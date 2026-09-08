# React + Vite
# QualityTrack - Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
Interfaz web de usuario para el sistema de gestión y trazabilidad industrial **QualityTrack**, desarrollada con **React**, **Vite** y **TypeScript**.

Currently, two official plugins are available:
---

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
## 📁 Estructura del proyecto (`src/`)

## React Compiler
La estructura de carpetas sigue un enfoque modular y por capas, diseñado para ser escalable a medida que se incorporen nuevos requerimientos de negocio:

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
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
```

## Expanding the ESLint configuration
---

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
## 🚀 Responsabilidad de cada carpeta

- **`components/`**: Elementos visuales que no pertenecen exclusivamente a una única pantalla y pueden reutilizarse en múltiples lugares del sistema.
- **`config/`**: Punto único de verdad para configuraciones. Ningún componente debe leer directamente variables de entorno o tener URLs hardcodeadas.
- **`hooks/`**: Lógica de estado o efectos secundarios reutilizables entre distintos componentes o vistas.
- **`modules/`**: Agrupa componentes, tipos y lógica que pertenecen exclusivamente a un dominio funcional del negocio de mecanizado (ej. órdenes de trabajo, cotizaciones, control de calidad).
- **`pages/`**: Componentes que actúan como vistas finales para cada ruta (`/login`, `/dashboard`, `/clients`, etc.), consumiendo componentes y módulos.
- **`services/`**: Encargados exclusivos de realizar peticiones HTTP hacia el Backend en NestJS. La UI nunca debe realizar llamadas de red directas.
- **`utils/`**: Funciones puras (sin estado ni efectos secundarios) de soporte general.

---

## 🛠️ Scripts disponibles

En el directorio `frontend/`:

- `npm run dev`: Inicia el servidor de desarrollo local con Hot Reload (por defecto en `http://localhost:5173`).
- `npm run build`: Compila la aplicación optimizada para producción en `dist/`.
- `npm run lint`: Ejecuta ESLint para analizar la calidad y consistencia del código.
- `npm run preview`: Previsualiza localmente el build de producción.
