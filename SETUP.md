# Guía de Inicialización y Configuración de Infraestructura (PREPRUNAPE)

Este archivo detalla los comandos exactos y el orden de configuración utilizado para levantar la infraestructura base de **Serene Pediatrics** (PREPRUNAPE) utilizando React 18 (TypeScript), Tailwind CSS v3, shadcn/ui, y Supabase.

---

## PASOS EJECUTADOS PARA LA CONFIGURACIÓN

### 1. Creación del Proyecto con Vite y React 18 (TypeScript)
Vite por defecto inicializa con React 19, por lo cual realizamos un scaffolding y posterior downgrade a React 18 de la siguiente manera:

```bash
# 1. Crear el proyecto con plantilla de React + TS
npx -y create-vite@latest . --template react-ts

# 2. Forzar la instalación de React 18 y sus tipos correspondientes
npm install react@^18 react-dom@^18 --legacy-peer-deps
npm install -D @types/react@^18 @types/react-dom@^18 --legacy-peer-deps
```

---

### 2. Instalación de todas las Dependencias
Instalamos el conjunto completo de librerías del stack de la aplicación:

```bash
# Dependencias de producción/runtime (incluye Leaflet v4 para React 18)
npm install @supabase/supabase-js react-router-dom zustand react-hook-form zod @hookform/resolvers @tanstack/react-query lucide-react @tanstack/react-table date-fns sonner leaflet@^1.9.4 react-leaflet@^4.2.1 --legacy-peer-deps

# Dependencias de desarrollo (Tailwind CSS v3, PostCSS, Autoprefixer, tipos)
npm install -D tailwindcss@^3.4.17 postcss autoprefixer @types/leaflet@^1.9.8 --legacy-peer-deps
```

---

### 3. Configuración para Resolver Conflictos de Peer Dependencies
Para evitar problemas de compatibilidad con CLIs de terceros que instalen dependencias de React 19 en un entorno de React 18, creamos un archivo `.npmrc` en la raíz del proyecto para forzar `--legacy-peer-deps` en cualquier comando de `npm` de manera automática:

Crear archivo `.npmrc` en la raíz:
```ini
legacy-peer-deps=true
```

---

### 4. Inicialización de Tailwind CSS
Generamos los archivos de configuración base para Tailwind CSS y PostCSS:

```bash
npx tailwindcss init -p
```
*Nota: Reemplazamos `tailwind.config.js` por `tailwind.config.ts` para TypeScript estricto, con soporte para las variables de color, Hanken Grotesk y Inter del manual de marca de Serene Pediatrics (`DESIGN (1).md`).*

---

### 5. Inicialización de shadcn/ui
Creamos el archivo `components.json` en la raíz con la siguiente estructura base para que el CLI de shadcn reconozca el proyecto sin requerir prompts interactivos:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

Para asegurar que los aliases de rutas `@/*` funcionen en todo el ecosistema de TypeScript y shadcn, agregamos la configuración tanto en `tsconfig.app.json` como en `tsconfig.json`:
```json
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

---

### 6. Instalar Componentes de shadcn/ui
Con el entorno de aliases y `.npmrc` configurado, instalamos el bloque completo de componentes de UI de shadcn en una sola línea:

```bash
npx shadcn@latest add input label card table dialog sheet badge avatar dropdown-menu select form textarea tabs separator skeleton tooltip popover calendar command alert alert-dialog progress scroll-area sidebar --yes
```

---

### 7. Configuración de Variables de Entorno
Copiamos y completamos las variables de entorno en el archivo `.env`:

```bash
# Copiar plantilla
cp .env.example .env
```

Contenido de `.env`:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

---

### 8. Correr el Proyecto localmente
Para iniciar el servidor de desarrollo local y verificar que no hay errores de compilación ni de TypeScript:

```bash
npm run dev
```

La aplicación compilará de forma ultra-rápida con Vite y estará disponible en `http://localhost:5173`.
