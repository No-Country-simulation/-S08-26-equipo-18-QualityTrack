# Decisiones de diseño — F-001 Autenticación

Modo elegido: pendiente (se ofrecen propuestas / juntos / dictado) · 2026-09-22 — ver respuesta en la sesión siguiente

## 2026-09-22

### Hechos investigados

**QT-01 · ¿El frontend (Netlify) y el backend (Render) son el mismo "sitio" para las cookies?**
> No. `netlify.app` y `onrender.com` figuran en la Public Suffix List (líneas 14885 y 15467), así que `x.netlify.app` y `y.onrender.com` son sitios distintos y las cookies de la API son de terceros para el frontend. — `investigado`, https://publicsuffix.org/list/public_suffix_list.dat, leído 2026-09-22

**QT-02 · ¿Qué hace Safari con cookies de terceros?**
> Las bloquea todas por defecto desde Safari 13.1 / iOS 13.4: "Cookies for cross-site resources are now blocked by default across the board." Con QT-01, un login por cookies directo contra Render no funcionaría en Safari ni en iPhone/iPad. — `investigado`, https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/, leído 2026-09-22

**QT-03 · ¿Netlify puede servir la API bajo su propio dominio?**
> Sí: una regla de rewrite con estado 200 (`from = "/api/*"`, `to = "https://…/:splat"`, `status = 200`) actúa de proxy. Las peticiones proxied cortan a los 26 s. — `investigado`, https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/, leído 2026-09-22
> Que las cabeceras de cookies pasen por el proxy no está en la documentación oficial; lo afirma personal de Netlify en su foro de soporte. — `investigado (fuente secundaria)`, https://answers.netlify.com/t/clarification-on-cookie-forwarding-behavior-for-rewrites-proxies/112442, leído 2026-09-22. Se confirma en la verificación integrada (unidad 11).

### Decisiones que necesitan al usuario (tradeoffs)

**QT-04 · ¿Cómo se sirven las cookies en producción, dado QT-01 y QT-02?**
> `propuesta` — A: el frontend llama a `/api/*` en su propio dominio y Netlify hace de proxy hacia Render (QT-03); en desarrollo, lo mismo con el proxy de Vite. Las cookies son de primera parte (`SameSite=Lax`) y no hace falta CORS. Costo: un salto extra y el corte de 26 s.
> B: llamar a Render directo con `SameSite=None; Secure` y CORS con credenciales. Costo: no funciona en Safari/iOS (QT-02).
> C: dominio propio para ambos (`app.x.com` / `api.x.com`). Costo: comprar y configurar un dominio.
> Recomendada: A.

**QT-05 · ¿Se revisa en cada petición que la sesión siga abierta?**
> `propuesta` — Sí. El token de acceso lleva el id de sesión y cada petición protegida comprueba que la sesión no esté cerrada (una consulta indexada). Sin esto, un token de acceso copiado seguiría sirviendo hasta 15 min después del logout, y eso contradice RN-cierre-de-sesion y RN-sesion-copiada.
> Alternativa: no revisar y aceptar esa ventana de 15 min. Requiere cambiar la spec.

**QT-06 · ¿Cómo se evita que dos pestañas que renuevan a la vez se detecten como sesión copiada?**
> `propuesta` — Margen de 30 s: si llega un token de refresco que se reemplazó hace menos de 30 s, se emite un par nuevo para la misma sesión en lugar de cerrar todo. Un robo usado dentro de esos 30 s no se detecta.
> Alternativa: sin margen. Abrir dos pestañas a la vez puede cerrar todas las sesiones de la persona (RN-sesion-copiada) sin que haya habido robo.

### Detalles dentro del alcance (según el modo elegido: propuestas del agente o preguntas)

