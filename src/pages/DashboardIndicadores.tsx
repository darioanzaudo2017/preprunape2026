import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserRole } from '../hooks/useUserRole'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  BarChart2,
  Calendar,
  Filter,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
  MapPin,
  ClipboardCheck,
  Stethoscope
} from 'lucide-react'

// Interfaces for database RPC responses
interface DashboardResumen {
  total_ninos: number
  total_pruebas: number
  total_aprobados: number
  total_no_aprobados: number
  total_no_evaluados: number
  ninos_aprobados: number
  ninos_no_aprobados: number
  ninos_sin_evaluar: number
  por_genero: { genero: string; cantidad: number }[]
  por_formulario: { formulario: string; cantidad: number }[]
  por_espacio_cuidado: { espacio: string; cantidad: number }[]
  nivel_educativo_adultos: { nivel: string; cantidad: number }[]
}

interface PreguntaNoPasaRow {
  pregunta_id: number
  pregunta_texto: string
  categoria: string
  formularios: string
  frecuencia_no_pasa: number
  frecuencia_total: number
  porcentaje: number
}

interface RangoEtarioRow {
  rango: string
  orden: number
  cantidad: number
}

// Colors palette for Recharts
const GENDER_COLORS = {
  Varon: '#2563eb', // Blue
  Mujer: '#ec4899', // Pink
  Otro: '#64748b'   // Gray
}

const RESULT_COLORS = {
  Aprobado: '#10b981',    // Green
  'No Aprobado': '#ef4444', // Red
  'No Evaluado': '#f59e0b'  // Orange
}

const BAR_COLOR_PRIMARY = '#6366f1' // Indigo
const BAR_COLOR_SECONDARY = '#0d9488' // Teal

