import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const target = new URL('.env', root);
let content = readFileSync(existsSync(target) ? target : new URL('.env.example', root), 'utf8');

// Preserve existing nonempty values; only complete the local configuration.
const defaults = {
  POSTGRES_DB: () => 'qualitytrack',
  POSTGRES_USER: () => 'qualitytrack',
  POSTGRES_PASSWORD: () => randomBytes(32).toString('hex'),
  DB_HOST: () => 'localhost',
  DB_PORT: () => '5432',
  DB_SSL: () => 'false',
  JWT_ACCESS_SECRET: () => randomBytes(32).toString('hex'),
  CORS_ORIGINS: () => 'http://localhost:5173',
  ADMIN_EMAIL: () => 'admin@qualitytrack.local',
  ADMIN_PASSWORD: () => randomBytes(32).toString('hex'),
  ADMIN_FIRST_NAME: () => 'Administrador',
  ADMIN_LAST_NAME: () => 'QualityTrack',
};

for (const [key, createValue] of Object.entries(defaults)) {
  const pattern = new RegExp(`^${key}=(.*)$`, 'm');
  const match = content.match(pattern);
  const value = match?.[1].trim();
  if (value && value !== '""' && value !== "''") continue;
  const line = `${key}=${createValue()}`;
  content = match ? content.replace(pattern, () => line) : `${content.trimEnd()}\n${line}\n`;
}

writeFileSync(target, content, { encoding: 'utf8', mode: 0o600 });
console.log(`Configuracion local preparada en ${fileURLToPath(target)}.`);
console.log('Los valores existentes se conservan. Los secretos nuevos no se muestran ni se versionan.');
console.log('Consultar ADMIN_EMAIL y ADMIN_PASSWORD en ese archivo para iniciar sesion tras el seed.');
