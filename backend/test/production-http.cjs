const assert = require('node:assert/strict');
module.exports = async (
  t,
  { call, em, users, sessions, roleNames, admin, legacyWorkOrderId },
) => {
  const token = admin.accessToken;
  const json = async (method, path, body, status = 200, auth = token) => {
    const res = await call(method, path, auth, body);
    const data = await res.json();
    assert.equal(res.status, status, JSON.stringify(data));
    return data;
  };
  const client = await json(
    'POST',
    '/clients',
    {
      businessName: 'Production fixture',
      taxId: '90000000010',
      email: 'production-client@example.test',
      phone: '123456789',
    },
    201,
  );
  const request = await json(
    'POST',
    '/requests',
    {
      clientId: client.id,
      title: 'Production',
      description: 'Requirements',
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
      description: 'Production source',
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
        title: 'Production OT',
        description: 'Drawing',
        priority: 'MEDIUM',
        plannedStartDate: '2026-10-01',
        plannedEndDate: '2026-10-09',
      },
      201,
    );
  const wo = await createOrder(),
    other = await createOrder();
  let material, sheet, operation, assignment, personnel;
  const snapshot = () =>
    em
      .getConnection()
      .execute(
        `select 'material' as entity,id,to_jsonb(m) as data from material m union all select 'sheet',id,to_jsonb(s) from route_sheet s union all select 'operation',id,to_jsonb(o) from operation o union all select 'assignment',id,to_jsonb(a) from work_order_material a union all select 'personnel',id,to_jsonb(p) from work_order_user p order by entity,id`,
      );
  const writes = [
    ['POST', '/materials', { materialCode: 'Forbidden', name: 'Forbidden' }],
    ['POST', '/route-sheets', { workOrderId: wo.id }],
    ['POST', '/operations', { routeSheetId: 1, name: 'Forbidden' }],
    [
      'POST',
      '/work-order-materials',
      { workOrderId: wo.id, materialId: 1, quantity: 1 },
    ],
    [
      'POST',
      '/work-order-users',
      { workOrderId: wo.id, userId: users.get('Producción').id },
    ],
    ['PUT', '/route-sheets/1', { instructions: 'Forbidden' }],
    ['PUT', '/operations/1', { name: 'Forbidden' }],
    ['PUT', '/work-order-materials/1', { quantity: 1 }],
    ['PATCH', '/work-order-users/1/unassign', {}],
  ];
  await t.test(
    'production planning and assignment reject unauthorized HTTP writes without changing data',
    async () => {
      for (const role of [
        null,
        'Administración',
        'Producción',
        'Calidad',
        'constructor',
      ]) {
        const before = await snapshot();
        for (const [method, path, body] of writes) {
          const res = await call(
            method,
            path,
            role ? sessions.get(role).accessToken : null,
            body,
          );
          assert.equal(res.status, role ? 403 : 401, `${role} ${path}`);
        }
        assert.deepEqual(await snapshot(), before);
      }
      for (const role of ['Administración', 'constructor'])
        assert.equal(
          (
            await call(
              'GET',
              `/work-orders/${wo.id}/materials`,
              sessions.get(role).accessToken,
            )
          ).status,
          403,
        );
    },
  );
  await t.test(
    'materials and lots use real FKs, exact quantities and preserve distinct lots of the same material',
    async () => {
      for (const body of [
        { name: 'Missing code' },
        { materialCode: '', name: 'Missing code' },
        { materialCode: 'MAT', name: 'M', supplier: 'Unrepresented' },
      ])
        assert.equal(
          (await call('POST', '/materials', token, body)).status,
          400,
        );
      material = await json(
        'POST',
        '/materials',
        {
          materialCode: ' MAT-PROD ',
          name: ' Steel ',
          specification: ' Spec ',
          manufacturer: ' Maker ',
        },
        201,
      );
      assert.equal(material.materialCode, 'MAT-PROD');
      assert.equal(material.name, 'Steel');
      await json(
        'POST',
        '/materials',
        { materialCode: 'MAT-PROD', name: 'Duplicate' },
        409,
      );
      await json(
        'POST',
        '/work-order-materials',
        { workOrderId: wo.id, materialId: 2147483647, quantity: 1 },
        404,
      );
      for (const quantity of [
        0,
        -1,
        'NaN',
        '1e2',
        '0.001',
        '1000000000000',
        null,
      ])
        await json(
          'POST',
          '/work-order-materials',
          { workOrderId: wo.id, materialId: material.id, quantity },
          400,
        );
      const payload = {
        workOrderId: wo.id,
        materialId: material.id,
        quantity: '1.25',
        unit: 'kg',
        lotNumber: 'LOT-A',
        certificateNumber: 'CERT',
        receivedAt: '2026-10-01T10:00:00Z',
        notes: 'Reception',
      };
      const results = await Promise.all([
        json('POST', '/work-order-materials', payload, 201),
        json(
          'POST',
          '/work-order-materials',
          { ...payload, lotNumber: 'LOT-B' },
          201,
        ),
      ]);
      assignment = results[0];
      assert.notEqual(results[0].id, results[1].id);
      assert.equal(assignment.quantity, '1.25');
      assert.equal(assignment.material.specification, 'Spec');
      assert.equal(assignment.assignedBy.id, users.get('Administrador').id);
      assert.equal(assignment.materialId, material.id);
      await json(
        'PUT',
        `/work-order-materials/${assignment.id}`,
        { workOrderId: other.id },
        400,
      );
      const updated = await json(
        'PUT',
        `/work-order-materials/${assignment.id}`,
        {
          lotNumber: null,
          unit: null,
          certificateNumber: null,
          receivedAt: null,
          notes: null,
          quantity: '2.50',
        },
      );
      for (const key of [
        'lotNumber',
        'unit',
        'certificateNumber',
        'receivedAt',
        'notes',
      ])
        assert.equal(updated[key], null);
      assert.equal(updated.quantity, '2.50');
      const reloaded = await json('GET', `/work-orders/${wo.id}/materials`);
      assert.equal(reloaded.length, 2);
      assert.equal(
        reloaded.find((m) => m.id === assignment.id).quantity,
        '2.50',
      );
      assert.deepEqual(
        await json('GET', `/work-orders/${other.id}/materials`),
        [],
      );
      assert.equal(
        (await call('DELETE', `/work-order-materials/${assignment.id}`, token))
          .status,
        404,
      );
    },
  );
  await t.test(
    'route sheets and operations have automatic unique numbers, real creators and immutable parents',
    async () => {
      const sheets = await Promise.all([
        json(
          'POST',
          '/route-sheets',
          { workOrderId: wo.id, instructions: 'Drawing v2' },
          201,
        ),
        json(
          'POST',
          '/route-sheets',
          { workOrderId: wo.id, instructions: 'Finishing' },
          201,
        ),
      ]);
      sheet = sheets[0];
      assert.notEqual(sheets[0].routeNumber, sheets[1].routeNumber);
      assert.match(sheet.routeNumber, /^HR-\d{6,}$/);
      assert.ok(Number(sheet.routeNumber.slice(3)) > 123);
      assert.equal(sheet.createdBy.id, users.get('Administrador').id);
      await json(
        'POST',
        '/route-sheets',
        { workOrderId: wo.id, routeNumber: 'Invented' },
        400,
      );
      await json(
        'PUT',
        `/route-sheets/${sheet.id}`,
        { workOrderId: other.id },
        400,
      );
      assert.equal(
        (await json('PUT', `/route-sheets/${sheet.id}`, { instructions: null }))
          .instructions,
        null,
      );
      await json(
        'POST',
        '/operations',
        { routeSheetId: 2147483647, name: 'Missing' },
        404,
      );
      await json(
        'POST',
        '/operations',
        {
          routeSheetId: sheet.id,
          name: 'Invalid date',
          plannedEnd: '2026-10-01',
        },
        400,
      );
      const body = {
        routeSheetId: sheet.id,
        name: 'Turning',
        description: 'Roughing',
        machine: 'CNC',
        plannedStart: '2026-10-01T10:00:00Z',
        plannedEnd: '2026-10-01T12:00:00Z',
        notes: 'Drawing v2',
      };
      const results = await Promise.all([
        json('POST', '/operations', body, 201),
        json('POST', '/operations', { ...body, name: 'Finishing' }, 201),
      ]);
      operation = results[0];
      assert.notEqual(results[0].operationNumber, results[1].operationNumber);
      assert.equal(operation.createdBy.id, users.get('Administrador').id);
      assert.equal(operation.actualStart, null);
      await json(
        'PUT',
        `/operations/${operation.id}`,
        { routeSheetId: sheets[1].id },
        400,
      );
      const updated = await json('PUT', `/operations/${operation.id}`, {
        description: null,
        machine: null,
        plannedEnd: null,
        plannedStart: null,
        notes: null,
      });
      for (const key of [
        'description',
        'machine',
        'plannedEnd',
        'plannedStart',
        'notes',
      ])
        assert.equal(updated[key], null);
      assert.equal(
        (await json('GET', `/route-sheets/work-order/${wo.id}`)).length,
        2,
      );
      assert.equal(
        (await json('GET', `/operations/route-sheet/${sheet.id}`)).length,
        2,
      );
      assert.deepEqual(
        await json('GET', `/route-sheets/work-order/${other.id}`),
        [],
      );
      await json(
        'POST',
        '/route-sheets',
        { workOrderId: legacyWorkOrderId },
        409,
      );
    },
  );
  await t.test(
    'assignable people are persisted active users; one active assignment per OT and actor differs from assignee',
    async () => {
      const available = await json(
        'GET',
        '/work-order-users/available',
        undefined,
        200,
        sessions.get('Supervisor').accessToken,
      );
      assert.ok(available.some((u) => u.id === users.get('Producción').id));
      for (const user of available)
        assert.deepEqual(Object.keys(user).sort(), [
          'firstName',
          'id',
          'isActive',
          'lastName',
          'role',
        ]);
      assert.equal(
        (await call('GET', '/users', sessions.get('Supervisor').accessToken))
          .status,
        403,
      );
      await json(
        'POST',
        '/work-order-users',
        { workOrderId: wo.id, userId: 2147483647 },
        404,
      );
      const uid = users.get('Producción').id;
      await json(
        'POST',
        '/work-order-users',
        { workOrderId: wo.id, userId: uid, role: 'Invented' },
        400,
      );
      const responses = await Promise.all([
        call('POST', '/work-order-users', token, {
          workOrderId: wo.id,
          userId: uid,
        }),
        call('POST', '/work-order-users', token, {
          workOrderId: wo.id,
          userId: uid,
        }),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
      personnel = await responses.find((r) => r.status === 201).json();
      assert.equal(personnel.user.id, uid);
      assert.notEqual(personnel.assignedBy.id, uid);
      assert.equal(personnel.user.role, 'Producción');
      await json(
        'POST',
        '/work-order-users',
        { workOrderId: other.id, userId: uid },
        201,
      );
      const closed = await json(
        'PATCH',
        `/work-order-users/${personnel.id}/unassign`,
        {},
      );
      assert.ok(closed.unassignedAt);
      assert.equal(closed.unassignedBy.id, users.get('Administrador').id);
      assert.deepEqual(
        await json('PATCH', `/work-order-users/${personnel.id}/unassign`, {}),
        closed,
      );
      await json(
        'POST',
        '/work-order-users',
        { workOrderId: wo.id, userId: uid },
        201,
      );
      const history = await json('GET', `/work-orders/${wo.id}/users`);
      assert.equal(history.length, 2);
      assert.equal(history.filter((p) => !p.unassignedAt).length, 1);
      const inactive = await em
        .getConnection()
        .execute('update "user" set is_active=false where id=? returning id', [
          users.get('Calidad').id,
        ]);
      assert.equal(inactive.length, 1);
      try {
        await json(
          'POST',
          '/work-order-users',
          { workOrderId: wo.id, userId: users.get('Calidad').id },
          409,
        );
        assert.ok(
          !(await json('GET', '/work-order-users/available')).some(
            (u) => u.id === users.get('Calidad').id,
          ),
        );
      } finally {
        await em
          .getConnection()
          .execute('update "user" set is_active=true where id=?', [
            users.get('Calidad').id,
          ]);
      }
      assert.equal(
        (await call('DELETE', `/work-order-users/${personnel.id}`, token))
          .status,
        404,
      );
    },
  );
  await t.test(
    'execution enforces approval, valid real dates, role authorization and closed-history protection',
    async () => {
      const execution = `/operations/${operation.id}/execution`,
        start = new Date(Date.now() - 7200000).toISOString(),
        end = new Date(Date.now() - 3600000).toISOString();
      for (const role of [null, 'Administración', 'Calidad', 'constructor'])
        assert.equal(
          (
            await call(
              'PATCH',
              execution,
              role ? sessions.get(role).accessToken : null,
              { actualStart: start },
            )
          ).status,
          role ? 403 : 401,
        );
      await json(
        'PATCH',
        execution,
        { actualStart: start },
        409,
        sessions.get('Producción').accessToken,
      );
      await json(
        'POST',
        '/approvals',
        { workOrderId: wo.id, status: 'APPROVED' },
        201,
      );
      for (const body of [
        {},
        { actualEnd: end },
        { actualStart: null },
        { actualStart: 'not-a-date' },
        {
          actualStart: start,
          actualEnd: new Date(Date.now() - 10800000).toISOString(),
        },
        { actualStart: new Date(Date.now() + 86400000).toISOString() },
        { actualStart: start, executedById: 1 },
      ])
        await json('PATCH', execution, body, 400);
      const running = await json(
        'PATCH',
        execution,
        { actualStart: start },
        200,
        sessions.get('Producción').accessToken,
      );
      assert.equal(running.executedBy.id, users.get('Producción').id);
      assert.equal(running.actualEnd, null);
      const parent = await json('GET', `/work-orders/${wo.id}`);
      assert.equal(parent.status, 'IN_PROGRESS');
      assert.equal(parent.actualStartDate, start);
      await json(
        'PUT',
        `/operations/${operation.id}`,
        { name: 'Rewrite' },
        409,
      );
      await json(
        'PATCH',
        execution,
        { actualStart: new Date(Date.now() - 10800000).toISOString() },
        409,
      );
      const completed = await json('PATCH', execution, { actualEnd: end });
      assert.equal(completed.actualEnd, end);
      assert.equal(
        (await json('GET', `/work-orders/${wo.id}`)).status,
        'IN_PROGRESS',
      );
      assert.deepEqual(
        await json('PATCH', execution, { actualEnd: end }),
        completed,
      );
      const before = await snapshot();
      await json('PUT', `/work-orders/${wo.id}`, {
        status: 'COMPLETED',
        actualEndDate: end,
      });
      for (const [method, path, body] of [
        ['POST', '/route-sheets', { workOrderId: wo.id }],
        ['POST', '/operations', { routeSheetId: sheet.id, name: 'Closed' }],
        [
          'POST',
          '/work-order-materials',
          { workOrderId: wo.id, materialId: material.id, quantity: 1 },
        ],
        [
          'POST',
          '/work-order-users',
          { workOrderId: wo.id, userId: users.get('Supervisor').id },
        ],
        ['PUT', `/route-sheets/${sheet.id}`, { instructions: 'Closed' }],
        ['PUT', `/work-order-materials/${assignment.id}`, { quantity: 1 }],
        ['PATCH', execution, { actualEnd: end }],
        ['PATCH', `/work-order-users/${personnel.id}/unassign`, {}],
      ])
        await json(method, path, body, 409);
      assert.deepEqual(await snapshot(), before);
      for (const role of ['Supervisor', 'Producción', 'Calidad'])
        for (const path of [
          `/work-orders/${wo.id}/users`,
          `/work-orders/${wo.id}/materials`,
          `/route-sheets/work-order/${wo.id}`,
          `/operations/route-sheet/${sheet.id}`,
        ])
          await json(
            'GET',
            path,
            undefined,
            200,
            sessions.get(role).accessToken,
          );
      for (const path of [
        '/work-orders/2147483647/users',
        '/work-orders/2147483647/materials',
        '/route-sheets/work-order/2147483647',
        '/operations/route-sheet/2147483647',
      ])
        await json('GET', path, undefined, 404);
    },
  );
};
