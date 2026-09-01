# PrepRunape 2026 - Defensoría de los Niños de Córdoba

Plataforma de evaluación de desarrollo infantil utilizando el protocolo PRUNAPE, destinada a municipios e instituciones del ámbito de la salud y desarrollo social que trabajan con niños en la Provincia de Córdoba.

## Identidad
- **Cliente:** Defensoría de los Derechos de Niñas, Niños y Adolescentes de Córdoba (CBA).
- **Tipo de Proyecto:** Municipal / Institucional / Salud / Social.
- **Supabase Project Reference:** `wbhshrxibzleubcsistn`
- **URL de la API:** `https://wbhshrxibzleubcsistn.supabase.co`

## Stack Técnico (Vite + React)
- **Framework:** React 18.3.1 (Vite 8.0.12, TypeScript 6.0.2)
- **Base de Datos y Auth:** Supabase (`@supabase/supabase-js` v2.106.2)
- **Estilos:** TailwindCSS v3.4.19 (con postCSS) y Shadcn UI / Radix UI
- **Routing:** React Router DOM v7.15.1
- **Manejo de Estado:** Zustand v5.0.13 (Auth) y TanStack Query v5.100.14 (Server State)
- **Formularios:** React Hook Form v7.76.1 + Zod v4.4.3
- **Mapas:** Leaflet v1.9.4 & React Leaflet v4.2.1
- **Gráficos:** Recharts v3.8.1

## Estructura del Proyecto
```
src/
├── assets/         # Recursos estáticos (imágenes, logos)
├── components/     # Componentes compartidos y layouts (Shadcn/UI)
├── features/       # Módulos de negocio principales
│   ├── adultos/    # Registro de adultos responsables
│   ├── auth/       # Formularios de Login, Register y control de acceso
│   ├── evaluaciones/# Protocolo PRUNAPE y lógica del test
│   ├── hogar/      # Formulario social y condiciones del hogar
│   ├── instituciones/# Red de instituciones PI y datos de las sedes
│   ├── mapa/       # Visualización georreferenciada en el mapa
│   └── ninos/      # Gestión y perfil de niños (NNyA)
├── hooks/          # Custom hooks (e.g. useUserRole)
├── lib/            # Clientes externos (Supabase, utils)
├── pages/          # Pantallas de la aplicación (Dashboard, Registro, etc.)
├── routes/         # Configuración de rutas y redirecciones
├── store/          # Zustand store (authStore, etc.)
├── types/          # Definiciones de TypeScript (database.ts)
└── index.css       # Estilos globales y tokens
```

## Roles de Usuario
- **`admin`:** Acceso total a la administración de usuarios, configuraciones y datos generales.
- **`coordinador`:** Permiso para gestionar instituciones, registrar niños, ver evaluaciones y reportes.
- **`agente_municipio`:** Registro y evaluación en territorio, limitado a su respectiva localidad o institución.
- **Estado de Aprobación:** Los usuarios nuevos quedan en estado `'pendiente'` hasta que un administrador aprueba su cuenta.

