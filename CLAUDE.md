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
- **PWA:** vite-plugin-pwa 2.0 (manifest + service worker generado por Workbox, `registerType: 'autoUpdate'`)

## Estructura del Proyecto
```
src/
├── assets/         # Recursos estáticos (imágenes, logos)
├── components/     # Componentes compartidos y layouts (Shadcn/UI)
│   └── shared/     # InstallAppButton (instalación PWA)
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
public/
├── icons/          # Íconos PWA (192, 512, maskable, apple-touch, favicon) generados desde la huella del logo
└── logo-primeros-pasos.png  # Logo del menú lateral (versión con óvalo durazno, 640px)
logo/               # Logos originales de Primeros Pasos (fuente, no se sirven)
```

## Rutas públicas (sin login)
- `/org` → `DashboardExternoPage` — muestra `TokenModal` si no hay token en la URL
- `/org/:token` → `DashboardExternoPage` — dashboard de datos anonimizados para organizaciones externas
- `/consulta` → `ConsultaFamiliar` — consulta pública para adultos responsables (lookup por DNI + IA)
- `/encuesta/:token` → `EncuestaPublica` — formulario de hogar sin login

## Roles de Usuario
- **`admin`:** Acceso total a la administración de usuarios, configuraciones y datos generales.
- **`coordinador`:** Permiso para gestionar instituciones, registrar niños, ver evaluaciones y reportes.
- **`agente_municipio`:** Registro y evaluación en territorio, limitado a su respectiva localidad o institución.
- **Estado de Aprobación:** Los usuarios nuevos quedan en estado `'pendiente'` hasta que un administrador aprueba su cuenta.

## Base de Datos (Tablas principales)
- **`users`:** Extensión del perfil de Auth (`iduser`, `display_name`, `DNI`, `rol`, `Localidad`, `estado`).
- **`niños`:** Registro de NNyA (`idninos`, `nombre`, `fecha_nacimiento`, `pesoNac`, `prematuro`, `idAdulto`, `adultoresponsable`, `origen_familia`, `otro_idioma`, etc.). Columnas `origen_familia` y `otro_idioma` agregadas en 2026-08. **Anulación suave (2026-10):** `anulado boolean NOT NULL DEFAULT false`, `anulado_at`, `anulado_por uuid`, `anulado_motivo` (ver sección "Anulación suave").
- **`adultos`:** Padres/Tutores (`id`, `DNI`, `NombreyApellido`, `Parentezco`, `NivelEducativo`, `idNNyA`).
- **`adultoyNNyA`:** Tabla de relación muchos a muchos entre adultos y niños.
- **`hogar`:** Datos del hogar (`id`, `localidad`, `barrio`, `tipo_barrio`, `tipo_hogar`, `jefatura`, `cant_personas`).
- **`hogar_snapshot`:** Snapshot periódico de condiciones del hogar (`cant_ambientes`, `hacinamiento`, `nivel_educativo_jefe`, `situacion_ocupacional`, `cobertura_salud`, `escala_ingresos`, etc.).
- **`hogar_ninos`:** Relación niños-hogar (`id_hogar`, `id_nino`).
- **`encuesta_tokens`:** Tokens UUID para encuesta pública del hogar sin login (`token`, `id_nino`, `expires_at`, `usado`).
- **`Prueba_pre_prunape`:** Evaluaciones de desarrollo (`id_prueba`, `idniño`, `Fecha`, `Aprobado`, `formulario`, `fechanacimiento`, `espCuidado`). **Anulación suave (2026-10):** `anulada boolean NOT NULL DEFAULT false`, `anulada_at`, `anulada_por uuid`, `anulada_motivo`.
- **`seguimiento_prunape`:** Seguimiento del protocolo PRUNAPE (`id`, `id_nino`, `resultado`, `fecha`, `observacion`).
- **`pregunta_list`:** Respuestas individuales de cada evaluación (`id_ingresoform`, `id_pregunta`, `respuesta`).
- **`config_formularios`:** Configuración de umbrales por formulario (`formulario`, `max_no_pasa`). Formularios: `Form 1` a `Form 5`.
- **`institucionesredPI`:** Información y logos de la red de instituciones adheridas.
- **`preguntas`, `preguntas2`, `intervalosevaluacion`:** Configuración de cuestionarios dinámicos de evaluación según edad.
- **`mapa_servicios`:** Georreferenciación de servicios sociales y comunitarios.
- **`Localidad`:** Tabla de localidades disponibles para selección en formularios.
- **`organizaciones`:** Acceso externo de instituciones/municipios (`id`, `nombre`, `token` UUID auto-generado, `localidad_permitida` NULL=todas, `activo` boolean). Se gestiona desde la tab "Organizaciones" en ConfigPage (solo admin).
- **`ninos_anulaciones_log`** / **`pruebas_anulaciones_log`:** historial de anulaciones y restauraciones (`id`, `id_nino` / `id_prueba`, `accion` 'anular'|'restaurar', `motivo`, `usuario uuid`, `created_at`). RLS: solo lectura para admin y coordinador; solo las funciones SECURITY DEFINER escriben.
- **`consulta_respuestas`:** Guarda las consultas de adultos responsables y las sugerencias de IA (`id bigserial PK`, `id_nino integer`, `adulto_id bigint`, `q1 text`, `q2 text`, `q3 text`, `ia_sugerencias text`, `created_at timestamptz`). RLS habilitado, sin políticas públicas — solo accesible via service_role desde Edge Functions.

