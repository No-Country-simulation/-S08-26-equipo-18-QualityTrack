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
