# Diseño — F-001 Autenticación

Componentes: `backend/` (NestJS, ver `Docs/backend-stack-api.md`) y `frontend/` (React + Vite). Sin integraciones con terceros.
Tokens: acceso JWT HS256 de 15 min (`sub` = id de usuario, `sid` = id de sesión) y refresco opaco de 256 bits. Los dos se guardan en el navegador y viajan en cabecera o en el cuerpo, sin cookies (QT-04, QT-19).

## Flujos

Iniciar sesión (US-001):
1. `frontend` envía `POST /auth/login {email, password, rememberMe}`.
2. `backend` valida la forma del cuerpo; si es inválida → 400.
3. `backend` busca el usuario por correo, con su rol. Si no existe, compara la contraseña contra un hash ficticio igual, para no delatar por tiempo, y responde 401 "Correo electrónico o contraseña incorrectos.". Si la contraseña no coincide → el mismo 401.
4. `backend` crea una `Session` (rememberMe, `expiresAt`, `lastUsedAt` = ahora) y su primer `RefreshToken`, del que solo guarda el hash. Todo en una transacción.
5. `backend` responde 200 `{ user, accessToken, refreshToken, expiresIn }`.
6. `frontend` guarda el par y `user` en el store: en `localStorage` si marcó Recordarme, en `sessionStorage` si no (QT-25). Después navega al inicio.

Usar la API con la sesión abierta (base de RN-sesion-requerida):
1. `frontend` (interceptor de axios) agrega `Authorization: Bearer <accessToken>` leído del store en el momento de enviar.
2. `backend` (guard global; las rutas marcadas `@Public()` quedan fuera) verifica la firma y la expiración del JWT. Después comprueba que la `Session` del `sid` exista, no esté revocada y no haya vencido (QT-05). Si algo falla → 401.

Renovar la sesión (US-002):
1. `frontend` recibe un 401 en una ruta fuera de `/auth/*`. Hace una sola llamada `POST /auth/refresh {refreshToken}`, compartida por todas las peticiones que fallaron a la vez.
2. `backend` busca el `RefreshToken` por hash.
   - No existe → 401.
   - Está reemplazado desde hace más de 30 s → sesión copiada: revoca **todas** las sesiones del usuario y responde 401 (RN-sesion-copiada).
   - Está reemplazado desde hace 30 s o menos → renovación concurrente legítima (QT-06): sigue como en el paso 3.
   - La sesión está revocada, vencida o lleva más de 7 días sin uso → 401.
3. `backend` marca el token presentado como reemplazado, crea uno nuevo y actualiza `lastUsedAt`. Si la sesión es con Recordarme, también extiende `expiresAt` a ahora + 7 días. Todo en una transacción.
4. `backend` responde 200 `{ accessToken, refreshToken, expiresIn }`. `frontend` guarda el par y reintenta la petición original una sola vez.
5. Si el refresco da 401, `frontend` limpia la sesión local y la ruta protegida redirige al login.

Cerrar sesión (US-003):
1. `frontend` envía `POST /auth/logout`, sin cuerpo y con Bearer (QT-26). Limpia la sesión local aunque la llamada falle.
2. `backend` revoca solo la `Session` del `sid` del token de acceso (RN-sesiones-simultaneas). Es idempotente: una sesión ya revocada también responde 204.

Recuperar la sesión (US-004):
1. Al arrancar, si el store persistido tiene un token, `frontend` llama `GET /auth/me`. Si el acceso venció, lo cubre el flujo de renovación.
2. `backend` devuelve `{ user }` del usuario de la sesión. Si la sesión ya no es válida, termina en 401 y se limpia la sesión local.

**Lo que no se confía del cliente:** el `user` que guarda el frontend es solo para mostrar. Quién es el usuario y si la sesión está abierta se decide siempre en el servidor, a partir del `sid`.

## Dónde se aplica cada regla
| Regla | Dónde |
|---|---|
| RN-acceso-con-credenciales | `AuthService.login`: comparación bcrypt contra `User.password` |
| RN-credenciales-invalidas | `AuthService.login`: un único 401 con el mensaje fijo y hash ficticio cuando el correo no existe. El frontend muestra `message` sin reinterpretarlo |
| RN-sesion-requerida | Backend: guard JWT global más la comprobación de sesión (fuente de verdad). Frontend: `ProtectedRoute` (solo UX) |
| RN-sesion-renovable | Backend: `AuthService.refresh`. Frontend: interceptor de respuesta de axios |
| RN-sesion-sin-recordarme | Servidor: `Session.expiresAt` = login + 12 h, que la renovación no extiende. Navegador: sin Recordarme el store persiste en `sessionStorage`, con Recordarme en `localStorage` (QT-25) |
| RN-sesion-con-recordarme | `Session.expiresAt` = último uso + 7 días, extendido en cada renovación |
| RN-sesion-por-inactividad | `AuthService.refresh`: rechaza si `lastUsedAt` tiene más de 7 días |
| RN-sesiones-simultaneas | Una `Session` por login. El logout revoca solo la del `sid` |
| RN-cierre-de-sesion | `Session.revokedAt`, comprobado en el guard (QT-05) y en el refresco |
| RN-sesion-copiada | `AuthService.refresh`: token reemplazado hace más de 30 s → `revokedAt` en todas las sesiones del usuario |
| RN-sin-registro-publico | No existe un endpoint de alta. Los usuarios vienen del seeder (QT-16) |

## Datos
- `Session`: id uuid, `user` (ManyToOne), `rememberMe`, `createdAt`, `lastUsedAt`, `expiresAt`, `revokedAt` (nullable). Índice por `user`.
- `RefreshToken`: id, `session` (ManyToOne), `tokenHash` (único, SHA-256 hex), `createdAt`, `replacedAt` (nullable).
- `Role`: los 5 roles del negocio, cargados por migración (Administrador, Supervisor, Producción, Calidad, Administración).
- `User.password` guarda el hash bcrypt, nunca el texto.
- Los tokens en claro no se persisten nunca en el servidor.

## Estados
Una sesión va de `activa` a `revocada` (logout o sesión copiada) o a `vencida` (`expiresAt` pasado o 7 días sin uso). Las dos son finales: una sesión no se reactiva, y para volver hay que iniciar sesión de nuevo.

## Cuando un paso falla
- En el login y en la renovación, lo que se escribe (sesión y token, o reemplazo y token nuevo) va en una sola transacción. Si falla, no queda un token emitido sin registrar.
- Dos renovaciones con el mismo token dentro de 30 s generan dos tokens válidos para la misma sesión. Se acepta: los dos pertenecen a la misma sesión y el logout la revoca entera.
- Si el logout falla en red, el frontend igual limpia la sesión local. La sesión del servidor sigue abierta hasta que vence. Se acepta: la única forma de usarla es tener el token de refresco, que ya se borró del navegador.

## Configuración
`JWT_ACCESS_SECRET` (obligatoria), `JWT_ACCESS_TTL` (por defecto 15 min), `CORS_ORIGINS` (lista separada por comas), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (solo el seeder). Frontend: `VITE_API_URL`, que ya existe.

## Preguntas abiertas
Ninguna.
