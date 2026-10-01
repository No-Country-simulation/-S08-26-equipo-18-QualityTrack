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
| Documentación de la API | OpenAPI generado por `@nestjs/swagger` desde los decoradores; Scalar sirve la referencia en `/docs` y el documento crudo en `/openapi.json`, ambos abiertos (decisión del usuario 2026-09-22) | 2026-09 |
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
- Cada endpoint declara en OpenAPI lo que devuelve: `@ApiOperation`, la respuesta con su clase, y `@ApiBearerAuth("access-token")` si el guard global lo protege.
- Las clases `*ResponseDto` existen solo para publicar la forma de la respuesta; el servicio devuelve objetos planos.
- `skipLibCheck: true` en `tsconfig.json`: los tipos de Scalar importan `fastify`, `har-format` y tipos del DOM, que este proyecto no instala. TypeScript sigue verificando el código propio, no los `.d.ts` de dependencias.
- `allowBuilds` de `pnpm-workspace.yaml` niega `@scarf/scarf` (telemetría de instalación que llega con Scalar).
- `/docs` se dibuja en el navegador con el bundle de Scalar traído desde jsDelivr: sin internet la página carga vacía. El contrato en sí no depende del CDN, está entero en `/openapi.json`.

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
| @nestjs/swagger | 12.0.1 | Genera el documento OpenAPI desde los decoradores (MIT; peer `@nestjs/core` ^12, coincide con el instalado) |
| @scalar/nestjs-api-reference | 1.2.21 | Sirve la referencia navegable en `/docs` (MIT; única dependencia propia: `@scalar/client-side-rendering`) |

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

## Contrato de endpoints requeridos por el frontend (Fase 9)

La siguiente tabla consolida los endpoints REST que el frontend consume o tiene preparados para consumir. Cada endpoint debe devolver las entidades tipadas según el modelo definido en `src/entities/` y aceptar los DTOs correspondientes con validación de entrada via `class-validator`.