## Páginas principales
- **`Dashboard.tsx`:** Resumen general con 5 cards (total, aprobados, no aprobados, sin evaluar, requieren PRUNAPE). Aprobados / no aprobados / sin evaluar cuentan **niños según su última evaluación** (`ninos_*`), y suman `total_registrados`; la card de evaluaciones usa `total_pruebas`. Usa RPCs: `get_dashboard_resumen`, `get_dashboard_localidades`, `get_ninos_requieren_prunape`, `get_rangos_etarios`. Pasa `p_espacio_cuidado: null` en todos excepto `get_dashboard_localidades` (que no tiene ese parámetro).
- **`DashboardIndicadores.tsx`:** Tablero avanzado con gráficos, filtros por localidad/género/institución. Incluye tabla "Hitos Críticos No Pasa" via `get_preguntas_no_pasa`. Visible para todos los roles (agente_municipio ve solo su localidad). Tiene botón de impresión PDF con estilos `@media print`. Las cards Aprobados / No Aprobados y el gráfico "Dictamen Final" cuentan niños por última evaluación (mismos números que Dashboard y Niños). La card No Aprobados muestra además "N sin reevaluar (X%)": niños cuya única evaluación fue No Aprobado (`get_ninos_no_aprobados_sin_reevaluar`). Los filtros son sticky solo desde `md`.
- **`DashboardExterno.tsx`:** Dashboard público para organizaciones externas en `/org` y `/org/:token`. Muestra un `TokenModal` inline cuando no hay token en la URL (pide el token, lo valida contra la Edge Function antes de navegar). Con token válido muestra gráficos de datos anonimizados con filtro por municipio. Implementa `fetchAllPages` para traer todos los datos paginados.
- **`ConsultaFamiliar.tsx`:** Página pública en `/consulta`. Flujo en 3 pasos: (1) ingreso de DNI del adulto responsable → busca sus niños vinculados; (2) selección del niño + resumen de evaluaciones + hitos No Pasa + formulario de 3 preguntas al adulto; (3) muestra sugerencias de IA generadas por OpenAI gpt-4o-mini vía Edge Function. Las preguntas reales las define el equipo de la Defensoría (pendiente reemplazo).
- **`Ninos.tsx`:** Listado de NNyA (tabla en `md+`, una card por niño en celular), columnas Fecha de Nacimiento / Última Evaluación / Formulario, filtro de alerta PRUNAPE (2 pruebas no aprobadas consecutivas), búsqueda y paginación. Query usa `(supabase as any)` por incompatibilidad de parser TypeScript con `ñ` en nombre de columna. Pestañas **Activos / Anulados** (los anulados muestran etiqueta roja y motivo; "Últ. evaluación" ignora evaluaciones anuladas con `.eq('anulada', false)`). Las tarjetas de totales usan `get_dashboard_resumen` y `get_ninos_requieren_prunape` con los 5 parámetros (incluido `p_espacio_cuidado: null`); sin él, PostgREST resuelve mal la sobrecarga y las tarjetas quedan en 0.
- **`NinoDetail.tsx`:** Perfil completo: datos del niño (incluye `origen_familia` e `otro_idioma`), adulto responsable, historial de evaluaciones con modal de detalle, datos del hogar, seguimiento PRUNAPE. El modal de detalle usa `ejecutar_consulta_prueba` RPC y maneja pruebas antiguas sin `formulario` infiriendo el form por edad. Tiene botón "Exportar PDF" que abre una nueva ventana con el historial completo de evaluaciones + hitos No Pasa por categoría (A4 portrait, `window.open()` para no conflictuar con el CSS de impresión de Indicadores).
- **Anulación en `NinoDetail.tsx` / `NuevaPrueba.tsx`:** en el perfil, botón "Anular" (solo admin/coordinador, cuadro con motivo obligatorio) y aviso rojo con "Restaurar" si el niño está anulado; a un niño anulado se le ocultan "Editar" y "Agregar Prueba". En el historial, cada evaluación tiene "Anular" / "Restaurar"; las anuladas se ven con etiqueta y motivo y **no** cuentan en totales, observaciones ni PDF. No hay botón de eliminar. `NuevaPrueba` bloquea a un niño anulado. Se usa `(supabase as any)` porque las columnas nuevas no están en los tipos.
- **`NuevoNino.tsx`:** Registro de NNyA con campos `origen_familia` (provincias AR + países LATAM, `<optgroup>`) e `otro_idioma` (checkboxes multi-selección, guardado como string separado por `, `). Modal de éxito post-registro con opciones "Ir al perfil" o "Volver al listado".
- **`NuevaPrueba.tsx`:** Registro de evaluación con selección automática de formulario por edad, preguntas filtradas por intervalo. Opciones en Espacio de Cuidado: Jardín de Infantes, Centro de Desarrollo Infantil, Escuela Primaria, Hogar, Comedor Comunitario, Centro de Salud, Jardín Provincial, Jardines de Infantes Públicos, Municipal (gestión con ONG).
- **`ConfigPage.tsx`:** 5 tabs: `usuarios` (gestión con RPC `get_users_with_email`), `localidades`, `formularios`, `organizaciones` (tabla con token copiable, municipio, toggle activo/inactivo), `links` (cards con URL + botón copiar + QR descargable para Portal Org y Consulta Familias). Solo visible para admin.
- **`EncuestaPublica.tsx`:** Formulario público de hogar en `/encuesta/:token`, sin login. Valida token via Edge Function `encuesta-hogar`.
- **`PendienteAprobacion.tsx`:** Pantalla para usuarios con `estado='pendiente'` o `rol=null`.

