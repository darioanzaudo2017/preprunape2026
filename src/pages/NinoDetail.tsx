import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  User,
  Calendar,
  Phone,
  MapPin,
  Users,
  Edit,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Eye,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Loader2,
  Save,
  X,
  Home
} from 'lucide-react'
import SeguimientoPrunape from '../components/SeguimientoPrunape'
import { FormularioHogar, useHogar } from '../features/hogar'

// Define data interface
interface NinoData {
  id: string
  dni: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  fechaNacRaw: string
  genero: string
  telefono: string
  responsable: string
  direccion: string
  localidad: string
  pesoNac: string
  prematuro: string
  semanas: number | null
  fechaNacReal: string
  otrasCaracteristicas: string
  
  // Adult fields
  adultId: number | null
  adultNombre: string
  adultDni: string
  adultTelefono: string
  adultParentesco: string
  adultNivelEducativo: string
  adultBarrio: string
  adultGenero: string
  adultEdad: string
  adultObservaciones: string
}

interface PruebaData {
  id_prueba: number
  fechaRealizacion: string
  formulario: string
  edadCalculada: string
  aprobado: string
  observacion: string
  espCuidado: string
  direccionEspCui: string
}

// Age calculator helper
function calculateAge(birthDateStr: string, testDateStr: string): string {
  try {
    const parseDate = (str: string) => {
      if (str.includes('-')) {
        return new Date(str)
      }
      const parts = str.split('/')
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
      }
      return new Date(str)
    }

    const birth = parseDate(birthDateStr)
    const test = parseDate(testDateStr)

    if (isNaN(birth.getTime()) || isNaN(test.getTime())) {
      return 'Edad no especificada'
    }

    let years = test.getFullYear() - birth.getFullYear()
    let months = test.getMonth() - birth.getMonth()
    let days = test.getDate() - birth.getDate()

    if (days < 0) {
      months -= 1
      const prevMonth = new Date(test.getFullYear(), test.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years -= 1
      months += 12
    }

    const parts = []
    if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`)
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`)
    if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`)

    return parts.join(', ') || '0 días'
  } catch (e) {
    return '3 años, 7 meses, 15 días'
  }
}

export default function NinoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const idninos = Number(id)
  const queryClient = useQueryClient()

  // Hogar hook and modal state
  const [isHogarModalOpen, setIsHogarModalOpen] = useState(false)
  const { hogarData, isLoading: isLoadingHogar } = useHogar(idninos)

  // Edit Modal States - Niño
  const [isEditing, setIsEditing] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editDni, setEditDni] = useState('')
  const [editFechaNac, setEditFechaNac] = useState('')
  const [editGenero, setEditGenero] = useState('Varon')
  const [editTelefono, setEditTelefono] = useState('')
  const [editDireccion, setEditDireccion] = useState('')
  const [editLocalidad, setEditLocalidad] = useState('')
  const [editPesoNac, setEditPesoNac] = useState('')
  const [editPrematuro, setEditPrematuro] = useState(false)
  const [editSemanas, setEditSemanas] = useState('')
  const [editFechaNacReal, setEditFechaNacReal] = useState('')
  const [editOtrasCaracteristicas, setEditOtrasCaracteristicas] = useState('')

  // Edit Modal States - Adulto Responsable
  const [editAdultId, setEditAdultId] = useState<number | null>(null)
  const [editAdultNombre, setEditAdultNombre] = useState('')
  const [editAdultDni, setEditAdultDni] = useState('')
  const [editAdultTelefono, setEditAdultTelefono] = useState('')
  const [editAdultParentesco, setEditAdultParentesco] = useState('')
  const [editAdultNivelEducativo, setEditAdultNivelEducativo] = useState('')
  const [editAdultBarrio, setEditAdultBarrio] = useState('')
  const [editAdultGenero, setEditAdultGenero] = useState('')
  const [editAdultEdad, setEditAdultEdad] = useState('')
  const [editAdultObservaciones, setEditAdultObservaciones] = useState('')

  // Fetch localities for dropdown
  const { data: localidadesList } = useQuery({
    queryKey: ['localidades-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('Localidad')
        .select('*')
        .order('Localidad', { ascending: true })
      return (data || []).map(row => row.Localidad as string)
    }
  })

  // Fetch latest follow-up status
  const { data: latestSeguimiento } = useQuery({
    queryKey: ['latest-seguimiento', idninos],
    queryFn: async () => {
      if (isNaN(idninos)) return null
      const { data, error } = await supabase
        .from('seguimiento_prunape')
        .select('resultado, fecha')
        .eq('id_nino', idninos)
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    }
  })

  // Fetch patient profile
  const { data: nino, isLoading: isLoadingNino } = useQuery<NinoData | null>({
    queryKey: ['nino', id],
    queryFn: async () => {
      if (isNaN(idninos)) return null

      const { data, error } = await supabase
        .from('niños')
        .select('idninos, dni, nombre, Direccion, Localidad, Telefonocontacto, adultoresponsable, fecha_nacimiento, genero, pesoNac, prematuro, semanas, fecha_nac_real, otras_características, idAdulto')
        .eq('idninos', idninos)
        .single()

      if (error) {
        console.error('Error fetching child detail:', error)
        return null
      }

      if (!data) return null

      // Fetch associated adult from public.adultos table
      let adultData = null
      if (data.idAdulto) {
        const { data: adult } = await supabase
          .from('adultos')
          .select('*')
          .eq('id', data.idAdulto)
          .single()
        adultData = adult
      } else {
        const { data: adult } = await supabase
          .from('adultos')
          .select('*')
          .eq('idNNyA', idninos)
          .maybeSingle()
        adultData = adult
      }

      const fullNombre = (data.nombre || '').trim()
      const nameParts = fullNombre.split(' ')
      const nombre = nameParts[0] || 'Sin nombre'
      const apellido = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sin apellido'

      return {
        id: String(data.idninos),
        dni: String(data.dni || ''),
        nombre,
        apellido,
        fechaNacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toLocaleDateString('es-AR') : 'Sin fecha',
        fechaNacRaw: data.fecha_nacimiento || '',
        genero: data.genero || 'Varon',
        telefono: data.Telefonocontacto ? String(data.Telefonocontacto) : '',
        responsable: data.adultoresponsable || 'Sin responsable registrado',
        direccion: data.Direccion || '',
        localidad: data.Localidad || '',
        pesoNac: data.pesoNac || '',
        prematuro: data.prematuro || 'No',
        semanas: data.semanas || null,
        fechaNacReal: data.fecha_nac_real || '',
        otrasCaracteristicas: data.otras_características || '',

        // Adult columns
        adultId: data.idAdulto || adultData?.id || null,
        adultNombre: adultData?.NombreyApellido || data.adultoresponsable || '',
        adultDni: adultData?.DNI || '',
        adultTelefono: adultData?.telefono || '',
        adultParentesco: adultData?.Parentezco || '',
        adultNivelEducativo: adultData?.NivelEducativo || '',
        adultBarrio: adultData?.Barrio || '',
        adultGenero: adultData?.genero || '',
        adultEdad: adultData?.Edad || '',
        adultObservaciones: adultData?.observaciones || ''
      }
    },
  })

  // Fetch evaluations
  const { data: pruebas, isLoading: isLoadingPruebas } = useQuery<PruebaData[]>({
    queryKey: ['pruebas', id],
    queryFn: async () => {
      if (isNaN(idninos)) return []

      const { data, error } = await supabase
        .from('Prueba_pre_prunape')
        .select('id_prueba, Fecha, Aprobado, Observacion, fechanacimiento, formulario, espCuidado, direccionEspCui')
        .eq('idniño', idninos)

      if (error) {
        console.error('Error fetching evaluations:', error)
        return []
      }

      return (data || []).map((item) => {
        const birthDate = item.fechanacimiento || ''
        const testDate = item.Fecha || ''

        // Normalize Aprobado text values
        let rawAprobado = String(item.Aprobado || 'No Evaluado').trim()
        let aprobado = 'No Evaluado'
        if (['aprobado', 'sí', 'si', 'yes', 'true'].includes(rawAprobado.toLowerCase())) {
          aprobado = 'Aprobado'
        } else if (['no aprobado', 'no'].includes(rawAprobado.toLowerCase())) {
          aprobado = 'No Aprobado'
        } else if (rawAprobado.toLowerCase() === 'no evaluado') {
          aprobado = 'No Evaluado'
        } else {
          aprobado = rawAprobado
        }

        return {
          id_prueba: item.id_prueba,
          fechaRealizacion: testDate ? new Date(testDate).toLocaleDateString('es-AR') : 'Sin fecha',
          formulario: item.formulario || 'Sin formulario',
          edadCalculada: birthDate && testDate ? calculateAge(birthDate, testDate) : 'Sin datos',
          aprobado,
          observacion: item.Observacion || 'Sin observación registrada.',
          espCuidado: item.espCuidado || 'No registrado',
          direccionEspCui: item.direccionEspCui || '',
        }
      })
    },
  })

  // Update Child + Adult Mutation
  const updateNinoMutation = useMutation({
    mutationFn: async (updated: {
      idninos: number
      nombre: string
      dni: number
      fecha_nacimiento: string | null
      genero: string
      Direccion: string
      Localidad: string
      Telefonocontacto: number | null
      pesoNac: string | null
      prematuro: 'Sí' | 'No'
      semanas: number | null
      fecha_nac_real: string | null
      otras_características: string | null

      // Adult fields
      adultId: number | null
      adultNombre: string
      adultDni: string
      adultTelefono: string
      adultParentesco: string
      adultNivelEducativo: string
      adultBarrio: string
      adultGenero: string
      adultEdad: string
      adultObservaciones: string
    }) => {
      // 1. Update niño public table
      const { error: childError } = await supabase
        .from('niños')
        .update({
          nombre: updated.nombre.toUpperCase(),
          dni: updated.dni,
          fecha_nacimiento: updated.fecha_nacimiento || null,
          genero: updated.genero,
          Direccion: updated.Direccion || null,
          Localidad: updated.Localidad || null,
          Telefonocontacto: updated.Telefonocontacto,
          pesoNac: updated.pesoNac || null,
          prematuro: updated.prematuro,
          semanas: updated.semanas,
          fecha_nac_real: updated.fecha_nac_real || null,
          otras_características: updated.otras_características || null,
          adultoresponsable: updated.adultNombre || null
        })
        .eq('idninos', updated.idninos)

      if (childError) throw childError

      // 2. Update or Insert public.adultos table
      if (updated.adultId) {
        const { error: adultError } = await supabase
          .from('adultos')
          .update({
            NombreyApellido: updated.adultNombre || null,
            DNI: updated.adultDni || null,
            telefono: updated.adultTelefono || null,
            Parentezco: updated.adultParentesco || null,
            Barrio: updated.adultBarrio || null,
            NivelEducativo: updated.adultNivelEducativo || null,
            genero: updated.adultGenero || null,
            Edad: updated.adultEdad || null,
            observaciones: updated.adultObservaciones || null
          })
          .eq('id', updated.adultId)

        if (adultError) throw adultError
      } else if (updated.adultNombre.trim()) {
        const { data: newAdult, error: adultInsertError } = await supabase
          .from('adultos')
          .insert({
            NombreyApellido: updated.adultNombre,
            DNI: updated.adultDni || null,
            telefono: updated.adultTelefono || null,
            Parentezco: updated.adultParentesco || null,
            Barrio: updated.adultBarrio || null,
            NivelEducativo: updated.adultNivelEducativo || null,
            genero: updated.adultGenero || null,
            Edad: updated.adultEdad || null,
            idNNyA: updated.idninos,
            observaciones: updated.adultObservaciones || null
          })
          .select()
          .single()

        if (adultInsertError) throw adultInsertError

        if (newAdult) {
          await supabase
            .from('niños')
            .update({ idAdulto: newAdult.id })
            .eq('idninos', updated.idninos)
        }
      }
    },
    onSuccess: () => {
      toast.success('¡Expediente del paciente y del adulto responsable actualizado con éxito!')
      queryClient.invalidateQueries({ queryKey: ['nino', id] })
      setIsEditing(false)
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al actualizar los expedientes.')
    }
  })

  const handleOpenEdit = () => {
    if (!nino) return
    const full = (nino.nombre + ' ' + nino.apellido).trim()
    setEditNombre(full)
    setEditDni(nino.dni)
    setEditFechaNac(nino.fechaNacRaw)
    setEditGenero(nino.genero)
    setEditTelefono(nino.telefono)
    setEditDireccion(nino.direccion)
    setEditLocalidad(nino.localidad)
    setEditPesoNac(nino.pesoNac)
    setEditPrematuro(nino.prematuro === 'Sí')
    setEditSemanas(String(nino.semanas || ''))
    setEditFechaNacReal(nino.fechaNacReal)
    setEditOtrasCaracteristicas(nino.otrasCaracteristicas)

    // Load adult states
    setEditAdultId(nino.adultId)
    setEditAdultNombre(nino.adultNombre)
    setEditAdultDni(nino.adultDni)
    setEditAdultTelefono(nino.adultTelefono)
    setEditAdultParentesco(nino.adultParentesco)
    setEditAdultNivelEducativo(nino.adultNivelEducativo)
    setEditAdultBarrio(nino.adultBarrio)
    setEditAdultGenero(nino.adultGenero)
    setEditAdultEdad(nino.adultEdad)
    setEditAdultObservaciones(nino.adultObservaciones)

    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editNombre.trim()) {
      toast.error('El nombre completo del niño es requerido.')
      return
    }
    const dniNum = parseInt(editDni)
    if (isNaN(dniNum)) {
      toast.error('El DNI del niño debe ser un número válido.')
      return
    }

    const phoneNum = editTelefono.trim() ? parseInt(editTelefono) : null
    const weeksNum = editSemanas.trim() ? parseInt(editSemanas) : null

    updateNinoMutation.mutate({
      idninos,
      nombre: editNombre.trim(),
      dni: dniNum,
      fecha_nacimiento: editFechaNac || null,
      genero: editGenero,
      Direccion: editDireccion.trim(),
      Localidad: editLocalidad,
      Telefonocontacto: isNaN(Number(phoneNum)) ? null : phoneNum,
      pesoNac: editPesoNac.trim() || null,
      prematuro: editPrematuro ? 'Sí' : 'No',
      semanas: isNaN(Number(weeksNum)) ? null : weeksNum,
      fecha_nac_real: editFechaNacReal || null,
      otras_características: editOtrasCaracteristicas.trim() || null,

      // Adult responsible details
      adultId: editAdultId,
      adultNombre: editAdultNombre.trim(),
      adultDni: editAdultDni.trim(),
      adultTelefono: editAdultTelefono.trim(),
      adultParentesco: editAdultParentesco,
      adultNivelEducativo: editAdultNivelEducativo,
      adultBarrio: editAdultBarrio.trim(),
      adultGenero: editAdultGenero,
      adultEdad: editAdultEdad.trim(),
      adultObservaciones: editAdultObservaciones.trim()
    })
  }

  const activeNino = nino ?? null
  const activePruebas = pruebas ?? []

  if (isLoadingNino || isLoadingPruebas) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-secondary text-sm">Cargando historial clínico del paciente...</p>
      </div>
    )
  }

  if (!activeNino) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border">
        <p className="text-secondary text-sm">No se encontró información del niño solicitado.</p>
        <Link to="/" className="mt-4 inline-block text-primary font-semibold hover:underline">
          Volver al Dashboard
        </Link>
      </div>
    )
  }

  const totalEvaluations = activePruebas.length
  const approvedEvaluations = activePruebas.filter((p) => p.aprobado === 'Aprobado').length
  const unapprovedEvaluations = activePruebas.filter((p) => p.aprobado === 'No Aprobado').length

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-on-surface-variant mb-2">
        <Link to="/" className="text-xs hover:text-primary transition-colors">
          Pacientes
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-xs font-semibold text-primary">
          {activeNino.apellido}, {activeNino.nombre}
        </span>
      </nav>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Patient Identity Card */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shrink-0">
            <User className="h-12 w-12" />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-on-surface font-display flex flex-wrap items-center gap-2.5">
                  {activeNino.nombre} {activeNino.apellido}
                  {latestSeguimiento && (
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                      latestSeguimiento.resultado === 'Pasó'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        : 'bg-red-50 text-red-700 border-red-200/50'
                    }`}>
                      PRUNAPE: {latestSeguimiento.resultado}
                    </span>
                  )}
                </h2>
                <p className="text-sm font-semibold text-primary mt-0.5 tracking-wider">
                  DNI {activeNino.dni}
                </p>
              </div>
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-1 px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-primary border border-outline-variant/30 rounded-lg transition-all active:scale-95 text-xs font-semibold"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-on-surface-variant shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Fecha de Nac.</p>
                  <p className="text-sm font-medium">{activeNino.fechaNacimiento}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-on-surface-variant shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Contacto</p>
                  <p className="text-sm font-medium">{activeNino.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-on-surface-variant shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Responsable</p>
                  <p className="text-sm font-medium">{activeNino.responsable}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-on-surface-variant shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Domicilio</p>
                  <p className="text-sm font-medium">{activeNino.direccion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-primary p-5 rounded-2xl flex items-center justify-between text-on-primary shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="text-xs font-medium opacity-90">Pruebas Totales</p>
              <p className="text-3xl font-extrabold font-display">
                {String(totalEvaluations).padStart(2, '0')}
              </p>
            </div>
            <ClipboardList className="h-10 w-10 opacity-30" />
          </div>

          <div className="bg-white p-5 rounded-2xl flex items-center justify-between border-l-4 border-primary shadow-sm border border-outline-variant/30">
            <div>
              <p className="text-xs font-semibold text-slate-400">Pruebas Aprobadas</p>
              <p className="text-3xl font-extrabold text-primary font-display">
                {String(approvedEvaluations).padStart(2, '0')}
              </p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-primary/20" />
          </div>

          <div className="bg-white p-5 rounded-2xl flex items-center justify-between border-l-4 border-red-500 shadow-sm border border-outline-variant/30">
            <div>
              <p className="text-xs font-semibold text-slate-400">No Aprobadas</p>
              <p className="text-3xl font-extrabold text-red-500 font-display">
                {String(unapprovedEvaluations).padStart(2, '0')}
              </p>
            </div>
            <XCircle className="h-10 w-10 text-red-500/20" />
          </div>
        </div>



        {/* Evaluations History Table */}
        <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-on-surface font-display">
                Historial de Evaluaciones
              </h3>
              <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold">
                {totalEvaluations} {totalEvaluations === 1 ? 'REGISTRO' : 'REGISTROS'}
              </span>
            </div>
            <Link
              to={`/ninos/${id}/nueva-prueba`}
              className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Agregar Prueba
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#545f73] text-white">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider pl-8">Fecha</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Formulario</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Resultado</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Espacio de Cuidado</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Observaciones</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePruebas.map((prueba, index) => (
                  <tr key={prueba.id_prueba || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                        <span className="text-sm font-semibold">{prueba.fechaRealizacion}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex bg-teal-50 px-2.5 py-1 rounded text-primary font-bold text-xs">
                        {prueba.formulario}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prueba.aprobado === 'Aprobado' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                          Aprobado
                        </span>
                      ) : prueba.aprobado === 'No Aprobado' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500">
                          No Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-500">
                          No Evaluado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                      {prueba.espCuidado}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[200px] truncate" title={prueba.observacion}>
                      {prueba.observacion}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button className="flex items-center gap-1 px-4 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-full transition-all active:scale-95 text-xs font-semibold">
                          <Eye className="h-3.5 w-3.5" />
                          Ver Detalle
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medical Observations Log */}
        <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h4 className="text-lg font-bold text-on-surface mb-4 font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Observaciones Médicas
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {activePruebas.map((prueba, index) => (
              <div key={index} className="min-w-[320px] max-w-[350px] p-4 bg-slate-50 rounded-xl border border-outline-variant/20 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-primary">Nota de Evolución</span>
                    <span className="text-[10px] text-slate-400">{prueba.fechaRealizacion}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-4">
                    {prueba.observacion}
                  </p>
                </div>
              </div>
            ))}
            {activePruebas.length === 0 && (
              <p className="text-sm text-on-surface-variant py-2">Sin observaciones registradas.</p>
            )}
          </div>
        </div>

        {/* Contexto Socioeconómico y Habitacional (Hogar) */}
        <div className="col-span-12">
          {isLoadingHogar ? (
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mr-3" />
              <span className="text-sm font-medium text-slate-500">Cargando datos del hogar...</span>
            </div>
          ) : !hogarData || !hogarData.hogar ? (
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2 font-display">
                  <Home className="h-5 w-5 text-slate-400" />
                  Contexto Socioeconómico y Habitacional
                </h4>
                <p className="text-sm text-slate-500 max-w-2xl">
                  No se han registrado datos de vivienda, educación ni servicios básicos para este hogar. Completar este módulo ayuda a identificar condiciones de vulnerabilidad o necesidades de apoyo.
                </p>
              </div>
              <button
                onClick={() => setIsHogarModalOpen(true)}
                className="shrink-0 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="h-4.5 w-4.5" />
                Registrar Datos del Hogar
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-on-surface flex items-center gap-2 font-display">
                    <Home className="h-5 w-5 text-primary" />
                    Contexto Socioeconómico y Habitacional
                  </h4>
                  <p className="text-xs text-slate-400">
                    Última actualización: {hogarData.snapshot?.fecha ? new Date(hogarData.snapshot.fecha).toLocaleDateString('es-AR') : 'Sin fecha'}
                  </p>
                </div>
                <button
                  onClick={() => setIsHogarModalOpen(true)}
                  className="px-4 py-2 border border-primary text-primary hover:bg-primary/5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <Edit className="h-4 w-4" />
                  Actualizar Datos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ubicación y Barrio */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ubicación y Barrio</span>
                  <div className="text-sm font-bold text-slate-700">
                    {hogarData.hogar?.localidad || 'Sin Localidad'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {hogarData.hogar?.barrio || 'Sin Barrio'} ({hogarData.hogar?.tipo_barrio === 'formal' ? 'Formal' : 'Informal'})
                  </div>
                </div>

                {/* Composición y Hacinamiento */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Estructura y Hacinamiento</span>
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <span>{hogarData.hogar?.cant_personas || 0} personas</span>
                    <span className="text-slate-300">|</span>
                    <span>{hogarData.snapshot?.cant_ambientes || 0} amb.</span>
                  </div>
                  <div>
                    {hogarData.snapshot?.hacinamiento === 'sin_hacinamiento' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Sin Hacinamiento
                      </span>
                    )}
                    {hogarData.snapshot?.hacinamiento === 'hacinamiento' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                        Hacinamiento
                      </span>
                    )}
                    {hogarData.snapshot?.hacinamiento === 'hacinamiento_critico' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                        Hacinamiento Crítico
                      </span>
                    )}
                  </div>
                </div>

                {/* Nivel Educativo y Empleo */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Jefe/a de Hogar</span>
                  <div className="text-sm font-bold text-slate-700 capitalize truncate">
                    {hogarData.snapshot?.nivel_educativo_jefe?.replace(/_/g, ' ') || 'Sin nivel educativo'}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    Trabajo: {hogarData.snapshot?.situacion_ocupacional || 'No especificado'}
                  </div>
                </div>

                {/* Cobertura e Ingresos */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Salud e Ingresos</span>
                  <div className="text-sm font-bold text-slate-700 capitalize">
                    {hogarData.snapshot?.cobertura_salud?.replace(/_/g, ' ') || 'Sin cobertura'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Ingresos: {hogarData.snapshot?.escala_ingresos === 'menos_1_sml' ? 'Menos de 1 SMVM' : 
                               hogarData.snapshot?.escala_ingresos === 'entre_1_2_sml' ? '1 a 2 SMVM' :
                               hogarData.snapshot?.escala_ingresos === 'entre_2_3_sml' ? '2 a 3 SMVM' :
                               hogarData.snapshot?.escala_ingresos === 'mas_3_sml' ? 'Más de 3 SMVM' : 'No especificado'}
                  </div>
                </div>
              </div>

              {hogarData.snapshot?.observaciones && (
                <div className="text-xs text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                  <span className="font-bold text-slate-600">Observaciones del Hogar:</span> {hogarData.snapshot.observaciones}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seguimiento PRUNAPE Form Section */}
        <div className="col-span-12">
          <SeguimientoPrunape idNino={idninos} mode="form" />
        </div>

        {/* Seguimiento PRUNAPE Timeline Section */}
        <div className="col-span-12">
          <SeguimientoPrunape idNino={idninos} mode="timeline" />
        </div>
      </div>

      {/* --- HOGAR FORM MODAL DIALOG --- */}
      {isHogarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/30 max-w-4xl w-full overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="overflow-y-auto flex-1">
              <FormularioHogar 
                idNino={idninos} 
                onClose={() => setIsHogarModalOpen(false)} 
                onSuccess={() => setIsHogarModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* --- INLINE EDIT PATIENT MODAL DIALOG --- */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/30 max-w-2xl w-full overflow-hidden animate-scale-up">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-on-surface font-display flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-primary" /> Editar Expediente del Niño/a
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildName">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="editChildName"
                  type="text"
                  placeholder="Ej. THIAGO ALEJANDRO MORENO"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* DNI */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildDni">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  id="editChildDni"
                  type="number"
                  placeholder="Sólo números"
                  value={editDni}
                  onChange={(e) => setEditDni(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildDob">
                  Fecha de Nacimiento
                </label>
                <input
                  id="editChildDob"
                  type="date"
                  value={editFechaNac}
                  onChange={(e) => setEditFechaNac(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Genero */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildGender">
                  Género
                </label>
                <select
                  id="editChildGender"
                  value={editGenero}
                  onChange={(e) => setEditGenero(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="Varon">Varon</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>

              {/* Peso Nac. */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildWeight">
                  Peso al Nacer
                </label>
                <input
                  id="editChildWeight"
                  type="text"
                  placeholder="Ej. 3200g o 3.2kg"
                  value={editPesoNac}
                  onChange={(e) => setEditPesoNac(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Domicilio */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildAddr">
                  Domicilio (Dirección)
                </label>
                <input
                  id="editChildAddr"
                  type="text"
                  placeholder="Calle, número, depto"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Localidad select dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildLoc">
                  Localidad
                </label>
                <select
                  id="editChildLoc"
                  value={editLocalidad}
                  onChange={(e) => setEditLocalidad(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Seleccione localidad</option>
                  {(localidadesList || []).map((locName) => (
                    <option key={locName} value={locName}>
                      {locName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildPhone">
                  Teléfono de Contacto
                </label>
                <input
                  id="editChildPhone"
                  type="number"
                  placeholder="Sólo números"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Prematuro toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-outline-variant/60">
                <input
                  id="editChildPrem"
                  type="checkbox"
                  checked={editPrematuro}
                  onChange={(e) => setEditPrematuro(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20"
                />
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-on-surface cursor-pointer select-none" htmlFor="editChildPrem">
                    ¿Es prematuro/a?
                  </label>
                  <span className="text-[10px] text-slate-400">Marque si nació antes de término.</span>
                </div>
              </div>

              {/* Prematuro conditional details */}
              {editPrematuro && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50/50 rounded-xl border border-outline-variant/30">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildWeeks">
                      Semanas de Gestación
                    </label>
                    <input
                      id="editChildWeeks"
                      type="number"
                      placeholder="Ej. 34"
                      value={editSemanas}
                      onChange={(e) => setEditSemanas(e.target.value)}
                      className="w-full px-4 py-2 border border-outline rounded-xl bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildRealDob">
                      Fecha Nacimiento Real
                    </label>
                    <input
                      id="editChildRealDob"
                      type="date"
                      value={editFechaNacReal}
                      onChange={(e) => setEditFechaNacReal(e.target.value)}
                      className="w-full px-4 py-2 border border-outline rounded-xl bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Otras Características */}
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editChildNotes">
                  Otras Características / Observaciones del Niño/a
                </label>
                <textarea
                  id="editChildNotes"
                  placeholder="Detalles clínicos o sociales relevantes..."
                  value={editOtrasCaracteristicas}
                  onChange={(e) => setEditOtrasCaracteristicas(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                />
              </div>

              {/* DATOS DEL ADULTO RESPONSABLE */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-primary font-display flex items-center gap-1.5 mb-1">
                  <Users className="h-4.5 w-4.5" /> Datos del Adulto Responsable
                </h4>
                <p className="text-[10px] text-slate-400">Información del responsable a cargo del niño/a.</p>
              </div>

              {/* Nombre Adulto */}
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultName">
                  Nombre Completo del Adulto
                </label>
                <input
                  id="editAdultName"
                  type="text"
                  placeholder="Nombre y Apellido del adulto"
                  value={editAdultNombre}
                  onChange={(e) => setEditAdultNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* DNI Adulto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultDni">
                  DNI del Adulto
                </label>
                <input
                  id="editAdultDni"
                  type="text"
                  placeholder="Ej. DNI o LC"
                  value={editAdultDni}
                  onChange={(e) => setEditAdultDni(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Telefono Adulto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultPhone">
                  Teléfono del Adulto
                </label>
                <input
                  id="editAdultPhone"
                  type="text"
                  placeholder="Número de contacto"
                  value={editAdultTelefono}
                  onChange={(e) => setEditAdultTelefono(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Parentesco */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultRel">
                  Parentesco
                </label>
                <select
                  id="editAdultRel"
                  value={editAdultParentesco}
                  onChange={(e) => setEditAdultParentesco(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Seleccione relación</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Tutor/a">Tutor/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Barrio */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultBarrio">
                  Barrio
                </label>
                <input
                  id="editAdultBarrio"
                  type="text"
                  placeholder="Barrio de residencia"
                  value={editAdultBarrio}
                  onChange={(e) => setEditAdultBarrio(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Nivel Educativo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultEdu">
                  Nivel Educativo
                </label>
                <input
                  id="editAdultEdu"
                  type="text"
                  placeholder="Ej. Secundario Completo"
                  value={editAdultNivelEducativo}
                  onChange={(e) => setEditAdultNivelEducativo(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Género Adulto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultGender">
                  Género del Adulto
                </label>
                <select
                  id="editAdultGender"
                  value={editAdultGenero}
                  onChange={(e) => setEditAdultGenero(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Seleccione género</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Varon">Varon</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Edad Adulto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultAge">
                  Edad del Adulto
                </label>
                <input
                  id="editAdultAge"
                  type="text"
                  placeholder="Ej. 32 años"
                  value={editAdultEdad}
                  onChange={(e) => setEditAdultEdad(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Observaciones Adulto */}
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editAdultNotes">
                  Observaciones sobre el Adulto
                </label>
                <textarea
                  id="editAdultNotes"
                  placeholder="Detalles adicionales sobre la situación familiar, ocupación, etc..."
                  value={editAdultObservaciones}
                  onChange={(e) => setEditAdultObservaciones(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 border border-outline rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateNinoMutation.isPending}
                className="bg-primary hover:brightness-110 text-on-primary px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateNinoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
