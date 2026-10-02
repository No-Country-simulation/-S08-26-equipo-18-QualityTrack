# QualityTrack

Sistema de gestión y trazabilidad para empresas de mecanizado industrial.

QualityTrack tiene como objetivo centralizar y conectar la información relacionada con el ciclo de vida de cada trabajo:

```text
Solicitud del cliente
        ↓
Cotización
        ↓
Aprobación
        ↓
Orden de Trabajo (OT)
        ↓
Hoja de Ruta
        ↓
Operaciones
        ↓
Control de Calidad
        ↓
Entrega
```

El sistema busca permitir que, desde una Orden de Trabajo, se pueda reconstruir el historial completo del trabajo sin depender de archivos físicos, planillas o sistemas separados.

---

## Stack tecnológico

### Backend

* Node.js
* NestJS
* JavaScript

### Frontend

* React
* Vite
* JavaScript

### Base de datos

* PostgreSQL 17

### ORM

* MikroORM

### Infraestructura

* Docker
* Docker Compose

### Control de versiones

* Git
* GitHub

---

## Estructura del proyecto

```text
QualityTrack/
│
├── backend/                # API y lógica del servidor
│
├── frontend/               # Aplicación web
│
├── docker-compose.yml      # Orquestación de los servicios
│
├── .env                    # Variables de entorno locales
├── .env.example            # Plantilla de variables de entorno
├── .gitignore              # Archivos ignorados por Git
│
└── README.md               # Documentación principal
```

---

# Requisitos previos

Para ejecutar QualityTrack en un entorno de desarrollo se necesita:

* Git
* Docker Desktop
* Visual Studio Code (recomendado)

No es necesario instalar PostgreSQL directamente en el equipo para ejecutar el proyecto mediante Docker Compose.

---

# Clonar el proyecto

Desde una terminal:

```bash
git clone https://github.com/No-Country-simulation/-S08-26-equipo-18-QualityTrack.git
```

Entrar en el proyecto:

```bash
cd -S08-26-equipo-18-QualityTrack
```

---

# Configurar variables de entorno

El repositorio no contiene las variables de entorno reales.

Crear el archivo `.env` a partir de `.env.example`.

### Git Bash

```bash
cp .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

El archivo `.env` es local y **no debe subirse al repositorio**.

Desde la raíz, con Node.js 22, completar la configuración local:

```bash
node scripts/setup-local-env.mjs
```

Este comando genera las claves faltantes con valores aleatorios y conserva los
valores existentes. No muestra secretos. Revisar en `.env` las credenciales
`ADMIN_EMAIL` y `ADMIN_PASSWORD`, que se usarán para iniciar sesión después del seed.

Variables necesarias:

| Variable | Uso |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Base de datos local |
| `JWT_ACCESS_SECRET` | Firma de tokens en el backend; al menos 32 caracteres |
| `CORS_ORIGINS` | Orígenes del navegador permitidos; local: `http://localhost:5173` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial creado por el seed manual |
| `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Nombres opcionales del administrador |
| `ADMIN_DNI` | DNI real de 7 u 8 dígitos, obligatorio al crear el administrador inicial |

Antes del primer seed, completar `ADMIN_DNI` manualmente en `.env`:
`setup-local-env.mjs` genera secretos, pero no inventa datos personales. Si el
administrador ya existe, repetir el seed conserva su cuenta y su estado.

La plantilla deja las contraseñas y la clave JWT vacías. Los valores reales quedan
en `.env`, ignorado por Git. La clave JWT pertenece al backend; no se coloca en
`frontend/.env`, en variables `VITE_*` ni en documentación. Producción configura
sus propios secretos y no reutiliza los del desarrollo local.

Compose selecciona el stage `development`, conecta el backend a `postgres:5432`
con `DB_SSL=false` y le pasa estas variables explícitamente. El navegador usa
`http://localhost:3000` como API. Para ejecutar el backend fuera de Docker, copiar
la configuración local a `backend/.env`: allí `DB_HOST=localhost` y `DB_PORT=5432`
apuntan al puerto publicado por PostgreSQL.

---

# Ejecutar el proyecto con Docker

Antes de iniciar el proyecto, verificar que **Docker Desktop esté ejecutándose**.

Desde la raíz de QualityTrack:

```bash
docker compose up -d postgres
docker compose run --build --rm backend pnpm migration:up
docker compose run --rm backend pnpm seed
docker compose up --build -d
```

