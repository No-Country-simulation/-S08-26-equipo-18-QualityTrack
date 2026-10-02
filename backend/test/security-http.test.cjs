const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// Opt-in: never migrate a developer's regular database or any remote database.
test('HTTP authorization and logout against an isolated PostgreSQL database', {
    skip: process.env.SECURITY_TEST_DB !== 'true', timeout: 60_000,
}, async (t) => {
    assert.ok(['localhost', '127.0.0.1', 'postgres'].includes(process.env.DB_HOST));
    assert.equal(process.env.POSTGRES_DB, 'qualitytrack_security');
    assert.equal(process.env.DB_SSL, 'false');
    process.env.JWT_ACCESS_SECRET ||= randomBytes(32).toString('hex');
    // Nest builds src/ only. Use the same source migration CLI as local setup
    // rather than silently looking for missing compiled migrations.
    const cli = path.join(path.dirname(require.resolve('@mikro-orm/cli/package.json')), 'cli.js');
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
        const base = await app.getUrl();
        const em = orm.em.fork();
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
    } finally {
        await app.close();
    }
});