## Base de Datos (Tablas principales)
- **`users`:** Extensión del perfil de Auth (`iduser`, `display_name`, `DNI`, `rol`, `Localidad`, `estado`).
- **`niños`:** Registro de NNyA (`idninos`, `nombre`, `fecha_nacimiento`, `pesoNac`, `prematuro`, `idAdulto`, `adultoresponsable`, `origen_familia`, `otro_idioma`, etc.). Columnas `origen_familia` y `otro_idioma` agregadas en 2026-08.
- **`adultos`:** Padres/Tutores (`id`, `DNI`, `NombreyApellido`, `Parentezco`, `NivelEducativo`, `idNNyA`).
- **`adultoyNNyA`:** Tabla de relación muchos a muchos entre adultos y niños.
- **`hogar`:** Datos del hogar (`id`, `localidad`, `barrio`, `tipo_barrio`, `tipo_hogar`, `jefatura`, `cant_personas`).
- **`hogar_snapshot`:** Snapshot periódico de condiciones del hogar (`cant_ambientes`, `hacinamiento`, `nivel_educativo_jefe`, `situacion_ocupacional`, `cobertura_salud`, `escala_ingresos`, etc.).
- **`hogar_ninos`:** Relación niños-hogar (`id_hogar`, `id_nino`).
- **`encuesta_tokens`:** Tokens UUID para encuesta pública del hogar sin login (`token`, `id_nino`, `expires_at`, `usado`).
- **`Prueba_pre_prunape`:** Evaluaciones de desarrollo (`id_prueba`, `idniño`, `Fecha`, `Aprobado`, `formulario`, `fechanacimiento`, `espCuidado`).
- **`seguimiento_prunape`:** Seguimiento del protocolo PRUNAPE (`id`, `id_nino`, `resultado`, `fecha`, `observacion`).
- **`pregunta_list`:** Respuestas individuales de cada evaluación (`id_ingresoform`, `id_pregunta`, `respuesta`).
- **`config_formularios`:** Configuración de umbrales por formulario (`formulario`, `max_no_pasa`). Formularios: `Form 1` a `Form 5`.
- **`institucionesredPI`:** Información y logos de la red de instituciones adheridas.
- **`preguntas`, `preguntas2`, `intervalosevaluacion`:** Configuración de cuestionarios dinámicos de evaluación según edad.
- **`mapa_servicios`:** Georreferenciación de servicios sociales y comunitarios.
- **`Localidad`:** Tabla de localidades disponibles para selección en formularios.

## Páginas principales
- **`Dashboard.tsx`:** Resumen general con 5 cards (total, aprobados, no aprobados, sin evaluar, requieren PRUNAPE). Usa RPCs: `get_dashboard_resumen`, `get_dashboard_localidades`, `get_ninos_requieren_prunape`, `get_rangos_etarios`. Pasa `p_espacio_cuidado: null` en todos excepto `get_dashboard_localidades` (que no tiene ese parámetro).
- **`DashboardIndicadores.tsx`:** Tablero avanzado con gráficos, filtros por localidad/género/institución. Incluye tabla "Hitos Críticos No Pasa" via `get_preguntas_no_pasa`. Visible para todos los roles (agente_municipio ve solo su localidad). Tiene botón de impresión PDF con estilos `@media print`.
- **`Ninos.tsx`:** Listado de NNyA con cards, columnas Fecha de Nacimiento / Última Evaluación / Formulario, filtro de alerta PRUNAPE (2 pruebas no aprobadas consecutivas), búsqueda y paginación. Query usa `(supabase as any)` por incompatibilidad de parser TypeScript con `ñ` en nombre de columna.
- **`NinoDetail.tsx`:** Perfil completo: datos del niño (incluye `origen_familia` e `otro_idioma`), adulto responsable, historial de evaluaciones con modal de detalle, datos del hogar, seguimiento PRUNAPE. El modal de detalle usa `ejecutar_consulta_prueba` RPC y maneja pruebas antiguas sin `formulario` infiriendo el form por edad. Tiene botón "Exportar PDF" que abre una nueva ventana con el historial completo de evaluaciones + hitos No Pasa por categoría (A4 portrait, `window.open()` para no conflictuar con el CSS de impresión de Indicadores).
- **`NuevoNino.tsx`:** Registro de NNyA con campos `origen_familia` (provincias AR + países LATAM, `<optgroup>`) e `otro_idioma` (checkboxes multi-selección, guardado como string separado por `, `). Modal de éxito post-registro con opciones "Ir al perfil" o "Volver al listado".
- **`NuevaPrueba.tsx`:** Registro de evaluación con selección automática de formulario por edad, preguntas filtradas por intervalo. Opciones en Espacio de Cuidado: Jardín de Infantes, Centro de Desarrollo Infantil, Escuela Primaria, Hogar, Comedor Comunitario, Centro de Salud, Jardín Provincial, Jardines de Infantes Públicos, Municipal (gestión con ONG).
- **`ConfigPage.tsx`:** Gestión de usuarios con email, estado (pendiente/Activo), rol. Usa RPC `get_users_with_email`.
- **`EncuestaPublica.tsx`:** Formulario público de hogar en `/encuesta/:token`, sin login. Valida token via Edge Function `encuesta-hogar`.
- **`PendienteAprobacion.tsx`:** Pantalla para usuarios con `estado='pendiente'` o `rol=null`.