Estos comandos inicializan la base local, crean el administrador y levantan los servicios:

```text
Frontend
Backend
PostgreSQL
```

La primera ejecución puede tardar más debido a la descarga de imágenes y la instalación de dependencias.

Las migraciones y el seed se ejecutan explícitamente; no se crean usuarios
automáticamente al desplegar. Ejecutar este recorrido con la configuración local
de Compose, nunca con credenciales de producción. Después de inicializar la base,
los siguientes arranques solo necesitan `docker compose up --build -d`.

Abrir `http://localhost:5173` e iniciar sesión con las credenciales de `.env`.
La documentación de la API está en `http://localhost:3000/docs`.

### Administración de usuarios

Con una cuenta Administrador, abrir **Usuarios** en el menú para consultar las
cuentas, crear usuarios, editar sus datos y cambiar sus roles. Los roles se toman de la base de datos:
Administrador, Supervisor, Producción, Calidad y Administración. No hay registro
público ni editor de permisos.

La API ofrece `GET /users`, `GET /roles`, `POST /users`, `PATCH /users/:id`,
`PATCH /users/:id/role` y `PATCH /users/:id/status`.
Todas estas acciones requieren Administrador; los otros roles reciben 403 y las
peticiones sin sesión válida, 401. El alta recibe nombre, apellido, email, contraseña
y `roleId`, además de DNI obligatorio y único. El DNI admite 7 u 8 dígitos,
puntos y espacios; se guarda como texto normalizado, conservando ceros iniciales.
Editar datos permite nombre, apellido, email y DNI; no modifica contraseña ni rol.
El cambio de rol recibe únicamente `roleId`. Email o DNI duplicado devuelve 409,
incluso si la otra cuenta está inactiva. Datos inválidos y roles inexistentes
devuelven 400; un usuario inexistente al editar, cambiar rol o estado devuelve 404.

Las contraseñas se guardan con bcrypt y nunca aparecen en las respuestas. Alta,
login y creación del administrador inicial admiten contraseñas no vacías de hasta
72 bytes UTF-8, sin recortar espacios; los caracteres acentuados y símbolos pueden
ocupar varios bytes. `ADMIN_PASSWORD` debe respetar el mismo límite.

**Desactivar** requiere confirmación, conserva la cuenta y su historial y revoca
todas sus sesiones. Una cuenta inactiva no puede iniciar sesión, acceder con
tokens anteriores ni renovarlos. Se puede **Reactivar** desde el filtro
**Inactivos**; deberá iniciar sesión nuevamente. También existen filtros
**Activos** y **Todos**. No hay borrado físico de cuentas.

No se permite desactivar la propia cuenta, quitarse el rol Administrador ni dejar
al sistema sin administradores activos, incluso con cambios simultáneos. Los cambios de rol se aplican
en la siguiente petición de las sesiones vigentes, sin volver a iniciar sesión.
El cambio de contraseña queda fuera de estas acciones.

La migración `Migration20261002143000_user_profile_status` agrega DNI anulable y
estado activo por defecto. Conserva las cuentas existentes y deja sus DNI
pendientes para completarlos al editar, sin inventar identificaciones.
Tras actualizar un entorno local existente, ejecutar:

```bash
docker compose run --rm --no-deps backend pnpm migration:up
```

### Solicitudes y cotizaciones

Solicitudes y Cotizaciones usan la API y conservan sus registros al recargar.
Administrador, Supervisor y Administración pueden consultar, crear y editar;
Producción puede consultar solicitudes. Solo Administrador y Supervisor registran
la aceptación o el rechazo comercial informado por el cliente.

La API ofrece `GET/POST /requests`, `GET/PUT /requests/:id`,
`GET/POST /quotations`, `GET/PUT /quotations/:id` y
`PATCH /quotations/:id/decision`. El último recibe únicamente
`{"status":"accepted"}` o `{"status":"rejected"}`; autor y fecha se toman del
servidor. No existen acciones de borrado físico para estos registros.