| Módulo / Entidad | Método y Ruta | Descripción / Parámetros | DTO o Payload esperado |
|---|---|---|---|
| Requests | `GET /requests` | Lista todas las solicitudes comerciales | Query opcional: `search`, `page`, `limit` |
| Requests | `GET /requests/:id` | Detalle de una solicitud | Respuesta: `Request` con `client` opcional |
| Requests | `POST /requests` | Crea nueva solicitud técnica | `CreateRequestDto` (`clientId`, `requestNumber`, `title`, `description`, `receivedAt`, `requestedDeliveryDate`) |
| Requests | `PUT /requests/:id` | Actualiza solicitud existente | `UpdateRequestDto` (campos parciales) |
| Requests | `DELETE /requests/:id` | Elimina una solicitud | Respuesta 204 No Content |
| Quotations | `GET /quotations` | Lista todas las cotizaciones | Query opcional: `search`, `page`, `limit` |
| Quotations | `GET /quotations/:id` | Detalle de cotización con items | Respuesta: `Quotation` con `items`, `client`, `request` |
| Quotations | `POST /quotations` | Crea nueva cotización comercial | `CreateQuotationDto` (`clientId`, `requestId`, `quotationNumber`, `version`, `subtotal`, `taxAmount`, `currency`, `items`) |
| Quotations | `PUT /quotations/:id` | Actualiza cotización existente | `UpdateQuotationDto` (campos parciales) |
| Quotations | `DELETE /quotations/:id` | Elimina una cotización | Respuesta 204 No Content |
| WorkOrders | `GET /work-orders` | Lista todas las órdenes de trabajo | Query opcional: `status`, `search`, `page`, `limit` |
| WorkOrders | `GET /work-orders/:id` | Detalle completo de una orden de trabajo | Respuesta: `WorkOrder` con `client`, `request`, `quotation` |
| WorkOrders | `POST /work-orders` | Crea nueva orden de trabajo | `CreateWorkOrderDto` (`workOrderNumber`, `title`, `description`, `priority`, `status`, `clientId`, `requestId`, `quotationId`, fechas) |
| WorkOrders | `PUT /work-orders/:id` | Actualiza orden de trabajo | `UpdateWorkOrderDto` (campos parciales) |
| WorkOrders | `DELETE /work-orders/:id` | Elimina una orden de trabajo | Respuesta 204 No Content |
| QualityControl | `GET /quality` | Lista todos los controles de calidad | Query opcional: `search`, `page`, `limit` |
| QualityControl | `GET /quality/work-order/:id` | Controles de calidad vinculados a una OT | Parámetro: `id` de la orden de trabajo |
| QualityControl | `GET /quality/:id` | Detalle de un control de calidad | Respuesta: `QualityControl` con `workOrder` |
| QualityControl | `POST /quality` | Registra control de calidad | `CreateQualityControlDto` (`workOrderId`, `operationId`, `specification`, `measuredValue`, `expectedValue`, `unit`, `observations`) |
| QualityControl | `PUT /quality/:id` | Actualiza control de calidad | `UpdateQualityControlDto` (campos parciales) |
| QualityControl | `DELETE /quality/:id` | Elimina control de calidad | Respuesta 204 No Content |
| Deliveries | `GET /deliveries` | Lista todos los remitos y entregas | Query opcional: `search`, `page`, `limit` |
| Deliveries | `GET /deliveries/work-order/:id` | Entregas vinculadas a una OT | Parámetro: `id` de la orden de trabajo |
| Deliveries | `GET /deliveries/:id` | Detalle de una entrega | Respuesta: `Delivery` con `client`, `workOrder` |
| Deliveries | `POST /deliveries` | Registra nuevo despacho o remito | `CreateDeliveryDto` (`workOrderId`, `clientId`, `deliveryDate`, `quantity`, `notes`) |
| Deliveries | `PUT /deliveries/:id` | Actualiza remito de entrega | `UpdateDeliveryDto` (campos parciales) |
| Deliveries | `DELETE /deliveries/:id` | Elimina remito de entrega | Respuesta 204 No Content |
| RouteSheets | `GET /route-sheets/work-order/:id` | Hoja de ruta vinculada a una OT | Parámetro: `id` de la orden de trabajo |
| RouteSheets | `GET /route-sheets/:id` | Detalle de hoja de ruta | Respuesta: `RouteSheet` |
| RouteSheets | `POST /route-sheets` | Crea hoja de ruta para una OT | `CreateRouteSheetDto` (`workOrderId`, `routeNumber`, `instructions`) |
| RouteSheets | `PUT /route-sheets/:id` | Actualiza hoja de ruta | `UpdateRouteSheetDto` (campos parciales) |
| RouteSheets | `DELETE /route-sheets/:id` | Elimina hoja de ruta | Respuesta 204 No Content |
| Operations | `GET /operations/route-sheet/:id` | Operaciones de una hoja de ruta | Parámetro: `id` de la hoja de ruta |
| Operations | `GET /operations/:id` | Detalle de una operación | Respuesta: `Operation` |
| Operations | `POST /operations` | Registra operación de mecanizado | `CreateOperationDto` (`routeSheetId`, `operationNumber`, `name`, `machine`, `estimatedHours`, fechas) |
| Operations | `PUT /operations/:id` | Actualiza estado u horas de operación | `UpdateOperationDto` (campos parciales) |
| Operations | `DELETE /operations/:id` | Elimina operación de mecanizado | Respuesta 204 No Content |
| Documents | `GET /documents` | Lista documentos técnicos | Query opcional: `workOrderId`, `requestId`, `quotationId` |
| Documents | `GET /documents/work-order/:id` | Documentos vinculados a una OT | Parámetro: `id` de la orden de trabajo |
| Documents | `GET /documents/types` | Tipos de documentos configurados | Respuesta: `DocumentType[]` |
| Documents | `POST /documents` | Carga de archivo técnico adjunto | Multipart form: `file`, `documentTypeId`, `workOrderId`, `description` |
| Documents | `DELETE /documents/:id` | Elimina documento adjunto | Respuesta 204 No Content |
| Materials | `GET /materials` | Catálogo maestro de materiales | Query opcional: `search`, `page`, `limit` |
| Materials | `POST /materials` | Crea material en catálogo | `CreateMaterialDto` (`code`, `name`, `description`, `unitOfMeasure`) |
| Materials | `PUT /materials/:id` | Actualiza material | `UpdateMaterialDto` (campos parciales) |
| Materials | `DELETE /materials/:id` | Elimina material | Respuesta 204 No Content |
| WorkOrderMaterials | `GET /work-order-materials/work-order/:id` | Materiales asignados a una OT | Parámetro: `id` de la orden de trabajo |
| WorkOrderMaterials | `POST /work-order-materials` | Asigna lote de material a OT | `CreateWorkOrderMaterialDto` (`workOrderId`, `materialId`, `quantity`, `heatNumber`, `certificateUrl`) |
| WorkOrderMaterials | `DELETE /work-order-materials/:id` | Desvincula material de OT | Respuesta 204 No Content |
| Approvals | `GET /approvals/work-order/:id` | Aprobación técnica/calidad de OT | Parámetro: `id` de la orden de trabajo |
| Approvals | `POST /approvals` | Registra decisión de aprobación | `CreateApprovalDto` (`workOrderId`, `status`, `comments`, `approvedById`) |
| Approvals | `PUT /approvals/:id` | Actualiza decisión de aprobación | `UpdateApprovalDto` (`status`, `comments`) |
| WorkOrderUsers | `GET /work-order-users/work-order/:id` | Personal asignado a una OT | Parámetro: `id` de la orden de trabajo |
| WorkOrderUsers | `POST /work-order-users` | Asigna operario/técnico a OT | `CreateWorkOrderUserDto` (`workOrderId`, `userId`, `roleInOrder`) |
| WorkOrderUsers | `DELETE /work-order-users/:id` | Desasigna personal de OT | Respuesta 204 No Content |

