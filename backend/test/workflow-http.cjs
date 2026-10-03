const assert = require('node:assert/strict');

// One newly created dossier crosses the modules and all five actual session roles.
module.exports = async (t, { call, users, sessions, password }) => {
  const token = (role) => sessions.get(role).accessToken;
  const json = async (
    method,
    path,
    body,
    role = 'Administrador',
    status = 200,
  ) => {
    const res = await call(method, path, role ? token(role) : null, body);
    const data = await res.json();
    assert.equal(res.status, status, JSON.stringify(data));
    return data;
  };
  let client,
    request,
    quote,
    order,
    approval,
    material,
    assignment,
    sheet,
    operation,
    personnel,
    quality,
    delivery,
    document;
  const bytes = Buffer.from('%PDF-1.7\nIntegrated dossier\n%%EOF\n');
  await t.test(
    'one new dossier persists commercial source, approval, production, quality, delivery and source file with actual roles',
    async () => {
      client = await json(
        'POST',
        '/clients',
        {
          businessName: 'Integrated workflow',
          taxId: '90000000013',
          email: 'workflow@example.test',
          phone: '123456789',
        },
        'Administración',
        201,
      );
      request = await json(
        'POST',
        '/requests',
        {
          clientId: client.id,
          title: 'Integrated piece',
          description: 'Drawing and technical requirements',
          receivedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        'Administración',
        201,
      );
      quote = await json(
        'POST',
        '/quotations',
        {
          clientId: client.id,
          requestId: request.id,
          version: 1,
          description: 'Machining',
          currency: 'ARS',
          items: [
            { description: 'Piece', quantity: '2.50', unitPrice: '10.00' },
          ],
        },
        'Administración',
        201,
      );
      quote = await json('PATCH', `/quotations/${quote.id}/decision`, {
        status: 'accepted',
      });
      order = await json(
        'POST',
        '/work-orders',
        {
          quotationId: quote.id,
          title: 'Integrated OT',
          description: 'Machining dossier',
          priority: 'MEDIUM',
          plannedStartDate: new Date().toISOString(),
          plannedEndDate: new Date(Date.now() + 86400000).toISOString(),
        },
        'Supervisor',
        201,
      );
      assert.equal(order.requestId, request.id);
      assert.equal(order.clientId, client.id);
      assert.match(request.requestNumber, /^SOL-\d+$/);
      assert.match(quote.quotationNumber, /^COT-\d+$/);
      assert.equal(quote.subtotal, '25.00');
      assert.equal(order.createdById, users.get('Supervisor').id);
      approval = await json('GET', `/approvals/work-order/${order.id}`);
      approval = await json(
        'PUT',
        `/approvals/${approval.id}/decide`,
        { status: 'APPROVED' },
        'Supervisor',
      );
      material = await json(
        'POST',
        '/materials',
        {
          materialCode: 'MAT-WORKFLOW',
          name: 'Steel',
          specification: 'Drawing specification',
        },
        'Supervisor',
        201,
      );
      assignment = await json(
        'POST',
        '/work-order-materials',
        {
          workOrderId: order.id,
          materialId: material.id,
          quantity: '2.50',
          unit: 'kg',
          lotNumber: 'LOT-WORKFLOW',
          certificateNumber: 'CERT-WORKFLOW',
        },
        'Supervisor',
        201,
      );
      sheet = await json(
        'POST',
        '/route-sheets',
        { workOrderId: order.id, instructions: 'Follow drawing' },
        'Supervisor',
        201,
      );
      operation = await json(
        'POST',
        '/operations',
        { routeSheetId: sheet.id, name: 'Turning', machine: 'CNC' },
        'Supervisor',
        201,
      );
      personnel = await json(
        'POST',
        '/work-order-users',
        { workOrderId: order.id, userId: users.get('Producción').id },
        'Supervisor',
        201,
      );
      const start = new Date(Date.now() - 2000).toISOString();
      operation = await json(
        'PATCH',
        `/operations/${operation.id}/execution`,
        { actualStart: start },
        'Producción',
      );
      const end = new Date().toISOString();
      operation = await json(
        'PATCH',
        `/operations/${operation.id}/execution`,
        { actualEnd: end },
        'Producción',
      );
      quality = await json(
        'POST',
        '/quality',
        {
          workOrderId: order.id,
          operationId: operation.id,
          specification: 'Diameter 10 mm, tolerance ±0.1',
          expectedValue: '10.0000',
          measuredValue: '10.0500',
          unit: 'mm',
        },
        'Calidad',
        201,
      );
      order = await json(
        'PUT',
        `/work-orders/${order.id}`,
        { status: 'COMPLETED', actualEndDate: end },
        'Supervisor',
      );
      delivery = await json(
        'POST',
        '/deliveries',
        {
          workOrderId: order.id,
          deliveryDate: new Date().toISOString(),
          quantity: 2,
        },
        'Administración',
        201,
      );
      const types = await json(
        'GET',
        '/documents/types',
        undefined,
        'Administración',
      );
      const form = new FormData();
      form.append('requestId', String(request.id));
      form.append('documentTypeId', String(types[0].id));
      form.append(
        'file',
        new Blob([bytes], { type: 'application/pdf' }),
        'workflow.pdf',
      );
      document = await json(
        'POST',
        '/documents/upload',
        form,
        'Administración',
        201,
      );
      assert.equal(approval.decidedById, users.get('Supervisor').id);
      assert.equal(assignment.assignedBy.id, users.get('Supervisor').id);
      assert.equal(personnel.userId, users.get('Producción').id);
      assert.equal(personnel.assignedBy.id, users.get('Supervisor').id);
      assert.equal(operation.executedBy.id, users.get('Producción').id);
      assert.equal(quality.performedBy.id, users.get('Calidad').id);
      assert.equal(delivery.createdBy.id, users.get('Administración').id);
      assert.equal(delivery.clientId, client.id);
      assert.equal(delivery.notes, null);
      assert.equal(document.uploadedById, users.get('Administración').id);
    },
  );

  await t.test(
    'a new application and new session reconstruct the complete dossier and download its original source file',
    async () => {
      const { NestFactory } = require('@nestjs/core');
      const { ValidationPipe } = require('@nestjs/common');
      const { AppModule } = require('../dist/src/app.module');
      const app = await NestFactory.create(AppModule, { logger: false });
      try {
        app.useGlobalPipes(
          new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
          }),
        );
        await app.listen(0, '127.0.0.1');
        const base = await app.getUrl();
        const login = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: users.get('Administrador').email,
            password,
          }),
        });
        assert.equal(login.status, 200);
        const fresh = await login.json();
        const read = async (path) => {
          const response = await fetch(base + path, {
            headers: { Authorization: `Bearer ${fresh.accessToken}` },
          });
          assert.equal(response.status, 200, path);
          return response.json();
        };
        const restored = await read(`/work-orders/${order.id}`);
        assert.equal(restored.status, 'COMPLETED');
        assert.equal(restored.workOrderNumber, order.workOrderNumber);
        assert.equal(restored.quotation.id, quote.id);
        assert.equal(restored.request.id, request.id);
        assert.equal(restored.client.id, client.id);
        assert.equal(
          (await read(`/quotations/${quote.id}`)).items[0].subtotal,
          25,
        );
        assert.equal(
          (await read(`/requests/${request.id}`)).requestNumber,
          request.requestNumber,
        );
        assert.equal(
          (await read(`/approvals/work-order/${order.id}`)).decidedById,
          approval.decidedById,
        );
        assert.equal(
          (await read(`/route-sheets/work-order/${order.id}`))[0].id,
          sheet.id,
        );
        const ops = await read(`/operations/route-sheet/${sheet.id}`);
        assert.equal(ops[0].actualEnd, operation.actualEnd);
        assert.equal(ops[0].executedBy.id, users.get('Producción').id);
        const materials = await read(`/work-orders/${order.id}/materials`);
        assert.equal(materials[0].materialId, material.id);
        assert.equal(materials[0].lotNumber, 'LOT-WORKFLOW');
        assert.equal(materials[0].quantity, '2.50');
        assert.equal(
          (await read(`/work-orders/${order.id}/users`))[0].userId,
          personnel.userId,
        );
        assert.equal(
          (await read(`/quality/work-order/${order.id}`))[0].measuredValue,
          '10.0500',
        );
        assert.equal(
          (await read(`/deliveries/work-order/${order.id}`))[0].clientId,
          client.id,
        );
        assert.deepEqual(
          (await read(`/documents/work-order/${order.id}`)).map((d) => d.id),
          [document.id],
        );
        const download = await fetch(
          `${base}/documents/${document.id}/download`,
          { headers: { Authorization: `Bearer ${fresh.accessToken}` } },
        );
        assert.equal(download.status, 200);
        assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
        const logout = await fetch(`${base}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${fresh.accessToken}` },
        });
        assert.equal(logout.status, 204);
        assert.equal(
          (
            await fetch(`${base}/auth/me`, {
              headers: { Authorization: `Bearer ${fresh.accessToken}` },
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await fetch(`${base}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: fresh.refreshToken }),
            })
          ).status,
          401,
        );
      } finally {
        await app.close();
      }
    },
  );

  await t.test(
    'direct requests cannot change the integrated dossier through forbidden roles or forged identity',
    async () => {
      await json(
        'PUT',
        `/work-orders/${order.id}`,
        { title: 'Forbidden' },
        'Producción',
        403,
      );
      await json(
        'POST',
        '/quality',
        { workOrderId: order.id, specification: 'Forbidden' },
        'Supervisor',
        403,
      );
      await json(
        'POST',
        '/deliveries',
        {
          workOrderId: order.id,
          deliveryDate: new Date().toISOString(),
          quantity: 1,
        },
        'Calidad',
        403,
      );
      await json(
        'POST',
        '/work-order-users',
        { workOrderId: order.id, userId: personnel.userId },
        'Administración',
        403,
      );
      await json(
        'PUT',
        `/quality/${quality.id}`,
        { performedById: users.get('Administrador').id },
        'Calidad',
        400,
      );
      await json(
        'PATCH',
        `/quotations/${quote.id}/decision`,
        { status: 'rejected' },
        'Administrador',
        409,
      );
      assert.equal(
        (await json('GET', `/work-orders/${order.id}`)).title,
        'Integrated OT',
      );
      assert.equal(
        (await json('GET', `/quality/${quality.id}`)).performedBy.id,
        users.get('Calidad').id,
      );
      assert.equal(
        (await json('GET', `/deliveries/work-order/${order.id}`)).length,
        1,
      );
      assert.equal(
        (await json('GET', `/work-orders/${order.id}/users`)).length,
        1,
      );
      assert.equal(
        (await json('GET', `/quotations/${quote.id}`)).decisionStatus,
        'accepted',
      );
    },
  );
};