Las altas requieren un cliente activo. La solicitud seleccionada debe pertenecer
al mismo cliente de la cotización. El servidor genera los números visibles con
secuencias independientes: `SOL-000001` y `COT-000001`. Los IDs internos también
son automáticos. El navegador no calcula ni envía estos números; se asignan al
guardar, son únicos y pueden tener saltos por transacciones fallidas. No pueden
cambiarse al editar; tampoco puede cambiarse el cliente ni el origen.
Una solicitud con cotizaciones conserva sus datos técnicos sin edición posterior.
Fecha de entrega solicitada y vigencia de la oferta son opcionales: omitirlas en
una actualización conserva el valor y enviar `null` lo limpia. La entrega
solicitada no puede ser anterior a la recepción de la solicitud.

Cada oferta necesita entre 1 y 100 ítems, cantidades positivas y precios no
negativos con hasta dos decimales. El servidor calcula y guarda los subtotales
por ítem, el subtotal de la oferta y el impuesto del 21 % que utiliza actualmente
el formulario; no acepta importes calculados ni autores enviados por el navegador.
El cálculo redondea cada ítem a centavos y la cotización con sus ítems se guarda
en una sola transacción. La moneda admitida es ARS o USD.

Las cotizaciones comienzan pendientes y pueden editarse mientras estén en ese
estado. Aceptar requiere cliente activo, vigencia no vencida, ítems e importes
coherentes. La decisión se confirma en pantalla y conserva quién la registró y
cuándo; repetir la misma decisión no cambia esa evidencia. Aceptadas y rechazadas
se consultan mediante **Ver detalle** y quedan sin edición. Una nueva oferta recibe
otro número automáticamente. Esta decisión comercial no constituye la
aprobación interna de una OT; el alta de OT desde una oferta aceptada corresponde
a la gestión de órdenes de trabajo descrita a continuación.

La migración `Migration20261002170000_quotation_decision` conserva las cotizaciones
e ítems existentes y agrega estado pendiente, sin inventar aceptación, autor ni
fecha. Los importes históricos se mantienen visibles: si son inconsistentes,
deben corregirse explícitamente antes de aceptar.

La migración `Migration20261002190000_commercial_numbers` agrega las secuencias
sin renumerar registros anteriores. Continúa por encima del mayor correlativo
existente del formato `SOL-n` o `COT-n`. Los números manuales anteriores conservan
su valor y sus relaciones. El alta por API no admite `requestNumber` ni
`quotationNumber` enviados por el cliente. Para actualizar una base local:

```bash
docker compose run --rm --no-deps backend pnpm migration:up
```

### Órdenes de trabajo y aprobación interna

Administrador y Supervisor crean y editan OT; Producción y Calidad pueden
consultarlas. Administración no tiene acceso al módulo de OT. El alta desde
**Nueva orden de trabajo** consulta cotizaciones reales y ofrece únicamente las
aceptadas de clientes activos, mostrando su cliente y solicitud. Sin una fuente
elegible se explica el requisito y no se permite guardar.

`POST /work-orders` recibe `quotationId`, título, descripción, prioridad e inicio
y fin planificados. El servidor deriva cliente y solicitud, exige aceptación
comercial registrada y genera un número único con una secuencia PostgreSQL.
No acepta número, autor, estado ni relaciones alternativas desde el navegador.
Una misma oferta puede originar varias OT; no se impone una cardinalidad comercial
que el equipo no haya definido. La lectura es `GET /work-orders` y
`GET /work-orders/:id`; la edición permitida es `PUT /work-orders/:id`.

La OT nueva comienza pendiente, con una aprobación interna pendiente sin actor ni
fecha de decisión. Desde su detalle, Administrador y Supervisor pueden aprobar
o rechazar: `PUT /approvals/:id/decide` recibe `status` (`APPROVED` o `REJECTED`)
y comentarios opcionales. La API también ofrece consultas `/approvals`,
`/approvals/:id` y `/approvals/work-order/:id`, y `POST /approvals` para registrar
la primera decisión por `workOrderId`. Usuario y fecha los fija el servidor;
decisión y estado de OT cambian en la misma transacción. Aprobar deja la OT
`APPROVED`; rechazar la cancela conservando evidencia. Repetir la decisión conserva
el primer dictamen y una decisión opuesta devuelve 409. La aceptación de la oferta
por el cliente y esta autorización interna de ejecución son registros distintos.

Editar conserva número y origen. El estado `APPROVED` no puede asignarse desde
el formulario de edición. Pasar a `IN_PROGRESS` o `COMPLETED` requiere aprobación
interna y fechas reales coherentes; completar exige inicio y fin reales.
No se permite editar una OT completada o cancelada ni borrar físicamente OT.
Las hojas de ruta, operaciones, materiales y personal se gestionan desde su detalle.

