import { useMemo, useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Users, FileSpreadsheet, CheckCircle2, AlertTriangle, Filter, X, HeartPulse, BarChart2, KeyRound, Loader2, AlertCircle } from 'lucide-react'

const API_BASE = 'https://wbhshrxibzleubcsistn.supabase.co/functions/v1/datos-externos'

interface RawRow {
  nino_id: number
  municipio: string | null
  nino_genero: string | null
  nino_edad_total_meses: number | null
  nino_edad_anios: number | null
  nino_prematuro: string | null
  adulto_nivel_educativo: string | null
  hogar_tipo_hogar: string | null
  hogar_cobertura_salud: string | null
  hogar_hacinamiento: string | null
  hogar_situacion_ocupacional: string | null
  hogar_escala_ingresos: string | null
  prueba_id: number | null
  prueba_fecha: string | null
  prueba_resultado: string | null
  prueba_formulario_efectivo: string | null
  prueba_espacio_cuidado: string | null
  prueba_edad_meses_al_momento: number | null
  pregunta_texto: string | null
  pregunta_categoria: string | null
  pregunta_respuesta: string | null
}

async function fetchAllPages(token: string): Promise<RawRow[]> {
  const PAGE_SIZE = 5000
  let page = 1
  const all: RawRow[] = []
  while (true) {
    const res = await fetch(`${API_BASE}?token=${token}&page=${page}&page_size=${PAGE_SIZE}`)
    if (!res.ok) throw new Error(`Error ${res.status}`)
    const json = await res.json()
    const datos: RawRow[] = json.datos ?? []
    all.push(...datos)
    if (all.length >= json.total_registros || datos.length < PAGE_SIZE) break
    page++
  }
  return all
}

const COLORS = ['#6366f1','#10b981','#ef4444','#f59e0b','#0d9488','#8b5cf6','#ec4899','#64748b']

function getRangoEtario(meses: number | null): string {
  if (meses === null) return 'Sin dato'
  if (meses < 12) return '< 1 año'
  if (meses < 24) return '1-2 años'
  if (meses < 36) return '2-3 años'
  if (meses < 48) return '3-4 años'
  return '4-5 años'
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-800 text-xs">
      <p className="font-bold">{payload[0].name || payload[0].payload?.name || payload[0].payload?.label}</p>
      <p className="text-indigo-300 font-semibold">Cantidad: <span className="text-white font-extrabold">{payload[0].value}</span></p>
    </div>
  )
}

