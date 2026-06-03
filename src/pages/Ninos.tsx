import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserRole } from '../hooks/useUserRole'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Plus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react'

interface Ninya {
  id: string
  dni: string
  nombre: string
  apellido: string
  direccion: string | null
  telefono: string | null
  requierePrunape?: boolean
  seguimiento?: { resultado: string; fecha: string } | null
}

export default function NinosPage() {
  const navigate = useNavigate()
  const { rol, isAgente, localidad, displayName } = useUserRole()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [soloAlerta, setSoloAlerta] = useState(false)

  console.log('NinosPage: Render called with state:', { rol, localidad, isAgente, displayName })

  // Fetch children from Supabase — agente_municipio only sees their own localidad
  const { data: ninos, isLoading, error: queryError } = useQuery<Ninya[]>({
    queryKey: ['ninos', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      console.log('NinosPage: children queryFn starting...', { rol, localidad, isAgente })
      let query = supabase
        .from('niños')
        .select('idninos, dni, nombre, Direccion, Telefonocontacto')

      if (isAgente && localidad) {
        console.log('NinosPage: Filtering children by locality:', localidad)
        query = query.eq('Localidad', localidad)
      }

      const { data: ninosData, error } = await query
      if (error) {
        console.error('NinosPage: Supabase query error:', error)
        throw error
      }

      // Fetch all seguimiento_prunape records to determine active follow-ups
      const { data: followUps } = await supabase
        .from('seguimiento_prunape')
        .select('id_nino, resultado, fecha')
        .order('fecha', { ascending: false })

      const followUpMap: Record<number, { resultado: string; fecha: string }> = {}
      if (followUps) {
        for (const item of followUps) {
          if (!followUpMap[item.id_nino]) {
            followUpMap[item.id_nino] = {
              resultado: item.resultado,
              fecha: item.fecha
            }
          }
        }
      }

      console.log('NinosPage: Supabase query returned', ninosData?.length, 'children')
      return (ninosData || []).map((item) => {
        const fullNombre = (item.nombre || '').trim()
        const nameParts = fullNombre.split(' ')
        const nombre = nameParts[0] || 'Sin nombre'
        const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sin apellido'

        return {
          id: String(item.idninos),
          dni: String(item.dni || ''),
          nombre,
          apellido,
          direccion: item.Direccion || '',
          telefono: String(item.Telefonocontacto || ''),
          seguimiento: followUpMap[item.idninos] || null
        }
      })
    },
  })

  if (queryError) {
    console.error('NinosPage: React Query error:', queryError)
  }

  // Fetch stats via RPC — avoids 1000-row PostgREST limit and uses correct field values
  const { data: stats } = useQuery({
    queryKey: ['ninos-stats', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_dashboard_resumen', {
        fecha_desde: null,
        fecha_hasta: null,
        p_localidad: isAgente && localidad ? localidad : null,
        p_genero: null
      })
      if (error) throw error
      const d = Array.isArray(data) ? (data[0]?.get_dashboard_resumen ?? data[0]) : data
      return {
        aprobados: d?.ninos_aprobados ?? 0,
        noAprobados: d?.ninos_no_aprobados ?? 0,
        pendientes: d?.ninos_sin_evaluar ?? 0,
      }
    },
  })

  // Fetch children requiring PRUNAPE (last 2 tests both No Aprobado)
  const { data: prunapeRaw } = useQuery({
    queryKey: ['ninos-prunape', rol, localidad],
    enabled: rol !== null,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_ninos_requieren_prunape', {
        p_localidad: isAgente && localidad ? localidad : null,
        fecha_desde: null,
        fecha_hasta: null,
        p_genero: null
      })
      if (error) throw error
      return new Set<string>((data || []).map((r: any) => String(r.idnino)))
    },
  })

  const prunapeIds = prunapeRaw ?? new Set<string>()

  const activeList: Ninya[] = (ninos || []).map((n) => ({
    ...n,
    requierePrunape: prunapeIds.has(n.id),
  }))

  // Filter children based on live search + alerta toggle
  const filteredList = activeList.filter((nino) => {
    if (soloAlerta && !nino.requierePrunape) return false
    const fullName = `${nino.nombre} ${nino.apellido}`.toLowerCase()
    const dni = nino.dni.toLowerCase()
    const address = (nino.direccion || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || dni.includes(query) || address.includes(query)
  })

  // Stats from real data
  const totalNNyA = activeList.length
  const approvedNNyA = stats?.aprobados ?? 0
  const rejectedNNyA = stats?.noAprobados ?? 0
  const pendingTests = stats?.pendientes ?? 0
  const requierenPrunape = prunapeIds.size

  // Paginated list calculation (6 items per page)
  const itemsPerPage = 6
  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-1">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
            Actualizado: {new Date().toLocaleDateString('es-AR')}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy mt-1 leading-none">
            Listado de Niños (NNyA)
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/ninos/nuevo')}
            className="bg-primary hover:brightness-110 text-on-primary px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="h-4 w-4" />
            Agregar NNyA
          </button>
        </div>
      </header>

      {/* Bento Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Stat 1 */}
        <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NNyA Total</span>
            <div className="bg-slate-800 p-1.5 rounded-lg">
              <Users className="h-4 w-4 text-primary-fixed-dim" />
            </div>
          </div>
          <div className="text-3xl font-extrabold leading-none mt-2 font-display">{totalNNyA}</div>
        </div>

        {/* Stat 2 */}
        <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-100">NNyA Aprobados</span>
            <div className="bg-primary-container/80 p-1.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-extrabold leading-none mt-2 font-display">{approvedNNyA}</div>
        </div>

        {/* Stat 3 */}
        <div className="bg-error-container text-on-error-container p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">NNyA No aprobados</span>
            <div className="bg-red-100 p-1.5 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-extrabold leading-none mt-2 font-display">{rejectedNNyA}</div>
        </div>

        {/* Stat 4 */}
        <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100">Sin Evaluar</span>
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-orange-100" />
            </div>
          </div>
          <div className="text-3xl font-extrabold leading-none mt-2 font-display">{pendingTests}</div>
        </div>

        {/* Stat 5 — Requieren PRUNAPE (clickable filter) */}
        <button
          onClick={() => { setSoloAlerta(v => !v); setCurrentPage(1) }}
          className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md text-left w-full ${soloAlerta ? 'bg-violet-600 border-violet-500 text-white' : 'bg-violet-50 border-violet-200 text-violet-900'}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${soloAlerta ? 'text-violet-200' : 'text-violet-500'}`}>Requieren PRUNAPE</span>
            <div className={`p-1.5 rounded-lg ${soloAlerta ? 'bg-violet-500' : 'bg-violet-100'}`}>
              <Stethoscope className={`h-4 w-4 ${soloAlerta ? 'text-white' : 'text-violet-600'}`} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold leading-none mt-2 font-display">{requierenPrunape}</div>
            <p className={`text-[10px] font-semibold mt-1 ${soloAlerta ? 'text-violet-200' : 'text-violet-500'}`}>
              {soloAlerta ? 'Mostrando solo alertas — clic para ver todos' : '2 No Aprobadas consecutivas'}
            </p>
          </div>
        </button>
      </section>

      {/* Search & Filters */}
      <section className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline h-5 w-5" />
          <input
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm placeholder:text-outline"
            placeholder="Buscar NNyA por nombre, DNI o dirección..."
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        {soloAlerta && (
          <button
            onClick={() => { setSoloAlerta(false); setCurrentPage(1) }}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-3 rounded-full text-xs font-bold shrink-0 hover:bg-violet-700 transition-colors"
          >
            <Stethoscope className="h-4 w-4" />
            Alerta PRUNAPE activa — limpiar
          </button>
        )}
      </section>

      {/* Patient Table Card */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#111c2d] text-white">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">DIRECCIÓN</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">NOMBRE</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">TELÉFONO</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">DNI</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading || rol === null ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-secondary">
                    Cargando registros...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-secondary">
                    No se encontraron pacientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                currentItems.map((nino) => (
                  <tr key={nino.id} className={`hover:bg-slate-50 transition-colors group ${nino.requierePrunape ? 'bg-violet-50/60' : ''}`}>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                      {nino.direccion || 'Sin dirección registrada'}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface font-semibold">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{nino.apellido}, {nino.nombre}</span>
                        {nino.requierePrunape && (
                          <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0" title="Requiere iniciar PRUNAPE">
                            <Stethoscope className="h-3 w-3" />
                            Requiere PRUNAPE
                          </span>
                        )}
                        {nino.seguimiento && (
                          <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            nino.seguimiento.resultado === 'Pasó'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                              : 'bg-red-50 text-red-700 border-red-200/50'
                          }`}>
                            PRUNAPE: {nino.seguimiento.resultado}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant text-center">
                      {nino.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant text-center font-mono">
                      {nino.dni}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/ninos/${nino.id}`)}
                        className="inline-flex items-center gap-1 bg-primary hover:bg-primary-container text-on-primary px-4 py-1.5 rounded-full text-xs font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                      >
                        <Eye className="h-3 w-3" />
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-medium text-on-surface-variant">
            Mostrando {currentItems.length} de {filteredList.length} pacientes
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-on-surface-variant disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-xs transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-slate-200 text-on-surface-variant'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-on-surface-variant disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Decorative Illustration Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-primary-container/10 p-8 md:p-12 rounded-3xl overflow-hidden relative">
        <div className="z-10">
          <h3 className="text-2xl font-bold text-primary mb-3 font-display">Sistema de Evaluación Integral</h3>
          <p className="text-sm leading-relaxed text-on-surface-variant mb-6">
            Optimice la gestión del desarrollo infantil con herramientas clínicas avanzadas diseñadas para la precisión y el cuidado empático.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Legibilidad Clínica
            </div>
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Seguridad de Datos
            </div>
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Seguimiento Continuo
            </div>
          </div>
        </div>
        <div className="relative h-[240px] rounded-2xl overflow-hidden shadow-md border-4 border-white">
          <img
            alt="Medical professional examining a child development chart"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdh4qBswn1tFQbdG_H3NhGCzqFtszHewNIFYYXxZem3V1Y9hb2QgV-TqkZja5UcChqUSjDaraBRTqCrIF8QgPB7mJaPgl3l_RWNdp6T6KYZcv_T0Z3HiU2dXCxnsVnGMIsQNdRHRRoB2JMzLyOpfuzvfA2V5EYDvtPfERj3xD1g8yPsJFuztdiW8xxQNt1gQIG12L6ihuNtbdYbtTaWJOkWd3AjZDjVNBaqkrnf-xB3lMyw-4aUx0XfOIY41EY8SGq1DGT0XJZVjM"
          />
        </div>
      </section>
    </div>
  )
}