La migración `Migration20261002180000_work_order_origin` agrega el vínculo a la
oferta y las restricciones de número y aprobación única. Conserva OT anteriores
con origen no documentado, sin inventar cliente, solicitud ni cotización; sus
datos se pueden consultar y editar según su estado. No se permite inventar su
aprobación o comenzar ejecución sin un origen documentado. Si existen números
duplicados o varias aprobaciones por OT, la migración se detiene para su revisión
con datos verificables: no renumera ni elimina evidencia silenciosamente.
Actualizar la base local con `docker compose run --rm --no-deps backend pnpm migration:up`.

### Producción: hojas de ruta, operaciones, materiales y personal

Administrador y Supervisor pueden planificar y asignar recursos a OT abiertas
con origen documentado. Producción puede registrar ejecución; Calidad consulta
este tramo. Administración no accede a estas APIs. Los permisos se comprueban
en el servidor y el actor se obtiene de la sesión.

- **Hojas de ruta:** `GET/POST /route-sheets`, `GET/PUT /route-sheets/:id` y
  `GET /route-sheets/work-order/:id`. Número automático `HR-000001`, instrucciones
  opcionales y autor real. Una OT puede tener varias hojas, todas consultables.
- **Operaciones:** `GET/POST /operations`, `GET/PUT /operations/:id` y
  `GET /operations/route-sheet/:id`. Número automático `OP-001` dentro de cada
  hoja; nombre, descripción, máquina, planificación y notas persistidos. Padre
  y número inmutables; una operación iniciada conserva su planificación.
- **Ejecución:** `PATCH /operations/:id/execution` registra `actualStart` y/o
  `actualEnd`, con aprobación interna y fechas coherentes que no estén en el futuro.
  Las fechas guardadas son inmutables. El primer inicio real pasa la OT a
  `IN_PROGRESS` en la misma transacción; completar una operación no completa
  automáticamente toda la OT. La respuesta identifica al usuario que registró
  el último inicio o fin. Repetir los mismos valores conserva ese registro.
- **Catálogo:** `GET/POST /materials` y `GET /materials/:id`. Crear exige código
  único y nombre; especificación y fabricante pertenecen al material. La
  asignación no crea materiales implícitamente ni acepta un nombre libre.
- **Partidas:** `POST /work-order-materials` recibe `workOrderId`, `materialId`,
  cantidad positiva con hasta dos decimales y lote/unidad/certificado/fecha de
  recepción/notas opcionales. `GET/PUT /work-order-materials/:id` consulta o edita
  la partida; `/work-order-materials` lista y `GET /work-orders/:id/materials`
  filtra por OT. Se permiten varios lotes del mismo material, sin sumar inventario.
  Un opcional enviado como `null` se limpia y un campo omitido se conserva.
- **Personal:** `GET /work-order-users/available` ofrece usuarios activos a
  quienes pueden asignarlos, sin exponer DNI, email ni credenciales ni abrir la
  administración de cuentas. `POST /work-order-users` recibe solamente OT y
  usuario; conserva fecha y responsable de la asignación. Una persona puede
  participar en varias OT, con una sola asignación activa en cada una.
  `PATCH /work-order-users/:id/unassign` finaliza la asignación con fecha y autor
  de baja; permite una nueva asignación sin borrar la anterior. Consultas:
  `/work-order-users`, `/work-order-users/:id` y `/work-orders/:id/users`.

El personal muestra su rol vigente del sistema. No hay campos de puesto, turno
o notas de asignación que se descarten al guardar. Tampoco se expone un proveedor
por partida: el fabricante se consulta desde el catálogo. Las OT completadas o
canceladas conservan sus asociaciones y rechazan cambios. Este tramo no ofrece
borrado físico de hojas, operaciones, materiales o asignaciones.

`Migration20261002200000_production` incorpora responsables nullable para
históricos, baja de asignaciones, secuencia de hojas y restricciones de duplicados.
Conserva registros y números previos sin inventar autores. Si hay usuarios
repetidos en una misma OT u operaciones con el mismo número dentro de una hoja,
se detiene para su revisión sin eliminar ni fusionar evidencia. Aplicar con
`docker compose run --rm --no-deps backend pnpm migration:up`; no volver a ejecutar
el seed sobre la base habitual para probar este flujo.

