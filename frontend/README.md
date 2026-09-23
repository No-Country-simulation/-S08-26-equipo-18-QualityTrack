# React + Vite
# QualityTrack - Frontend
# QualityTrack — Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
Interfaz web de usuario para el sistema de gestión y trazabilidad industrial **QualityTrack**, desarrollada con **React**, **Vite** y **TypeScript**.
Interfaz web de usuario para el sistema de gestión y trazabilidad industrial **QualityTrack**, diseñada para empresas de mecanizado de precisión. Permite el seguimiento integral de todo el ciclo productivo: solicitudes, cotizaciones, órdenes de trabajo (OT), hojas de ruta, control de calidad y entregas.

Currently, two official plugins are available:
Desarrollada con **React 19**, **Vite**, **TypeScript**, **Chakra UI v3**, **Zustand** y **Vitest**.

---

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
## 📁 Estructura del proyecto (`src/`)
## 📋 Tabla de Contenidos
## Tabla de Contenidos

## React Compiler
La estructura de carpetas sigue un enfoque modular y por capas, diseñado para ser escalable a medida que se incorporen nuevos requerimientos de negocio:
1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación Rápida](#-instalación-rápida)
3. [Variables de Entorno](#-variables-de-entorno)
4. [Ejecución en Desarrollo](#-ejecución-en-desarrollo)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Scripts Disponibles](#-scripts-disponibles)
7. [Ejecución de Tests](#-ejecución-de-tests)
8. [Comunicación con el Backend](#-comunicación-con-el-backend)
9. [Solución de Problemas Frecuentes](#-solución-de-problemas-frecuentes)
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Rápida](#instalación-rápida)
3. [Variables de Entorno](#variables-de-entorno)
4. [Ejecución en Desarrollo](#ejecución-en-desarrollo)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Scripts Disponibles](#scripts-disponibles)
7. [Ejecución de Tests](#ejecución-de-tests)
8. [Comunicación con el Backend](#comunicación-con-el-backend)
9. [Solución de Problemas Frecuentes](#solución-de-problemas-frecuentes)

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
---

## 💻 Requisitos Previos
## Requisitos Previos

Antes de comenzar, asegúrate de contar con el siguiente software instalado en tu equipo:

- **Node.js**: Versión `20.x` o superior (se recomienda versión LTS `22.x`).
- **npm**: Versión `10.x` o superior (incluido con Node.js).
- **Git**: Para el control de versiones.
- *(Opcional)* **Docker Desktop**: Si se desea levantar todo el ecosistema (Frontend + Backend + PostgreSQL) mediante contenedores.

Para verificar tus versiones instaladas, ejecuta en la terminal:

```bash
node -v
npm -v
git --version
```

---

## 📦 Instalación Rápida
## Instalación Rápida

Sigue estos 4 pasos para tener el Frontend listo en menos de 2 minutos:

### 1. Clonar el repositorio

```bash
git clone https://github.com/No-Country-simulation/-S08-26-equipo-18-QualityTrack.git
cd -S08-26-equipo-18-QualityTrack
```

### 2. Entrar a la carpeta del Frontend

> **IMPORTANTE:** Todos los comandos de Frontend (`npm run dev`, `npm test`, etc.) deben ejecutarse siempre dentro del directorio `frontend/`.

```bash
cd frontend
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar variables de entorno

Copia la plantilla de ejemplo para generar tu archivo `.env` local:

**En Linux / macOS / Git Bash:**
```bash
cp .env.example .env
```

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

---

## 🔐 Variables de Entorno
## Variables de Entorno

El archivo `.env` almacena la configuración de conexión del cliente web. Por seguridad, **este archivo nunca debe subirse al repositorio Git** (está ignorado por `.gitignore`).

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base de la API Backend de QualityTrack | `http://localhost:3000` |
| `VITE_API_TIMEOUT_MS` | Tiempo máximo de espera para peticiones HTTP en milisegundos | `15000` |
| `VITE_APP_ENV` | Entorno de ejecución (`development`, `production`, `test`) | `development` |

> **Nota técnica sobre Vite:** En Vite, toda variable de entorno que deba ser accesible desde el código del navegador **debe comenzar obligatoriamente con el prefijo `VITE_`** y se consume a través de `import.meta.env.VITE_NOMBRE_VARIABLE` o mediante el módulo centralizado `src/config/env.ts`.
> **Nota técnica sobre Vite:** En Vite, toda variable de entorno que deba ser accesible desde el código del navegador **debe comenzar obligatoriamente con el prefijo `VITE_`** y se consume centralizadamente a través del módulo `src/config/index.ts` (`config.api.baseUrl`, `config.env`, etc.).

---

## 🚀 Ejecución en Desarrollo
## Ejecución en Desarrollo

Una vez instaladas las dependencias y configurado el archivo `.env`, inicia el servidor local de desarrollo:

```bash
npm run dev
```

La consola mostrará la URL de acceso:

```text
  VITE v8.2.2  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  >  Local:   http://localhost:5173/
  >  Network: use --host to expose
```

Abre tu navegador en: **`http://localhost:5173`**

### 🔑 Credenciales de prueba para Login
### Credenciales de prueba para Login

El sistema cuenta con un servicio de autenticación simulado para desarrollo:

- **Correo electrónico:** `admin@qualitytrack.com` (o cualquier correo válido)
- **Contraseña:** `password123` (o cualquier clave de 6 o más caracteres)

---

## 📁 Estructura del Proyecto
## Estructura del Proyecto

El código fuente en `frontend/src/` sigue una arquitectura modular y escalable por capas de responsabilidad:

```text
frontend/src/
├── assets/         # Recursos estáticos globales (imágenes, íconos, logos).
├── components/     # Componentes UI reutilizables y genéricos (botones, inputs, modales, layout, navbar).
├── config/         # Configuración centralizada y variables de entorno (URL del backend, constantes globales).
├── hooks/          # Custom hooks reutilizables con lógica transversal (useAuth, useDebounce, etc.).
├── modules/        # Organización modular por dominio de negocio (auth, clients, work-orders, quality, etc.).
├── pages/          # Pantallas o vistas completas asociadas al sistema de enrutamiento.
├── services/       # Capa de comunicación HTTP con la API del backend (servicios REST, clientes API).
├── utils/          # Funciones utilitarias puras y helpers (formato de fechas, validadores, helpers numéricos).
├── App.css         # Estilos globales de la aplicación raíz.
├── App.tsx         # Componente raíz de la aplicación.
├── index.css       # Estilos base y reseteo CSS.
└── main.tsx        # Punto de entrada de React (montaje en el DOM).
├── assets/         # Recursos estáticos globales (imágenes, logotipos, íconos SVG).
├── components/     # Componentes UI atómicos y compuestos reutilizables (Button, Card, FormField, DataTable, Can).
├── config/         # Configuración centralizada y lectura segura de variables de entorno (env.ts).
├── hooks/          # Custom hooks transversales (useApi, useDataTable, useForm, usePermissions).
├── layouts/        # Estructuras de página compartidas (DashboardLayout, Sidebar, Navbar).
├── modules/        # Organización por dominios de negocio (auth, clients, work-orders, quality).
├── pages/          # Pantallas y vistas completas montadas por el enrutador (LoginPage, DashboardPage, etc.).
├── routes/         # Configuración central del enrutador (AppRoutes.tsx) y guardas (ProtectedRoute, PublicRoute).
├── services/       # Cliente HTTP centralizado (api.ts) y servicios de dominio (clientService, quotationService, etc.).
├── store/          # Manejo de estado global con Zustand y persistencia (authStore.ts).
├── test/           # Configuración del entorno de pruebas (setup.ts) y utilidades de renderizado (test-utils.tsx).
├── theme/          # Configuración del tema visual y tokens de diseño con Chakra UI v3.
├── types/          # Definiciones e interfaces de TypeScript del negocio y permisos (auth.ts, permissions.ts).
├── utils/          # Funciones puras de soporte (validadores de formulario, normalización de roles, fechas).
├── App.tsx         # Componente raíz con ChakraProvider y AppRoutes.
└── main.tsx        # Punto de entrada de React en el DOM.
```

## Expanding the ESLint configuration
### 🧩 Responsabilidad de cada capa
### Responsabilidad de cada capa

- **`components/`**: Bloques visuales universales independientes del negocio.
- **`services/`**: Encargados exclusivos de la comunicación de red hacia la API REST. Los componentes nunca hacen `fetch()` directo.
- **`hooks/`**: Concentran la lógica reactiva de ciclo de vida (tablas, formularios, permisos, llamadas a API).
- **`store/`**: Estado global persistente en `localStorage` (sesión activa, token JWT, usuario autenticado).

---

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
## 🚀 Responsabilidad de cada carpeta
## 🛠️ Scripts Disponibles
## Scripts Disponibles

- **`components/`**: Elementos visuales que no pertenecen exclusivamente a una única pantalla y pueden reutilizarse en múltiples lugares del sistema.
- **`config/`**: Punto único de verdad para configuraciones. Ningún componente debe leer directamente variables de entorno o tener URLs hardcodeadas.
- **`hooks/`**: Lógica de estado o efectos secundarios reutilizables entre distintos componentes o vistas.
- **`modules/`**: Agrupa componentes, tipos y lógica que pertenecen exclusivamente a un dominio funcional del negocio de mecanizado (ej. órdenes de trabajo, cotizaciones, control de calidad).
- **`pages/`**: Componentes que actúan como vistas finales para cada ruta (`/login`, `/dashboard`, `/clients`, etc.), consumiendo componentes y módulos.
- **`services/`**: Encargados exclusivos de realizar peticiones HTTP hacia el Backend en NestJS. La UI nunca debe realizar llamadas de red directas.
- **`utils/`**: Funciones puras (sin estado ni efectos secundarios) de soporte general.
Todos los comandos deben ejecutarse desde la carpeta `frontend/`:

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo con Hot Module Replacement (HMR). |
| `npm run build` | Compila y optimiza la aplicación para producción en la carpeta `dist/`. |
| `npm test` | Ejecuta la suite de pruebas unitarias una vez con **Vitest**. |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo/observador en tiempo real. |
| `npm run preview` | Previsualiza localmente el build compilado de producción en `dist/`. |
| `npm run lint` | Ejecuta ESLint para auditar la calidad, estilos y consistencia del código. |

---

## 🛠️ Scripts disponibles
## 🧪 Ejecución de Tests
## Ejecución de Tests

En el directorio `frontend/`:
El proyecto utiliza **Vitest** + **React Testing Library** + **jsdom** para pruebas unitarias y de integración de componentes y utilidades.

- `npm run dev`: Inicia el servidor de desarrollo local con Hot Reload (por defecto en `http://localhost:5173`).
- `npm run build`: Compila la aplicación optimizada para producción en `dist/`.
- `npm run lint`: Ejecuta ESLint para analizar la calidad y consistencia del código.
- `npm run preview`: Previsualiza localmente el build de producción.
### Correr todas las pruebas

```bash
npm test
```

Salida esperada:
```text
 ✓ src/utils/__tests__/validators.test.ts (4 tests)
 ✓ src/components/__tests__/Button.test.tsx (3 tests)
 ✓ src/routes/__tests__/Navigation.test.tsx (1 test)

 Test Files  3 passed (3)
      Tests  8 passed (8)
```

### Escribir una nueva prueba

Al crear un nuevo componente o utilidad, agrega su archivo de prueba con extensión `.test.tsx` o `.test.ts` dentro de una carpeta `__tests__/` adyacente. Para componentes que requieran el tema de Chakra UI, utiliza `renderWithProviders` desde `src/test/test-utils`:

```tsx
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../test/test-utils'
import { MiComponente } from './MiComponente'

describe('MiComponente', () => {
    it('debe renderizar correctamente', () => {
        renderWithProviders(<MiComponente titulo="Prueba" />)
        expect(screen.getByText('Prueba')).toBeInTheDocument()
    })
})
```

---

## 🌐 Comunicación con el Backend
## Comunicación con el Backend

La comunicación con el backend (NestJS) está totalmente centralizada:

1. **Cliente HTTP Base (`src/services/api.ts`):**  
   Instancia única de **axios** (`apiClient`) configurada desde `src/config/appConfig.ts`:
   - `baseURL` desde `VITE_API_URL` y `timeout` desde `VITE_API_TIMEOUT_MS`.
   - Inyección automática del encabezado `Authorization: Bearer <accessToken>` a partir de la sesión en `useAuthStore`.
   - Ante un `401`, pide un token nuevo a `POST /auth/refresh` (una sola vez aunque fallen varias peticiones a la vez) y reintenta la petición. Si no se puede renovar, cierra la sesión local.
   - Conversión de errores HTTP en instancias de `ApiError` con código de estado (`status`) y datos detallados; sin respuesta del servidor, `status` es `0`.
   - Los servicios usan la fachada `api.get/post/put/patch/delete`, que devuelve directamente el cuerpo de la respuesta.

2. **Sesión (`src/store/authStore.ts` y `src/services/authService.ts`):**  
   - `POST /auth/login` devuelve `{ user, accessToken, refreshToken, expiresIn }`.
   - Con "Recordarme" la sesión se guarda en `localStorage`; sin él, en `sessionStorage` (termina al cerrar la pestaña).
   - Al arrancar, la app valida la sesión guardada con `GET /auth/me`.
   - `POST /auth/logout` cierra la sesión de ese dispositivo en el servidor.

3. **Servicios de Dominio (`src/services/`):**  
   Cada módulo de negocio cuenta con su propio servicio tipado:
   - `clientService.ts`: CRUD de Clientes (`getClients`, `getClientById`, `createClient`, etc.).
   - `requestService.ts`: Gestión de Solicitudes de mecanizado.
   - `quotationService.ts`: Cotizaciones y presupuestos.
   - `workOrderService.ts`: Órdenes de Trabajo (OT) y hojas de ruta.
   - `qualityService.ts`: Registro de controles dimensionales e inspecciones.
   - `deliveryService.ts`: Remitos y despachos.

4. **Consumo reactivo en UI:**  
   Los componentes consumen estos servicios utilizando el custom hook `useApi`:
   ```tsx
   const { data, loading, error, execute } = useApi(clientService.getClients)
   ```

---

## ❓ Solución de Problemas Frecuentes
## Solución de Problemas Frecuentes

### 1. Error: `Could not read package.json: ENOENT`
- **Causa:** Intentaste ejecutar `npm run dev` o `npm test` desde la raíz del repositorio en lugar de la carpeta de Frontend.
- **Solución:** Navega a la carpeta correspondiente antes de ejecutar el comando:
  ```bash
  cd frontend
  npm run dev
  ```

### 2. Error: `Puerto 5173 ya está en uso`
- **Causa:** Hay otra instancia de Vite o un contenedor corriendo en el puerto 5173.
- **Solución:** Cierra la terminal que tenga el proceso anterior, o Vite asignará automáticamente el siguiente puerto libre (ej: `5174`).

### 3. Errores de CORS al conectar con la API
- **Causa:** El Backend no tiene habilitado el origen `http://localhost:5173` en su configuración de CORS.
- **Solución:** Verifica que el backend tenga configurada la variable `CORS_ORIGIN=http://localhost:5173` en su `.env`.

### 4. Advertencias de TypeScript en rojo en VS Code
- **Causa:** Si las dependencias solo se instalaron dentro de un contenedor Docker, el VS Code de tu máquina física (Windows/Mac) no encuentra `node_modules`.
- **Solución:** Ejecuta `npm install` localmente dentro de `frontend/` para que el analizador de código de tu editor resuelva los tipos.