**QT-07 · Duración del token de acceso** → 15 min. — `propuesta`
**QT-08 · Formato del token de refresco** → valor aleatorio de 256 bits, opaco; en la BD solo se guarda su hash SHA-256. El token de acceso es JWT HS256 (`sub` = id de usuario, `sid` = id de sesión). — `propuesta`
**QT-09 · Cómo se implementa "Recordarme" (RN-sesion-sin-recordarme / con-recordarme / por-inactividad)** → sin Recordarme: cookie de refresco sin `Max-Age` (se borra al cerrar el navegador) y la sesión vence a las 12 h de iniciada, controlado en el servidor. Con Recordarme: cookie con `Max-Age` de 7 días, que se extiende en cada renovación. En ambos casos, el servidor rechaza un refresco con más de 7 días sin uso. — `propuesta`
**QT-10 · Modelo de datos** → entidad `Session` (id uuid, usuario, rememberMe, createdAt, lastUsedAt, expiresAt, revokedAt) y entidad `RefreshToken` (hash único, sesión, createdAt, replacedAt). Una sesión por dispositivo (RN-sesiones-simultaneas). — `propuesta`
**QT-11 · Atributos de las cookies** → `access_token`: `HttpOnly; Secure; SameSite=Lax; Path=/api`. `refresh_token`: igual, pero `Path=/api/auth` (solo viaja a refresh/logout). `Secure` se desactiva solo en desarrollo local por http. — `propuesta`
**QT-12 · CSRF** → con A: `SameSite=Lax` más solo JSON en los endpoints que escriben. Sin token CSRF aparte. — `propuesta`
**QT-13 · Prefijo de rutas** → prefijo global `api` en Nest (`/api/auth/...`), excepto `healthcheck`, que sigue en `/healthcheck` para no romper el monitoreo existente. — `propuesta`
**QT-14 · Contrato de respuestas** → `POST /api/auth/login {email,password,rememberMe?}` → 200 `{ user }`. `GET /api/auth/me` → 200 `{ user }`. `POST /api/auth/refresh` → 204. `POST /api/auth/logout` → 204, idempotente. `user` = `{id, firstName, lastName, email, role:{id,name,description}}`, igual a `AuthUser` del frontend. El token nunca va en el cuerpo. Credenciales inválidas → 401 con el mensaje de RN-credenciales-invalidas. — `propuesta`
**QT-15 · No revelar si el correo existe (RN-credenciales-invalidas)** → mismo mensaje en ambos casos y comparación contra un hash ficticio cuando el correo no existe, para igualar el tiempo de respuesta. — `propuesta`
**QT-16 · Roles y admin inicial (Q-08)** → migración con los 5 roles (Administrador, Supervisor, Producción, Calidad, Administración). Seeder que crea el admin desde `ADMIN_EMAIL` / `ADMIN_PASSWORD`; nunca con credenciales en el código. — `propuesta`
**QT-17 · Secretos y configuración** → `JWT_ACCESS_SECRET` (obligatorio: la app no arranca sin él), `COOKIE_SECURE`, `FRONTEND_ORIGIN` (solo si se elige B en QT-04). — `propuesta`
**QT-18 · Frontend: renovación transparente** → interceptor de axios. Ante un 401 llama una sola vez a `/auth/refresh`, compartido entre peticiones concurrentes, y reintenta; si el refresh falla, cierra la sesión local. Al arrancar, restaura la sesión con `GET /auth/me`. — `propuesta`

## 2026-09-22 (respuestas del usuario)

Modo para los detalles: **propuestas** — asumido por el agente porque el usuario no eligió; lo puede cambiar.

**QT-04 · ¿Cómo se sirven las cookies?**
> Sin cookies. Los tokens se guardan en `localStorage` y el de acceso viaja en `Authorization: Bearer`. — `usuario`
> Objeción registrada: el agente advirtió que un script inyectado (XSS) puede leer `localStorage` y llevarse el token de refresco de 7 días, y propuso A (proxy de Netlify con cookies). El usuario mantiene `localStorage`.
> *(Supera a QT-11 y QT-12; cambia QT-08, QT-09, QT-13, QT-14, QT-17 y QT-18: ver QT-19 a QT-24)*