### Calidad y entregas

Las inspecciones usan `GET/POST /quality`, `GET/PUT /quality/:id` y
`GET /quality/work-order/:id`. Administrador y Calidad registran y editan;
Supervisor y Producción consultan. La especificación es obligatoria y conserva
criterios o tolerancias textuales. Los valores esperado y medido son opcionales,
aceptan hasta diez enteros y cuatro decimales (numeric(14,4)) y se devuelven como
strings exactos. Una inspección visual puede omitir ambos valores y la unidad.
La operación es opcional y debe pertenecer a una hoja de la misma OT.

El inspector se toma de la sesión; editar conserva el autor original y registra
el editor y fecha. Si se omite la fecha en un alta, se usa la hora del servidor;
se puede indicar una fecha histórica o limpiar un opcional con null. No se
infiere aprobación/rechazo a partir de medidas ni se admite borrar evidencia.

Entregas usa `GET/POST /deliveries`, `GET/PUT /deliveries/:id` y
`GET /deliveries/work-order/:id`. Administrador, Supervisor y Administración
registran y editan; Calidad consulta. `GET /deliveries/work-orders` proporciona
las OT de origen para este flujo sin conceder a Administración acceso general
al módulo de OT. El destinatario se deriva de la cotización de la OT y no se
recibe del navegador. Las cantidades son enteros positivos hasta 2147483647;
las notas son opcionales. La fecha de entrega no puede preceder a la fecha de
creación de la OT, comparando días en America/Buenos_Aires. Se acepta YYYY-MM-DD
o timestamp ISO con zona horaria. Al editar una fecha sin cambios, el formulario
conserva el timestamp original.

Ambos registros conservan su OT; no se permite trasladarlos a otra. Las OT con
origen comercial documentado admiten estos registros incluso al completarse;
las canceladas conservan su historial sin nuevas escrituras. Los históricos sin
origen o destinatario coherente se consultan sin completar relaciones ficticias.
No se impone un máximo acumulado de entregas: el modelo todavía no registra
una cantidad producida contra la que validarlo.

`Migration20261002210000_quality_deliveries` agrega autores de entrega y editor
de inspección nullable para históricos y permite notas de entrega vacías. No
reescribe registros anteriores ni cambia secretos. Aplicar con
`docker compose run --rm --no-deps backend pnpm migration:up`; no ejecutar el
seed para comprobar este flujo.

### Comprobaciones antes de integrar cambios

```bash
cd frontend
npm ci
npm run build
npm test
cd ..
```

`npm run build` ejecuta TypeScript antes de generar el bundle. El chequeo aislado
es `npm run typecheck`. Las cachés `*.tsbuildinfo` son archivos generados y no se
versionan. CI Frontend ejecuta build y pruebas en PRs y en cambios de `develop`.

Para comprobar la compilación del backend con sus dependencias de desarrollo:

```bash
docker compose run --rm backend pnpm run build
docker compose run --rm backend pnpm run test:security
```

Las pruebas de permisos y TLS no usan la BD habitual. CI Backend agrega una
integración HTTP con PostgreSQL efímero: requiere `SECURITY_TEST_DB=true`, host
local, `POSTGRES_DB=qualitytrack_security` y `DB_SSL=false`. Esa prueba aplica las
migraciones y crea sus propios usuarios/clientes en una base exclusiva de pruebas.
Para reproducirla, usar una base nueva y aislada con esos valores.

### Formularios y estado de los módulos

Clientes permite limpiar contacto, dirección, ciudad, provincia y notas al editar:
`null` borra un opcional, mientras que un campo omitido conserva su valor. Los
campos obligatorios rechazan `null` con 400. Los máximos son 1000 caracteres para
razón social, 255 para contacto/dirección/ciudad/provincia/email/teléfono y 5000
para notas; email y teléfono deben además respetar su formato. CUIT admite once
dígitos y separadores (guiones, puntos o espacios), sin exigir checksum.

Las pantallas muestran únicamente respuestas del servidor. Un fallo al guardar
conserva el formulario y muestra el error; una lista vacía permanece vacía. Los
módulos cuya API todavía no está implementada muestran indisponibilidad y permiten
reintentar, sin datos de demostración ni éxitos locales. El dashboard informa que
sus indicadores aún no están disponibles y el catálogo de personal no ofrece
usuarios ficticios. Las APIs de dominio e indicadores se incorporan progresivamente.

