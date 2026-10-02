export function databaseTlsOptions(env: NodeJS.ProcessEnv = process.env) {
    if (env.DB_SSL === 'false') return { ssl: false as const };
    const ca = env.DB_SSL_CA?.trim().replace(/\\n/g, '\n');
    return { ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) } };
}
