import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  ArrowLeft,
  Building2,
  MapPin,
  Baby,
  Navigation,
  Search,
  X,
  Globe,
  Users,
  BookOpen,
  Briefcase,
  Layers,
  Heart,
  Map
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

// Leaflet standard marker icon override for Vite to prevent missing asset icon issue
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Logo image helper component to handle error fallback gracefully
function LogoImage({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-outline-variant/30">
        <Building2 className="h-8 w-8" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-16 h-16 rounded-2xl object-cover border border-outline-variant/30 bg-white shrink-0 shadow-sm"
    />
  )
}

export default function InstitucionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const idNum = id ? parseInt(id, 10) : undefined
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch individual institution details
  const { data: institucion, isLoading: isLoadingPI, error: piError } = useQuery({
    queryKey: ['institucion', idNum],
    queryFn: async () => {
      if (idNum === undefined || isNaN(idNum)) throw new Error('ID inválido')
      const { data, error } = await supabase
        .from('institucionesredPI')
        .select('*')
        .eq('id', idNum)
        .single()
      if (error) throw error
      return data
    },
    enabled: idNum !== undefined && !isNaN(idNum)
  })

  // Fetch all related points of service (mapa_servicios) linked by FK
  const { data: servicios, isLoading: isLoadingServicios } = useQuery<MapaServicioView[]>({
    queryKey: ['institucion-servicios', idNum],
    queryFn: async () => {
      if (idNum === undefined || isNaN(idNum)) throw new Error('ID inválido')
      const { data, error } = await supabase
        .from('mapa_servicios_con_coords')
        .select('*')
        .eq('id_instituciones', idNum)
      if (error) {
        console.warn('Error fetching view coords, falling back to table:', error)
        const { data: tableData, error: tableError } = await supabase
          .from('mapa_servicios')
          .select('*')
          .eq('id_instituciones', idNum)
        if (tableError) throw tableError
        return tableData || []
      }
      return data || []
    },
    enabled: idNum !== undefined && !isNaN(idNum)
  })

  // Client-side search within the list of related service points
  const filteredServicios = useMemo(() => {
    if (!servicios) return []
    return servicios.filter(item => {
      const name = item.nombre || ''
      const entity = item.nombre_de_la_entidad || ''
      const address = item.domicilio || ''
      const locality = item.localidad || ''
      const neighborhood = item.denominacion_barrial || ''
      
      const query = searchTerm.toLowerCase()
      return (
        name.toLowerCase().includes(query) ||
        entity.toLowerCase().includes(query) ||
        address.toLowerCase().includes(query) ||
        locality.toLowerCase().includes(query) ||
        neighborhood.toLowerCase().includes(query)
      )
    })
  }, [servicios, searchTerm])

  // Get only geolocalized points for the map
  const mapPoints = useMemo(() => {
    return filteredServicios.filter((s): s is MapaServicioView & { latitud: number; longitud: number } => 
      typeof s.latitud === 'number' && typeof s.longitud === 'number'
    )
  }, [filteredServicios])

  // Map center calculation
  const mapCenter = useMemo(() => {
    if (mapPoints.length > 0) {
      return [mapPoints[0].latitud, mapPoints[0].longitud]
    }
    return [-31.4201, -64.1888] // Cordoba center default
  }, [mapPoints])

  const getBadgeTypeColor = (type?: string | null) => {
    if (!type) return 'bg-slate-100 text-slate-700'
    const t = type.toLowerCase()
    if (t.includes('municipal')) return 'bg-teal-500/10 text-teal-700 border border-teal-500/20'
    if (t.includes('provincial')) return 'bg-sky-500/10 text-sky-700 border border-sky-500/20'
    if (t.includes('nacional')) return 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
    if (t.includes('ong') || t.includes('civil') || t.includes('asociación')) return 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
    return 'bg-slate-500/10 text-slate-700 border border-slate-500/20'
  }

  if (isLoadingPI) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 space-y-6 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2 pt-4">
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="h-16 bg-slate-100 rounded-xl w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (piError || !institucion) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <X className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">No se encontró la institución</h3>
        <p className="text-sm text-on-surface-variant">
          El registro solicitado no existe o no tiene los permisos suficientes.
        </p>
        <Link
          to="/instituciones"
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Directorio
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Header Back Link */}
      <div>
        <Link
          to="/instituciones"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors group mb-2"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Directorio de Instituciones
        </Link>

        <div className="flex gap-4 items-start mt-2">
          <LogoImage src={institucion.logo} alt={institucion["Nombre de la institución"] || 'Logo'} />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeTypeColor(institucion["Institución"])}`}>
                {institucion["Institución"] || 'Organismo'}
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-brand-navy leading-tight">
              {institucion["Nombre de la institución"]}
            </h1>
          </div>
        </div>
      </div>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Institution Profile Details ( BENTO SIDE ) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Description / Abordaje */}
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <BookOpen className="h-4.5 w-4.5 text-primary" /> Descripción del Programa / Abordaje
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line bg-[#f7f9fb] p-4 rounded-xl border border-outline-variant/20">
              {institucion["Descripción del Programa/ abordaje en marcha"] || 'Sin descripción detallada registrada.'}
            </p>
          </div>

          {/* Card 2: Ubicación & Cobertura */}
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Layers className="h-4.5 w-4.5 text-primary" /> Ubicación y Cobertura
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Localidad</span>
                <p className="font-semibold text-on-surface flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {institucion.Localidad || 'No registrada'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Dirección</span>
                <p className="font-semibold text-on-surface truncate">{institucion.Direccion || 'No registrada'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Franja Etaria</span>
                <p className="font-semibold text-on-surface flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {institucion["Franja etaria con la que trabajan"] || 'No especificada'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Alcance de NNyA</span>
                <p className="font-semibold text-on-surface flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {institucion["¿A qué cantidad de NNyA alcanzan el programa?."] || 'No especificado'}
                </p>
              </div>
            </div>

            {institucion["¿Qué va a sumar tu institución?"] && (
              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Aportes a la Red</span>
                <p className="text-on-surface-variant leading-relaxed mt-1">{institucion["¿Qué va a sumar tu institución?"]}</p>
              </div>
            )}
          </div>

          {/* Card 3: Ejes de Trabajo */}
          {institucion["Eje de trabajo (se puede elegir más de una opción)"] && (
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Briefcase className="h-4.5 w-4.5 text-primary" /> Ejes de Trabajo
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {institucion["Eje de trabajo (se puede elegir más de una opción)"]
                  .split(',')
                  .map((axis: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#f1f5f9] text-[#475569] border border-slate-200"
                    >
                      {axis.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Card 4: Contacto & Redes */}
          <div className="bg-[#f0f9ff]/50 rounded-2xl p-6 border border-[#bae6fd]/40 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal flex items-center gap-1.5 border-b border-[#bae6fd]/20 pb-2">
              <Heart className="h-4.5 w-4.5" /> Canales de Contacto
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500">Contacto de Referencia</span>
                <p className="font-semibold text-on-surface mt-1 whitespace-pre-line leading-relaxed">
                  {institucion["Contacto de referencia"] || 'Sin información de contacto registrada.'}
                </p>
              </div>

              {institucion["Redes sociales de la institución"] && (
                <div className="pt-2 border-t border-[#bae6fd]/30">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    Canales Digitales
                  </span>
                  <p className="font-semibold text-on-surface mt-1 truncate">
                    {institucion["Redes sociales de la institución"]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Puntos de Servicio ( list & map ) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Interactive Map of points of service */}
          {mapPoints.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Map className="h-4.5 w-4.5 text-primary" /> Mapa Geográfico de Servicios
              </h3>
              <div className="h-[300px] w-full rounded-xl overflow-hidden border border-outline-variant/20 shadow-inner relative z-0">
                <MapContainer center={mapCenter as [number, number]} zoom={12} className="h-full w-full z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mapPoints.map((point) => (
                    <Marker key={point.id} position={[point.latitud, point.longitud]} icon={markerIcon}>
                      <Popup>
                        <div className="p-1 space-y-1 text-xs">
                          <p className="font-bold text-brand-navy leading-tight">{point.nombre}</p>
                          {point.nombre_de_la_entidad && (
                            <p className="font-semibold text-brand-teal text-[10px]">Entidad: {point.nombre_de_la_entidad}</p>
                          )}
                          <p className="text-[10px] text-slate-500">{point.domicilio}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}
          
          {/* Search list container */}
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div>
              {/* Header inside bento */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-bold text-on-surface">
                    Puntos de Servicio Vinculados
                  </h2>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold shadow-sm">
                    {filteredServicios.length} {filteredServicios.length === 1 ? 'PUNTO' : 'PUNTOS'}
                  </span>
                </div>

                {/* Sub-search input */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o barrio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 border border-outline rounded-xl bg-[#f7f9fb] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Service Cards list wrapper */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredServicios.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#f7f9fb] p-5 rounded-xl border border-outline-variant/20 hover:border-primary/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-1">
                        <h4 className="text-sm font-bold text-on-surface font-display leading-tight">
                          {item.nombre}
                        </h4>

                        {item.latitud && item.longitud && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-extrabold border border-emerald-500/20 shadow-sm shrink-0">
                            <Navigation className="h-2.5 w-2.5 fill-emerald-600 rotate-45" />
                            GPS
                          </span>
                        )}
                      </div>

                      {item.nombre_de_la_entidad && (
                        <p className="text-[11px] text-brand-teal font-semibold">
                          Entidad: {item.nombre_de_la_entidad}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 mt-3 text-[11px] text-on-surface-variant">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {item.localidad} {item.denominacion_barrial ? `(${item.denominacion_barrial})` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium leading-relaxed">
                          <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          </div>
                          <span className="truncate">{item.domicilio || 'Domicilio no registrado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading services state */}
                {isLoadingServicios && (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2].map((idx) => (
                      <div key={idx} className="h-20 bg-slate-100 rounded-xl w-full"></div>
                    ))}
                  </div>
                )}

                {/* Empty points count */}
                {filteredServicios.length === 0 && !isLoadingServicios && (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Search className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-bold text-on-surface">No se encontraron puntos de servicio</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 max-w-xs">
                      No hay registros coincidentes de servicios relacionados para esta institución.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
