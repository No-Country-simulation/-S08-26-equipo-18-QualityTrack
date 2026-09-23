const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const SESSION_WITHOUT_REMEMBER_MS = 12 * HOUR_MS;
export const SESSION_WITH_REMEMBER_MS = 7 * DAY_MS;
export const SESSION_INACTIVITY_LIMIT_MS = 7 * DAY_MS;

// Dos pestañas pueden renovar a la vez con el mismo token; dentro de este margen
// no se considera que la sesión fue copiada.
export const REFRESH_REUSE_GRACE_MS = 30 * 1000;

export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export const INVALID_CREDENTIALS_MESSAGE = "Correo electrónico o contraseña incorrectos.";
