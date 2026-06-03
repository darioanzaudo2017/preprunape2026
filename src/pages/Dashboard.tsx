import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUserRole } from '../hooks/useUserRole'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Plus,
  BarChart3,
  MapPin,
  FileSpreadsheet,
  Stethoscope
} from 'lucide-react'

interface LocalityMetric {
  name: string
  children: number
  tests: number
  approved: number
  rejected: number
  passRate: number
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { rol, isAgente, localidad, displayName } = useUserRole()
  const userName = displayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuario'

  // Single RPC call — all stats computed in SQL, no row limit issues
  const { data: resumen, isLoading: isLoadingResumen } = useQuery({
    queryKey: ['dashboard-resumen', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_dashboard_resumen', {
        fecha_desde: null,
        fecha_hasta: null,
        p_localidad: isAgente && localidad ? localidad : null,
        p_genero: null
      })
      if (error) throw error
      // Supabase puede devolver el JSON envuelto en array con clave de función
      if (Array.isArray(data)) {
        const row = data[0]
        return row?.get_dashboard_resumen ?? row
      }
      return data
    }
  })

  // Locality matrix — SQL aggregation, no row limit
  const { data: localityRaw, isLoading: isLoadingLocality } = useQuery({
    queryKey: ['dashboard-locality', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_dashboard_localidades', {
        p_localidad: isAgente && localidad ? localidad : null,
        fecha_desde: null,
        fecha_hasta: null,
        p_genero: null
      })
      if (error) throw error
      return data ?? []
    }
  })

  // Age groups — SQL aggregation
  const { data: rangosRaw, isLoading: isLoadingRangos } = useQuery({
    queryKey: ['dashboard-rangos', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_rangos_etarios', {
        fecha_desde: null,
        fecha_hasta: null,
        p_localidad: isAgente && localidad ? localidad : null,
        p_genero: null
      })
      if (error) throw error
      return data ?? []
    }
  })

  const stats = useMemo(() => {
    if (!resumen) return { totalNinos: 0, totalTests: 0, approved: 0, rejected: 0, pending: 0, passRate: 0 }
    const totalTests = resumen.total_pruebas
    const approved = resumen.total_aprobados
    const rejected = resumen.total_no_aprobados
    const pending = resumen.total_no_evaluados
    const passRate = totalTests > 0 ? Math.round((approved / totalTests) * 100) : 0
    return { totalNinos: resumen.total_ninos, totalTests, approved, rejected, pending, passRate }
  }, [resumen])

  const localityMetrics = useMemo((): LocalityMetric[] => {
    if (!localityRaw) return []
    return localityRaw.map((loc: any) => ({
      name: loc.localidad || 'Sin Localidad',
      children: loc.total_ninos,
      tests: loc.total_pruebas,
      approved: loc.total_aprobados,
      rejected: loc.total_no_aprobados,
      passRate: loc.total_pruebas > 0 ? Math.round((loc.total_aprobados / loc.total_pruebas) * 100) : 0
    })).sort((a: any, b: any) => b.children - a.children)
  }, [localityRaw])

  const ageGroupMetrics = useMemo(() => {
    if (!rangosRaw) return { form1: 0, form2: 0, form3: 0, form4: 0, form5: 0, other: 0 }
    const get = (label: string) => rangosRaw.find((r: any) => r.rango === label)?.cantidad ?? 0
    return {
      form1: get('6-12 meses'),
      form2: get('12-18 meses'),
      form3: get('18-24 meses') + get('2-3 años'),
      form4: get('3-4 años'),
      form5: get('4-5 años') + get('5-6 años'),
      other: get('0-6 meses') + get('6+ años')
    }
  }, [rangosRaw])

  // Niños que requieren PRUNAPE (2 últimas pruebas No Aprobado)
  const { data: prunapeCount } = useQuery({
    queryKey: ['dashboard-prunape', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_ninos_requieren_prunape', {
        p_localidad: isAgente && localidad ? localidad : null,
        fecha_desde: null,
        fecha_hasta: null,
        p_genero: null
      })
      if (error) throw error
      return (data ?? []).length as number
    }
  })

  const isLoading = isLoadingResumen || isLoadingLocality || isLoadingRangos

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 bg-[#f7f9fb] min-h-screen text-on-surface">
      
      {/* Top Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-1">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
            Panel de Control y Analíticas
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy mt-1 leading-none">
            Hola, <span className="text-primary capitalize">{userName}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            {isAgente ? `Monitoreo local para la localidad de ${localidad}` : 'Visualización integral de indicadores y cobertura nacional'}
          </p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => navigate('/ninos/nuevo')}
            className="bg-primary hover:brightness-110 text-on-primary px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="h-4 w-4" />
            Nuevo Niño (NNyA)
          </button>
          <button
            onClick={() => navigate('/ninos')}
            className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Users className="h-4 w-4 text-slate-500" />
            Ver Listado Completo
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
          <div className="lg:col-span-8 h-80 bg-slate-200 rounded-2xl"></div>
          <div className="lg:col-span-4 h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <>
          {/* Bento Stats Row */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Stat 1: Total NNyA */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pacientes Registrados</span>
                <div className="bg-slate-800 p-2 rounded-xl">
                  <Users className="h-5 w-5 text-primary-fixed-dim" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold leading-none font-display">{stats.totalNinos}</div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Niños y Niñas en seguimiento</p>
              </div>
            </div>

            {/* Stat 2: Total Pruebas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Evaluaciones Pre-PRUNAPE</span>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold leading-none font-display text-brand-navy">{stats.totalTests}</div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Pruebas clínicas realizadas</p>
              </div>
            </div>

            {/* Stat 3: Aprobados / Tasa */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex justify-between items-center min-h-[140px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-col justify-between h-full">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tasa de Aprobación</span>
                <div>
                  <div className="text-4xl font-extrabold leading-none font-display text-emerald-600">{stats.passRate}%</div>
                  <p className="text-[10px] text-emerald-600/80 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {stats.approved} NNyA Aprobados
                  </p>
                </div>
              </div>
              
              {/* Circular SVG Progress Ring */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-500"
                    strokeDasharray={`${stats.passRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-600 font-display">
                  {stats.passRate}%
                </div>
              </div>
            </div>

            {/* Stat 4: Pruebas Pendientes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pruebas Pendientes</span>
                <div className="bg-orange-500/10 p-2 rounded-xl">
                  <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold leading-none font-display text-orange-600">{stats.pending}</div>
                <p className="text-[10px] text-orange-600 font-bold mt-1">Evaluaciones en espera de cierre</p>
              </div>
            </div>

            {/* Stat 5: Requieren PRUNAPE */}
            <div
              onClick={() => navigate('/ninos?alerta=prunape')}
              className="bg-violet-600 text-white p-6 rounded-2xl shadow-sm border border-violet-500/30 flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200">Requieren PRUNAPE</span>
                <div className="bg-violet-500 p-2 rounded-xl">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <div className="text-4xl font-extrabold leading-none font-display">{prunapeCount ?? '—'}</div>
                <p className="text-[10px] text-violet-200 font-bold mt-1">2 No Aprobadas consecutivas</p>
              </div>
            </div>

          </section>

          {/* Indicators Charts ( SVG Bento Graphics ) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Donut chart for test distribution */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold text-brand-navy flex items-center gap-1.5">
                  <BarChart3 className="h-4.5 w-4.5 text-primary" /> Distribución de Resultados
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Estado global de aprobados vs no aprobados</p>
              </div>

              {stats.totalTests === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Award className="h-8 w-8 opacity-45" />
                  <p className="text-xs font-semibold">Sin evaluaciones registradas</p>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  
                  {/* Clean Horizontal Distribution Bar */}
                  <div className="h-5 rounded-full overflow-hidden flex shadow-inner border border-slate-100">
                    <div
                      style={{ width: `${stats.totalTests > 0 ? (stats.approved / stats.totalTests) * 100 : 0}%` }}
                      className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer relative group"
                      title={`Aprobados: ${stats.approved}`}
                    />
                    <div
                      style={{ width: `${stats.totalTests > 0 ? (stats.rejected / stats.totalTests) * 100 : 0}%` }}
                      className="bg-red-500 hover:opacity-90 transition-all cursor-pointer"
                      title={`No Aprobados: ${stats.rejected}`}
                    />
                    <div
                      style={{ width: `${stats.totalTests > 0 ? (stats.pending / stats.totalTests) * 100 : 0}%` }}
                      className="bg-orange-400 hover:opacity-90 transition-all cursor-pointer"
                      title={`Pendientes: ${stats.pending}`}
                    />
                  </div>

                  {/* Distribution Legends list */}
                  <div className="space-y-3 pt-2 text-xs">
                    
                    <div className="flex justify-between items-center bg-[#f8fafc] p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                        Aprobado (Sí)
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-700">{stats.approved} NNyA</span>
                        <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                          {stats.totalTests > 0 ? Math.round((stats.approved / stats.totalTests) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                        No Aprobado (No)
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-700">{stats.rejected} NNyA</span>
                        <span className="bg-red-500/10 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                          {stats.totalTests > 0 ? Math.round((stats.rejected / stats.totalTests) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#f8fafc] p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-orange-400 shrink-0"></span>
                        Evaluación Pendiente
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-700">{stats.pending} NNyA</span>
                        <span className="bg-orange-500/10 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                          {stats.totalTests > 0 ? Math.round((stats.pending / stats.totalTests) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Horizontal Bar Chart for child ages distribution corresponding to pre-prunape forms */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-sm font-bold text-brand-navy flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-primary" /> Rango Etario por Formularios Pre-PRUNAPE
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Clasificación automática de pacientes según formularios clínicos</p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                
                {/* Form 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                    <span>Formulario 1 (6 a 11 meses)</span>
                    <span className="text-brand-navy font-extrabold">{ageGroupMetrics.form1} NNyA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.form1 / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Form 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                    <span>Formulario 2 (12 a 17 meses)</span>
                    <span className="text-brand-navy font-extrabold">{ageGroupMetrics.form2} NNyA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.form2 / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Form 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                    <span>Formulario 3 (18 a 29 meses)</span>
                    <span className="text-brand-navy font-extrabold">{ageGroupMetrics.form3} NNyA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.form3 / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Form 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                    <span>Formulario 4 (30 a 47 meses)</span>
                    <span className="text-brand-navy font-extrabold">{ageGroupMetrics.form4} NNyA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.form4 / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Form 5 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                    <span>Formulario 5 (48 a 71 meses)</span>
                    <span className="text-brand-navy font-extrabold">{ageGroupMetrics.form5} NNyA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.form5 / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Other */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between font-bold text-slate-400 text-[11px]">
                    <span>Otros / Mayor de 6 años</span>
                    <span className="text-slate-500 font-extrabold">{ageGroupMetrics.other} NNyA</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.totalNinos > 0 ? (ageGroupMetrics.other / stats.totalNinos) * 100 : 0}%` }}
                      className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

              </div>
            </div>

          </section>

          {/* Locality indicators leader-board table */}
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-brand-navy flex items-center gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-primary" /> Matriz de Desempeño por Localidades
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Indicadores consolidados por región municipal activa</p>
              </div>
              <span className="bg-slate-50 text-slate-500 border border-slate-200/60 px-3 py-1 rounded-full text-xs font-bold">
                {localityMetrics.length} Localidades Registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase border-b border-slate-100">
                    <th className="px-6 py-3.5">LOCALIDAD MUNICIPAL</th>
                    <th className="px-6 py-3.5 text-center">NNyA TOTALES</th>
                    <th className="px-6 py-3.5 text-center">EVALUACIONES TOMADAS</th>
                    <th className="px-6 py-3.5 text-center">APROBADOS (SÍ)</th>
                    <th className="px-6 py-3.5 text-center">TASA DE RENDIMIENTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {localityMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-bold">
                        No hay localidades con niños asignados para mostrar.
                      </td>
                    </tr>
                  ) : (
                    localityMetrics.map((loc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-brand-navy flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"></span>
                          {loc.name}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-700">{loc.children}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-700">{loc.tests}</td>
                        <td className="px-6 py-3.5 text-center text-emerald-600 font-bold">
                          {loc.approved} <span className="text-[10px] text-slate-400 font-medium">tomadas</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-right font-extrabold font-display text-brand-teal">{loc.passRate}%</span>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div
                                style={{ width: `${loc.passRate}%` }}
                                className="h-full bg-brand-teal rounded-full"
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

          </section>
        </>
      )}

    </div>
  )
}