## Funciones RPC relevantes
- `get_dashboard_resumen(fecha_desde, fecha_hasta, p_localidad, p_genero, p_espacio_cuidado)` — estadísticas generales. Tiene dos versiones sobrecargadas (4 y 5 params); siempre pasar los 5 para evitar PGRST203. Devuelve conteos de **pruebas** (`total_pruebas`, `total_aprobados`, `total_no_aprobados`, `total_no_evaluados`) y de **niños** (`total_registrados`, `total_ninos` = con al menos una prueba, `ninos_aprobados`, `ninos_no_aprobados`, `ninos_sin_evaluar`). Los `ninos_aprobados` / `ninos_no_aprobados` se clasifican por la **última prueba** del niño (dentro de los filtros), por lo que no se solapan y `aprobados + no_aprobados + sin_evaluar = total_registrados`.
- `get_dashboard_localidades(p_localidad, p_institucion, p_genero, p_fecha_desde)` — métricas por localidad. **Solo 4 parámetros**, NO tiene `p_espacio_cuidado`.
- `get_ninos_requieren_prunape(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — niños con 2 pruebas no aprobadas consecutivas.
- `get_ninos_no_aprobados_sin_reevaluar(p_localidad, p_genero, fecha_desde, fecha_hasta, p_espacio_cuidado)` — devuelve `integer`: niños cuya última prueba es No Aprobado y que tienen una sola prueba dentro de los filtros. SECURITY DEFINER. Se usa en la card No Aprobados de Indicadores.
- `get_rangos_etarios(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — distribución por rango etario para el Dashboard.
- `get_preguntas_no_pasa(p_localidad, p_institucion, p_genero, p_fecha_desde, p_espacio_cuidado)` — tabla "Hitos Críticos No Pasa" en Indicadores. SECURITY DEFINER para evitar timeout con agente_municipio. Usa `preguntas2.id_pregunta` y `idrespuestacom = 2` (No Pasa).
- `ejecutar_consulta_prueba(p_id_prueba, form, p_umbral)` — devuelve respuestas con resultado pasa/no pasa.
- `anular_nino(p_id integer, p_motivo text)` / `restaurar_nino(p_id integer)` — SECURITY DEFINER; solo admin y coordinador; motivo obligatorio; escriben en `ninos_anulaciones_log`.
- `anular_prueba(p_id bigint, p_motivo text)` / `restaurar_prueba(p_id bigint)` — ídem para evaluaciones, escriben en `pruebas_anulaciones_log`.
- `get_users_with_email()` — lista usuarios con email de auth.users (SECURITY DEFINER).
- `get_user_rol()` — devuelve el rol del usuario actual (SECURITY DEFINER, SET row_security=off para evitar recursión RLS).

**IMPORTANTE:** Siempre pasar todos los parámetros explícitamente en RPCs sobrecargadas para evitar PGRST203 (ambigüedad). La excepción es `get_dashboard_localidades` que solo acepta 4 parámetros — pasarle `p_espacio_cuidado` causa PGRST202.

**Valores en `pregunta_list.idrespuestacom`:** 1 = Pasa, 2 = No Pasa, 3 = No Evaluable.

## Edge Functions (Supabase)
- **`encuesta-hogar`:** Maneja GET (validar token) y POST (guardar datos de hogar). `verify_jwt: false` para acceso público. Token se pasa como query param `?token=...`.
- **`datos-externos`:** API de consumo externo para organizaciones. `verify_jwt: false`. Requiere token UUID por organización (`?token=...`). Devuelve datos anonimizados desde `vista_datos_externos`. Soporta paginación (`page`, `page_size` máx 10000, default 5000) y filtro por municipio (`?localidad=...`). `total_registros` usa `count: 'exact'` de PostgREST (no `data.length`). Gestión de acceso via tabla `organizaciones`.
- **`consulta-familiar`:** `verify_jwt: false`. Dos métodos:
  - **GET** `?dni=XXX`: busca adulto por DNI → encuentra sus niños via `adultoyNNyA` → para cada niño devuelve pruebas + hitos No Pasa agrupados por categoría. Respuesta: `{ adulto_id, adulto_nombre, ninos: [{ id, nombre, fecha_nacimiento, genero, edad_meses, total_pruebas, ultimo_resultado, ultima_fecha, hitos_no_pasa }] }`.
  - **POST** `{ id_nino, adulto_id, q1, q2, q3 }`: valida relación adulto-niño → obtiene datos del niño + hitos → construye prompt → llama OpenAI gpt-4o-mini → guarda en `consulta_respuestas` → retorna `{ nino_nombre, edad_anios, edad_meses_resto, total_pruebas, ultimo_resultado, hitos_no_pasa, sugerencias }`.
  - Requiere secret `OPENAI_API_KEY` en Supabase Dashboard → Edge Functions → Manage secrets.

## API de Datos Externos
- **Endpoint:** `https://wbhshrxibzleubcsistn.supabase.co/functions/v1/datos-externos?token=<uuid>`
- **Vista:** `vista_datos_externos` — una fila por pregunta respondida, joinea niños + adultos + hogar + hogar_snapshot + pruebas + preguntas + respuestas. Excluye datos identificatorios (nombre, DNI, teléfono, dirección). Excluye la localidad "prueba". Incluye columna `municipio` (= `n."Localidad"`) para filtros internos pero no identifica directamente al niño.
- **Modificar la vista:** Requiere `DROP VIEW` + `CREATE VIEW` (PostgreSQL no permite quitar columnas con `CREATE OR REPLACE`).
- **Tabla `organizaciones`:** Se gestiona desde la tab "Organizaciones" en ConfigPage (toggle activo/inactivo, ver token). Para crear: `INSERT INTO organizaciones (nombre, localidad_permitida) VALUES ('Nombre', 'Localidad') RETURNING nombre, token;`
- **Estructura respuesta:** `{ organizacion, pagina, page_size, total_registros, datos[] }`. Agrupar por `nino_id + prueba_id` para reconstruir la jerarquía niño → prueba → preguntas.
- **Parámetros opcionales:** `page`, `page_size` (máx 10000), `localidad` (filtro adicional).
- **PostgREST row limit:** Configurado en 50000 con `ALTER ROLE authenticator SET pgrst.db_max_rows = '50000'; NOTIFY pgrst, 'reload config';`. El default de PostgREST es 1000 — si se ve un número fijo de registros en el frontend, verificar primero este límite.

## Patrones técnicos importantes
- **RLS recursivo:** La función `get_user_rol()` usa `SET row_security = off` en plpgsql para evitar recursión al consultar `public.users`.
- **Inferencia de formulario:** Las pruebas antiguas tienen `formulario=null`. Se infiere por edad con `getNormalizedFormName()`. Siempre usar `.maybeSingle()` (no `.single()`) al buscar en `config_formularios` para evitar error 406.
- **SPA routing en Vercel:** `vercel.json` con rewrite `/(.*) → /index.html`.
- **Agente municipio:** Su localidad es fija (no editable), se sincroniza desde `users.Localidad` via `useUserRole`.
- **Columna `ñ` en Supabase:** El parser TypeScript de PostgREST falla con `ñ` en strings de `.select('idniño, ...')`. Solución: usar `(supabase as any).from(...)` y castear el resultado con `as Array<{...}>`. También aplica para tablas no tipadas como `organizaciones`.
- **Timeout en agente_municipio:** RPCs con JOINs masivos sin `SECURITY DEFINER` ejecutan con permisos del usuario → RLS en cada JOIN → timeout. Toda RPC de Indicadores/Dashboard debe llevar `SECURITY DEFINER SET search_path = public`.
- **Multi-select con React Hook Form:** Usar `watch()` + `setValue()`. Los valores seleccionados se almacenan como string separado por `, ` en columna `text`. Al leer, usar `.split(', ').filter(Boolean)`.
- **Fechas timezone-safe:** Usar `formatDate()` de `src/lib/utils.ts` para evitar que las fechas aparezcan un día antes por el offset UTC-3 (`new Date(fecha + 'T12:00:00')`).
- **Impresión PDF de Indicadores:** `@media print` en `index.css` con clases semánticas (`kpi-grid`, `charts-grid-3`, `charts-grid-2`), página A4 horizontal, sin scroll. No usar `window.print()` sin antes ocultar sidebar y header. Las cards, filas de gráficos y filas de tabla llevan `break-inside: avoid` para que no se partan entre páginas, y `print-color-adjust: exact` conserva los colores de fondo.
- **Impresión PDF de NinoDetail:** Usar `window.open()` + `win.document.write()` para abrir el reporte en ventana nueva con su propio `@page { size: A4 portrait }`. Evita conflictos con los estilos `@media print` globales de Indicadores.
- **Modificar vistas PostgreSQL:** `CREATE OR REPLACE VIEW` no permite quitar columnas — usar `DROP VIEW IF EXISTS` + `CREATE VIEW` en la misma migración.
- **TokenModal en rutas públicas:** Patrón para rutas que requieren token pero no login. El componente inline verifica `useParams()` — si no hay token, muestra modal con input. Valida contra Edge Function antes de navegar a la ruta con token. Ver `DashboardExterno.tsx`.
- **QR codes:** Generar con `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=<url-encoded>`. Para descargar usar fetch + blob + `<a download>`.
- **OpenAI desde Edge Functions:** La API key `OPENAI_API_KEY` se guarda como secret en Supabase (Dashboard → Edge Functions → Manage secrets). Nunca en el frontend ni en variables `VITE_*`. Modelo usado: `gpt-4o-mini`.
- **fetchAllPages en DashboardExterno:** Loop que llama a la Edge Function paginando hasta que `datos.length < page_size`. Depende de que `total_registros` use `count: 'exact'` (no `data.length`) y de que el PostgREST row limit sea suficientemente alto.

## Anulación suave (soft delete) de niños y evaluaciones

**Regla de negocio:** no se borra nada de la base. Un niño o una evaluación se **anula** (con motivo, usuario y fecha) y se puede **restaurar**. Lo anulado no cuenta en dashboards ni indicadores y aparece en la pestaña "Anulados" / marcado en el historial. **La "última evaluación" de un niño ignora las evaluaciones anuladas.**

**Decisiones tomadas (2026-10-14):**
- Anulan y restauran: **admin y coordinador**. El agente de municipio no puede.
- Motivo **obligatorio** al anular.
- El **DNI de un niño anulado sigue bloqueado** (`existe_dni` no se filtra); si fue un error se restaura el original.
- Sin borrado real: se quitaron las políticas `DELETE` de `niños`, `Prueba_pre_prunape` y `pregunta_list` (sin política, un DELETE por API afecta 0 filas y no da error). Para restaurar una: `CREATE POLICY ninos_delete ON public."niños" FOR DELETE TO authenticated USING (get_user_rol() = 'admin'::text);` (análogas `prueba_delete`, `pregunta_list_delete`).
- Triggers `ninos_proteger_anulacion_trg` y `pruebas_proteger_anulacion_trg`: un usuario de la API (rol `authenticated`/`anon`) **no puede** modificar columnas `anulado*`/`anulada*` ni crear filas ya anuladas, ni siquiera un admin; solo las funciones `anular_*`/`restaurar_*`. Detectan al llamador con `current_user`, por eso los triggers **no** son SECURITY DEFINER.

### Estado

| Parte | Niños | Evaluaciones |
|---|---|---|
| Columnas + historial | Hecho | Hecho |
| Funciones anular / restaurar | Hecho, probado | Hecho, probado |
| Trigger de protección | Hecho, probado | Hecho, probado |
| Sin borrado real (políticas DELETE) | Hecho | Hecho |
| Frontend (pestañas, botones, bloqueos) | Hecho, probado por el usuario | Hecho, probado por el usuario |
| **Excluir de funciones/vistas de dashboards e indicadores** | **PENDIENTE (Paso 3)** | **PENDIENTE (Paso 3)** |
| **Edge Functions y vistas externas** | **PENDIENTE (Paso 4)** | **PENDIENTE (Paso 4)** |

**Mientras el Paso 3 y 4 no estén hechos NO usar la anulación sobre datos reales**: los dashboards, la lista "Requieren PRUNAPE", "Hitos Críticos No Pasa", la Consulta Familiar (`/consulta`) y el portal de datos externos (`/org`) siguen incluyendo lo anulado. Para probar usar solo niños de la localidad "prueba".

### Paso 3 pendiente: funciones y vistas de dashboards
Agregar `anulado = false` (niño) y `anulada = false` (evaluación) en cada una, **una por vez**, con `CREATE OR REPLACE` conservando la firma, y comparar contra la línea base antes y después:
- **HECHAS (2026-10-19), probadas contra línea base y con anulación simulada que se revierte sola, y verificadas en pantalla como admin (Dashboard, Indicadores, Niños):** `get_dashboard_resumen` (5 parámetros), `get_dashboard_localidades` (4 parámetros), `get_ninos_requieren_prunape` (5 parámetros), `get_ninos_no_aprobados_sin_reevaluar`, `get_preguntas_no_pasa`, `get_rangos_etarios`. Migraciones: `*_excluir_anulados`. En `get_dashboard_localidades` la condición de evaluación va en el `ON` del `LEFT JOIN` (no en el `WHERE`) para que un niño sin evaluaciones vigentes siga contando como niño.
- **Sobrecargas que NO se pueden llamar** (ambiguas contra la de más parámetros, la app nunca las usa, no se pudo verificar y **siguen sin filtrar anulados**): `get_dashboard_resumen` (4 parámetros), `get_dashboard_localidades` (1 parámetro), `get_ninos_requieren_prunape` (4 parámetros). Decidir si se actualizan igual con el mismo cambio o se eliminan.
- **HECHA (2026-10-19):** `vista_datos_externos` (migración `vista_datos_externos_excluir_anulados`). `n.anulado = false` va en el `WHERE` y `p.anulada = false` en el `ON` del `LEFT JOIN` a `Prueba_pre_prunape`, para que un niño sin evaluaciones vigentes siga apareciendo como niño sin pruebas. La Edge Function `datos-externos` no necesitó cambios (lee la vista con `service_role`). Línea base tras el cambio: 25064 filas, 1151 niños, 1787 pruebas; Ushuaia 1477 filas / 113 niños / 126 pruebas (idéntica a antes); Despeñaderos 14511 filas / 523 niños / 1020 pruebas.
- **SIN FILTRAR A PROPÓSITO (decisión 2026-10-19):** `vista_prueba_edad` y `vista_preguntas_respuestas`. Las usa la función `ejecutar_consulta_prueba` (sin SECURITY DEFINER), que se llama desde el botón "Ver Detalle" del historial en `NinoDetail.tsx`, desde "Exportar PDF" y desde `NuevaPrueba.tsx`. Se consultan siempre por el id de una sola evaluación, así que no inflan conteos. **Se quiere poder ver el detalle de una evaluación anulada**: si estas vistas excluyeran anuladas, el modal de una evaluación anulada saldría vacío. No filtrarlas.
- **A REVISAR O RETIRAR (sin uso detectado, 2026-10-19):** `vista_ninos_adultos` (expone nombre, DNI, teléfono y dirección de niños y adultos), `vista_nnya_dos_no_aprobados` y `vista_prueba_edad2` (idéntica a `vista_prueba_edad`). No aparecen en el repositorio, en otras funciones/vistas/políticas de la base, ni en los registros de la API de las últimas 24 horas; no se puede descartar un uso externo ocasional (hoja conectada, reporte). Siguen incluyendo anulados. Antes de retirarlas o filtrarlas, confirmar con el equipo. Si se filtran, no cambian columnas: alcanza con `CREATE OR REPLACE VIEW` (`n.anulado = false` / `p.anulada = false`).
- `existe_dni`: **no** filtrar (el DNI queda bloqueado).
- **`buscar_niño4` y `buscar_niños4` (decisión 2026-10-19: se dejan como están, SIN filtrar anulados):** son dos funciones idénticas que buscan niños por nombre, DNI o dirección dentro de una localidad (usan el operador `&@~`, no son SECURITY DEFINER). No se usan en la app, ni en otras funciones, vistas o políticas de la base (verificado; falta confirmar que ninguna Edge Function las llame). **A revisar o borrar en el futuro, con más tiempo y cautela:** antes de tocarlas confirmar con el equipo que ninguna integración externa (hoja de cálculo, automatización) las llame. Si se conservan, agregar `AND anulado = false` en las dos ramas de cada una; si no, eliminarlas. Mientras tanto devolverían niños anulados a quien las llame.
- **Seguridad, vistas abiertas a `anon` — RESUELTO el 2026-10-19 (migración `vistas_cerrar_acceso_anon`):** las vistas `vista_*` pertenecen a `postgres`, no son `security_invoker` y tenían todos los permisos otorgados a `anon` y `authenticated`, por lo que se saltaban RLS y se podían leer con la clave pública (comprobado: `vista_ninos_adultos` devolvía sus 1161 filas con nombre, DNI, teléfono y dirección de niños y adultos; las tablas originales devolvían 0). Se aplicó `REVOKE`: `anon` sin acceso a ninguna (ahora responden 401); `authenticated` sin acceso a `vista_ninos_adultos`, `vista_nnya_dos_no_aprobados`, `vista_prueba_edad2` y `vista_datos_externos`; en `vista_prueba_edad` y `vista_preguntas_respuestas` (las usa `ejecutar_consulta_prueba`) `authenticated` conserva solo `SELECT`; `service_role` conserva todo (la Edge Function `datos-externos` sigue leyendo `vista_datos_externos`). Verificado: con la clave pública las 6 vistas dan 401, y "Ver Detalle" (incluso de una evaluación anulada) sigue funcionando como admin. **Para deshacer:** `GRANT ALL ON public.<vista> TO anon, authenticated;` (estado original: `anon`, `authenticated` y `service_role` con `arwdDxt`). **Pendiente / límites:** (1) `vista_prueba_edad` y `vista_preguntas_respuestas` siguen saltándose RLS para cualquier usuario logueado (p. ej. un agente de otra localidad podría leerlas por API); solución futura: `security_invoker = on` probando con cada rol y vigilando timeouts, o retirar las vistas. (2) Los permisos nuevos de vistas que se creen a futuro pueden volver a otorgarse a `anon` por los privilegios por defecto de Supabase: revisar `relacl` al crear una vista. (3) `mapa_servicios_con_coords` quedó con acceso `anon` a propósito (datos del mapa de servicios, no de niños); su `HEAD` con conteo da 500 pero la lectura normal anda.
- "Última evaluación / último resultado" debe calcularse **solo sobre evaluaciones no anuladas**.
- `total_registrados`, `total_ninos`, `ninos_*`, `total_*` y `ninos_sin_evaluar` deben excluir niños anulados; un niño sin evaluaciones vigentes cuenta como "sin evaluar".

**Decisión abierta:** hoy `ninos_aprobados + ninos_no_aprobados + ninos_sin_evaluar` NO suma `total_registrados` (687+354+20=1061 de 1123 globalmente): ~62 niños tienen la última prueba con `Aprobado` vacío/NULL (98 pruebas así en el sistema) y no entran en ninguna categoría. Pendiente decidir si se cuentan aparte (recomendado: no mezclarlo con el cambio de anulación).

### Línea base (medida con 0 anulados, antes del Paso 3)
- Global: `total_registrados` 1123, `total_ninos` 1103, `total_pruebas` 1707, `total_aprobados` 888, `total_no_aprobados` 716, `total_no_evaluados` 98, `ninos_aprobados` 687, `ninos_no_aprobados` 354, `ninos_sin_evaluar` 20.
- Ushuaia: `total_registrados` 113, `total_ninos` 112, `total_pruebas` 126, `total_aprobados` 81, `total_no_aprobados` 45, `ninos_aprobados` 80, `ninos_no_aprobados` 32, `ninos_sin_evaluar` 1; 5 niños requieren PRUNAPE; 26 no aprobados sin reevaluar.
- Totales de tablas: 1123 niños, 1707 evaluaciones, 25870 respuestas, 19 seguimientos, 6 vínculos de hogar.

### Paso 4: Edge Functions
- **HECHO (2026-10-19) `consulta-familiar` v4:** GET excluye niños anulados (`.eq('anulado', false)`) y evaluaciones anuladas (`.eq('anulada', false)`); si todos los niños vinculados al DNI están anulados responde el mismo 404 que "sin niños" (no revela que existió). POST rechaza niños anulados con 403 "No autorizado para consultar este niño/a" (mismo mensaje que sin vínculo) antes de llamar a OpenAI, y ignora evaluaciones anuladas. Probado con niños de la localidad "prueba": anulado → 404 / 403; no anulado y sin pruebas → igual que antes. No se probó el descuento de una evaluación anulada vía la función (se verificó en SQL), ni un POST válido (gasta IA y guarda en `consulta_respuestas`). Versión anterior (v3) respaldada en la memoria de Claude (`backup_edge_consulta_familiar_v3`) para revertir con `deploy_edge_function`.
- **HECHO** `datos-externos`: se resolvió en la vista `vista_datos_externos`, sin cambios en la función.
- **PENDIENTE** `encuesta-hogar`: rechazar tokens de niños anulados.

### Datos de prueba a restaurar antes de medir
Quedaron dos anulaciones hechas durante las pruebas (2026-10-14): niño **920** ("DARO PRUEBA 5", localidad "prueba") y evaluación **214** del niño **62** (Atilio Avila Pereyra, **Despeñaderos, dato real**, evaluación del 22/7/2024). Restaurar ambas desde la app (botón "Restaurar") antes de tomar la línea base del Paso 3.

### Cómo se trabajó (para retomar)
- **Una cosa por vez**: migración → verificación de solo lectura → siguiente. Cada paso con su "para deshacer".
- **Pruebas sin dejar rastro:** bloque `DO $$ ... RAISE EXCEPTION 'RESULTADOS: %', r; END $$;` que simula usuarios con `set_config('request.jwt.claims', json_build_object('sub','<uuid>','role','authenticated')::text, true); SET LOCAL ROLE authenticated;` y captura cada caso en un `BEGIN ... EXCEPTION WHEN OTHERS`. El `RAISE` final revierte todo. Después se verifica que los conteos no cambiaron. Los UUID de usuarios de prueba (admin, agente) salen de `select rol, iduser, "Localidad" from users`.
- **El entorno bloquea** algunas operaciones sobre producción desde `apply_migration` / `execute_sql` (triggers sobre tablas con datos, bloques con `DELETE`). Cuando pasa: pasarle el SQL al usuario para que lo pegue en el SQL Editor de Supabase y verificar después con consultas de solo lectura. No intentar rodear el bloqueo.
- Migraciones aplicadas: `ninos_anulacion_suave_columnas`, `ninos_anulaciones_log_tabla`, `ninos_anular_restaurar_funciones`, `pruebas_anulacion_suave_columnas`, `pruebas_anular_restaurar_funciones`. Aplicadas por el usuario en el SQL Editor: trigger de niños, `DROP POLICY ninos_delete`, trigger de evaluaciones, `DROP POLICY prueba_delete` y `pregunta_list_delete`.

## PWA y diseño responsivo
- **PWA:** configurada en `vite.config.ts` (`VitePWA`). El service worker solo se genera en `npm run build` (no en `npm run dev`); para probarla usar `npm run build` + `npx vite preview`. Solo se cachea la carcasa de la app (JS/CSS/íconos). **Nunca** agregar `runtimeCaching` para Supabase ni Edge Functions: hay datos de niños y no deben quedar en el dispositivo.
- **Instalación:** `components/shared/InstallAppButton.tsx` captura `beforeinstallprompt` a nivel de módulo (Android/Chrome: botón "Instalar app") y en iOS/Safari muestra un cuadro de 3 pasos (Compartir → Añadir a pantalla de inicio → Añadir). No aparece si la app ya está instalada. Se usa en el menú lateral y en el encabezado del login.
- **Layout:** en `routes/index.tsx` el menú lateral es fijo desde `lg` y un cajón deslizable (botón hamburguesa en el header) en pantallas menores; se cierra al cambiar de ruta. Páginas internas usan `p-4 sm:p-6 lg:p-8`. Las tablas anchas deben tener una versión en cards para `md:hidden` (ver `Ninos.tsx`).
- **Modales dentro del menú lateral:** el `<aside>` tiene `transform`, lo que vuelve `position: fixed` relativo al aside. Cualquier modal que se abra desde ahí debe renderizarse con `createPortal(..., document.body)`.
- **Íconos PWA:** se generan desde la huella naranja del logo sobre fondo `#ffe8cd`. Para regenerarlos hace falta `sharp` (no es dependencia del proyecto; instalarlo en una carpeta temporal).

## Marca y colores
- **Marca:** "Primeros Pasos - Sistema de Datos para el Monitoreo de los Primeros Años". La interfaz (login, título de pestaña) todavía dice "Prep-PRUNAPE".
- **Paleta del logo:** azul `#3b7aff` (logo) / `#2f6df0` (primario de la app, contraste AA con texto blanco), naranja `#ff8010`, durazno `#ffe8cd`. Definida en `tailwind.config.ts` (`primary`, `primary-container`, `brand.teal` → ahora azul, `brand.orange`, `tertiary` → naranja) y en las variables CSS de `index.css` (`--primary`, `--ring`, `--accent-foreground`). El nombre `brand-teal` se conservó por compatibilidad pero ahora es azul.
- **Colores semánticos que NO siguen la marca:** verde = aprobado, rojo = no aprobado, violeta = alerta PRUNAPE.
- **Tailwind:** al cambiar `tailwind.config.ts` hay que reiniciar `npm run dev`; el HMR no regenera la paleta.

## Convenciones de Código
- **Servicios:** Todo acceso directo a Supabase debe estructurarse en la carpeta `src/features/` o hooks específicos, evitando queries crudas en componentes de UI.
- **Estilos:** Utilizar los tokens de diseño y variables CSS de Tailwind disponibles. No añadir clases inline ad-hoc complejas.
- **Manejo de Formularios:** Usar React Hook Form controlado por esquemas Zod para validaciones y formateos dinámicos (DNI, CUIT, fechas).
- **Convención Terminológica:** No utilizar terminología médica o de salud clínica como "paciente", "pacientes", "formularios clínicos" o "clínico/s" en la interfaz (UI), notificaciones, mensajes de carga o textos descriptivos. Usar siempre "niño/a", "niños/as" o "NNyA", y referirse a las evaluaciones simplemente como "formularios" o "hitos de desarrollo" para reflejar adecuadamente el carácter institucional y social de la Defensoría de los NNyA.

## Variables de Entorno (Requeridas)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Secrets de Edge Functions (Supabase Dashboard → Edge Functions → Manage secrets)
- `OPENAI_API_KEY` — requerida por `consulta-familiar` para llamar a gpt-4o-mini.

## Reglas Críticas de Seguridad
1. **Nunca** guardar API keys, contraseñas o tokens en los archivos de código.
2. **Nunca** deshabilitar RLS (Row Level Security) en producción.
3. **No usar** la clave `service_role` en el cliente web frontend.
4. Las variables con prefijo `VITE_` se exponen públicamente en el frontend compilado; no incluir credenciales privadas.
5. **Pre-commit hook** instalado en `.git/hooks/pre-commit`: bloquea commits con JWTs reales (detecta el prefijo estándar de tokens Base64). No eliminar.
6. **`.gitignore`** cubre `.env`, `.env.local`, `.env.*.local`, `.env.development`, `.env.production`, `.env.staging`.
7. **No borrar niños ni evaluaciones de la base** (ni con `DELETE` ni creando políticas de borrado): usar siempre la anulación suave. Las cascadas de `niños` eliminarían seguimiento, hogar y tokens de encuesta.