function TokenModal({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = value.trim()
    if (!t) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}?token=${t}&page=1&page_size=1`)
      if (res.status === 401 || res.status === 403) {
        setError('Token inválido o sin acceso. Verificá el código enviado.')
        return
      }
      if (!res.ok) {
        setError('No se pudo verificar el token. Intentá nuevamente.')
        return
      }
      const json = await res.json()
      if (!json.datos) {
        setError('Respuesta inesperada del servidor.')
        return
      }
      onSuccess(t)
    } catch {
      setError('Error de conexión. Verificá tu acceso a internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1e293b] shadow-md">
            <HeartPulse className="h-7 w-7 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">PrepPRUNAPE</h2>
            <p className="text-xs text-slate-400">Portal de Datos para Organizaciones</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
              Ingresá tu código de acceso
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-slate-300"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {loading ? 'Verificando…' : 'Acceder al Tablero'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400">
          Defensoría de NNyA · Córdoba · Datos anonimizados
        </p>
      </div>
    </div>
  )
}

export default function DashboardExternoPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [pGenero, setPGenero] = useState('')
  const [pFormulario, setPFormulario] = useState('')
  const [pEspacio, setPEspacio] = useState('')
  const [pMunicipio, setPMunicipio] = useState('')

  const { data: rows = [], isLoading, error } = useQuery<RawRow[]>({
    queryKey: ['datos-externos', token],
    queryFn: () => fetchAllPages(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Opciones de filtro disponibles en los datos
  const opcionesMunicipio = useMemo(() => {
    const s = new Set(rows.map(r => r.municipio).filter(Boolean) as string[])
    return [...s].sort()
  }, [rows])

  const opcionesFormulario = useMemo(() => {
    const s = new Set(rows.map(r => r.prueba_formulario_efectivo).filter(Boolean) as string[])
    return [...s].sort()
  }, [rows])

  const opcionesEspacio = useMemo(() => {
    const s = new Set(rows.map(r => r.prueba_espacio_cuidado).filter(Boolean) as string[])
    return [...s].sort()
  }, [rows])

  // Filas filtradas
  const filtered = useMemo(() => rows.filter(r => {
    if (pMunicipio && r.municipio !== pMunicipio) return false
    if (pGenero && r.nino_genero !== pGenero) return false
    if (pFormulario && r.prueba_formulario_efectivo !== pFormulario) return false
    if (pEspacio && r.prueba_espacio_cuidado !== pEspacio) return false
    return true
  }), [rows, pMunicipio, pGenero, pFormulario, pEspacio])

  // NNyA únicos
  const uniqueNinos = useMemo(() => new Set(filtered.map(r => r.nino_id)), [filtered])

  // Pruebas únicas
  const uniquePruebas = useMemo(() => {
    const m = new Map<number, RawRow>()
    for (const r of filtered) {
      if (r.prueba_id && !m.has(r.prueba_id)) m.set(r.prueba_id, r)
    }
    return m
  }, [filtered])

  const totalPruebas = uniquePruebas.size
  const aprobadas = [...uniquePruebas.values()].filter(r => r.prueba_resultado === 'Aprobado').length
  const noAprobadas = [...uniquePruebas.values()].filter(r => r.prueba_resultado === 'No Aprobado').length
  const passPercent = totalPruebas > 0 ? Math.round((aprobadas / totalPruebas) * 100) : 0
  const failPercent = totalPruebas > 0 ? Math.round((noAprobadas / totalPruebas) * 100) : 0

  // Género
  const generoData = useMemo(() => {
    const m = new Map<string, Set<number>>()
    for (const r of filtered) {
      const g = r.nino_genero || 'Sin dato'
      if (!m.has(g)) m.set(g, new Set())
      m.get(g)!.add(r.nino_id)
    }
    return [...m.entries()].map(([name, s], i) => ({ name: name === 'Varon' ? 'Varón' : name, value: s.size, color: COLORS[i % COLORS.length] }))
  }, [filtered])

  // Resultado de pruebas
  const resultadoData = useMemo(() => [
    { name: 'Aprobado', value: aprobadas, color: '#10b981' },
    { name: 'No Aprobado', value: noAprobadas, color: '#ef4444' },
    { name: 'No Evaluado', value: totalPruebas - aprobadas - noAprobadas, color: '#f59e0b' },
  ].filter(d => d.value > 0), [aprobadas, noAprobadas, totalPruebas])

  // Rango etario (por NNyA único, usando edad en el momento de la prueba)
  const rangoData = useMemo(() => {
    const m = new Map<string, number>()
    const seen = new Set<number>()
    for (const r of filtered) {
      if (!r.nino_id || seen.has(r.nino_id)) continue
      seen.add(r.nino_id)
      const rango = getRangoEtario(r.nino_edad_total_meses)
      m.set(rango, (m.get(rango) ?? 0) + 1)
    }
    const order = ['< 1 año','1-2 años','2-3 años','3-4 años','4-5 años','Sin dato']
    return order.filter(k => m.has(k)).map(k => ({ name: k, cantidad: m.get(k)! }))
  }, [filtered])

  // Formulario
  const formularioData = useMemo(() => {
    const m = new Map<string, number>()
    for (const [, r] of uniquePruebas) {
      const f = r.prueba_formulario_efectivo || 'Sin dato'
      m.set(f, (m.get(f) ?? 0) + 1)
    }
    return [...m.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([name, cantidad]) => ({ name, cantidad }))
  }, [uniquePruebas])

  // Espacio de cuidado (top 8)
  const espacioData = useMemo(() => {
    const m = new Map<string, number>()
    for (const [, r] of uniquePruebas) {
      const e = r.prueba_espacio_cuidado || 'Sin registro'
      m.set(e, (m.get(e) ?? 0) + 1)
    }
    return [...m.entries()].sort((a,b) => b[1]-a[1]).slice(0,8).map(([label, cantidad]) => ({ label, cantidad }))
  }, [uniquePruebas])

  // Hitos No Pasa más frecuentes
  const hitosNoPasaData = useMemo(() => {
    const m = new Map<string, { categoria: string; count: number }>()
    for (const r of filtered) {
      if (r.pregunta_respuesta !== 'No Pasa' && r.pregunta_respuesta !== 'No pasa') continue
      const key = r.pregunta_texto || 'Sin dato'
      if (!m.has(key)) m.set(key, { categoria: r.pregunta_categoria || '', count: 0 })
      m.get(key)!.count++
    }
    return [...m.entries()]
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([texto, { categoria, count }]) => ({
        label: texto.length > 60 ? texto.slice(0, 58) + '…' : texto,
        categoria,
        cantidad: count
      }))
  }, [filtered])

  // Nivel educativo adultos (top 6)
  const educacionData = useMemo(() => {
    const m = new Map<string, Set<number>>()
    for (const r of filtered) {
      const nivel = r.adulto_nivel_educativo || 'Sin dato'
      if (!m.has(nivel)) m.set(nivel, new Set())
      m.get(nivel)!.add(r.nino_id)
    }
    return [...m.entries()].sort((a,b) => b[1].size - a[1].size).slice(0,6)
      .map(([nivel, s]) => ({ nivel, cantidad: s.size }))
  }, [filtered])

  const hasFilters = !!(pMunicipio || pGenero || pFormulario || pEspacio)

  if (!token) return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <TokenModal onSuccess={t => navigate(`/org/${t}`)} />
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center gap-4">
      <HeartPulse className="h-10 w-10 animate-pulse text-indigo-500" />
      <p className="text-slate-500 font-semibold text-sm">Cargando datos…</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <BarChart2 className="h-10 w-10 text-slate-400" />
      <h2 className="text-lg font-bold text-slate-700">Token inválido o sin acceso</h2>
      <p className="text-sm text-slate-400 max-w-sm">Verificá que el enlace sea correcto o contactá a la Defensoría de NNyA de Córdoba.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <header className="bg-[#1e293b] text-white px-8 py-5 flex items-center gap-4 shadow-lg">
        <HeartPulse className="h-8 w-8 text-teal-400 shrink-0" />
        <div>
          <h1 className="font-bold text-lg leading-tight">Tablero de Indicadores — PrepPRUNAPE</h1>
          <p className="text-xs text-slate-400 mt-0.5">Defensoría de los Derechos de NNyA · Córdoba</p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {opcionesMunicipio.length > 1 && (
              <div className="space-y-1 min-w-[180px]">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Municipio
                </label>
                <select
                  value={pMunicipio}
                  onChange={e => setPMunicipio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Todos</option>
                  {opcionesMunicipio.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1 min-w-[140px]">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Género
              </label>
              <select
                value={pGenero}
                onChange={e => setPGenero(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todos</option>
                <option value="Varon">Varón</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>

            <div className="space-y-1 min-w-[160px]">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Formulario
              </label>
              <select
                value={pFormulario}
                onChange={e => setPFormulario(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todos</option>
                {opcionesFormulario.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="space-y-1 min-w-[200px]">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Espacio de Cuidado
              </label>
              <select
                value={pEspacio}
                onChange={e => setPEspacio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todos</option>
                {opcionesEspacio.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={() => { setPMunicipio(''); setPGenero(''); setPFormulario(''); setPEspacio('') }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border-l-4 border-l-slate-400 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Total NNyA
            </p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{uniqueNinos.size}</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Niños/as registrados</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border-l-4 border-l-indigo-500 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Total Evaluaciones
            </p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalPruebas}</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Pruebas realizadas</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobadas
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">
              {aprobadas} <span className="text-xs font-bold text-slate-400">({passPercent}%)</span>
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Superaron todos los hitos</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border-l-4 border-l-red-500 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> No Aprobadas
            </p>
            <p className="text-3xl font-extrabold text-red-600 mt-2">
              {noAprobadas} <span className="text-xs font-bold text-slate-400">({failPercent}%)</span>
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">No pasaron la evaluación</p>
          </div>
        </div>

        {/* Fila 1: Género + Resultado + Rango etario */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Género */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribución por Género</h3>
              <p className="text-[10px] text-slate-400 font-semibold">NNyA únicos</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={generoData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}>
                    {generoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Resultado de Evaluaciones</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Por dictamen final</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resultadoData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}>
                    {resultadoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rango etario */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Rangos Etarios</h3>
              <p className="text-[10px] text-slate-400 font-semibold">NNyA por edad</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rangoData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#6366f1" radius={[4,4,0,0]} name="NNyA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fila 2: Formulario + Espacio de Cuidado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Por formulario */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Evaluaciones por Formulario</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Distribución por etapa de desarrollo</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formularioData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#0d9488" radius={[4,4,0,0]} name="Evaluaciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Por espacio de cuidado */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Espacio de Cuidado / Institución</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Top 8 por cantidad de evaluaciones</p>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={espacioData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 9, fontWeight: 600 }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0,4,4,0]} name="Evaluaciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fila 3: Hitos No Pasa */}
        {hitosNoPasaData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Hitos con Mayor Frecuencia de No Pasa</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Top 10 — cantidad de respuestas No Pasa en el período</p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hitosNoPasaData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 9, fontWeight: 600 }} width={220} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#ef4444" radius={[0,4,4,0]} name="No Pasa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Fila 4: Nivel educativo adultos */}
        {educacionData.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Nivel Educativo del Adulto Responsable</h3>
              <p className="text-[10px] text-slate-400 font-semibold">NNyA únicos por nivel educativo del adulto</p>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educacionData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="nivel" type="category" tick={{ fontSize: 9, fontWeight: 600 }} width={160} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#f59e0b" radius={[0,4,4,0]} name="NNyA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-medium pb-6">
          Defensoría de los Derechos de NNyA · Córdoba · PrepPRUNAPE 2026 · Datos anonimizados
        </p>
      </div>
    </div>
  )
}