## Funciones RPC relevantes
- `get_dashboard_resumen(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — estadísticas generales. Tiene dos versiones sobrecargadas (4 y 5 params); siempre pasar los 5 para evitar PGRST203.
- `get_dashboard_localidades(p_localidad, p_institucion, p_genero, p_fecha_desde)` — métricas por localidad. **Solo 4 parámetros**, NO tiene `p_espacio_cuidado`.
- `get_ninos_requieren_prunape(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — niños con 2 pruebas no aprobadas consecutivas.
- `get_rangos_etarios(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — distribución por rango etario para el Dashboard.
- `get_preguntas_no_pasa(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — tabla "Hitos Críticos No Pasa" en Indicadores. SECURITY DEFINER para evitar timeout con agente_municipio. Usa `preguntas2.id_pregunta` y `idrespuestacom = 2` (No Pasa).
- `ejecutar_consulta_prueba(p_id_prueba, form, p_umbral)` — devuelve respuestas con resultado pasa/no pasa.
- `get_users_with_email()` — lista usuarios con email de auth.users (SECURITY DEFINER).
- `get_user_rol()` — devuelve el rol del usuario actual (SECURITY DEFINER, SET row_security=off para evitar recursión RLS).

**IMPORTANTE:** Siempre pasar todos los parámetros explícitamente en RPCs sobrecargadas para evitar PGRST203 (ambigüedad). La excepción es `get_dashboard_localidades` que solo acepta 4 parámetros — pasarle `p_espacio_cuidado` causa PGRST202.

**Valores en `pregunta_list.idrespuestacom`:** 1 = Pasa, 2 = No Pasa, 3 = No Evaluable.

## Edge Functions (Supabase)
- **`encuesta-hogar`:** Maneja GET (validar token) y POST (guardar datos de hogar). `verify_jwt: false` para acceso público. Token se pasa como query param `?token=...`.
- **`datos-externos`:** API de consumo externo para organizaciones (municipios, ONGs, etc.). `verify_jwt: false`. Requiere token UUID por organización (`?token=...`). Devuelve datos anonimizados desde `vista_datos_externos` (sin nombre, DNI, teléfono ni dirección). Soporta paginación (`page`, `page_size` máx 5000) y filtro por localidad. Gestión de acceso via tabla `organizaciones`.

## API de Datos Externos
- **Endpoint:** `https://wbhshrxibzleubcsistn.supabase.co/functions/v1/datos-externos?token=<uuid>`
- **Vista:** `vista_datos_externos` — una fila por pregunta respondida, joinea niños + adultos + hogar + hogar_snapshot + pruebas + preguntas + respuestas. Excluye datos identificatorios (nombre, DNI, teléfono, dirección, **localidad**). Excluye la localidad "prueba". Cubre todos los municipios reales.
- **Columnas excluidas intencionalmente:** `nino_localidad`, `hogar_localidad` — la localidad no se expone a organizaciones externas.
- **Modificar la vista:** Requiere `DROP VIEW` + `CREATE VIEW` (PostgreSQL no permite quitar columnas con `CREATE OR REPLACE`).
- **Tabla `organizaciones`:** `id`, `nombre`, `token` (UUID auto), `localidad_permitida` (NULL = todas), `activo`. Gestionar desde Supabase SQL Editor.
- **Crear organización:** `INSERT INTO organizaciones (nombre, localidad_permitida) VALUES ('Nombre', 'Localidad') RETURNING nombre, token;`
- **Revocar acceso:** `UPDATE organizaciones SET activo = false WHERE id = X;`
- **Ver organizaciones existentes:** `SELECT nombre, token, localidad_permitida, activo FROM organizaciones;`
- **Estructura respuesta:** `{ organizacion, pagina, page_size, total_registros, datos[] }`. Agrupar por `nino_id + prueba_id` para reconstruir la jerarquía niño → prueba → preguntas.
- **Parámetros opcionales:** `page`, `page_size` (máx 5000), `localidad` (filtro adicional por localidad aunque no se devuelva en los datos).

## Patrones técnicos importantes
- **RLS recursivo:** La función `get_user_rol()` usa `SET row_security = off` en plpgsql para evitar recursión al consultar `public.users`.
- **Inferencia de formulario:** Las pruebas antiguas tienen `formulario=null`. Se infiere por edad con `getNormalizedFormName()`. Siempre usar `.maybeSingle()` (no `.single()`) al buscar en `config_formularios` para evitar error 406.
- **SPA routing en Vercel:** `vercel.json` con rewrite `/(.*) → /index.html`.
- **Agente municipio:** Su localidad es fija (no editable), se sincroniza desde `users.Localidad` via `useUserRole`.
- **Columna `ñ` en Supabase:** El parser TypeScript de PostgREST falla con `ñ` en strings de `.select('idniño, ...')`. Solución: usar `(supabase as any).from(...)` y castear el resultado con `as Array<{...}>`.
- **Timeout en agente_municipio:** RPCs con JOINs masivos sin `SECURITY DEFINER` ejecutan con permisos del usuario → RLS en cada JOIN → timeout. Toda RPC de Indicadores/Dashboard debe llevar `SECURITY DEFINER SET search_path = public`.
- **Multi-select con React Hook Form:** Usar `watch()` + `setValue()`. Los valores seleccionados se almacenan como string separado por `, ` en columna `text`. Al leer, usar `.split(', ').filter(Boolean)`.
- **Fechas timezone-safe:** Usar `formatDate()` de `src/lib/utils.ts` para evitar que las fechas aparezcan un día antes por el offset UTC-3 (`new Date(fecha + 'T12:00:00')`).
- **Impresión PDF de Indicadores:** `@media print` en `index.css` con clases semánticas (`kpi-grid`, `charts-grid-3`, `charts-grid-2`), página A4 horizontal, sin scroll. No usar `window.print()` sin antes ocultar sidebar y header.
- **Impresión PDF de NinoDetail:** Usar `window.open()` + `win.document.write()` para abrir el reporte en ventana nueva con su propio `@page { size: A4 portrait }`. Evita conflictos con los estilos `@media print` globales de Indicadores.
- **Modificar vistas PostgreSQL:** `CREATE OR REPLACE VIEW` no permite quitar columnas — usar `DROP VIEW IF EXISTS` + `CREATE VIEW` en la misma migración.

## Convenciones de Código
- **Servicios:** Todo acceso directo a Supabase debe estructurarse en la carpeta `src/features/` o hooks específicos, evitando queries crudas en componentes de UI.
- **Estilos:** Utilizar los tokens de diseño y variables CSS de Tailwind disponibles. No añadir clases inline ad-hoc complejas.
- **Manejo de Formularios:** Usar React Hook Form controlado por esquemas Zod para validaciones y formateos dinámicos (DNI, CUIT, fechas).
- **Convención Terminológica:** No utilizar terminología médica o de salud clínica como "paciente", "pacientes", "formularios clínicos" o "clínico/s" en la interfaz (UI), notificaciones, mensajes de carga o textos descriptivos. Usar siempre "niño/a", "niños/as" o "NNyA", y referirse a las evaluaciones simplemente como "formularios" o "hitos de desarrollo" para reflejar adecuadamente el carácter institucional y social de la Defensoría de los NNyA.

## Variables de Entorno (Requeridas)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Reglas Críticas de Seguridad
1. **Nunca** guardar API keys, contraseñas o tokens en los archivos de código.
2. **Nunca** deshabilitar RLS (Row Level Security) en producción.
3. **No usar** la clave `service_role` en el cliente web frontend.
4. Las variables con prefijo `VITE_` se exponen públicamente en el frontend compilado; no incluir credenciales privadas.
5. **Pre-commit hook** instalado en `.git/hooks/pre-commit`: bloquea commits con JWTs reales (detecta el prefijo estándar de tokens Base64). No eliminar.
6. **`.gitignore`** cubre `.env`, `.env.local`, `.env.*.local`, `.env.development`, `.env.production`, `.env.staging`.