export default function DashboardIndicadoresPage() {
  const { rol, isAgente, localidad: userLocalidad } = useUserRole()

  // 1. Global Filter States
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [pGenero, setPGenero] = useState<string>('')
  const [pLocalidad, setPLocalidad] = useState<string>('')
  const [pCategoria, setPCategoria] = useState<string>('')

  // Resolve locality dynamically based on role/isAgente
  const activeLocalidad = isAgente ? userLocalidad : pLocalidad

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // 2. Fetch localities list from Supabase table 'Localidad'
  const { data: localidades = [] } = useQuery<{ id: number; Localidad: string }[]>({
    queryKey: ['localidades-filtros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Localidad')
        .select('id, Localidad')
        .order('Localidad', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })

  // 3. Query 1: get_dashboard_resumen — todos los filtros
  const { data: resumen, isLoading: isLoadingResumen } = useQuery<DashboardResumen | null>({
    queryKey: ['dashboard-resumen-rpc', fechaDesde, fechaHasta, activeLocalidad, pGenero],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_dashboard_resumen', {
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        p_localidad: activeLocalidad || null,
        p_genero: pGenero || null
      })
      if (error) throw error
      // Supabase puede devolver el JSON como objeto directo o envuelto en array
      if (Array.isArray(data)) {
        const row = data[0]
        return (row?.get_dashboard_resumen ?? row) || null
      }
      return data || null
    }
  })

  // 4. Query 2: get_preguntas_no_pasa — todos los filtros
  const { data: preguntasNoPasa = [], isLoading: isLoadingPreguntas } = useQuery<PreguntaNoPasaRow[]>({
    queryKey: ['preguntas-no-pasa-rpc', fechaDesde, fechaHasta, pGenero, pCategoria, activeLocalidad],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_preguntas_no_pasa', {
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        p_genero: pGenero || null,
        p_categoria: pCategoria || null,
        p_localidad: activeLocalidad || null,
        p_limit: 150
      })
      if (error) throw error
      return data || []
    }
  })

  // Query: niños que requieren PRUNAPE — todos los filtros
  const { data: prunapeData = [] } = useQuery<{ idnino: number; nombre: string; ultima_prueba: string }[]>({
    queryKey: ['prunape-alerta', activeLocalidad, fechaDesde, fechaHasta, pGenero],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_ninos_requieren_prunape', {
        p_localidad: activeLocalidad || null,
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        p_genero: pGenero || null
      })
      if (error) throw error
      return data ?? []
    }
  })

  // 5. Query 3: get_rangos_etarios — todos los filtros
  const { data: rangosEtarios = [], isLoading: isLoadingRangos } = useQuery<RangoEtarioRow[]>({
    queryKey: ['rangos-etarios-rpc', fechaDesde, fechaHasta, activeLocalidad, pGenero],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_rangos_etarios', {
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        p_localidad: activeLocalidad || null,
        p_genero: pGenero || null
      })
      if (error) throw error
      return (data || []).sort((a, b) => a.orden - b.orden)
    }
  })

  // 6. Reset filters handler
  const handleClearFilters = () => {
    setFechaDesde('')
    setFechaHasta('')
    setPGenero('')
    setPLocalidad('')
    setPCategoria('')
    setCurrentPage(1)
  }

  // 7. Data formatting helpers
  const totalPruebas = resumen?.total_pruebas ?? 0
  const passPercent = totalPruebas > 0 ? Math.round(((resumen?.total_aprobados ?? 0) / totalPruebas) * 100) : 0
  const failPercent = totalPruebas > 0 ? Math.round(((resumen?.total_no_aprobados ?? 0) / totalPruebas) * 100) : 0

  // Gender chart formatting
  const genderChartData = useMemo(() => {
    if (!resumen?.por_genero) return []
    const total = resumen.por_genero.reduce((acc, curr) => acc + curr.cantidad, 0)
    return resumen.por_genero.map(item => ({
      name: item.genero === 'Varon' ? 'Varón' : item.genero === 'Mujer' ? 'Mujer' : item.genero,
      value: item.cantidad,
      percentage: total > 0 ? Math.round((item.cantidad / total) * 100) : 0,
      color: item.genero === 'Varon' ? GENDER_COLORS.Varon : item.genero === 'Mujer' ? GENDER_COLORS.Mujer : GENDER_COLORS.Otro
    }))
  }, [resumen])

  // Results distribution chart formatting
  const resultsChartData = useMemo(() => {
    if (!resumen) return []
    const total = (resumen.total_aprobados || 0) + (resumen.total_no_aprobados || 0) + (resumen.total_no_evaluados || 0) || totalPruebas
    return [
      {
        name: 'Aprobado',
        value: resumen.total_aprobados ?? 0,
        percentage: total > 0 ? Math.round(((resumen.total_aprobados ?? 0) / total) * 100) : 0,
        color: RESULT_COLORS.Aprobado
      },
      {
        name: 'No Aprobado',
        value: resumen.total_no_aprobados ?? 0,
        percentage: total > 0 ? Math.round(((resumen.total_no_aprobados ?? 0) / total) * 100) : 0,
        color: RESULT_COLORS['No Aprobado']
      },
      {
        name: 'No Evaluado',
        value: resumen.total_no_evaluados ?? 0,
        percentage: total > 0 ? Math.round(((resumen.total_no_evaluados ?? 0) / total) * 100) : 0,
        color: RESULT_COLORS['No Evaluado']
      }
    ].filter(item => item.value > 0)
  }, [resumen, totalPruebas])

  // Horizontal bar chart for adult education level
  const educationChartData = useMemo(() => {
    if (!resumen?.nivel_educativo_adultos) return []
    return [...resumen.nivel_educativo_adultos]
      .sort((a, b) => b.cantidad - a.cantidad)
      .map(item => ({
        nivel: item.nivel || 'No especificado',
        cantidad: item.cantidad
      }))
  }, [resumen])

  // Horizonal bar chart for spaces (Top 10)
  const spacesChartData = useMemo(() => {
    if (!resumen?.por_espacio_cuidado) return []
    return [...resumen.por_espacio_cuidado]
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)
      .map(item => ({
        espacio: item.espacio || 'Sin espacio registrado',
        cantidad: item.cantidad
      }))
  }, [resumen])

  // 8. Custom Recharts Tooltip Component
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold">{payload[0].name || data.nivel || data.rango || data.formulario || data.espacio}</p>
          <p className="font-semibold text-indigo-300">
            Cantidad: <span className="font-extrabold text-white">{payload[0].value}</span>
          </p>
          {data.percentage !== undefined && (
            <p className="text-[10px] text-slate-400 font-medium">Porcentaje: {data.percentage}%</p>
          )}
        </div>
      )
    }
    return null
  }

  // 9. Table pagination logic
  const itemsPerPage = 10
  const totalPages = Math.ceil(preguntasNoPasa.length / itemsPerPage)
  const paginatedPreguntas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return preguntasNoPasa.slice(start, start + itemsPerPage)
  }, [preguntasNoPasa, currentPage])

  const getCategoryColor = (cat?: string) => {
    if (!cat) return 'bg-slate-100 text-slate-700'
    const c = cat.toLowerCase().trim()
    if (c.includes('lenguaje')) return 'bg-blue-100 text-blue-800 border border-blue-200/50'
    if (c.includes('psico') || c.includes('social')) return 'bg-purple-100 text-purple-800 border border-purple-200/50'
    if (c.includes('motriz fino') || c.includes('fino')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
    if (c.includes('motriz grueso') || c.includes('grueso')) return 'bg-amber-100 text-amber-800 border border-amber-200/50'
    return 'bg-slate-100 text-slate-700 border border-slate-200/50'
  }

  // Skeleton Loader helper for individual card blocks
  const SkeletonBlock = () => (
    <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="h-40 bg-slate-100 rounded-xl w-full"></div>
    </div>
  )

  const hasNoData = useMemo(() => {
    return !isLoadingResumen && (!resumen || resumen.total_pruebas === 0)
  }, [resumen, isLoadingResumen])

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 bg-[#f7f9fb] min-h-screen">
      
      {/* Sticky Filters bar */}
      <nav className="sticky top-0 z-30 bg-[#f7f9fb]/90 backdrop-blur-md pb-4 pt-1 flex flex-col md:flex-row gap-4 items-end border-b border-slate-200/40">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full text-xs">
          {/* Fecha Desde */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Fecha Desde
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Fecha Hasta */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Fecha Hasta
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Género Select */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Users className="h-3 w-3" /> Género
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
              value={pGenero}
              onChange={(e) => { setPGenero(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todos</option>
              <option value="Varon">Varón</option>
              <option value="Mujer">Mujer</option>
            </select>
          </div>

          {/* Localidad Select */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Localidad
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              value={activeLocalidad}
              disabled={isAgente}
              onChange={(e) => { setPLocalidad(e.target.value); setCurrentPage(1); }}
            >
              {isAgente ? (
                <option value={userLocalidad || ''}>{userLocalidad || 'Sin Localidad'}</option>
              ) : (
                <>
                  <option value="">Todas las Localidades</option>
                  {localidades.map((loc) => (
                    <option key={loc.id} value={loc.Localidad}>
                      {loc.Localidad}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Categoría (solo afecta preguntas no pasa) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Filter className="h-3 w-3" /> Categoría (Hitos)
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold cursor-pointer"
              value={pCategoria}
              onChange={(e) => { setPCategoria(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todas las Categorías</option>
              <option value="Lenguaje">Lenguaje</option>
              <option value="Psico social">Psico social</option>
              <option value="Motriz fino">Motriz fino</option>
              <option value="Motriz grueso">Motriz grueso</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleClearFilters}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-[#f1f5f9] text-[#475569] border border-slate-200 hover:bg-[#e2e8f0] flex items-center gap-1.5 transition-colors shrink-0 md:h-[34px]"
        >
          <X className="h-3.5 w-3.5" /> Limpiar Filtros
        </button>
      </nav>

      {/* Empty State when no data matches active filter set */}
      {hasNoData ? (
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BarChart2 className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-700">Sin datos para los filtros activos</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No se han registrado evaluaciones pre-PRUNAPE que coincidan con el rango de fechas, género o localidad especificados. Prueba cambiando los filtros superiores.
          </p>
          <button
            onClick={handleClearFilters}
            className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold shadow-sm"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Cards row */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1: Total NNyA (Azul) */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-600 border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" /> Total Niños
              </span>
              <div className="mt-2">
                {isLoadingResumen ? (
                  <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-extrabold text-brand-navy font-display">{resumen?.total_ninos ?? 0}</div>
                )}
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Pacientes únicos registrados</p>
              </div>
            </div>

            {/* Card 2: Total Pruebas (Violeta) */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> Total Pruebas
              </span>
              <div className="mt-2">
                {isLoadingResumen ? (
                  <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-extrabold text-brand-navy font-display">{totalPruebas}</div>
                )}
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Evaluaciones realizadas</p>
              </div>
            </div>

            {/* Card 3: Aprobados (Verde) */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-500 border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Aprobados
              </span>
              <div className="mt-2">
                {isLoadingResumen ? (
                  <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-extrabold text-emerald-600 font-display">
                    {resumen?.total_aprobados ?? 0}{' '}
                    <span className="text-xs font-bold text-slate-400">({passPercent}%)</span>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Superaron todos los hitos</p>
              </div>
            </div>

            {/* Card 4: No Aprobados (Rojo) */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-red-500 border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" /> No Aprobados
              </span>
              <div className="mt-2">
                {isLoadingResumen ? (
                  <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <div className="text-3xl font-extrabold text-red-600 font-display">
                    {resumen?.total_no_aprobados ?? 0}{' '}
                    <span className="text-xs font-bold text-slate-400">({failPercent}%)</span>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 font-semibold mt-1">No pasaron la pre-PRUNAPE</p>
              </div>
            </div>

            {/* Card 5: Requieren PRUNAPE (Violeta) */}
            <div className="bg-violet-600 rounded-2xl p-6 border border-violet-500/30 shadow-sm flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-white" /> Requieren PRUNAPE
              </span>
              <div className="mt-2">
                <div className="text-3xl font-extrabold text-white font-display">{prunapeData.length}</div>
                <p className="text-[9px] text-violet-200 font-semibold mt-1">2 No Aprobadas consecutivas</p>
              </div>
            </div>

          </section>

          {/* Bloque de alerta PRUNAPE */}
          {prunapeData.length > 0 && (
            <section className="bg-violet-50 border border-violet-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-violet-100 p-2 rounded-xl">
                    <Stethoscope className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-violet-900">NNyA que requieren derivación a PRUNAPE</h3>
                    <p className="text-[10px] text-violet-500 font-medium">Tienen las 2 últimas evaluaciones pre-PRUNAPE como No Aprobado</p>
                  </div>
                </div>
                <span className="bg-violet-600 text-white text-xs font-extrabold px-3 py-1 rounded-full">{prunapeData.length} NNyA</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase text-violet-500 border-b border-violet-200">
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">DNI</th>
                      <th className="py-2 pr-4">Dirección</th>
                      <th className="py-2 pr-4">Localidad</th>
                      <th className="py-2">Última prueba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {prunapeData.slice(0, 10).map((n) => (
                      <tr key={n.idnino} className="text-violet-900 font-medium">
                        <td className="py-2 pr-4 font-bold">{n.nombre}</td>
                        <td className="py-2 pr-4 font-mono">{(n as any).dni ?? '—'}</td>
                        <td className="py-2 pr-4">{(n as any).direccion || '—'}</td>
                        <td className="py-2 pr-4">{(n as any).localidad || '—'}</td>
                        <td className="py-2">{n.ultima_prueba ? new Date(n.ultima_prueba).toLocaleDateString('es-AR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {prunapeData.length > 10 && (
                  <p className="text-[10px] text-violet-400 font-semibold mt-2 text-center">
                    Mostrando 10 de {prunapeData.length}. Ver listado completo en Niños (NNyA).
                  </p>
                )}
              </div>
            </section>
          )}

          {/* FILA 1 — Gráficos (3 columnas) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1.1: Distribución por género */}
            {isLoadingResumen ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Distribución por Género</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Proporción de niños evaluados por género</p>
                </div>
                {genderChartData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos</div>
                ) : (
                  <div className="h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {genderChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Chart 1.2: Nivel educativo adultos */}
            {isLoadingResumen ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Nivel Educativo Adultos</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Educación del tutor responsable del niño</p>
                </div>
                {educationChartData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos</div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={educationChartData} layout="vertical" margin={{ left: 15, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                        <YAxis type="category" dataKey="nivel" stroke="#94a3b8" fontSize={9} width={80} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="cantidad" fill={BAR_COLOR_PRIMARY} radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Chart 1.3: Distribución Aprobado/No Aprobado/No Evaluado */}
            {isLoadingResumen ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Dictamen Final de Pruebas</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Proporción de resultados en las evaluaciones</p>
                </div>
                {resultsChartData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos</div>
                ) : (
                  <div className="h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={resultsChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {resultsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

          </section>

          {/* FILA 2 — Gráficos (2 columnas) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 2.1: Rangos etarios */}
            {isLoadingRangos ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Distribución por Rango Etario</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Población evaluada clasificada por rangos de edad</p>
                </div>
                {rangosEtarios.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rangosEtarios} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="rango" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="cantidad" fill={BAR_COLOR_SECONDARY} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Chart 2.2: Distribución por Formulario */}
            {isLoadingResumen ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Evaluaciones por Formulario</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Formularios clínicos de hitos utilizados</p>
                </div>
                {!resumen?.por_formulario || resumen.por_formulario.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resumen.por_formulario} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="formulario" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="cantidad" fill={BAR_COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

          </section>

          {/* FILA 3 — Gráfico ancho (1 columna completa) */}
          <section>
            {isLoadingResumen ? <SkeletonBlock /> : (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-navy">Top 10 Espacios de Cuidado</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Instituciones y espacios de cuidado con mayor cantidad de pruebas tomadas</p>
                </div>
                {spacesChartData.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs font-semibold">Sin datos de espacios de cuidado</div>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spacesChartData} layout="vertical" margin={{ left: 40, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                        <YAxis type="category" dataKey="espacio" stroke="#94a3b8" fontSize={9} width={120} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="cantidad" fill={BAR_COLOR_SECONDARY} radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* TABLA INFERIOR — Preguntas No Pasa */}
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display text-sm font-bold text-brand-navy flex items-center gap-1.5">
                  <TrendingDown className="h-4.5 w-4.5 text-red-500" /> Hitos Críticos "No Pasa"
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Preguntas falladas con mayor frecuencia por los NNyA</p>
              </div>
              
              <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm shrink-0">
                <Info className="h-3.5 w-3.5" />
                {preguntasNoPasa.length} Hitos Detectados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase border-b border-slate-100">
                    <th className="px-6 py-3.5 w-32">CATEGORÍA</th>
                    <th className="px-6 py-3.5 w-36">FORMULARIOS</th>
                    <th className="px-6 py-3.5">PREGUNTA / HITO CLÍNICO</th>
                    <th className="px-6 py-3.5 text-center w-24">FALLOS</th>
                    <th className="px-6 py-3.5 text-center w-24">TOTAL</th>
                    <th className="px-6 py-3.5 w-44">% NO PASA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {isLoadingPreguntas ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                          <span className="text-slate-400 text-xs font-semibold">Cargando hitos clínicos críticos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPreguntas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                        No hay hitos críticos para mostrar con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedPreguntas.map((row) => (
                      <tr key={row.pregunta_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold ${getCategoryColor(row.categoria)}`}>
                            {row.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-[10px] text-slate-500">{row.formularios}</td>
                        <td className="px-6 py-3.5 font-semibold text-brand-navy truncate max-w-sm" title={row.pregunta_texto}>
                          {row.pregunta_texto}
                        </td>
                        <td className="px-6 py-3.5 text-center text-red-600 font-bold">{row.frecuencia_no_pasa}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-500">{row.frecuencia_total}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-8 font-bold text-red-600 text-right">{Math.round(row.porcentaje)}%</span>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200/40">
                              <div
                                style={{ width: `${row.porcentaje}%` }}
                                className="h-full bg-red-500 rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table pagination navigation */}
            {totalPages > 1 && !isLoadingPreguntas && (
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">
                  Mostrando página {currentPage} de {totalPages} ({preguntasNoPasa.length} hitos totales)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </section>
        </>
      )}

    </div>
  )
}