**QT-05 · ¿Se revisa en cada petición que la sesión siga abierta?**
> Sí, con el `sid` en el token de acceso y una consulta a la sesión en cada petición protegida. — `usuario`

**QT-06 · Margen para renovaciones simultáneas**
> Sí, 30 s. — `usuario`

**QT-19 · Transporte de los tokens** *(supera a QT-11, QT-12)*
> Login y refresh devuelven `accessToken` y `refreshToken` en el cuerpo. El frontend manda el de acceso en `Authorization: Bearer` y el de refresco en el cuerpo de `/auth/refresh` y `/auth/logout`. Como no hay cookies, no hace falta protección CSRF. — `agente, dentro del alcance`

**QT-20 · Prefijo de rutas** *(supera a QT-13)*
> Sin prefijo global: `/auth/...` directo sobre Render. Sin proxy no hace falta, y `healthcheck` queda como está. — `agente, dentro del alcance`

**QT-21 · Contrato de respuestas** *(supera a QT-14)*
> `POST /auth/login {email, password, rememberMe?}` → 200 `{ user, accessToken, refreshToken, expiresIn }`.
> `POST /auth/refresh {refreshToken}` → 200 `{ accessToken, refreshToken, expiresIn }`.
> `POST /auth/logout {refreshToken}` → 204, idempotente; requiere el token de acceso.
> `GET /auth/me` → 200 `{ user }`.
> `user` = `{id, firstName, lastName, email, role:{id,name,description}}`. Cualquier refresco inválido, vencido o revocado → 401. — `agente, dentro del alcance`

**QT-22 · Configuración** *(supera a QT-17)*
> `JWT_ACCESS_SECRET` es obligatorio: la app no arranca sin él. `CORS_ORIGINS` es la lista de orígenes del frontend, separados por coma; CORS sin credenciales, porque el origen es distinto. `ADMIN_EMAIL` / `ADMIN_PASSWORD` solo para el seeder. — `agente, dentro del alcance`

**QT-23 · Frontend: renovación transparente** *(supera a QT-18)*
> Instancia de axios con `baseURL` desde `VITE_API_URL`. Un interceptor de petición agrega el Bearer. El interceptor de respuesta, ante un 401 fuera de `/auth/*`, llama una sola vez a `/auth/refresh` (compartido entre peticiones concurrentes), guarda el par nuevo y reintenta; si falla, limpia la sesión local. Al arrancar con un token guardado, valida con `GET /auth/me`. — `agente, dentro del alcance`

**QT-24 · Pestañas que comparten `localStorage`**
> Cada petición lee el token del store en el momento de enviarse, no uno capturado antes. Si dos pestañas refrescan a la vez, las cubre el margen de QT-06. — `agente, dentro del alcance`

**QT-25 · ¿Cómo se cumple RN-sesion-sin-recordarme ("termina al cerrar el navegador") sin cookies?**
> `propuesta`, contradice la spec y queda en espera del usuario:
> A. Sin Recordarme, guardar en `sessionStorage`: la sesión termina al cerrar la pestaña, pero abrir la app en otra pestaña pide login de nuevo.
> B. Cambiar la regla: sin Recordarme, la sesión dura como máximo 12 h desde el login aunque se cierre el navegador (`localStorage` en ambos casos).
> Recomendada: B, porque A obliga a iniciar sesión por pestaña.

**QT-25 · Dónde guarda el navegador la sesión según "Recordarme"**
> Sin Recordarme → `sessionStorage` (vive en la pestaña); con Recordarme → `localStorage`. El servidor igual aplica 12 h o 7 días según `Session.rememberMe`. — `usuario`
> Sobre la objeción de QT-04, el usuario dice: "es para un MVP".

**QT-26 · ¿El logout necesita el token de refresco en el cuerpo?** *(ajusta QT-21)*
> No. `POST /auth/logout` va sin cuerpo y con Bearer: la sesión sale del `sid` del token de acceso. `refresh` es `@Public()` porque se llama con el token de acceso vencido. — `agente, dentro del alcance`
