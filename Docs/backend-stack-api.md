# Stack backend — QualityTrack API
componente: `backend/` · área: backend

## Adoptado
| Eje | Elección | Desde |
|---|---|---|
| Runtime | Node.js 22 (imagen `node:22-alpine`) | anterior a 2026-09 |
| Lenguaje | TypeScript 6.0.3, `strict` activado | anterior a 2026-09 |
| Framework | NestJS 12.0.1 sobre Express (`@nestjs/platform-express`) | anterior a 2026-09 |
| Configuración | `@nestjs/config` 12.0.0, global, lee `.env` | anterior a 2026-09 |
| Persistencia | MikroORM 7.2.0 (`@mikro-orm/postgresql`) contra PostgreSQL 17, decoradores legacy + `reflect-metadata` | anterior a 2026-09 |
| Migraciones | `@mikro-orm/migrations` 7.2.0, en TS en `backend/migrations/`, generadas siempre con el CLI, aplicadas en CI antes del deploy | anterior a 2026-09 |
| Modelo de dominio | anémico: las entidades son datos, las reglas van en los servicios (observado en `src/entities/`) | anterior a 2026-09 |
| Estructura | módulos Nest por funcionalidad (`src/<feature>/` con module, controller, service, dto) | propuesta, ver QT-01 |
| Acceso a datos | `EntityManager`/`EntityRepository` de MikroORM inyectado en el servicio, sin capa propia de repositorios | propuesta, ver QT-02 |
| Validación de entrada | `class-validator` + `class-transformer` con `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) | 2026-09 (QT-03) |
| Manejo de errores | excepciones HTTP de Nest (`UnauthorizedException`, etc.) con el formato de error por defecto de Nest (`{ statusCode, message, error }`) | propuesta, ver QT-04 |
| Configuración obligatoria | validada al arrancar (`src/config/env.validation.ts`): la app no inicia sin `JWT_ACCESS_SECRET` | 2026-09 |
| Autenticación | guard JWT global (`APP_GUARD`), rutas abiertas con `@Public()`; sesión comprobada en BD en cada petición | 2026-09 |
| Datos iniciales | seeder de MikroORM (`backend/seeders/`, `pnpm seed`) | 2026-09 |
| Tests | Jest 30.4.2 + supertest 7.2.2 | anterior a 2026-09 |

## Opt-ins
Decididos por el usuario el 2026-09-22 (QT-06 a QT-09).
- **Niveles de test:** el agente no escribe tests en ningún nivel (unit: no · integración contra Postgres real: no · contenedores efímeros: no · API en proceso: no). Los tests los escribe y corre el usuario. El agente verifica que el proyecto compile (`pnpm run build`).
- **Test primero:** no.
- **Tests end-to-end automatizados (navegador):** no.
- **Datos de test:** los define el usuario. El agente entrega un seed con los roles y un admin inicial (F-001, Q-08), que sirve para probar a mano.

## Convenciones
- Una sola configuración de base: `src/config/database.config.ts`, usada por `AppModule` y por el CLI (`mikro-orm.config.ts` la reexporta).
- Toda relación `ManyToOne` declara `index: true` (MikroORM 7 no indexa las FK en Postgres por su cuenta).
- Imagen Docker con pnpm vía corepack; CI compila el backend en cada PR (`.github/workflows/ci-backend.yml`).
- Entidades en `src/entities/`, un archivo por entidad, clases que extienden `BaseEntity` (`createdAt`/`updatedAt`) cuando tienen auditoría.
- Los comentarios del código explican el porqué de cada relación (estilo existente en las entidades).
- `mikro-orm.config.ts` carga `.env` con `process.loadEnvFile()` si existe (el CLI no lo hace solo).
- Variables de entorno de la BD: `DB_HOST`, `DB_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_SSL`.

## Paquetes
| Paquete | Versión | Por qué está |
|---|---|---|
| @nestjs/common, @nestjs/core, @nestjs/platform-express | 12.0.1 | Framework HTTP |
| @nestjs/config | 12.0.0 | Variables de entorno |
| @mikro-orm/core, postgresql, decorators, migrations, cli | 7.2.0 | ORM, esquema y migraciones |
| @mikro-orm/nestjs | 7.1.0 | Integración ORM ↔ Nest |
| @swc-node/register, @swc/core | 1.12.x / 1.16.2 | Ejecutar la config TS del CLI de MikroORM |
| @mikro-orm/seeder | 7.2.0 (misma versión que `@mikro-orm/core`; 7.2.1 exige core 7.2.1) | Admin inicial |
| @nestjs/jwt | 12.0.2 | Firmar y verificar JWT de acceso |
| bcryptjs | 3.0.3 | Hash de contraseñas, JS puro (QT-05) |
| class-validator / class-transformer | 0.15.1 / 0.5.1 | Validación de DTOs |
| jest, supertest, @nestjs/testing | 30.4.2 / 7.2.2 / 12.0.1 | Tests |

## Planificado (no adoptado)
- Nada pendiente de F-001 en el backend.

## Observaciones fuera de alcance (reportadas, no corregidas por decisión del usuario)
- `src/config/database.config.ts` calcula `useSsl` pero `driverOptions` está comentado: `DB_SSL` no tiene efecto. Si la base de producción exige SSL, la conexión falla.
- `jest.config.js` solo busca `*.spec.js` sin transformador TS: los tests en `.ts` no se ejecutan tal cual.
- Tokens de deploy (`RENDER_API_KEY`, `NETLIFY_AUTH_TOKEN`) en `.env` locales; no versionados.
- CI usa Node `lts/*`; el Dockerfile fija Node 22.

## Evidencia
Leído el 2026-09-22 de `backend/package.json`, `backend/pnpm-lock.yaml`, `backend/tsconfig.json`, `backend/mikro-orm.config.ts`, `backend/Dockerfile`, `backend/jest.config.js`, `docker-compose.yml` (postgres:17), `.github/workflows/*.yml`, `backend/src/**`.
Corregido el 2026-09-22 para que compile: `@Property({type:"enum", items})` → `@Enum(() => …)` en `WorkOrder` y `Approval`, y el segundo argumento inválido de `@ManyToOne` en `Delivery`.
Indeterminado: versión exacta de Node en producción (Render); la define el servicio, no el repo.