### Permisos y conexión remota

La API de clientes comprueba el rol vigente de BD en cada request. Administrador
puede consultar, crear, editar y cambiar el estado; Supervisor y Administración
pueden consultar, crear y editar. Producción, Calidad y roles desconocidos reciben
403 para esas acciones. Sin sesión válida la respuesta es 401. Cambiar el estado
conserva el permiso existente `clients:delete` de la UI y no borra registros.

Logout con access token vencido renueva y reintenta la revocación una vez. Siempre
se limpian las credenciales locales; si el servidor no confirma el cierre, la
pantalla de login informa que no se pudo confirmar la revocación remota.

Para una BD remota, `DB_SSL=true` verifica el certificado y el nombre del servidor.
Si el proveedor usa una CA que no está en el almacén de confianza del runtime,
configurar `DB_SSL_CA` con el certificado CA PEM oficial (saltos reales o `\n`).
En Supabase se obtiene desde la configuración de conexión del proyecto:
[documentación de conexiones SSL](https://supabase.com/docs/guides/database/connecting-to-postgres#ssl-connections).
Configurar el mismo valor en el entorno del backend y, si corresponde, en el secret
`DB_SSL_CA` del environment `production` de GitHub, usado por migraciones y seed.
El certificado CA es público; no cargar una clave privada. Sin CA personalizada
se usa el almacén de confianza predeterminado. `DB_SSL=false` queda reservado al
entorno local de Compose. Las pruebas de seguridad generan certificados temporales
con OpenSSL y verifican aceptación con CA válida, rechazo sin confianza y hostname
incorrecto; CI y el stage de desarrollo disponen de esa herramienta.

---

# Servicios disponibles

Una vez iniciado Docker Compose:

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:3000
```

### PostgreSQL

```text
localhost:5432
```

PostgreSQL no se accede desde el navegador. Es utilizado por el Backend.

---

# Verificar los contenedores

En otra terminal, desde la raíz del proyecto:

```bash
docker compose ps
```

Los servicios deberían aparecer ejecutándose.

---

# Ver logs

Para consultar los logs de todos los servicios:

```bash
docker compose logs
```

Para consultar solamente el Backend:

```bash
docker compose logs backend
```

Para consultar solamente el Frontend:

```bash
docker compose logs frontend
```

Para consultar PostgreSQL:

```bash
docker compose logs postgres
```

Para seguir los logs en tiempo real:

```bash
docker compose logs -f
```

---

# Detener el proyecto

Si Docker Compose está ejecutándose en primer plano, se puede detener con:

```text
Ctrl + C
```

También se puede ejecutar:

```bash
docker compose down
```

Esto detiene y elimina los contenedores, pero mantiene el volumen de PostgreSQL.

---

# Persistencia de PostgreSQL

La base de datos utiliza un volumen Docker:

```text
postgres_data
```

Esto permite conservar los datos de PostgreSQL aunque los contenedores sean eliminados y posteriormente creados nuevamente.

Por ejemplo:

```bash
docker compose down
```

no elimina los datos almacenados en el volumen.

### ⚠️ Importante

El siguiente comando elimina también los volúmenes:

```bash
docker compose down -v
```

Esto puede eliminar los datos locales de PostgreSQL.

Utilizarlo únicamente cuando sea necesario reiniciar completamente la base de datos de desarrollo.

---

# Desarrollo

Docker Compose utiliza los directorios locales de Backend y Frontend como volúmenes.

Esto permite trabajar directamente sobre el código del equipo y aprovechar el hot reload durante el desarrollo.

### Backend

```text
backend/
```

### Frontend

```text
frontend/
```

Los cambios realizados en el código se reflejan dentro de los contenedores sin necesidad de reconstruir las imágenes en cada modificación.

Backend y frontend utilizan polling para detectar cambios en los volúmenes de
Docker Desktop sobre Windows. Si la API conserva una validación anterior,
reiniciar el backend con `docker compose restart backend`. Después de modificar
variables de Docker Compose, aplicar la configuración con
`docker compose up -d backend`.

---

# Reconstruir las imágenes

Si se modifican dependencias, Dockerfiles o configuraciones que requieren una reconstrucción:

```bash
docker compose up --build
```

Para reconstruir sin utilizar la caché:

```bash
docker compose build --no-cache
```

Luego:

```bash
docker compose up
```

---

# Comandos Docker principales

### Iniciar

```bash
docker compose up
```

### Iniciar reconstruyendo imágenes

```bash
docker compose up --build
```

### Iniciar en segundo plano

```bash
docker compose up -d
```

### Ver estado

```bash
docker compose ps
```

### Ver logs

```bash
docker compose logs
```

### Detener

```bash
docker compose down
```

### Reconstruir imágenes

```bash
docker compose build
```

---

# Flujo de trabajo con Git

El proyecto utiliza ramas para organizar el desarrollo.

Ramas principales:

```text
main
develop
```

### `main`

Contiene la versión estable del proyecto.

### `develop`

Rama utilizada para integrar el desarrollo antes de llevarlo a `main`.

Para desarrollar una nueva funcionalidad se recomienda crear una rama a partir de `develop`.

Ejemplo:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad
```

Al finalizar el trabajo:

```bash
git add .
git commit -m "feat: descripcion del cambio"
git push origin feature/nombre-funcionalidad
```

Los cambios deberán integrarse mediante Pull Request siguiendo el flujo definido por el equipo.

---

# Reglas importantes

## No subir variables de entorno reales

No subir:

```text
.env
```

Sí debe mantenerse:

```text
.env.example
```

---

## No subir dependencias instaladas

No subir:

```text
node_modules/
```

Las dependencias se instalan mediante `npm install` o durante la construcción de los contenedores Docker.

---

## No modificar infraestructura sin coordinación

Los siguientes archivos afectan a todo el equipo:

```text
docker-compose.yml
.env.example
backend/Dockerfile
frontend/Dockerfile
```

Los cambios importantes sobre ellos deben coordinarse con el equipo antes de integrarlos.

---

# Solución de problemas frecuentes

## Docker no inicia

Verificar que Docker Desktop esté abierto y funcionando.

Después ejecutar:

```bash
docker compose ps
```

---

## El puerto 5173 está ocupado

El Frontend utiliza:

```text
5173
```

Verificar qué aplicación está utilizando ese puerto antes de modificar la configuración de Docker Compose.

---

## El puerto 3000 está ocupado

El Backend utiliza:

```text
3000
```

Verificar qué aplicación está utilizando ese puerto antes de modificar la configuración.

---

## PostgreSQL no inicia

Consultar los logs:

```bash
docker compose logs postgres
```

También verificar que las variables del archivo `.env` estén correctamente configuradas.

---

## Reconstrucción completa

Si existen problemas relacionados con imágenes o dependencias:

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

**No utilizar `docker compose down -v` salvo que sea necesario eliminar también los datos locales de PostgreSQL.**

---

# Arquitectura inicial

La arquitectura inicial del proyecto sigue esta estructura:

```text
                    ┌───────────────┐
                    │    Usuario    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Frontend    │
                    │ React + Vite  │
                    └───────┬───────┘
                            │
                            │ HTTP
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │    NestJS     │
                    └───────┬───────┘
                            │
                            │
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │      17       │
                    └───────────────┘
```

Docker Compose administra estos servicios durante el desarrollo:

```text
┌──────────────────────────────────────────┐
│              Docker Compose              │
│                                          │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Frontend │  │ Backend │  │ Postgres│ │
│  │  :5173   │  │  :3000  │  │  :5432  │ │
│  └──────────┘  └─────────┘  └─────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

---

# Estado actual del proyecto

La infraestructura inicial se encuentra preparada:

* Repositorio Git → ✅
* Backend NestJS → ✅
* Frontend React + Vite → ✅
* Dockerfile Backend → ✅
* Dockerfile Frontend → ✅
* Docker Compose → ✅
* PostgreSQL 17 → ✅
* Variables de entorno de ejemplo → ✅
* `.gitignore` → ✅
* Ejecución mediante Docker → ✅

Pendiente de implementación:

* Configuración de MikroORM
* Migraciones de base de datos
* Modelos y entidades
* API de negocio
* Autenticación y autorización
* Módulos funcionales
* Interfaz funcional
* Testing completo
* Despliegue

---

# Equipo

QualityTrack — Proyecto de desarrollo colaborativo.

Repositorio:

```text
https://github.com/No-Country-simulation/-S08-26-equipo-18-QualityTrack
```
