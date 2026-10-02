require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Reflector } = require('@nestjs/core');
const { JwtAuthGuard } = require('../dist/src/auth/jwt-auth.guard');
const { ClientsController } = require('../dist/src/clients/clients.controller');
const { databaseTlsOptions } = require('../dist/src/config/database-tls.config');
const tls = require('node:tls');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function fixture(role = 'Administrador', action = 'list') {
    const user = { id: 1, role: { name: role } };
    const request = { headers: { authorization: 'Bearer fixture' } };
    const session = { user };
    const jwt = { verifyAsync: async () => ({ sub: '1', sid: 'fixture', role: 'Administrador' }) };
    const em = { findOne: async () => session };
    const context = {
        getHandler: () => ClientsController.prototype[action],
        getClass: () => ClientsController,
        switchToHttp: () => ({ getRequest: () => request }),
    };
    return { guard: new JwtAuthGuard(new Reflector(), jwt, em), context, user, request, jwt, em };
}

// Expectations express the agreed business policy, independent of the policy implementation.
for (const role of ['Administrador', 'Supervisor', 'Administración', 'Producción', 'Calidad', 'constructor']) {
    for (const action of ['list', 'getById', 'create', 'update', 'setStatus']) {
        test(`${role}: clients.${action}`, async () => {
            const { guard, context } = fixture(role, action);
            const allowed = role === 'Administrador' ||
                (['Supervisor', 'Administración'].includes(role) && action !== 'setStatus');
            if (allowed) assert.equal(await guard.canActivate(context), true);
            else await assert.rejects(guard.canActivate(context), error => error.getStatus() === 403);
        });
    }
}

test('missing bearer token returns 401, not 403', async () => {
    const f = fixture();
    f.request.headers = {};
    await assert.rejects(f.guard.canActivate(f.context), error => error.getStatus() === 401);
});

test('invalid JWT or revoked session returns 401', async () => {
    const invalid = fixture();
    invalid.jwt.verifyAsync = async () => { throw new Error('expired'); };
    await assert.rejects(invalid.guard.canActivate(invalid.context), error => error.getStatus() === 401);
    const revoked = fixture();
    revoked.em.findOne = async () => null;
    await assert.rejects(revoked.guard.canActivate(revoked.context), error => error.getStatus() === 401);
});

test('database role changes apply to an existing JWT; claimed role does not grant access', async () => {
    const f = fixture();
    assert.equal(await f.guard.canActivate(f.context), true);
    f.user.role.name = 'Producción';
    await assert.rejects(f.guard.canActivate(f.context), error => error.getStatus() === 403);
});

test('local database can explicitly disable SSL', () => {
    assert.deepEqual(databaseTlsOptions({ DB_SSL: 'false' }), { ssl: false });
});

test('TLS verifies trust and hostname, including a provider CA', { timeout: 20_000 }, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qualitytrack-tls-'));
    const keyFile = path.join(dir, 'key.pem');
    const certFile = path.join(dir, 'cert.pem');
    let server;
    try {
        execFileSync(process.env.OPENSSL_BINARY || 'openssl', [
            'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
            '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost',
            '-keyout', keyFile, '-out', certFile,
        ], { stdio: 'ignore' });
        const cert = fs.readFileSync(certFile, 'utf8');
        server = tls.createServer({ key: fs.readFileSync(keyFile), cert }, socket => socket.end());
        server.on('tlsClientError', () => {});
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const connect = (options, servername = 'localhost') => new Promise((resolve, reject) => {
            const socket = tls.connect({ host: '127.0.0.1', port: server.address().port, servername, ...options });
            socket.once('secureConnect', () => { socket.destroy(); resolve(socket.authorized); });
            socket.once('error', reject);
        });
        await assert.rejects(connect(databaseTlsOptions({ DB_SSL: 'true' }).ssl),
            error => error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT');
        assert.equal(await connect(databaseTlsOptions({ DB_SSL: 'true', DB_SSL_CA: cert }).ssl), true);
        assert.equal(await connect(databaseTlsOptions({ DB_SSL_CA: cert.replace(/\n/g, '\\n') }).ssl), true);
        await assert.rejects(connect(databaseTlsOptions({ DB_SSL_CA: cert }).ssl, 'wrong.example'),
            error => error.code === 'ERR_TLS_CERT_ALTNAME_INVALID');
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
