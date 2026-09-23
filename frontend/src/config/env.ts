/**
 * Re-exportacion del objeto ENV para compatibilidad retroactiva.
 * La fuente unica de verdad se encuentra centralizada en appConfig.ts (Issue #41).
 */
export { ENV, getEnvVariable } from './appConfig'
export { default } from './appConfig'