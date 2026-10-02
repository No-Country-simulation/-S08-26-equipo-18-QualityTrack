const assert = require('node:assert/strict');
module.exports = async (
  t,
  { call, em, users, sessions, admin, legacyWorkOrderId },
) => {
  const json = async (
    method,
    path,
    body,
    status = 200,
    token = admin.accessToken,
  ) => {
    const res = await call(method, path, token, body);
    const data = await res.json();
    assert.equal(res.status, status, JSON.stringify(data));
    return data;
  };
  const token = (role) => sessions.get(role).accessToken;
  const client = await json(
    'POST',
    '/clients',
    {
      businessName: 'Quality delivery fixture',
      taxId: '90000000011',
      email: 'quality@example.test',
      phone: '123456789',
    },
    201,
  );
  const request = await json(
    'POST',
    '/requests',
    {
      clientId: client.id,
      title: 'Quality source',
      description: 'Drawing',
      receivedAt: '2026-10-01',
    },
    201,
  );
  const quote = await json(
    'POST',
    '/quotations',
    {
      clientId: client.id,
      requestId: request.id,
      version: 1,
      description: 'Quality source',
      currency: 'ARS',
      items: [{ description: 'Part', quantity: 1, unitPrice: 1 }],
    },
    201,
  );
  await json('PATCH', `/quotations/${quote.id}/decision`, {
    status: 'accepted',
  });
  const createOrder = () =>
    json(
      'POST',
      '/work-orders',
      {
        quotationId: quote.id,
        title: 'Quality OT',
        description: 'Drawing',
        priority: 'MEDIUM',
        plannedStartDate: '2026-10-01',
        plannedEndDate: '2026-10-09',
      },
      201,
    );
  const wo = await createOrder(),
    other = await createOrder();
  // Explicit dates only in the isolated database: the same business day must pass.
  await em
    .getConnection()
    .execute('update work_order set created_at=? where id=?', [
      '2026-10-01T23:45:00Z',
      wo.id,
    ]);
  const sheet = await json(
    'POST',
    '/route-sheets',
    { workOrderId: wo.id },
    201,
  );
  const otherSheet = await json(
    'POST',
    '/route-sheets',
    { workOrderId: other.id },
    201,
  );
  const operation = await json(
    'POST',
    '/operations',
    { routeSheetId: sheet.id, name: 'Inspection operation' },
    201,
  );
  const foreignOperation = await json(
    'POST',
    '/operations',
    { routeSheetId: otherSheet.id, name: 'Other operation' },
    201,
  );
  let quality, delivery;
  const snapshot = () =>
    em
      .getConnection()
      .execute(
        `select 'quality' as entity,id,to_jsonb(q) as data from quality_control q union all select 'delivery',id,to_jsonb(d) from delivery d order by entity,id`,
      );
  await t.test(
    'quality and deliveries enforce role permissions and dedicated delivery sources',
    async () => {
      const before = await snapshot();
      for (const role of [null, 'Supervisor', 'Producción', 'Administración']) {
        const res = await call(
          'POST',
          '/quality',
          role ? token(role) : undefined,
          { workOrderId: wo.id, specification: 'Forbidden' },
        );
        assert.equal(res.status, role ? 403 : 401);
      }
      for (const role of [null, 'Calidad', 'Producción']) {
        const res = await call(
          'POST',
          '/deliveries',
          role ? token(role) : undefined,
          { workOrderId: wo.id, deliveryDate: '2026-10-01', quantity: 1 },
        );
        assert.equal(res.status, role ? 403 : 401);
      }
      assert.deepEqual(await snapshot(), before);
      await json(
        'GET',
        '/work-orders',
        undefined,
        403,
        token('Administración'),
      );
      const sources = await json(
        'GET',
        '/deliveries/work-orders',
        undefined,
        200,
        token('Administración'),
      );
      assert.ok(
        sources.some((o) => o.id === wo.id && o.clientId === client.id),
      );
      await json('GET', '/clients', undefined, 403, token('Calidad'));
      for (const role of [
        'Administrador',
        'Supervisor',
        'Calidad',
        'Producción',
      ])
        await json('GET', '/quality', undefined, 200, token(role));
      for (const role of [
        'Administrador',
        'Supervisor',
        'Calidad',
        'Administración',
      ])
        await json('GET', '/deliveries', undefined, 200, token(role));
      await json('GET', '/deliveries', undefined, 403, token('Producción'));
      await json('GET', '/quality', undefined, 403, token('Administración'));
    },
  );
  await t.test(
    'visual inspections persist null measurements, real author, and optional operation',
    async () => {
      quality = await json(
        'POST',
        '/quality',
        { workOrderId: wo.id, specification: 'Sin fisuras; inspección visual' },
        201,
        token('Calidad'),
      );
      assert.equal(quality.measuredValue, null);
      assert.equal(quality.expectedValue, null);
      assert.equal(quality.operationId, null);
      assert.equal(quality.unit, null);
      assert.equal(quality.performedById, users.get('Calidad').id);
      assert.ok(quality.performedAt);
      assert.equal(quality.updatedBy, null);
      const read = await json('GET', `/quality/${quality.id}`);
      assert.deepEqual(read, quality);
      assert.ok(
        (await json('GET', `/quality/work-order/${wo.id}`)).some(
          (q) => q.id === quality.id,
        ),
      );
    },
  );
  await t.test(
    'quality rejects invalid decimals, forged authors, and foreign operations without writes',
    async () => {
      const before = await snapshot();
      for (const measuredValue of [
        '45 ± 0.01',
        '1e3',
        '10000000000',
        '0.00001',
        'Infinity',
        '',
        {},
        true,
      ])
        await json(
          'POST',
          '/quality',
          { workOrderId: wo.id, specification: 'Invalid', measuredValue },
          400,
        );
      for (const body of [
        { performedById: users.get('Administrador').id },
        { updatedById: 1 },
        { specification: null },
        { workOrderId: null },
        { specification: '   ' },
      ])
        await json(
          'POST',
          '/quality',
          { workOrderId: wo.id, specification: 'Invalid', ...body },
          400,
        );
      await json(
        'POST',
        '/quality',
        {
          workOrderId: wo.id,
          specification: 'Invalid',
          operationId: foreignOperation.id,
        },
        409,
      );
      await json(
        'PUT',
        `/quality/${quality.id}`,
        { operationId: foreignOperation.id },
        409,
      );
      await json(
        'PUT',
        `/quality/${quality.id}`,
        { workOrderId: other.id },
        409,
      );
      await json('PUT', `/quality/${quality.id}`, {}, 400);
      await json('PUT', `/quality/${quality.id}`, { specification: null }, 400);
      await json(
        'PUT',
        `/quality/${quality.id}`,
        { specification: 'Forbidden' },
        403,
        token('Supervisor'),
      );
      await json(
        'POST',
        '/quality',
        {
          workOrderId: legacyWorkOrderId,
          specification: 'Undocumented source',
        },
        409,
      );
      assert.deepEqual(await snapshot(), before);
    },
  );
  await t.test(
    'quality preserves decimal precision and original performer while tracking editor',
    async () => {
      let q = await json('PUT', `/quality/${quality.id}`, {
        operationId: operation.id,
        expectedValue: '9999999999.9999',
        measuredValue: '-0.0001',
        specification: 'Diameter ± 0.0001',
        unit: 'mm',
      });
      assert.equal(q.expectedValue, '9999999999.9999');
      assert.equal(q.measuredValue, '-0.0001');
      assert.equal(q.operation.id, operation.id);
      assert.equal(q.performedBy.id, users.get('Calidad').id);
      assert.equal(q.updatedBy.id, users.get('Administrador').id);
      assert.ok(q.updatedAt);
      q = await json('PUT', `/quality/${quality.id}`, {
        observations: 'Retest',
      });
      assert.equal(q.measuredValue, '-0.0001');
      assert.equal(q.expectedValue, '9999999999.9999');
      q = await json('PUT', `/quality/${quality.id}`, {
        expectedValue: null,
        measuredValue: null,
        operationId: null,
        unit: null,
        performedAt: null,
        observations: null,
      });
      for (const field of [
        'expectedValue',
        'measuredValue',
        'operationId',
        'unit',
        'performedAt',
        'observations',
      ])
        assert.equal(q[field], null);
      assert.equal(q.performedBy.id, users.get('Calidad').id);
    },
  );
  await t.test(
    'deliveries derive recipient, allow empty notes and compare business calendar dates',
    async () => {
      delivery = await json(
        'POST',
        '/deliveries',
        { workOrderId: wo.id, deliveryDate: '2026-10-01', quantity: 2 },
        201,
        token('Administración'),
      );
      assert.equal(delivery.clientId, client.id);
      assert.equal(delivery.notes, null);
      assert.equal(delivery.createdBy.id, users.get('Administración').id);
      assert.deepEqual(
        await json('GET', `/deliveries/${delivery.id}`),
        delivery,
      );
      // 00:30Z on October 2 is still October 1 in Argentina.
      await em
        .getConnection()
        .execute('update work_order set created_at=? where id=?', [
          '2026-10-02T00:30:00Z',
          wo.id,
        ]);
      await json(
        'POST',
        '/deliveries',
        {
          workOrderId: wo.id,
          deliveryDate: '2026-10-01',
          quantity: 1,
          notes: null,
        },
        201,
        token('Supervisor'),
      );
      await json(
        'POST',
        '/deliveries',
        { workOrderId: wo.id, deliveryDate: '2026-09-30', quantity: 1 },
        400,
      );
      assert.ok(
        (await json('GET', `/deliveries/work-order/${wo.id}`)).some(
          (d) => d.id === delivery.id,
        ),
      );
    },
  );
  await t.test(
    'delivery rejects invalid quantity, date, forged recipient and immutable origin',
    async () => {
      const before = await snapshot();
      for (const quantity of [0, -1, 1.5, 2147483648, '2', null])
        await json(
          'POST',
          '/deliveries',
          { workOrderId: wo.id, deliveryDate: '2026-10-01', quantity },
          400,
        );
      for (const deliveryDate of [
        '2026-02-30',
        'bad-date',
        '2026-10-01T10:00:00',
      '2026-10-01 10:00:00',
        null,
      ])
        await json(
          'POST',
          '/deliveries',
          { workOrderId: wo.id, deliveryDate, quantity: 1 },
          400,
        );
      for (const body of [
        { clientId: client.id },
        { createdById: 1 },
        { updatedById: 1 },
        { workOrderId: null },
      ])
        await json(
          'POST',
          '/deliveries',
          {
            workOrderId: wo.id,
            deliveryDate: '2026-10-01',
            quantity: 1,
            ...body,
          },
          400,
        );
      await json(
        'PUT',
        `/deliveries/${delivery.id}`,
        { workOrderId: other.id },
        409,
      );
      await json('PUT', `/deliveries/${delivery.id}`, { quantity: null }, 400);
      await json(
        'PUT',
        `/deliveries/${delivery.id}`,
        { deliveryDate: null },
        400,
      );
      await json(
        'PUT',
        `/deliveries/${delivery.id}`,
        { quantity: 1 },
        403,
        token('Calidad'),
      );
      await json(
        'POST',
        '/deliveries',
        {
          workOrderId: legacyWorkOrderId,
          deliveryDate: '2026-10-01',
          quantity: 1,
        },
        409,
      );
      assert.deepEqual(await snapshot(), before);
    },
  );
  await t.test(
    'delivery edits retain creator, track editor and clear notes explicitly',
    async () => {
      let d = await json(
        'PUT',
        `/deliveries/${delivery.id}`,
        { notes: 'Transport' },
        200,
        token('Supervisor'),
      );
      assert.equal(d.quantity, 2);
      assert.equal(d.deliveryDate, delivery.deliveryDate);
      assert.equal(d.createdBy.id, users.get('Administración').id);
      assert.equal(d.updatedBy.id, users.get('Supervisor').id);
      d = await json('PUT', `/deliveries/${delivery.id}`, {
        quantity: 2147483647,
        notes: null,
      });
      assert.equal(d.notes, null);
      assert.equal(d.quantity, 2147483647);
      assert.equal(d.createdBy.id, users.get('Administración').id);
      assert.equal(d.updatedBy.id, users.get('Administrador').id);
    },
  );
  await t.test(
    'historical missing recipients are visible and cannot be silently repaired',
    async () => {
      await em
        .getConnection()
        .execute('update delivery set client_id=null where id=?', [
          delivery.id,
        ]);
      const before = await snapshot();
      const d = await json('GET', `/deliveries/${delivery.id}`);
      assert.equal(d.clientId, null);
      await json('PUT', `/deliveries/${delivery.id}`, { notes: 'Repair' }, 409);
      assert.deepEqual(await snapshot(), before);
    },
  );
  await t.test(
    'cancelled orders retain evidence and completed orders accept inspection and delivery',
    async () => {
      await em
        .getConnection()
        .execute('update work_order set status=? where id=?', [
          'CANCELLED',
          wo.id,
        ]);
      const before = await snapshot();
      await json(
        'POST',
        '/quality',
        { workOrderId: wo.id, specification: 'Cancelled' },
        409,
      );
      await json(
        'PUT',
        `/quality/${quality.id}`,
        { observations: 'Cancelled' },
        409,
      );
      await json(
        'POST',
        '/deliveries',
        { workOrderId: wo.id, deliveryDate: '2026-10-02', quantity: 1 },
        409,
      );
      await json('DELETE', `/quality/${quality.id}`, undefined, 404);
      await json('DELETE', `/deliveries/${delivery.id}`, undefined, 404);
      assert.deepEqual(await snapshot(), before);
      await em
        .getConnection()
        .execute('update work_order set status=? where id=?', [
          'COMPLETED',
          wo.id,
        ]);
      await json(
        'POST',
        '/quality',
        { workOrderId: wo.id, specification: 'Final visual inspection' },
        201,
      );
      await json(
        'POST',
        '/deliveries',
        { workOrderId: wo.id, deliveryDate: '2026-10-02', quantity: 1 },
        201,
      );
    },
  );
};
