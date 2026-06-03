import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  Search,
  Building2,
  MapPin,
  Baby,
  Network,
  Navigation,
  X,
  ExternalLink,
  Compass
} from 'lucide-react'

// Custom interface for the mapa_servicios view or table
interface MapaServicioView {
  id: number
  id_instituciones: number | null
  nombre: string | null
  nombre_de_la_entidad: string | null
  institucion: string | null
  departamento: string | null
  localidad: string | null
  denominacion_barrial: string | null
  domicilio: string | null
  latitud?: number | null
  longitud?: number | null
}

// Logo image helper component to handle error fallback gracefully
function LogoImage({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-outline-variant/30">
        <Building2 className="h-6 w-6" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/30 bg-white shrink-0 shadow-sm"
    />
  )
}

export default function InstitucionesPage() {
  const [activeTab, setActiveTab] = useState<'instituciones' | 'mapa'>('instituciones')

  // Search & Filter state for institutions
  const [searchTermPI, setSearchTermPI] = useState('')
  const [localidadFilterPI, setLocalidadFilterPI] = useState('')

  // Search & Filter state for service map
  const [searchTermServicios, setSearchTermServicios] = useState('')
  const [localidadFilterServicios, setLocalidadFilterServicios] = useState('')
  const [tipoFilterServicios, setTipoFilterServicios] = useState('')



  // Fetch institutions
  const { data: instituciones, isLoading: isLoadingPI } = useQuery({
    queryKey: ['instituciones-red-pi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institucionesredPI')
        .select('*')
      if (error) throw error
      return data || []
    }
  })

  // Fetch services map
  const { data: servicios, isLoading: isLoadingServicios } = useQuery<MapaServicioView[]>({
    queryKey: ['mapa-servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mapa_servicios_con_coords')
        .select('*')
      if (error) {
        console.warn('Error fetching mapa_servicios_con_coords view, trying mapa_servicios table:', error)
        // Fallback to table
        const { data: tableData, error: tableError } = await supabase
          .from('mapa_servicios')
          .select('*')
        if (tableError) throw tableError
        return tableData || []
      }
      return data || []
    }
  })

  // Tab 1 unique filters
  const uniqueLocalidadesPI = useMemo(() => {
    if (!instituciones) return []
    const locs = instituciones
      .map(i => i.Localidad)
      .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
    return Array.from(new Set(locs)).sort()
  }, [instituciones])

  // Tab 2 unique filters
  const uniqueLocalidadesServicios = useMemo(() => {
    if (!servicios) return []
    const locs = servicios
      .map(s => s.localidad)
      .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
    return Array.from(new Set(locs)).sort()
  }, [servicios])

  const uniqueTiposServicios = useMemo(() => {
    if (!servicios) return []
    const tipos = servicios
      .map(s => s.institucion)
      .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    return Array.from(new Set(tipos)).sort()
  }, [servicios])

  // Tab 1 client-side filter
  const filteredPI = useMemo(() => {
    if (!instituciones) return []
    return instituciones.filter(item => {
      const name = item["Nombre de la institución"] || ''
      const type = item["Institución"] || ''
      const axes = item["Eje de trabajo (se puede elegir más de una opción)"] || ''
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTermPI.toLowerCase()) ||
        type.toLowerCase().includes(searchTermPI.toLowerCase()) ||
        axes.toLowerCase().includes(searchTermPI.toLowerCase())
        
      const matchesLocalidad = !localidadFilterPI || item.Localidad === localidadFilterPI
      
      return matchesSearch && matchesLocalidad
    })
  }, [instituciones, searchTermPI, localidadFilterPI])

  // Tab 2 client-side filter
  const filteredServicios = useMemo(() => {
    if (!servicios) return []
    return servicios.filter(item => {
      const name = item.nombre || ''
      const entity = item.nombre_de_la_entidad || ''
      const address = item.domicilio || ''
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTermServicios.toLowerCase()) ||
        entity.toLowerCase().includes(searchTermServicios.toLowerCase()) ||
        address.toLowerCase().includes(searchTermServicios.toLowerCase())
        
      const matchesLocalidad = !localidadFilterServicios || item.localidad === localidadFilterServicios
      const matchesTipo = !tipoFilterServicios || item.institucion === tipoFilterServicios
      
      return matchesSearch && matchesLocalidad && matchesTipo
    })
  }, [servicios, searchTermServicios, localidadFilterServicios, tipoFilterServicios])

  // Helper to split and render axes as chips
  const renderAxesChips = (axesString?: string | null) => {
    if (!axesString) return null
    const list = axesString.split(',').map(s => s.trim()).filter(s => s !== '')
    if (list.length === 0) return null
    
    const visible = list.slice(0, 3)
    const extraCount = list.length - 3
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {visible.map((axis, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#475569] border border-slate-200"
          >
            {axis}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            +{extraCount} más
          </span>
        )}
      </div>
    )
  }

  // Get color for institution type
  const getBadgeTypeColor = (type?: string | null) => {
    if (!type) return 'bg-slate-100 text-slate-700'
    const t = type.toLowerCase()
    if (t.includes('municipal')) return 'bg-teal-500/10 text-teal-700 border border-teal-500/20'
    if (t.includes('provincial')) return 'bg-sky-500/10 text-sky-700 border border-sky-500/20'
    if (t.includes('nacional')) return 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
    if (t.includes('ong') || t.includes('civil') || t.includes('asociación')) return 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
    return 'bg-slate-500/10 text-slate-700 border border-slate-500/20'
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-navy tracking-tight">
            Instituciones y Servicios
          </h1>
          <p className="text-sm text-brand-slate-text mt-1">
            Directorio de organismos, programas gubernamentales y mapa general de servicios de atención.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#e2e8f0]/60 p-1.5 rounded-2xl flex gap-1 self-stretch md:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setActiveTab('instituciones')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'instituciones'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
            }`}
          >
            <Network className="h-4 w-4" />
            Instituciones Red PI
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${activeTab === 'instituciones' ? 'bg-primary text-on-primary' : 'bg-slate-200 text-slate-600'}`}>
              {filteredPI.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'mapa'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
            }`}
          >
            <Compass className="h-4 w-4" />
            Mapa de Servicios
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${activeTab === 'mapa' ? 'bg-primary text-on-primary' : 'bg-slate-200 text-slate-600'}`}>
              {filteredServicios.length}
            </span>
          </button>
        </div>
      </div>

      {/* SKELETON LOADER STATE */}
      {((activeTab === 'instituciones' && isLoadingPI) || (activeTab === 'mapa' && isLoadingServicios)) ? (
        <div className="space-y-6">
          {/* Skeleton Search Bar */}
          <div className="h-16 bg-white rounded-2xl shadow-sm border border-outline-variant/30 animate-pulse"></div>
          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-4 animate-pulse">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'instituciones' ? (
        /* --- TAB 1: INSTITUCIONES RED PI --- */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Buscar por institución, tipo, ejes de trabajo..."
                value={searchTermPI}
                onChange={(e) => setSearchTermPI(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTermPI && (
                <button
                  onClick={() => setSearchTermPI('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Localidad Filter */}
            <div className="w-full md:w-64">
              <select
                value={localidadFilterPI}
                onChange={(e) => setLocalidadFilterPI(e.target.value)}
                className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Todas las Localidades</option>
                {uniqueLocalidadesPI.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPI.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-outline-variant/30 hover:border-primary/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div>
                  {/* Top info row */}
                  <div className="flex gap-4 items-start">
                    <LogoImage src={item.logo} alt={item["Nombre de la institución"] || 'Logo'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeTypeColor(item["Institución"])}`}>
                          {item["Institución"] || 'Organismo'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface font-display group-hover:text-primary transition-colors leading-snug">
                        {item["Nombre de la institución"]}
                      </h3>
                    </div>
                  </div>

                  {/* Body description short snippet */}
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-4 line-clamp-2">
                    {item["Descripción del Programa/ abordaje en marcha"] || 'Sin descripción detallada disponible.'}
                  </p>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100/80 mt-4">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-medium">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{item.Localidad || 'Sin especificar'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-medium">
                      <Baby className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{item["Franja etaria con la que trabajan"] || 'Sin especificar'}</span>
                    </div>
                  </div>

                  {/* Ejes Chips */}
                  {item["Eje de trabajo (se puede elegir más de una opción)"] && (
                    <div className="pt-2">
                      {renderAxesChips(item["Eje de trabajo (se puede elegir más de una opción)"])}
                    </div>
                  )}
                </div>

                {/* Bottom Ver Detalle Button */}
                <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/instituciones/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors"
                  >
                    Ver detalle completo
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Empty view */}
            {filteredPI.length === 0 && (
              <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-dashed border-outline-variant/80 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Building2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-on-surface">No se encontraron instituciones</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                  Intente ajustar los filtros de búsqueda o localidad para encontrar lo que busca.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- TAB 2: MAPA DE SERVICIOS --- */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Buscar por punto de servicio, entidad o domicilio..."
                value={searchTermServicios}
                onChange={(e) => setSearchTermServicios(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTermServicios && (
                <button
                  onClick={() => setSearchTermServicios('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Localidad Filter */}
            <div className="w-full lg:w-64">
              <select
                value={localidadFilterServicios}
                onChange={(e) => setLocalidadFilterServicios(e.target.value)}
                className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Todas las Localidades</option>
                {uniqueLocalidadesServicios.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo/Institucion Filter */}
            <div className="w-full lg:w-64">
              <select
                value={tipoFilterServicios}
                onChange={(e) => setTipoFilterServicios(e.target.value)}
                className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Todos los Tipos</option>
                {uniqueTiposServicios.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServicios.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-outline-variant/30 hover:border-primary/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top header row */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeTypeColor(item.institucion)}`}>
                      {item.institucion || 'Punto de Servicio'}
                    </span>
                    
                    {/* Geolocation badge */}
                    {item.latitud && item.longitud && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                        <Navigation className="h-3 w-3 fill-emerald-600 rotate-45" />
                        Con geolocalización
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-on-surface font-display group-hover:text-primary transition-colors leading-snug">
                    {item.nombre}
                  </h3>

                  {item.nombre_de_la_entidad && (
                    <p className="text-xs text-brand-teal font-semibold mt-1">
                      Entidad: {item.nombre_de_la_entidad}
                    </p>
                  )}

                  {/* Details metadata */}
                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-medium">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {item.localidad} {item.denominacion_barrial ? `(${item.denominacion_barrial})` : ''}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-on-surface-variant text-[11px] font-medium">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      </div>
                      <span className="leading-relaxed">{item.domicilio || 'Domicilio no registrado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty view */}
            {filteredServicios.length === 0 && (
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-dashed border-outline-variant/80 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-on-surface">No se encontraron servicios</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                  Intente ajustar los filtros de búsqueda, localidad o tipos de institución.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
