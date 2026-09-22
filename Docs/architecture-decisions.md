# Decisiones técnicas del producto — registro

Registro append-only. Una respuesta reemplazada se marca con qué la reemplazó; nunca se borra.

Modo elegido para `Docs/backend-stack-api.md`: **propuestas** (el agente decide los detalles, etiquetados; el usuario objeta lo que no le sirva). Confirmado por el usuario el 2026-09-22 al aprobar las propuestas.

## QT-01 — Estructura del código backend
- **Pregunta:** ¿cómo se organiza el código nuevo?
- **Respuesta:** un módulo Nest por funcionalidad (`src/auth/`, `src/users/`…), cada uno con module, controller, service y dto. Es la convención nativa de Nest y lo que el `AppModule` actual ya sugiere.
- **Origen:** agente, dentro del alcance.

## QT-02 — Acceso a datos
- **Pregunta:** ¿capa propia de repositorios o el ORM directo?
- **Respuesta:** `EntityRepository`/`EntityManager` de MikroORM inyectados en el servicio. MikroORM ya aplica unit of work; envolverlo agrega código sin comprador.
- **Origen:** agente, dentro del alcance.

## QT-03 — Validación de entrada
- **Pregunta:** ¿cómo se valida el body de las peticiones?
- **Respuesta:** `class-validator` + `class-transformer` con `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). Es el mecanismo documentado por Nest.
- **Origen:** agente, dentro del alcance.

## QT-04 — Manejo de errores
- **Pregunta:** ¿qué forma tienen los errores HTTP?
- **Respuesta:** excepciones HTTP de Nest con su cuerpo por defecto `{ statusCode, message, error }`. El frontend (`api.ts`) ya lee `data.message`, así que no hace falta un filtro propio.
- **Origen:** agente, dentro del alcance.

## QT-05 — Hash de contraseñas
- **Pregunta:** ¿con qué se hashean las contraseñas?
- **Respuesta:** `bcryptjs` (JS puro). `argon2` y `bcrypt` necesitan compilar nativos y `pnpm-workspace.yaml` restringe los builds (`allowBuilds`), lo que complicaría la instalación en CI/Render.
- **Origen:** agente, dentro del alcance.

## QT-06 — Niveles de test del backend
- **Pregunta:** ¿qué niveles de test automatizado se entregan con el código? unit · integración contra Postgres real · contenedores efímeros (Testcontainers) · API en proceso (Nest + supertest).
- **Propuesta:** unit sí (servicio de auth: hash, rotación, reuso) · integración contra Postgres real: sí, contra el Postgres de `docker-compose` · contenedores efímeros: no (exige Docker en CI y minutos por corrida) · API en proceso: sí (supertest contra la app Nest). Requiere agregar un transformador TS a Jest (`@swc/jest`, ya hay `@swc/core`).
- **Origen:** propuesta.

## QT-07 — Test primero
- **Propuesta:** no. Los tests se escriben junto al código de cada unidad.
- **Origen:** propuesta.

## QT-08 — Tests end-to-end automatizados (navegador)
- **Propuesta:** no, por ahora. Reconsiderarlo cuando haya más de un flujo de negocio completo.
- **Origen:** propuesta.

## QT-09 — Datos de test
- **Propuesta:** seeder de MikroORM (`@mikro-orm/seeder`) que crea los roles y un usuario admin; los tests e2e crean y limpian sus propios usuarios.
- **Origen:** propuesta.

## Respuestas del 2026-09-22
- **QT-06:** reemplazada la propuesta. Respuesta (usuario): el agente no escribe tests; solo verifica que compile. Los tests los hace el usuario.
- **QT-07:** respuesta (usuario): no.
- **QT-08:** respuesta (usuario): no.
- **QT-09:** respuesta (usuario): los datos de test los define el usuario; el seed de roles + admin se entrega igual por F-001 Q-08.
- **QT-01 a QT-05:** sin objeciones del usuario; se mantienen como agente, dentro del alcance.
