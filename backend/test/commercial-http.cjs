const assert = require('node:assert/strict');

module.exports = async (t, { call, em, users, sessions, roleNames, admin, legacyQuoteId }) => {
  const token = admin.accessToken;
  let serial = 0;
  const clientResponse = await call('POST', '/clients', token, { businessName: 'Commercial fixture', taxId: '90000000002', email: 'commercial@example.test', phone: '123456789' });
  assert.equal(clientResponse.status, 201); const client = await clientResponse.json();
  const otherResponse = await call('POST', '/clients', token, { businessName: 'Other commercial fixture', taxId: '90000000003', email: 'other-commercial@example.test', phone: '123456789' });
  assert.equal(otherResponse.status, 201); const other = await otherResponse.json();
  const requestInput = () => ({ clientId: client.id, requestNumber: `SOL-HTTP-${++serial}`, title: 'Technical source', description: 'Drawing and requirements', receivedAt: '2026-10-01T00:00:00.000Z', requestedDeliveryDate: '2026-10-03T00:00:00.000Z' });
  const firstRequest = await call('POST', '/requests', token, requestInput()); assert.equal(firstRequest.status, 201); const request = await firstRequest.json();
  const quoteInput = () => ({ clientId: client.id, requestId: request.id, quotationNumber: `COT-HTTP-${++serial}`, version: 1, description: 'Commercial conditions', currency: 'ARS', validUntil: null,
    items: [{ description: 'Fractional piece', quantity: '0.50', unitPrice: '0.01', notes: 'Preserve' }, { description: 'Second piece', quantity: '3.00', unitPrice: '0.10' }] });
  const firstQuote = await call('POST', '/quotations', token, quoteInput()); assert.equal(firstQuote.status, 201); const quote = await firstQuote.json();
  const editableRequest = await (await call('POST', '/requests', token, requestInput())).json();
  const editableQuote = await (await call('POST', '/quotations', token, quoteInput())).json();
  const snapshot = async () => ({ requests: await em.getConnection().execute('select * from request order by id'), quotations: await em.getConnection().execute('select * from quotation order by id'), items: await em.getConnection().execute('select * from quotation_item order by id') });
  const json = async response => { const body = await response.json(); assert.ok(!JSON.stringify(body).includes('password')); assert.ok(!JSON.stringify(body).includes('dni')); return body; };

  await t.test('commercial APIs enforce every role and use the session author', async () => {
    const actions = [['GET', '/requests'], ['GET', `/requests/${request.id}`], ['POST', '/requests'], ['PUT', `/requests/${editableRequest.id}`], ['GET', '/quotations'], ['GET', `/quotations/${quote.id}`], ['POST', '/quotations'], ['PUT', `/quotations/${editableQuote.id}`], ['PATCH', `/quotations/${quote.id}/decision`]];
    for (const [method, endpoint] of actions) assert.equal((await call(method, endpoint, null, method === 'GET' ? undefined : {})).status, 401);
    for (const role of roleNames) for (const [method, endpoint] of actions) {
      const commercial = ['Administrador', 'Supervisor', 'Administración'].includes(role);
      const allowed = endpoint.startsWith('/requests') ? commercial || (role === 'Producción' && method === 'GET') : method === 'PATCH' ? ['Administrador', 'Supervisor'].includes(role) : commercial;
      const body = method === 'GET' ? undefined : method === 'PATCH' ? { status: 'accepted' } : method === 'PUT' ? { description: 'Role update' } : endpoint === '/requests' ? requestInput() : quoteInput();
      const before = !allowed ? await snapshot() : null;
      const response = await call(method, endpoint, sessions.get(role).accessToken, body);
      assert.equal(response.status, allowed ? method === 'POST' ? 201 : 200 : 403, `${role} ${method} ${endpoint}`);
      if (allowed) { const data = await json(response); if (method === 'POST') assert.equal(data.createdById, users.get(role).id); }
      else assert.deepEqual(await snapshot(), before);
    }
    // The base quote has been accepted in the matrix, so subsequent tests use new drafts.
    for (const endpoint of [`/requests/${request.id}`, `/quotations/${quote.id}`]) assert.equal((await call('DELETE', endpoint, token)).status, 404);
  });

  await t.test('requests validate dates and fields, preserve omissions, unique numbers and immutable quoted source', async () => {
    for (const override of [{ title: null }, { title: ' ' }, { title: 'T'.repeat(501) }, { requestNumber: 'N'.repeat(101) }, { clientId: '1' }, { clientId: 2147483648 }, { receivedAt: '2026-02-30' }, { requestedDeliveryDate: '2026-09-30T00:00:00.000Z' }, { createdById: users.get('Calidad').id }, { status: 'APPROVED' }]) {
      const before = await snapshot(); assert.equal((await call('POST', '/requests', token, { ...requestInput(), ...override })).status, 400); assert.deepEqual(await snapshot(), before);
    }
    assert.equal((await call('POST', '/requests', token, { ...requestInput(), clientId: 2147483647 })).status, 404);
    const duplicate = requestInput(); const race = await Promise.all([1, 2].map(() => call('POST', '/requests', token, duplicate))); assert.deepEqual(race.map(result => result.status).sort(), [201, 409]);
    const response = await call('POST', '/requests', token, { ...requestInput(), title: ' Trimmed ' }); assert.equal(response.status, 201); const editable = await json(response);
    assert.equal(editable.title, 'Trimmed'); assert.equal(editable.createdById, users.get('Administrador').id);
    assert.equal((await call('PUT', `/requests/${editable.id}`, token, { requestedDeliveryDate: null, title: 'Changed' })).status, 200);
    const reloaded = await json(await call('GET', `/requests/${editable.id}`, token)); assert.equal(reloaded.requestedDeliveryDate, null); assert.equal(reloaded.description, editable.description); assert.equal(reloaded.createdAt, editable.createdAt);
    for (const body of [{}, { title: null }, { receivedAt: null }, { clientId: other.id }, { requestNumber: 'CHANGED' }, { createdAt: '2026-01-01' }]) assert.equal((await call('PUT', `/requests/${editable.id}`, token, body)).status, ['clientId', 'requestNumber'].some(key => Object.hasOwn(body, key)) ? 409 : 400);
    assert.equal((await call('PUT', `/requests/${request.id}`, token, { description: 'Changed origin' })).status, 409);
    assert.equal((await call('GET', '/requests/2147483648', token)).status, 400);
    assert.equal((await call('GET', '/requests/2147483647', token)).status, 404);
    await call('PATCH', `/clients/${other.id}/status`, token, { isActive: false });
    assert.equal((await call('POST', '/requests', token, { ...requestInput(), clientId: other.id })).status, 409);
  });

  await t.test('quotations persist complete items, exact calculated amounts, nested validation and coherent origin', async () => {
    const response = await call('POST', '/quotations', token, quoteInput()); assert.equal(response.status, 201); const draft = await json(response);
    assert.equal(draft.subtotal, '0.31'); assert.equal(draft.taxAmount, '0.07'); assert.equal(draft.total, '0.38'); assert.equal(draft.items[0].subtotal, 0.01);
    assert.equal(draft.decisionStatus, 'pending'); assert.equal(draft.decidedById, null); assert.equal(draft.decidedAt, null);
    const reloaded = await json(await call('GET', `/quotations/${draft.id}`, token)); assert.deepEqual(reloaded, draft);
    for (const override of [{ items: [] }, { items: null }, { version: 1.5 }, { currency: 'EUR' }, { validUntil: '2026-02-30' }, { subtotal: '999' }, { taxAmount: '999' }, { createdById: 1 }, { decisionStatus: 'accepted' }, { items: Array(101).fill({ description: 'Many', quantity: 1, unitPrice: 1 }) }]) {
      const before = await snapshot(); assert.equal((await call('POST', '/quotations', token, { ...quoteInput(), ...override })).status, 400); assert.deepEqual(await snapshot(), before);
    }
    for (const item of [{ description: '', quantity: 1, unitPrice: 1 }, { description: 'X', quantity: 0, unitPrice: 1 }, { description: 'X', quantity: '1e2', unitPrice: 1 }, { description: 'X', quantity: true, unitPrice: 1 }, { description: 'X', quantity: 1.001, unitPrice: 1 }, { description: 'X', quantity: 1, unitPrice: -1 }, { description: 'X', quantity: 1, unitPrice: null }, { description: 'X', quantity: 1, unitPrice: 1, subtotal: 1 }, { description: 'X', quantity: 1, unitPrice: 1, quotationId: draft.id }, { description: 'X', quantity: '999999999999.99', unitPrice: '999999999999.99' }]) {
      const before = await snapshot(); assert.equal((await call('POST', '/quotations', token, { ...quoteInput(), items: [item] })).status, 400); assert.deepEqual(await snapshot(), before);
    }
    assert.equal((await call('POST', '/quotations', token, { ...quoteInput(), requestId: 2147483647 })).status, 404);
    const mismatched = await (await call('POST', '/clients', token, { businessName: 'Mismatch', taxId: '90000000004', email: 'mismatch@example.test', phone: '123456789' })).json();
    assert.equal((await call('POST', '/quotations', token, { ...quoteInput(), clientId: mismatched.id })).status, 400);
    const duplicate = quoteInput(); const race = await Promise.all([1, 2].map(() => call('POST', '/quotations', token, duplicate))); assert.deepEqual(race.map(result => result.status).sort(), [201, 409]);
    const oldItems = draft.items;
    assert.equal((await call('PUT', `/quotations/${draft.id}`, token, { description: 'New draft description', validUntil: null })).status, 200);
    const unchangedItems = await json(await call('GET', `/quotations/${draft.id}`, token)); assert.deepEqual(unchangedItems.items, oldItems); assert.equal(unchangedItems.version, 1);
    assert.equal((await call('PUT', `/quotations/${draft.id}`, token, { items: [{ description: 'Replacement', quantity: 2, unitPrice: '10.01', notes: 'New note' }] })).status, 200);
    const updated = await json(await call('GET', `/quotations/${draft.id}`, token)); assert.equal(updated.items.length, 1); assert.equal(updated.subtotal, '20.02'); assert.equal(updated.taxAmount, '4.20'); assert.equal(updated.items[0].notes, 'New note'); assert.equal(updated.createdAt, draft.createdAt);
    for (const body of [{}, { items: null }, { version: null }, { requestId: request.id + 999 }, { clientId: mismatched.id }, { quotationNumber: 'CHANGED' }]) assert.equal((await call('PUT', `/quotations/${draft.id}`, token, body)).status, ['requestId', 'clientId', 'quotationNumber'].some(key => Object.hasOwn(body, key)) ? 409 : 400);
    const legacy = await json(await call('GET', `/quotations/${legacyQuoteId}`, token)); assert.equal(legacy.decisionStatus, 'pending'); assert.equal(legacy.decidedById, null); assert.equal(legacy.items[0].notes, 'Preserved notes');
    await em.getConnection().execute('update quotation set subtotal = ? where id = ?', ['-1.00', legacyQuoteId]);
    const invalidLegacy = await json(await call('GET', `/quotations/${legacyQuoteId}`, token)); assert.equal(invalidLegacy.subtotal, '-1.00');
    assert.equal((await call('PATCH', `/quotations/${legacyQuoteId}/decision`, token, { status: 'accepted' })).status, 409);
    assert.equal((await call('PUT', `/quotations/${legacyQuoteId}`, token, { items: [{ description: 'Explicit legacy correction', quantity: 3, unitPrice: '41.15', notes: 'Preserved notes' }] })).status, 200);
    const corrected = await json(await call('GET', `/quotations/${legacyQuoteId}`, token)); assert.equal(corrected.subtotal, '123.45'); assert.equal(corrected.createdById, legacy.createdById);
  });

  await t.test('item replacement rolls back completely when a database write fails', async () => {
    const draft = await (await call('POST', '/quotations', token, quoteInput())).json();
    const connection = em.getConnection(); const before = await snapshot();
    await connection.execute(`create function reject_commercial_fixture() returns trigger language plpgsql as $$ begin if new.description = 'reject-item-fixture' then raise exception 'isolated fixture failure'; end if; return new; end $$;`);
    await connection.execute('create trigger reject_commercial_fixture before insert on quotation_item for each row execute function reject_commercial_fixture()');
    try {
      assert.equal((await call('PUT', `/quotations/${draft.id}`, token, { description: 'Must rollback', items: [{ description: 'reject-item-fixture', quantity: 2, unitPrice: 100 }] })).status, 500);
      assert.deepEqual(await snapshot(), before);
    } finally { await connection.execute('drop trigger reject_commercial_fixture on quotation_item'); await connection.execute('drop function reject_commercial_fixture()'); }
  });

  await t.test('commercial decisions preserve actor and date, lock terms, reject invalid acceptance and concurrent changes', async () => {
    const draft = await (await call('POST', '/quotations', token, quoteInput())).json();
    for (const body of [{ status: 'pending' }, { status: null }, { status: 'accepted', decidedById: users.get('Calidad').id }, { status: 'accepted', decidedAt: '2026-01-01' }]) assert.equal((await call('PATCH', `/quotations/${draft.id}/decision`, token, body)).status, 400);
    const concurrent = await Promise.all(['accepted', 'rejected'].map(status => call('PATCH', `/quotations/${draft.id}/decision`, token, { status }))); assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]);
    const saved = await json(await call('GET', `/quotations/${draft.id}`, token)); assert.equal(saved.decidedById, users.get('Administrador').id); assert.ok(saved.decidedAt); assert.equal(saved.decidedBy.id, saved.decidedById);
    const repeated = await json(await call('PATCH', `/quotations/${draft.id}/decision`, sessions.get('Supervisor').accessToken, { status: saved.decisionStatus })); assert.equal(repeated.decidedById, saved.decidedById); assert.equal(repeated.decidedAt, saved.decidedAt);
    assert.equal((await call('PUT', `/quotations/${draft.id}`, token, { description: 'Changed accepted terms' })).status, 409);
    const expired = await (await call('POST', '/quotations', token, { ...quoteInput(), validUntil: '2000-01-01T00:00:00.000Z' })).json(); assert.equal((await call('PATCH', `/quotations/${expired.id}/decision`, token, { status: 'accepted' })).status, 409);
    assert.equal((await call('PATCH', `/quotations/${expired.id}/decision`, token, { status: 'rejected' })).status, 200);
    const raced = await (await call('POST', '/quotations', token, quoteInput())).json();
    const race = await Promise.all([call('PUT', `/quotations/${raced.id}`, token, { items: [{ description: 'Concurrent edit', quantity: 2, unitPrice: 10 }] }), call('PATCH', `/quotations/${raced.id}/decision`, token, { status: 'accepted' })]);
    assert.equal(race[1].status, 200); assert.ok([200, 409].includes(race[0].status));
    const final = await json(await call('GET', `/quotations/${raced.id}`, token)); assert.equal(final.decisionStatus, 'accepted'); assert.equal(final.subtotal, race[0].status === 200 ? '20.00' : '0.31');
    await call('PATCH', `/clients/${client.id}/status`, token, { isActive: false });
    assert.equal((await call('POST', '/quotations', token, quoteInput())).status, 409);
    const pending = (await json(await call('GET', '/quotations', token))).find(record => record.clientId === client.id && record.decisionStatus === 'pending');
    assert.equal((await call('PATCH', `/quotations/${pending.id}/decision`, token, { status: 'accepted' })).status, 409);
    assert.equal((await call('GET', `/quotations/${final.id}`, token)).status, 200);
    assert.equal((await call('PATCH', '/quotations/2147483647/decision', token, { status: 'accepted' })).status, 404);
    await call('PATCH', `/clients/${client.id}/status`, token, { isActive: true });
  });
};
