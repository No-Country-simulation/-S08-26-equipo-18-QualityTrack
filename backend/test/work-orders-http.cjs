const assert = require('node:assert/strict');
module.exports = async (
  t,
  {
    call,
    em,
    users,
    sessions,
    roleNames,
    admin,
    legacyWorkOrderId,
    legacyWorkOrderBefore,
  },
) => {
  const token = admin.accessToken;
  const client = await (
    await call('POST', '/clients', token, {
      businessName: 'WO client',
      taxId: '90000000009',
      email: 'wo@example.test',
      phone: '123456789',
    })
  ).json();
  const request = await (
    await call('POST', '/requests', token, {
      clientId: client.id,
      title: 'WO source',
      description: 'Requirements',
      receivedAt: '2026-10-01',
    })
  ).json();
  const quote = async (status) => {
    const response = await call('POST', '/quotations', token, {
      clientId: client.id,
      requestId: request.id,
      version: 1,
      description: 'Accepted conditions',
      currency: 'ARS',
      items: [{ description: 'Piece', quantity: 2, unitPrice: 10 }],
    });
    assert.equal(response.status, 201);
    const q = await response.json();
    if (status)
      assert.equal(
        (await call('PATCH', `/quotations/${q.id}/decision`, token, { status }))
          .status,
        200,
      );
    return q;
  };
  const accepted = await quote('accepted'),
    pending = await quote(),
    rejected = await quote('rejected');
  const input = () => ({
    quotationId: accepted.id,
    title: 'Manufacture',
    description: 'Drawing',
    priority: 'HIGH',
    plannedStartDate: '2026-10-02',
    plannedEndDate: '2026-10-09',
  });
  const create = async () => {
    const response = await call('POST', '/work-orders', token, input());
    assert.equal(response.status, 201);
    return response.json();
  };
  let wo;
  await t.test(
    'work order migration preserves historical records without inventing origin and rejects duplicate numbers',
    async () => {
      const record = (
        await em
          .getConnection()
          .execute('select * from work_order where id = ?', [legacyWorkOrderId])
      )[0];
      for (const key of Object.keys(legacyWorkOrderBefore))
        assert.deepEqual(record[key], legacyWorkOrderBefore[key]);
      assert.equal(record.quotation_id, null);
      const legacy = await (
        await call('GET', `/work-orders/${legacyWorkOrderId}`, token)
      ).json();
      assert.equal(legacy.originStatus, 'missing');
      assert.equal(legacy.clientId, null);
      assert.equal(legacy.quotation, null);
      assert.equal(
        (
          await call('PUT', `/work-orders/${legacy.id}`, token, {
            title: 'Verified historical edit',
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call('POST', '/approvals', token, {
            workOrderId: legacy.id,
            status: 'APPROVED',
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    'work order creation enforces accepted source, valid fields and unique server numbers concurrently',
    async () => {
      for (const q of [pending, rejected])
        assert.equal(
          (
            await call('POST', '/work-orders', token, {
              ...input(),
              quotationId: q.id,
            })
          ).status,
          409,
        );
      for (const extra of [
        { quotationId: null },
        { quotationId: 2147483648 },
        { title: null },
        { title: ' ' },
        { title: 'x'.repeat(501) },
        { description: 'x'.repeat(5001) },
        { priority: 'INVALID' },
        { plannedStartDate: '2026-02-30' },
        { plannedEndDate: '2026-10-01' },
        { workOrderNumber: 1001 },
        { createdById: 1 },
        { clientId: client.id },
        { requestId: request.id },
        { status: 'APPROVED' },
        { actualStartDate: '2026-10-02' },
      ])
        assert.equal(
          (await call('POST', '/work-orders', token, { ...input(), ...extra }))
            .status,
          400,
        );
      assert.equal(
        (
          await call('POST', '/work-orders', token, {
            ...input(),
            quotationId: 2147483647,
          })
        ).status,
        404,
      );
      const results = await Promise.all([create(), create()]);
      wo = results[0];
      assert.notEqual(results[0].workOrderNumber, results[1].workOrderNumber);
      assert.ok(wo.workOrderNumber > 1100);
      assert.equal(wo.status, 'PENDING');
      assert.equal(wo.clientId, client.id);
      assert.equal(wo.requestId, request.id);
      assert.equal(wo.quotationId, accepted.id);
      assert.equal(wo.createdById, users.get('Administrador').id);
      assert.equal(JSON.stringify(wo).includes('password'), false);
      assert.equal(JSON.stringify(wo).includes('dni'), false);
      assert.deepEqual(
        await (await call('GET', `/work-orders/${wo.id}`, token)).json(),
        wo,
      );
      const approval = await (
        await call('GET', `/approvals/work-order/${wo.id}`, token)
      ).json();
      assert.equal(approval.status, 'PENDING');
      assert.equal(approval.decidedBy, null);
      assert.equal(approval.decisionAt, null);
      await assert.rejects(
        em
          .getConnection()
          .execute('update work_order set work_order_number = ? where id = ?', [
            wo.workOrderNumber,
            results[1].id,
          ]),
      );
    },
  );
  await t.test(
    'work orders and internal approvals enforce role permissions without writes on denial',
    async () => {
      const actions = [
        ['GET', '/work-orders'],
        ['GET', `/work-orders/${wo.id}`],
        ['POST', '/work-orders'],
        ['PUT', `/work-orders/${wo.id}`],
        ['GET', '/approvals'],
        ['GET', `/approvals/work-order/${wo.id}`],
        ['POST', '/approvals'],
      ];
      for (const [method, url] of actions)
        assert.equal(
          (await call(method, url, null, method === 'GET' ? undefined : {}))
            .status,
          401,
        );
      for (const role of roleNames) {
        const writes = ['Administrador', 'Supervisor'].includes(role),
          reads = writes || ['Producción', 'Calidad'].includes(role);
        for (const [method, url] of actions) {
          const allowed = method === 'GET' ? reads : writes;
          const count = await em
            .getConnection()
            .execute('select count(*)::int as count from work_order');
          const body =
            method === 'GET'
              ? undefined
              : url === '/approvals'
                ? { workOrderId: (await create()).id, status: 'APPROVED' }
                : method === 'POST'
                  ? input()
                  : { title: 'Role edit' };
          const response = await call(
            method,
            url,
            sessions.get(role).accessToken,
            body,
          );
          assert.equal(
            response.status,
            allowed ? (method === 'POST' ? 201 : 200) : 403,
            `${role} ${method} ${url}`,
          );
          if (!allowed && url !== '/approvals')
            assert.deepEqual(
              await em
                .getConnection()
                .execute('select count(*)::int as count from work_order'),
              count,
            );
        }
      }
      assert.equal(
        (await call('DELETE', `/work-orders/${wo.id}`, token)).status,
        404,
      );
    },
  );
  await t.test(
    'editing preserves immutable source, validates real dates and cannot forge internal approval',
    async () => {
      for (const extra of [
        { status: null },
        { workOrderNumber: 999 },
        { quotationId: accepted.id },
        { clientId: client.id },
        { createdById: 1 },
        { status: 'APPROVED' },
        { actualStartDate: '2026-10-02' },
        { actualEndDate: '2026-10-03' },
        { plannedEndDate: '2026-09-30' },
      ])
        assert.ok(
          [400, 409].includes(
            (await call('PUT', `/work-orders/${wo.id}`, token, extra)).status,
          ),
        );
      assert.equal(
        (await call('PUT', `/work-orders/${wo.id}`, token, {})).status,
        400,
      );
      assert.equal(
        (
          await call('PUT', '/work-orders/2147483647', token, {
            title: 'Missing',
          })
        ).status,
        404,
      );
      assert.equal((await call('GET', '/work-orders/0', token)).status, 400);
      const updated = await (
        await call('PUT', `/work-orders/${wo.id}`, token, {
          title: 'New title',
        })
      ).json();
      assert.equal(updated.quotationId, wo.quotationId);
      assert.equal(updated.workOrderNumber, wo.workOrderNumber);
      assert.equal(updated.createdAt, wo.createdAt);
    },
  );
  await t.test(
    'internal decision is atomic, records real actor/date, is idempotent and blocks opposite decisions',
    async () => {
      const approval = await (
        await call('GET', `/approvals/work-order/${wo.id}`, token)
      ).json();
      for (const payload of [
        { status: 'PENDING' },
        { status: 'APPROVED', decidedById: 1 },
        { status: 'APPROVED', decisionAt: '2026-01-01' },
        { status: 'APPROVED', comments: 'x'.repeat(5001) },
      ])
        assert.equal(
          (
            await call(
              'PUT',
              `/approvals/${approval.id}/decide`,
              token,
              payload,
            )
          ).status,
          400,
        );
      for (const role of [
        'Producción',
        'Calidad',
        'Administración',
        'constructor',
      ])
        assert.equal(
          (
            await call(
              'PUT',
              `/approvals/${approval.id}/decide`,
              sessions.get(role).accessToken,
              { status: 'APPROVED' },
            )
          ).status,
          403,
        );
      const race = await Promise.all(
        ['APPROVED', 'REJECTED'].map((status) =>
          call('PUT', `/approvals/${approval.id}/decide`, token, {
            status,
            comments: 'Confirmed',
          }),
        ),
      );
      assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
      const decision = await race.find((r) => r.status === 200).json();
      assert.equal(decision.decidedById, users.get('Administrador').id);
      assert.ok(decision.decisionAt);
      assert.deepEqual(
        await (
          await call(
            'PUT',
            `/approvals/${approval.id}/decide`,
            sessions.get('Supervisor').accessToken,
            { status: decision.status, comments: 'Do not replace' },
          )
        ).json(),
        decision,
      );
      const current = await (
        await call('GET', `/work-orders/${wo.id}`, token)
      ).json();
      assert.equal(
        current.status,
        decision.status === 'APPROVED' ? 'APPROVED' : 'CANCELLED',
      );
      const runnable = await create();
      const pa = await (
        await call('GET', `/approvals/work-order/${runnable.id}`, token)
      ).json();
      assert.equal(
        (
          await call('PUT', `/approvals/${pa.id}/decide`, token, {
            status: 'APPROVED',
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call('PUT', `/work-orders/${runnable.id}`, token, {
            status: 'IN_PROGRESS',
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call('PUT', `/work-orders/${runnable.id}`, token, {
            status: 'IN_PROGRESS',
            actualStartDate: '2026-10-03',
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call('PUT', `/work-orders/${runnable.id}`, token, {
            status: 'COMPLETED',
            actualEndDate: '2026-10-04',
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await call('PUT', `/work-orders/${runnable.id}`, token, {
            title: 'Rewrite closed',
          })
        ).status,
        409,
      );
      await call('PATCH', `/clients/${client.id}/status`, token, {
        isActive: false,
      });
      assert.equal(
        (await call('POST', '/work-orders', token, input())).status,
        409,
      );
      assert.equal(
        (await call('GET', `/work-orders/${runnable.id}`, token)).status,
        200,
      );
    },
  );
};
