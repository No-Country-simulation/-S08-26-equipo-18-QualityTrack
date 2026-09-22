# Stack frontend — QualityTrack Web
componente: `frontend/` · área: frontend

## Adoptado
| Eje | Elección | Desde |
|---|---|---|
| Runtime de build | Vite 8.2.2 con `@vitejs/plugin-react` | anterior a 2026-09 |
| Lenguaje | TypeScript 7.0.2 | anterior a 2026-09 |
| UI | React 19.2.8 + Chakra UI 3.37.0 (tema propio en `src/theme/theme.ts`) | anterior a 2026-09 |
| Ruteo | react-router-dom 7.18.3, con guards `ProtectedRoute` / `PublicRoute` | anterior a 2026-09 |
| Estado global | zustand 5.0.15; la sesión vive en `src/store/authStore.ts`, persistida en `localStorage` (con Recordarme) o `sessionStorage` (sin él) y validada con `/auth/me` al arrancar | 2026-09 |
| Estructura | por capas: `pages/`, `layouts/`, `components/`, `hooks/`, `services/`, `store/`, `types/`, `utils/`, `config/` | anterior a 2026-09 |
| Configuración | `src/config/appConfig.ts`, fuente única; lee `VITE_API_URL` y `VITE_API_TIMEOUT_MS` | anterior a 2026-09 |
| Cliente HTTP | axios 1.20: instancia `apiClient` en `src/services/api.ts` (baseURL `VITE_API_URL`, timeout `VITE_API_TIMEOUT_MS`, Bearer por interceptor, refresco único ante 401 y reintento); fachada `api.get/post/put/patch/delete` + `ApiError` | 2026-09 |
| Errores | `ApiError` + `formatApiErrorMessage` (hook `useApi`) + `getErrorMessage` (`utils/errorHandler.ts`) + `ErrorBoundary` | anterior a 2026-09 |
| Tests | Vitest 5.0.1 + Testing Library + jsdom | anterior a 2026-09 |

## Opt-ins
Decididos por el usuario el 2026-09-22 (F-001 Q-12, aplicado a todo el proyecto).
- **Niveles de test:** el agente no escribe tests en ningún nivel (unit: no · integración: no · componentes: no). Los tests existentes y nuevos los mantiene el usuario. El agente verifica que compile (`npm run build` y chequeo de tipos).
- **Test primero:** no.
- **Tests end-to-end automatizados (navegador):** no.
- **Datos de test:** los define el usuario.

## Convenciones
- Un error sin respuesta del servidor (red, timeout) se convierte en `ApiError` con `status` 0.
- Los servicios de dominio (`clientService`, `workOrderService`, …) llaman a `api.*` y nunca al cliente HTTP directamente.
- Comentarios en español que explican el porqué; los archivos alternan comillas simples y dobles (se respeta la del archivo).
- La visibilidad por rol (`usePermissions`, `Can`) es solo UX; la autorización real vive en el backend.

## Paquetes
| Paquete | Versión | Por qué está |
|---|---|---|
| @chakra-ui/react, @emotion/react | 3.37.0 / 11.14.x | Componentes de UI |
| react-icons | 5.7.x | Íconos |
| axios | 1.20.0 | Cliente HTTP con interceptores |
| zustand | 5.0.15 | Estado global y persistencia de la sesión |
| react-router-dom | 7.18.3 | Ruteo |
| vitest, @testing-library/* , jsdom | 5.0.1 / … | Tests |

## Planificado (no adoptado)
- Nada pendiente de F-001.

## Observaciones fuera de alcance (reportadas, no corregidas)
- `README.md` tiene contenido duplicado y restos de la plantilla de Vite (dos títulos, dos tablas de contenido).
- `checkHealth()` en `services/api.ts` llama a `/health`, pero el backend expone `/healthcheck` y responde texto, no JSON.
- `eslint.config.js` ignora los `.ts`/`.tsx` ("File ignored because no matching configuration"): el lint no revisa el código TypeScript.
- La pantalla de login muestra datos fijos ("Ping 12ms", "v4.8", botón RFID) que no vienen del sistema.

## Evidencia
Leído el 2026-09-22 de `frontend/package.json`, `node_modules/*/package.json` (versiones instaladas), `vite.config.js`, `src/**`, `.env.example`.
Indeterminado: no hay lockfile de pnpm; las versiones exactas salen de `package-lock.json`/`node_modules`.
