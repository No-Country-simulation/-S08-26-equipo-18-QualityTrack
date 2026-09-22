export interface AppMetaConfig {
  name: string;
  version: string;
  description: string;
}

export interface EnvConfig {
  mode: string;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
}

export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
}

export interface FormatConfig {
  locale: string;
  currency: string;
  dateFormat: string;
}

export interface AppConfig {
  app: AppMetaConfig;
  env: EnvConfig;
  api: ApiConfig;
  pagination: PaginationConfig;
  format: FormatConfig;
}

export function getEnvVariable(key: string, defaultValue: string = ""): string {
  const value = import.meta.env[key];
  return value !== undefined && value !== "" ? String(value) : defaultValue;
}

const mode = import.meta.env.MODE || "development";

export const config: Readonly<AppConfig> = Object.freeze({
  app: Object.freeze({
    name: "QualityTrack",
    version: "1.0.0",
    description: "MES & Control de Calidad",
  }),
  env: Object.freeze({
    mode,
    isDev: Boolean(import.meta.env.DEV),
    isProd: Boolean(import.meta.env.PROD),
    isTest: mode === "test",
  }),
  api: Object.freeze({
    baseUrl: getEnvVariable("VITE_API_URL", "http://localhost:3000"),
    timeoutMs: Number(getEnvVariable("VITE_API_TIMEOUT_MS", "15000")) || 15000,
  }),
  pagination: Object.freeze({
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  }),
  format: Object.freeze({
    locale: "es-AR",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
  }),
});

export const ENV = Object.freeze({
  API_URL: config.api.baseUrl,
});

export default config;
