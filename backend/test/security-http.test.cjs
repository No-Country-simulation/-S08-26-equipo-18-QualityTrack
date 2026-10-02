const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
require('reflect-metadata');

// Opt-in: never migrate a developer's regular database or any remote database.
test('HTTP authorization and logout against an isolated PostgreSQL database', {
    skip: process.env.SECURITY_TEST_DB !== 'true', timeout: 240_000,
}, async (t) => {
    assert.ok(['localhost', '127.0.0.1', 'postgres'].includes(process.env.DB_HOST));
    assert.equal(process.env.POSTGRES_DB, 'qualitytrack_security');
    assert.equal(process.env.DB_SSL, 'false');
    process.env.JWT_ACCESS_SECRET ||= randomBytes(32).toString('hex');
    // Nest builds src/ only. Use the same source migration CLI as local setup
    // rather than silently looking for missing compiled migrations.
    const cli = path.join(path.dirname(require.resolve('@mikro-orm/cli/package.json')), 'cli.js');
    // Prove the additive migration preserves users from the previous schema.
    execFileSync(process.execPath, [cli, 'migration:up', '--to', 'Migration20260922180709', '--config', './mikro-orm.config.ts'], { stdio: 'inherit' });
    const { MikroORM: PostgreSqlORM } = require('@mikro-orm/postgresql');
    const databaseConfig = require('../dist/src/config/database.config').default;
    const legacyOrm = await PostgreSqlORM.init(databaseConfig);
    const legacyPasswordHash = await require('bcryptjs').hash(randomBytes(24).toString('hex'), 10);
    let legacyId, legacyQuoteId, legacyQuoteBefore, legacyWorkOrderId, legacyWorkOrderBefore, legacyProductionBefore;
    try {
        const rows = await legacyOrm.em.getConnection().execute(
            'insert into "user" (first_name, last_name, email, password, role_id, created_at, updated_at) values (?, ?, ?, ?, (select id from role where name = ?), now(), now()) returning id',
            ['Legacy', 'Account', 'migration-legacy@example.test', legacyPasswordHash, 'Calidad'],
        );
        legacyId = rows[0].id;
        const connection = legacyOrm.em.getConnection();
        const [client] = await connection.execute('insert into client (business_name, tax_id, email, phone, is_active, created_at, updated_at) values (?, ?, ?, ?, true, now(), now()) returning id', ['Migration client', '90000000001', 'migration-client@example.test', '123456789']);
        const [request] = await connection.execute('insert into request (client_id, request_number, title, description, received_at, created_by_id, created_at, updated_at) values (?, ?, ?, ?, now(), ?, now(), now()) returning id', [client.id, 'SOL-000123', 'Existing request', 'Existing source', legacyId]);
        const [quote] = await connection.execute('insert into quotation (client_id, request_id, quotation_number, version, description, subtotal, tax_amount, currency, created_by_id, created_at, updated_at) values (?, ?, ?, 1, ?, ?, ?, ?, ?, now(), now()) returning id', [client.id, request.id, 'COT-000045', 'Existing offer', '123.45', '25.92', 'ARS', legacyId]);
        legacyQuoteId = quote.id;
        await connection.execute('insert into quotation_item (quotation_id, description, quantity, unit_price, subtotal, notes) values (?, ?, ?, ?, ?, ?)', [quote.id, 'Existing item', '3.00', '41.15', '123.45', 'Preserved notes']);
        const [legacyWorkOrder] = await connection.execute('insert into work_order (work_order_number, title, description, priority, status, created_by_id, planned_start_date, planned_end_date, created_at) values (1100, ?, ?, ?, ?, ?, now(), now(), now()) returning id', ['Legacy WO', 'Preserve historical origin', 'MEDIUM', 'APPROVED', legacyId]);
        legacyWorkOrderId = legacyWorkOrder.id;
        legacyWorkOrderBefore = (await connection.execute('select * from work_order where id = ?', [legacyWorkOrderId]))[0];
        const [duplicate] = await connection.execute('insert into work_order (work_order_number, title, description, priority, status, created_by_id, planned_start_date, planned_end_date, created_at) values (1100, ?, ?, ?, ?, ?, now(), now(), now()) returning id', ['Duplicate fixture', 'Must not be renumbered', 'MEDIUM', 'PENDING', legacyId]);
        assert.throws(() => execFileSync(process.execPath, [cli, 'migration:up', '--config', './mikro-orm.config.ts'], { stdio: 'pipe' }));
        assert.equal((await connection.execute('select work_order_number from work_order where id = ?', [duplicate.id]))[0].work_order_number, 1100);
        await connection.execute('delete from work_order where id = ?', [duplicate.id]);
        execFileSync(process.execPath, [cli, 'migration:up', '--to', 'Migration20261002190000_commercial_numbers', '--config', './mikro-orm.config.ts'], { stdio: 'inherit' });
        const [sheet] = await connection.execute('insert into route_sheet (work_order_id,route_number,instructions,created_by_id,created_at,updated_at) values (?, ?, ?, ?, now(), now()) returning id', [legacyWorkOrderId, 'HR-000123', 'Historical instructions', legacyId]);
        await connection.execute('insert into operation (route_sheet_id,operation_number,name,notes) values (?, ?, ?, ?)', [sheet.id, 'OP-007', 'Historical operation', 'Historical notes']);
        const [material] = await connection.execute('insert into material (material_code,name,specification,manufacturer) values (?, ?, ?, ?) returning id', ['LEGACY-MAT', 'Historical material', 'Historical specification', 'Historical manufacturer']);
        await connection.execute('insert into work_order_material (work_order_id,material_id,quantity,unit,lot_number) values (?, ?, ?, ?, ?)', [legacyWorkOrderId, material.id, '1.25', 'kg', 'Historical lot']);
        await connection.execute('insert into work_order_user (work_order_id,user_id,assigned_at) values (?, ?, now())', [legacyWorkOrderId, legacyId]);
        const [duplicateOp] = await connection.execute('insert into operation (route_sheet_id,operation_number,name) values (?, ?, ?) returning id', [sheet.id, 'OP-007', 'Duplicate fixture']);
        const failedOp = require('node:child_process').spawnSync(process.execPath, [cli, 'migration:up', '--config', './mikro-orm.config.ts'], { encoding: 'utf8' });
        assert.notEqual(failedOp.status, 0); assert.match(failedOp.stdout + failedOp.stderr, /Duplicate operation numbers/);
        await connection.execute('delete from operation where id=?', [duplicateOp.id]);
        const [duplicatePerson] = await connection.execute('insert into work_order_user (work_order_id,user_id,assigned_at) values (?, ?, now()) returning id', [legacyWorkOrderId, legacyId]);
        const failedPerson = require('node:child_process').spawnSync(process.execPath, [cli, 'migration:up', '--config', './mikro-orm.config.ts'], { encoding: 'utf8' });
        assert.notEqual(failedPerson.status, 0); assert.match(failedPerson.stdout + failedPerson.stderr, /Duplicate personnel assignments/);
        await connection.execute('delete from work_order_user where id=?', [duplicatePerson.id]);
        legacyProductionBefore={};
        for(const table of ['route_sheet','operation','material','work_order_material','work_order_user']) legacyProductionBefore[table]=await connection.execute(`select * from ${table} order by id`);
        legacyQuoteBefore = (await connection.execute('select * from quotation where id = ?', [quote.id]))[0];
    } finally { await legacyOrm.close(); }
    execFileSync(process.execPath, [cli, 'migration:up', '--config', './mikro-orm.config.ts'], { stdio: 'inherit' });
    require('reflect-metadata');
    const { NestFactory } = require('@nestjs/core');
    const { ValidationPipe } = require('@nestjs/common');
    const { MikroORM } = require('@mikro-orm/core');
    const { JwtService } = require('@nestjs/jwt');
    const { hash } = require('bcryptjs');
    const { AppModule } = require('../dist/src/app.module');
    const { User } = require('../dist/src/entities/User');
    const { Role } = require('../dist/src/entities/Role');
    const { Session } = require('../dist/src/entities/Session');
    const { RefreshToken } = require('../dist/src/entities/RefreshToken');
    const { hashRefreshToken } = require('../dist/src/auth/tokens');
    const { REFRESH_REUSE_GRACE_MS } = require('../dist/src/auth/session-policy');
    const app = await NestFactory.create(AppModule, { logger: false });
    try {
        const orm = app.get(MikroORM);
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.listen(0, '127.0.0.1');
        const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
        const schema = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Security fixture').build());
        assert.ok(schema.paths['/requests'].post);
        assert.ok(schema.paths['/quotations/{id}/decision'].patch);
        assert.ok(schema.components.schemas.QuotationResponseDto.properties.decidedAt.nullable);
        assert.equal(schema.components.schemas.QuotationItemDto.properties.quantity.oneOf.length, 2);
        const base = await app.getUrl();
        const em = orm.em.fork();
        const legacyUser = await em.findOneOrFail(User, { id: legacyId });
        assert.equal(legacyUser.dni, null);
        assert.equal(legacyUser.isActive, true);
        assert.equal(legacyUser.password, legacyPasswordHash);
        assert.equal(legacyUser.email, 'migration-legacy@example.test');
        await t.test('production migration preserves historical records and rejects duplicates without assigning invented actors', async () => {
            for(const [table, rows] of Object.entries(legacyProductionBefore)) {
                const after=await em.getConnection().execute(`select * from ${table} order by id`);
                assert.equal(after.length,rows.length);
                for(let i=0;i<rows.length;i++)for(const key of Object.keys(rows[i]))assert.deepEqual(after[i][key],rows[i][key],`${table}.${key}`);
                for(const row of after)for(const key of ['assigned_by_id','executed_by_id','unassigned_at','unassigned_by_id'])if(key in row)assert.equal(row[key],null);
            }
        });
        const legacyQuote = (await em.getConnection().execute('select * from quotation where id = ?', [legacyQuoteId]))[0];
        for (const key of Object.keys(legacyQuoteBefore)) assert.deepEqual(legacyQuote[key], legacyQuoteBefore[key]);
        assert.equal(legacyQuote.decision_status, 'pending');
        assert.equal(legacyQuote.decided_by_id, null); assert.equal(legacyQuote.decided_at, null);
        const password = randomBytes(24).toString('hex');
        const passwordHash = await hash(password, 10);
        const sessions = new Map();
        const users = new Map();
        const roleNames = ['Administrador', 'Supervisor', 'Administración', 'Producción', 'Calidad', 'constructor'];
        const unknown = new Role();
        unknown.name = 'constructor';
        unknown.description = 'Only an unknown-role test fixture';
        await em.persist(unknown).flush();
        const call = (method, endpoint, token, body) => fetch(base + endpoint, {
            method,
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        for (const [index, name] of roleNames.entries()) {
            const user = new User();
            user.firstName = 'Security';
            user.lastName = 'Fixture';
            user.email = `security-${index}@example.test`;
            user.password = passwordHash;
            user.role = await em.findOneOrFail(Role, { name });
            await em.persist(user).flush();
            users.set(name, user);
            const login = await call('POST', '/auth/login', null, { email: user.email, password });
            assert.equal(login.status, 200, `login for ${name}`);
            sessions.set(name, await login.json());
        }

        let number = 0;
        const input = () => ({ businessName: 'Security fixture', taxId: String(30000000000 + ++number), email: 'client@example.test', phone: '123456789' });
        const admin = sessions.get('Administrador');
        await t.test('the initial seed requires a real-format unique DNI and preserves an existing inactive account', async () => {
            const seedArgs = [cli, 'seeder:run', '--config', './mikro-orm.config.ts'];
            const seedEnv = { ...process.env, ADMIN_EMAIL: 'seed-fixture@example.test', ADMIN_PASSWORD: password, ADMIN_DNI: '70.000.000' };
            for (const [email, dni] of [['seed-missing@example.test', ''], ['seed-invalid@example.test', 'abc70000000']]) {
                const failed = require('node:child_process').spawnSync(process.execPath, seedArgs, { env: { ...seedEnv, ADMIN_EMAIL: email, ADMIN_DNI: dni }, encoding: 'utf8' });
                assert.notEqual(failed.status, 0);
                assert.match(failed.stdout + failed.stderr, /ADMIN_DNI/);
                assert.equal(await em.fork().count(User, { email }), 0);
            }
            execFileSync(process.execPath, seedArgs, { env: seedEnv, stdio: 'inherit' });
            const seeded = await em.fork().findOneOrFail(User, { email: seedEnv.ADMIN_EMAIL });
            assert.equal(seeded.dni, '70000000');
            assert.equal(seeded.isActive, true);
            await em.nativeUpdate(User, { id: seeded.id }, { isActive: false });
            execFileSync(process.execPath, seedArgs, { env: { ...seedEnv, ADMIN_DNI: '' }, stdio: 'inherit' });
            const preserved = await em.fork().findOneOrFail(User, { id: seeded.id });
            assert.equal(preserved.isActive, false);
            assert.equal(preserved.dni, seeded.dni);
            assert.equal(preserved.password, seeded.password);
            const duplicate = require('node:child_process').spawnSync(process.execPath, seedArgs, { env: { ...seedEnv, ADMIN_EMAIL: 'seed-duplicate@example.test' }, encoding: 'utf8' });
            assert.notEqual(duplicate.status, 0);
            assert.equal(await em.fork().count(User, { email: 'seed-duplicate@example.test' }), 0);
        });
        await t.test('users are administered exclusively by Administrador and credentials stay private', async () => {
            const actions = [
                ['GET', '/users'], ['GET', '/roles'], ['POST', '/users'],
                ['PATCH', `/users/${users.get('Supervisor').id}/role`],
                ['PATCH', `/users/${users.get('Supervisor').id}`],
                ['PATCH', `/users/${users.get('Supervisor').id}/status`],
            ];
            for (const name of [null, ...roleNames.filter(name => name !== 'Administrador')]) {
                const before = await em.getConnection().execute('select * from "user" order by id');
                for (const [method, endpoint] of actions) {
                    const res = await call(method, endpoint, name ? sessions.get(name).accessToken : null,
                        method === 'GET' ? undefined : { roleId: users.get('Administrador').role.id, role: 'Administrador', permissions: ['users:manage'] });
                    assert.equal(res.status, name ? 403 : 401, `${name}: ${method} ${endpoint}`);
                }
                assert.deepEqual(await em.getConnection().execute('select * from "user" order by id'), before);
            }
            const rolesResponse = await call('GET', '/roles', admin.accessToken);
            assert.equal(rolesResponse.status, 200);
            const roles = await rolesResponse.json();
            const safe = (value, managed = true) => {
                for (const record of Array.isArray(value) ? value : [value]) {
                    assert.deepEqual(Object.keys(record).sort(), (managed ? ['dni', 'email', 'firstName', 'id', 'isActive', 'lastName', 'role'] : ['email', 'firstName', 'id', 'lastName', 'role']));
                    assert.deepEqual(Object.keys(record.role).sort(), ['description', 'id', 'name']);
                }
            };
            const createdUsers = new Map();
            const credentials = { firstName: ' New ', lastName: ' User ', email: 'new@example.test', dni: '30111222', password: ' é'.repeat(24), roleId: roles[0].id };
            // Exactly 72 UTF-8 bytes, including spaces. No trimming of passwords.
            assert.equal(Buffer.byteLength(credentials.password), 72);
            for (const [index, name] of roleNames.filter(name => name !== 'constructor').entries()) {
                const dto = { ...credentials, email: ` CREATED-${index}@EXAMPLE.TEST `, dni: String(40000000 + index), roleId: roles.find(role => role.name === name).id };
                const res = await call('POST', '/users', admin.accessToken, dto);
                assert.equal(res.status, 201, `create ${name}`);
                const data = await res.json();
                safe(data);
                assert.equal(data.firstName, 'New');
                assert.equal(data.lastName, 'User');
                assert.equal(data.email, dto.email.trim().toLowerCase());
                assert.equal(data.role.id, dto.roleId);
                const stored = await em.fork().findOneOrFail(User, { id: data.id });
                assert.match(stored.password, /^\$2[aby]\$12\$/);
                const login = await call('POST', '/auth/login', null, { email: data.email, password: dto.password });
                assert.equal(login.status, 200, `login ${name}`);
                const session = await login.json();
                safe(session.user, false);
                safe((await (await call('GET', '/auth/me', session.accessToken)).json()).user, false);
                createdUsers.set(name, { ...data, session });
                assert.equal((await call('POST', '/users', admin.accessToken, dto)).status, 409);
            }
            safe(await (await call('GET', '/users', admin.accessToken)).json());
            for (const invalid of [
                { firstName: '' }, { firstName: '  ' }, { firstName: null }, { firstName: 1 }, { firstName: 'A'.repeat(256) },
                { lastName: ' ' }, { lastName: null }, { lastName: 'A'.repeat(256) },
                { email: null }, { email: 'invalid' }, { password: '' }, { password: null }, { password: 1 },
                { dni: undefined }, { dni: null }, { dni: 30111222 }, { dni: '' }, { dni: '123456' }, { dni: '123456789' }, { dni: 'ab30111222' },
                { password: 'A'.repeat(73) }, { password: 'é'.repeat(37) }, { password: '😀'.repeat(19) },
                { roleId: null }, { roleId: 0 }, { roleId: 1.5 }, { roleId: '1' }, { roleId: 2147483647 }, { roleId: 2147483648 },
                { role: { id: roles[0].id } }, { permissions: ['users:manage'] }, { isAdmin: true }, { unknown: true },
            ]) {
                const before = await em.getConnection().execute('select * from "user" order by id');
                const res = await call('POST', '/users', admin.accessToken, { ...credentials, ...invalid });
                assert.equal(res.status, 400, `invalid ${Object.keys(invalid)}`);
                assert.deepEqual(await em.getConnection().execute('select * from "user" order by id'), before);
            }
            assert.equal((await call('POST', '/auth/login', null, { email: credentials.email, password: 'é'.repeat(37) })).status, 400);
            const target = createdUsers.get('Supervisor');
            const qualityId = roles.find(role => role.name === 'Calidad').id;
            const before = await em.getConnection().execute('select * from "user" where id = ?', [target.id]);
            assert.equal((await call('GET', '/clients', target.session.accessToken)).status, 200);
            const updated = await call('PATCH', `/users/${target.id}/role`, admin.accessToken, { roleId: qualityId });
            assert.equal(updated.status, 200);
            safe(await updated.json());
            assert.equal((await call('GET', '/clients', target.session.accessToken)).status, 403);
            const after = await em.getConnection().execute('select * from "user" where id = ?', [target.id]);
            assert.equal(after[0].password, before[0].password);
            assert.equal(after[0].email, before[0].email);
            for (const invalid of [{ roleId: null }, { roleId: 0 }, { roleId: 2147483647 }, { roleId: qualityId, email: 'forged@example.test' }, { roleId: qualityId, password: 'forged' }]) {
                assert.equal((await call('PATCH', `/users/${target.id}/role`, admin.accessToken, invalid)).status, 400);
            }
            assert.equal((await call('PATCH', '/users/2147483647/role', admin.accessToken, { roleId: qualityId })).status, 404);
            for (const id of ['0', '-1', '2147483648', '999999999999999999999999', 'invalid']) {
                assert.equal((await call('PATCH', `/users/${id}/role`, admin.accessToken, { roleId: qualityId })).status, 400);
            }
            assert.equal((await call('PATCH', `/users/${users.get('Administrador').id}/role`, admin.accessToken, { roleId: qualityId })).status, 409);
            assert.equal((await call('PATCH', `/users/${users.get('Administrador').id}/role`, admin.accessToken, { roleId: users.get('Administrador').role.id })).status, 200);
            // Concurrent normalized-email collisions remain 409 at the UNIQUE constraint.
            const duplicates = await Promise.all([1, 2].map(index => call('POST', '/users', admin.accessToken, { ...credentials, dni: String(30000010 + index), email: 'race@example.test' })));
            assert.deepEqual(duplicates.map(res => res.status).sort(), [201, 409]);
        });
        await t.test('personal data edits preserve identity and deactivation revokes all sessions without deleting history', async () => {
            const legacyBefore = await em.getConnection().execute('select * from "user" where id = ?', [legacyId]);
            assert.equal((await call('PATCH', `/users/${legacyId}`, admin.accessToken, { firstName: 'Incomplete' })).status, 400);
            assert.deepEqual(await em.getConnection().execute('select * from "user" where id = ?', [legacyId]), legacyBefore);
            assert.equal((await call('PATCH', `/users/${legacyId}`, admin.accessToken, { firstName: 'Completed', dni: '71000000' })).status, 200);
            const target = users.get('Supervisor');
            const endpoint = `/users/${target.id}`;
            const before = (await em.getConnection().execute('select * from "user" where id = ?', [target.id]))[0];
            const sessionRows = await em.getConnection().execute('select id from session where user_id = ? order by id', [target.id]);
            const edit = await call('PATCH', endpoint, admin.accessToken, {
                firstName: ' Updated ', lastName: ' Person ', email: ' EDITED@EXAMPLE.TEST ', dni: '31.222.333',
            });
            assert.equal(edit.status, 200);
            const data = await edit.json();
            assert.equal(data.id, target.id);
            assert.equal(data.dni, '31222333');
            assert.equal(data.email, 'edited@example.test');
            assert.equal(data.firstName, 'Updated');
            const after = (await em.getConnection().execute('select * from "user" where id = ?', [target.id]))[0];
            for (const field of ['password', 'created_at', 'role_id']) assert.deepEqual(after[field], before[field]);
            assert.deepEqual(await em.getConnection().execute('select id from session where user_id = ? order by id', [target.id]), sessionRows);
            const me = await (await call('GET', '/auth/me', sessions.get('Supervisor').accessToken)).json();
            assert.equal(me.user.email, data.email);
            assert.equal(Object.hasOwn(me.user, 'dni'), false);
            for (const invalid of [
                {}, { firstName: null }, { firstName: ' ' }, { lastName: null }, { email: null }, { email: 'invalid' },
                { dni: null }, { dni: '' }, { dni: 'abc31222333' }, { dni: '123456789' },
                { firstName: 'A'.repeat(256) }, { password: 'forged' }, { roleId: users.get('Administrador').role.id },
                { isActive: false }, { permissions: ['users:manage'] },
            ]) {
                const snapshot = await em.getConnection().execute('select * from "user" where id = ?', [target.id]);
                assert.equal((await call('PATCH', endpoint, admin.accessToken, invalid)).status, 400, `profile ${Object.keys(invalid)}`);
                assert.deepEqual(await em.getConnection().execute('select * from "user" where id = ?', [target.id]), snapshot);
            }
            assert.equal((await call('PATCH', endpoint, admin.accessToken, { email: users.get('Administrador').email.toUpperCase() })).status, 409);
            assert.equal((await call('PATCH', endpoint, admin.accessToken, { dni: '40.000.000' })).status, 409);
            assert.equal((await call('PATCH', '/users/2147483647', admin.accessToken, { firstName: 'Missing' })).status, 404);
            // DNI remains reserved when the account is inactive; reactivate the existing person.
            const secondResponse = await call('POST', '/auth/login', null, { email: data.email, password });
            assert.equal(secondResponse.status, 200);
            const second = await secondResponse.json();
            const activeSessions = [sessions.get('Supervisor'), second];
            for (const isActive of [null, 'false', 0, undefined]) {
                assert.equal((await call('PATCH', endpoint + '/status', admin.accessToken, { isActive })).status, 400);
            }
            assert.equal((await call('PATCH', endpoint + '/status', admin.accessToken, { isActive: false, password: 'forged' })).status, 400);
            const disabled = await call('PATCH', endpoint + '/status', admin.accessToken, { isActive: false });
            assert.equal(disabled.status, 200);
            assert.equal((await disabled.json()).isActive, false);
            assert.equal((await call('PATCH', endpoint + '/status', admin.accessToken, { isActive: false })).status, 200);
            assert.equal((await call('POST', '/auth/login', null, { email: data.email, password })).status, 401);
            for (const session of activeSessions) {
                assert.equal((await call('GET', '/auth/me', session.accessToken)).status, 401);
                assert.equal((await call('GET', '/clients', session.accessToken)).status, 401);
                assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: session.refreshToken })).status, 401);
            }
            const saved = await em.fork().findOneOrFail(User, { id: target.id });
            assert.equal(saved.password, before.password);
            assert.equal(saved.dni, data.dni);
            assert.equal(saved.isActive, false);
            const storedSessions = await em.fork().find(Session, { user: target.id });
            assert.ok(storedSessions.length >= 2);
            assert.ok(storedSessions.every(session => session.revokedAt));
            assert.equal((await call('PATCH', `/users/${users.get('Calidad').id}`, admin.accessToken, { dni: '31.222.333' })).status, 409);
            assert.equal((await call('PATCH', endpoint, admin.accessToken, { lastName: 'Edited inactive' })).status, 200);
            assert.equal((await call('PATCH', `/users/${users.get('Administrador').id}/status`, admin.accessToken, { isActive: false })).status, 409);
            assert.equal((await call('PATCH', endpoint + '/status', admin.accessToken, { isActive: true })).status, 200);
            for (const session of activeSessions) {
                assert.equal((await call('GET', '/auth/me', session.accessToken)).status, 401);
                assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: session.refreshToken })).status, 401);
            }
            const newLogin = await call('POST', '/auth/login', null, { email: data.email, password });
            assert.equal(newLogin.status, 200);
            sessions.set('Supervisor', await newLogin.json());
            const list = await (await call('GET', '/users', admin.accessToken)).json();
            assert.equal(list.find(user => user.id === target.id).isActive, true);
            assert.equal((await call('DELETE', endpoint, admin.accessToken)).status, 404);
        });
        await t.test('concurrent cross-demotions keep an administrator and invalidate old permissions', async () => {
            const adminRole = users.get('Administrador').role;
            const qualityRole = await em.findOneOrFail(Role, { name: 'Calidad' });
            const originalAdmins = await em.getConnection().execute('select id from "user" where role_id = ?', [adminRole.id]);
            const peers = [];
            for (let i = 0; i < 2; i++) {
                const res = await call('POST', '/users', admin.accessToken, {
                    firstName: 'Concurrent', lastName: 'Admin', email: `concurrent-${i}@example.test`, dni: String(50000000 + i), password, roleId: adminRole.id,
                });
                assert.equal(res.status, 201);
                const user = await res.json();
                const login = await call('POST', '/auth/login', null, { email: user.email, password });
                assert.equal(login.status, 200);
                peers.push({ ...user, session: await login.json() });
            }
            // Isolated DB fixture setup only: the two peers are now the only admins.
            for (const { id } of originalAdmins) await em.nativeUpdate(User, { id }, { role: qualityRole.id });
            try {
                const results = await Promise.all(peers.map((actor, index) => call('PATCH', `/users/${peers[1 - index].id}/role`, actor.session.accessToken, { roleId: qualityRole.id })));
                assert.deepEqual(results.map(res => res.status).sort(), [200, 403]);
                const remaining = await em.fork().find(User, { role: adminRole.id });
                assert.equal(remaining.length, 1);
                for (const peer of peers) {
                    assert.equal((await call('GET', '/users', peer.session.accessToken)).status, peer.id === remaining[0].id ? 200 : 403);
                }
                const last = peers.find(peer => peer.id === remaining[0].id);
                assert.equal((await call('PATCH', `/users/${last.id}/role`, last.session.accessToken, { roleId: qualityRole.id })).status, 409);
                assert.equal(await em.fork().count(User, { role: adminRole.id }), 1);
            } finally {
                for (const { id } of originalAdmins) await em.nativeUpdate(User, { id }, { role: adminRole.id });
            }
        });
        await t.test('mixed role/status changes keep an active administrator and login/refresh cannot survive deactivation', async () => {
            const adminRole = users.get('Administrador').role;
            const qualityRole = await em.findOneOrFail(Role, { name: 'Calidad' });
            const originals = await em.getConnection().execute('select id from "user" where role_id = ? and is_active = true', [adminRole.id]);
            const peers = [];
            for (let i = 0; i < 2; i++) {
                const res = await call('POST', '/users', admin.accessToken, { firstName: 'Mixed', lastName: 'Admin', email: `mixed-${i}@example.test`, dni: String(60000000 + i), password, roleId: adminRole.id });
                assert.equal(res.status, 201);
                const user = await res.json();
                const login = await call('POST', '/auth/login', null, { email: user.email, password });
                assert.equal(login.status, 200);
                peers.push({ ...user, session: await login.json() });
            }
            for (const { id } of originals) await em.nativeUpdate(User, { id }, { role: qualityRole.id });
            try {
                const results = await Promise.all([
                    call('PATCH', `/users/${peers[1].id}/status`, peers[0].session.accessToken, { isActive: false }),
                    call('PATCH', `/users/${peers[0].id}/role`, peers[1].session.accessToken, { roleId: qualityRole.id }),
                ]);
                assert.equal(results.filter(res => res.status === 200).length, 1);
                assert.ok(results.every(res => [200, 401, 403].includes(res.status)));
                const remaining = await em.fork().find(User, { role: adminRole.id, isActive: true });
                assert.equal(remaining.length, 1);
                const last = peers.find(peer => peer.id === remaining[0].id);
                assert.equal((await call('PATCH', `/users/${last.id}/status`, last.session.accessToken, { isActive: false })).status, 409);
            } finally {
                for (const { id } of originals) await em.nativeUpdate(User, { id }, { role: adminRole.id });
            }
            const res = await call('POST', '/users', admin.accessToken, { firstName: 'Race', lastName: 'Access', email: 'race-access@example.test', dni: '62000000', password, roleId: users.get('Supervisor').role.id });
            assert.equal(res.status, 201);
            const target = await res.json();
            const first = await (await call('POST', '/auth/login', null, { email: target.email, password })).json();
            const [login, refresh, disabled] = await Promise.all([
                call('POST', '/auth/login', null, { email: target.email, password }),
                call('POST', '/auth/refresh', null, { refreshToken: first.refreshToken }),
                call('PATCH', `/users/${target.id}/status`, admin.accessToken, { isActive: false }),
            ]);
            assert.equal(disabled.status, 200);
            for (const response of [login, refresh]) {
                assert.ok([200, 401].includes(response.status));
                if (response.status === 200) {
                    const tokens = await response.json();
                    assert.equal((await call('GET', '/auth/me', tokens.accessToken)).status, 401);
                    assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: tokens.refreshToken })).status, 401);
                }
            }
            assert.ok((await em.fork().find(Session, { user: target.id })).every(session => session.revokedAt));
            assert.equal((await call('PATCH', `/users/${target.id}/status`, admin.accessToken, { isActive: true })).status, 200);
            assert.equal((await call('GET', '/auth/me', first.accessToken)).status, 401);
            assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: first.refreshToken })).status, 401);
        });
        await require('./commercial-http.cjs')(t, { call, em, users, sessions, roleNames, admin, legacyQuoteId });
        await require('./work-orders-http.cjs')(t, { call, em, users, sessions, roleNames, admin, legacyWorkOrderId, legacyWorkOrderBefore });
        await require('./production-http.cjs')(t, { call, em, users, sessions, roleNames, admin, legacyWorkOrderId });
        const created = await call('POST', '/clients', admin.accessToken, input());
        assert.equal(created.status, 201);
        const client = await created.json();
        await t.test('client updates preserve omitted fields, clear null optionals and validate the database contract', async () => {
            const endpoint = `/clients/${client.id}`;
            const optionalFields = ['contactName', 'address', 'city', 'province', 'notes'];
            const filled = Object.fromEntries(optionalFields.map(name => [name, name === 'notes' ? 'N'.repeat(5000) : 'A'.repeat(255)]));
            assert.equal((await call('PUT', endpoint, admin.accessToken, { ...filled, businessName: 'B'.repeat(1000) })).status, 200);
            assert.equal((await call('PUT', endpoint, admin.accessToken, { phone: '+54 (11) 1234-5678' })).status, 200);
            const preserved = await (await call('GET', endpoint, admin.accessToken)).json();
            for (const name of optionalFields) assert.equal(preserved[name], filled[name]);
            const cleared = await call('PUT', endpoint, admin.accessToken, Object.fromEntries(optionalFields.map(name => [name, null])));
            assert.equal(cleared.status, 200);
            const reloaded = await (await call('GET', endpoint, admin.accessToken)).json();
            for (const name of optionalFields) assert.equal(reloaded[name], null);
            for (const name of ['businessName', 'taxId', 'email', 'phone']) {
                for (const method of ['POST', 'PUT']) {
                    const before = await em.getConnection().execute('select * from client order by id');
                    const res = await call(method, method === 'POST' ? '/clients' : endpoint, admin.accessToken, { ...(method === 'POST' ? input() : {}), [name]: null });
                    assert.equal(res.status, 400, `${method} ${name}: null`);
                    assert.deepEqual(await em.getConnection().execute('select * from client order by id'), before);
                }
            }
            for (const invalid of [
                { businessName: '  ' }, { businessName: 'B'.repeat(1001) },
                ...optionalFields.map(name => ({ [name]: 'A'.repeat(name === 'notes' ? 5001 : 256) })),
                { taxId: 'abc30712345678' }, { phone: 'abc1234567' }, { phone: '123456' },
                { phone: '1234567890123456' }, { email: 'invalid' },
            ]) {
                assert.equal((await call('PUT', endpoint, admin.accessToken, invalid)).status, 400, JSON.stringify(Object.keys(invalid)));
            }
            const normalized = await call('PUT', endpoint, admin.accessToken, { taxId: '30-71234567-8', email: ' CLIENT@EXAMPLE.TEST ' });
            assert.equal(normalized.status, 200);
            const data = await normalized.json();
            assert.equal(data.taxId, '30712345678');
            assert.equal(data.email, 'client@example.test');
            assert.equal((await call('POST', '/clients', admin.accessToken, { ...input(), taxId: '30.71234567.8' })).status, 409);
            const another = await (await call('POST', '/clients', admin.accessToken, input())).json();
            assert.equal((await call('PUT', `/clients/${another.id}`, admin.accessToken, { taxId: '30712345678' })).status, 409);
        });
        const actions = [
            ['GET', '/clients'], ['GET', `/clients/${client.id}`],
            ['POST', '/clients'], ['PUT', `/clients/${client.id}`],
            ['PATCH', `/clients/${client.id}/status`],
        ];
        for (const [method, endpoint] of actions) {
            const result = await call(method, endpoint, null, method === 'GET' ? undefined : input());
            assert.equal(result.status, 401, `unauthenticated ${method} ${endpoint}`);
        }
        for (const name of roleNames) {
            const token = sessions.get(name).accessToken;
            for (const [method, endpoint] of actions) {
                const allowed = name === 'Administrador' ||
                    (['Supervisor', 'Administración'].includes(name) && method !== 'PATCH');
                const before = !allowed ? await em.getConnection().execute('select * from client order by id') : null;
                const body = method === 'PATCH' ? { isActive: false } :
                    method === 'GET' ? undefined : method === 'PUT' ? { notes: name } : input();
                // A forged role/permissions payload cannot get past the guard.
                if (!allowed && body) Object.assign(body, { role: 'Administrador', permissions: ['clients:create'] });
                const result = await call(method, endpoint, token, body);
                assert.equal(result.status, allowed ? (method === 'POST' ? 201 : 200) : 403, `${name}: ${method} ${endpoint}`);
                if (!allowed) assert.deepEqual(await em.getConnection().execute('select * from client order by id'), before);
            }
        }
        const supervisor = users.get('Supervisor');
        supervisor.role = await em.findOneOrFail(Role, { name: 'Calidad' });
        await em.flush();
        assert.equal((await call('GET', '/clients', sessions.get('Supervisor').accessToken)).status, 403);

        const loginAgain = async () => {
            const res = await call('POST', '/auth/login', null, { email: users.get('Administrador').email, password });
            assert.equal(res.status, 200);
            return res.json();
        };
        const current = await loginAgain();
        const other = await loginAgain();
        const jwt = app.get(JwtService);
        const { sub, sid } = jwt.decode(current.accessToken);
        const expired = await jwt.signAsync({ sub, sid }, { expiresIn: -1 });
        assert.equal((await call('POST', '/auth/logout', expired)).status, 401);
        const renewedResponse = await call('POST', '/auth/refresh', null, { refreshToken: current.refreshToken });
        assert.equal(renewedResponse.status, 200);
        const renewed = await renewedResponse.json();
        assert.equal((await call('POST', '/auth/logout', renewed.accessToken)).status, 204);
        em.clear();
        assert.ok((await em.findOneOrFail(Session, { id: sid })).revokedAt);
        // Even after the replay grace expires, a logged-out token must not close
        // a different active session belonging to the same user.
        await em.nativeUpdate(RefreshToken, { tokenHash: hashRefreshToken(current.refreshToken) }, {
            replacedAt: new Date(Date.now() - REFRESH_REUSE_GRACE_MS - 1000),
        });
        for (const token of [current.accessToken, renewed.accessToken]) {
            assert.equal((await call('GET', '/auth/me', token)).status, 401);
        }
        for (const token of [current.refreshToken, renewed.refreshToken]) {
            assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: token })).status, 401);
        }
        assert.equal((await call('GET', '/auth/me', other.accessToken)).status, 200);
        assert.equal((await call('POST', '/auth/logout', other.accessToken)).status, 204);
        assert.equal((await call('GET', '/auth/me', other.accessToken)).status, 401);
        // Replay revocation still commits after moving refresh inside a transaction.
        const replay = await loginAgain();
        const separate = await loginAgain();
        assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: replay.refreshToken })).status, 200);
        await em.nativeUpdate(RefreshToken, { tokenHash: hashRefreshToken(replay.refreshToken) }, {
            replacedAt: new Date(Date.now() - REFRESH_REUSE_GRACE_MS - 1000),
        });
        assert.equal((await call('POST', '/auth/refresh', null, { refreshToken: replay.refreshToken })).status, 401);
        assert.equal((await call('GET', '/auth/me', separate.accessToken)).status, 401);
    } finally {
        await app.close();
    }
});
