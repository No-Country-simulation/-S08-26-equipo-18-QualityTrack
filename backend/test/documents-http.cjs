const assert = require('node:assert/strict');
const { readFile, writeFile, unlink, readdir } = require('node:fs/promises');
const { join } = require('node:path');
module.exports = async (
  t,
  { call, em, users, sessions, admin, password, legacyWorkOrderId },
) => {
  const token = (role) => sessions.get(role).accessToken;
  const json = async (
    method,
    path,
    body,
    status = 200,
    auth = admin.accessToken,
  ) => {
    const r = await call(method, path, auth, body);
    const d = await r.json();
    assert.equal(r.status, status, JSON.stringify(d));
    return d;
  };
  const client = await json(
    'POST',
    '/clients',
    {
      businessName: 'Document fixture',
      taxId: '90000000012',
      email: 'docs@example.test',
      phone: '123456789',
    },
    201,
  );
  const makeRequest = () =>
    json(
      'POST',
      '/requests',
      {
        clientId: client.id,
        title: 'Document source',
        description: 'Requirements',
        receivedAt: '2026-10-01',
      },
      201,
    );
  const request = await makeRequest(),
    foreignRequest = await makeRequest();
  const quote = await json(
    'POST',
    '/quotations',
    {
      clientId: client.id,
      requestId: request.id,
      version: 1,
      description: 'Document source',
      currency: 'ARS',
      items: [{ description: 'Part', quantity: 1, unitPrice: 1 }],
    },
    201,
  );
  await json('PATCH', `/quotations/${quote.id}/decision`, {
    status: 'accepted',
  });
  const makeOrder = () =>
    json(
      'POST',
      '/work-orders',
      {
        quotationId: quote.id,
        title: 'Document OT',
        description: 'Drawing',
        priority: 'MEDIUM',
        plannedStartDate: '2026-10-01',
        plannedEndDate: '2026-10-09',
      },
      201,
    );
  const wo = await makeOrder(),
    other = await makeOrder();
  const types = await json('GET', '/documents/types');
  assert.ok(types.length >= 6);
  const typeId = types[0].id;
  const source = Buffer.from('%PDF-1.7\nDocument evidence\n%%EOF\n');
  const upload = async (
    fields,
    bytes = source,
    name = 'plan.pdf',
    mime = 'application/pdf',
    status = 201,
    auth = admin.accessToken,
  ) => {
    const data = new FormData();
    for (const [k, v] of Object.entries({ documentTypeId: typeId, ...fields }))
      if (v !== undefined) data.append(k, String(v));
    if (bytes !== null)
      data.append('file', new Blob([bytes], { type: mime }), name);
    return json('POST', '/documents/upload', data, status, auth);
  };
  const snapshot = () =>
    em.getConnection().execute('select * from document order by id');
  const disk = async () => {
    try {
      return (await readdir(process.env.DOCUMENT_STORAGE_DIR)).sort();
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  };
  let direct, requestDoc, quoteDoc, combined;
  await t.test(
    'document upload rejects anonymous/read-only roles before persisting files',
    async () => {
      const before = await snapshot(),
        files = await disk();
      for (const role of [null, 'Producción', 'Calidad'])
        await upload(
          { workOrderId: wo.id },
          source,
          'plan.pdf',
          'application/pdf',
          role ? 403 : 401,
          role ? token(role) : null,
        );
      await upload(
        { workOrderId: wo.id },
        source,
        'plan.pdf',
        'application/pdf',
        403,
        token('Administración'),
      );
      await json(
        'GET',
        `/documents/work-order/${wo.id}`,
        undefined,
        403,
        token('Administración'),
      );
      await json('GET', '/documents', undefined, 401, null);
      assert.deepEqual(await snapshot(), before);
      assert.deepEqual(await disk(), files);
    },
  );
  await t.test(
    'upload persists real metadata and author, ignores declared MIME and returns no storage path',
    async () => {
      direct = await upload(
        { workOrderId: wo.id, description: 'Drawing revision' },
        source,
        'plano-á.pdf',
        'application/x-forged',
        201,
        token('Supervisor'),
      );
      assert.equal(direct.fileName, 'plano-á.pdf');
      assert.equal(direct.fileSize, source.length);
      assert.equal(direct.mimeType, 'application/pdf');
      assert.equal(direct.version, 1);
      assert.equal(direct.uploadedById, users.get('Supervisor').id);
      assert.ok(direct.uploadedAt);
      assert.equal(direct.downloadAvailable, true);
      assert.equal(direct.storagePath, undefined);
      const stored = (
        await em
          .getConnection()
          .execute('select * from document where id=?', [direct.id])
      )[0];
      assert.match(stored.storage_path, /^[a-f0-9-]{36}\.pdf$/);
      assert.match(stored.sha256, /^[a-f0-9]{64}$/);
      assert.equal(stored.file_size, source.length);
      assert.deepEqual(await json('GET', `/documents/${direct.id}`), direct);
    },
  );
  await t.test(
    'invalid upload fields, empty files, formats and mismatched origins leave DB and disk unchanged',
    async () => {
      const before = await snapshot(),
        files = await disk();
      await upload({}, source, 'plan.pdf', 'application/pdf', 400);
      await upload(
        { workOrderId: wo.id },
        null,
        'plan.pdf',
        'application/pdf',
        400,
      );
      await upload(
        { workOrderId: wo.id },
        Buffer.alloc(0),
        'plan.pdf',
        'application/pdf',
        400,
      );
      await upload(
        { workOrderId: wo.id },
        Buffer.from('Not PDF'),
        'plan.pdf',
        'application/pdf',
        400,
      );
      await upload(
        { workOrderId: wo.id },
        source,
        'script.exe',
        'application/pdf',
        400,
      );
      await upload(
        { workOrderId: wo.id },
        Buffer.from([0, 255]),
        'invalid.txt',
        'text/plain',
        400,
      );
      await upload(
        { workOrderId: wo.id },
        Buffer.alloc(1025),
        'big.txt',
        'text/plain',
        413,
      );
      for (const fields of [
        { workOrderId: 'bad' },
        { workOrderId: wo.id, documentTypeId: 0 },
        { workOrderId: wo.id, storagePath: '/secret' },
        { workOrderId: wo.id, uploadedById: 1 },
        { workOrderId: wo.id, fileSize: 1 },
        { workOrderId: wo.id, mimeType: 'text/plain' },
        { workOrderId: wo.id, version: 9 },
      ])
        await upload(fields, source, 'plan.pdf', 'application/pdf', 400);
      await upload(
        { workOrderId: wo.id, requestId: foreignRequest.id },
        source,
        'plan.pdf',
        'application/pdf',
        409,
      );
      await upload(
        { quotationId: quote.id, requestId: foreignRequest.id },
        source,
        'plan.pdf',
        'application/pdf',
        409,
      );
      await upload(
        { workOrderId: 2147483647 },
        source,
        'plan.pdf',
        'application/pdf',
        404,
      );
      await upload(
        { workOrderId: wo.id, documentTypeId: 2147483647 },
        source,
        'plan.pdf',
        'application/pdf',
        404,
      );
      assert.deepEqual(await snapshot(), before);
      assert.deepEqual(await disk(), files);
    },
  );
  await t.test(
    'expedient includes commercial source documents exactly once and excludes another OT',
    async () => {
      requestDoc = await upload(
        { requestId: request.id },
        Buffer.from('Requirements,revision\npart,1\n'),
        'requirements.csv',
        'text/plain',
        201,
        token('Administración'),
      );
      quoteDoc = await upload(
        { quotationId: quote.id },
        source,
        'offer.pdf',
        'application/pdf',
        201,
        token('Administración'),
      );
      combined = await upload({
        workOrderId: wo.id,
        requestId: request.id,
        quotationId: quote.id,
      });
      const elsewhere = await upload({
        workOrderId: other.id,
        requestId: request.id,
      });
      const docs = await json(
        'GET',
        `/documents/work-order/${wo.id}`,
        undefined,
        200,
        token('Calidad'),
      );
      assert.deepEqual(
        docs.map((d) => d.id).sort((a, b) => a - b),
        [direct.id, requestDoc.id, quoteDoc.id, combined.id].sort(
          (a, b) => a - b,
        ),
      );
      assert.equal(
        docs.some((d) => d.id === elsewhere.id),
        false,
      );
      const otherDocs = await json('GET', `/documents/work-order/${other.id}`);
      assert.equal(
        otherDocs.some((d) => d.id === direct.id || d.id === combined.id),
        false,
      );
      assert.ok(otherDocs.some((d) => d.id === requestDoc.id));
      await json(
        'GET',
        `/documents/request/${request.id}`,
        undefined,
        200,
        token('Administración'),
      );
      assert.equal(
        (await json('GET', `/documents/work-order/${legacyWorkOrderId}`)).every(
          (d) => d.workOrderId === legacyWorkOrderId,
        ),
        true,
      );
    },
  );
  await t.test(
    'download is authenticated, byte-exact, safe attachment and permitted through the real OT origin',
    async () => {
      for (const role of [
        'Administrador',
        'Supervisor',
        'Producción',
        'Calidad',
      ]) {
        const r = await call(
          'GET',
          `/documents/${direct.id}/download`,
          token(role),
        );
        assert.equal(r.status, 200);
        assert.deepEqual(Buffer.from(await r.arrayBuffer()), source);
        assert.match(r.headers.get('content-disposition'), /^attachment;/);
        assert.match(
          r.headers.get('content-disposition'),
          /filename\*=UTF-8''plano-%C3%A1.pdf/,
        );
        assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(r.headers.get('cache-control'), 'private, no-store');
      }
      await json(
        'GET',
        `/documents/${direct.id}/download`,
        undefined,
        401,
        null,
      );
      await json(
        'GET',
        `/documents/${direct.id}/download`,
        undefined,
        403,
        token('Administración'),
      );
      const q = await call(
        'GET',
        `/documents/${quoteDoc.id}/download`,
        token('Calidad'),
      );
      assert.equal(q.status, 200);
      assert.deepEqual(Buffer.from(await q.arrayBuffer()), source);
      const unrelated = await upload({ requestId: foreignRequest.id });
      await json(
        'GET',
        `/documents/${unrelated.id}/download`,
        undefined,
        403,
        token('Calidad'),
      );
      const visible = await json(
        'GET',
        '/documents',
        undefined,
        200,
        token('Calidad'),
      );
      assert.equal(
        visible.some((d) => d.id === unrelated.id),
        false,
      );
    },
  );
  await t.test(
    'a fresh application and login recover stored file bytes without seed or in-memory attachments',
    async () => {
      const { NestFactory } = require('@nestjs/core'),
        { ValidationPipe } = require('@nestjs/common'),
        { AppModule } = require('../dist/src/app.module');
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
        const base = await app.getUrl(),
          login = await fetch(base + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: users.get('Calidad').email,
              password,
            }),
          });
        assert.equal(login.status, 200);
        const session = await login.json(),
          r = await fetch(base + `/documents/${direct.id}/download`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
        assert.equal(r.status, 200);
        assert.deepEqual(Buffer.from(await r.arrayBuffer()), source);
      } finally {
        await app.close();
      }
    },
  );
  await t.test(
    'failed database persistence cleans only the new file and does not erase existing evidence',
    async () => {
      const before = await snapshot(),
        files = await disk();
      await em
        .getConnection()
        .execute(
          `create function reject_test_doc() returns trigger language plpgsql as $$ begin if NEW.description='fail-storage-fixture' then raise exception 'fixture write failure'; end if; return NEW; end $$`,
        );
      await em
        .getConnection()
        .execute(
          'create trigger reject_test_doc before insert on document for each row execute function reject_test_doc()',
        );
      try {
        await upload(
          { workOrderId: wo.id, description: 'fail-storage-fixture' },
          source,
          'plan.pdf',
          'application/pdf',
          500,
        );
      } finally {
        await em
          .getConnection()
          .execute('drop trigger reject_test_doc on document');
        await em.getConnection().execute('drop function reject_test_doc()');
      }
      assert.deepEqual(await snapshot(), before);
      assert.deepEqual(await disk(), files);
    },
  );
  await t.test(
    'missing files and changed bytes produce useful errors instead of another file or silent corruption',
    async () => {
      const stored = (
        await em
          .getConnection()
          .execute('select storage_path from document where id=?', [direct.id])
      )[0];
      const path = join(process.env.DOCUMENT_STORAGE_DIR, stored.storage_path),
        bytes = await readFile(path);
      try {
        const changed = Buffer.from(bytes);
        changed[10] ^= 1;
        await writeFile(path, changed);
        await json('GET', `/documents/${direct.id}/download`, undefined, 409);
      } finally {
        await writeFile(path, bytes);
      }
      const temp = await upload({ workOrderId: wo.id });
      const [row] = await em
        .getConnection()
        .execute('select storage_path from document where id=?', [temp.id]);
      await unlink(join(process.env.DOCUMENT_STORAGE_DIR, row.storage_path));
      await json('GET', `/documents/${temp.id}/download`, undefined, 404);
    },
  );
  await t.test(
    'DB restrictions retain evidence, reject new orphans and expose no DELETE API',
    async () => {
      const before = await snapshot();
      await assert.rejects(
        em
          .getConnection()
          .execute('update document set work_order_id=null where id=?', [
            direct.id,
          ]),
      );
      await assert.rejects(
        em
          .getConnection()
          .execute('delete from request where id=?', [foreignRequest.id]),
      );
      await assert.rejects(
        em
          .getConnection()
          .execute('delete from work_order where id=?', [wo.id]),
      );
      await json('DELETE', `/documents/${direct.id}`, undefined, 404);
      assert.deepEqual(await snapshot(), before);
    },
  );
};
