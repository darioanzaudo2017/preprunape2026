import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  BookOpen,
  Loader2,
  ArrowRight,
  Save,
  HelpCircle,
  Flame,
  ImageIcon,
  X,
  Trophy
} from 'lucide-react'
import type { Nino, Pregunta2, ConfigFormulario } from '../types/database'

type ResultadoFila = {
  pregunta_texto: string
  pregunta_categoria: string
  respuesta_texto: string
  resultado: string
}

// Helper to calculate exact age in months at the moment of the test.
// Parses date parts manually to avoid JS Date UTC offset shifting the day.
function calculateAgeInMonths(birthDateStr: string, testDateStr: string): number {
  const [by, bm, bd] = birthDateStr.split('-').map(Number)
  const [ty, tm, td] = testDateStr.split('-').map(Number)
  if (!by || !ty) return 0

  let months = (ty - by) * 12 + (tm - bm)
  if (td < bd) months--
  return Math.max(0, months)
}

// Convert months to human readable age string
function monthsToAgeString(totalMonths: number): string {
  if (totalMonths < 0) return '0 meses'
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`)
  
  return parts.join(', ') || '0 meses'
}

// Rango Formulario Mapping
const RANGOS_FORMULARIOS = [
  { form: 'Form 1', min: 6, max: 11, label: '6 a 11 meses' },
  { form: 'Form 2', min: 12, max: 17, label: '12 a 17 meses' },
  { form: 'Form 3', min: 18, max: 29, label: '18 a 29 meses' },
  { form: 'Form 4', min: 30, max: 47, label: '30 a 47 meses' },
  { form: 'Form 5', min: 48, max: 71, label: '48 a 71 meses' },
]

function getFormByAge(months: number): { form: 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'; label: string } {
  const found = RANGOS_FORMULARIOS.find(r => months >= r.min && months <= r.max)
  if (found) return { form: found.form as any, label: found.label }
  
  if (months < 6) return { form: 'Form 1', label: 'Menor a 6 meses (Usa Form 1 por defecto)' }
  return { form: 'Form 5', label: 'Mayor a 71 meses (Usa Form 5 por defecto)' }
}

// Parse "Xm Yd" format from intervalosevaluacion into total days for comparison
function parseEdadToDays(edadStr: string): number {
  const mMatch = edadStr.match(/(\d+)m/)
  const dMatch = edadStr.match(/(\d+)d/)
  const months = mMatch ? parseInt(mMatch[1]) : 0
  const days = dMatch ? parseInt(dMatch[1]) : 0
  return months * 30 + days
}

// Calculate age as (months * 30 + days) matching Postgres AGE() logic:
// months = complete calendar months elapsed, days = remaining calendar days.
// This matches the formula used in intervalosevaluacion and ejecutar_consulta_prueba.
function calculateAgeInDays(birthDateStr: string, testDateStr: string): number {
  const [by, bm, bd] = birthDateStr.split('-').map(Number)
  const [ty, tm, td] = testDateStr.split('-').map(Number)
  if (!by || !ty) return 0

  // Complete calendar months (same as Postgres EXTRACT(MONTH FROM AGE(...)))
  let months = (ty - by) * 12 + (tm - bm)
  // Remaining days within the current month
  let days = td - bd
  if (days < 0) {
    months--
    // Days remaining = days in the previous month minus the shortfall
    const prevMonth = tm === 1 ? 12 : tm - 1
    const prevYear = tm === 1 ? ty - 1 : ty
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()
    days += daysInPrevMonth
  }
  return Math.max(0, months * 30 + days)
}

// Get the column flag of the next level form to check if a question is next-level ("de no pasa")
function getNextFormCol(formName: string): string | null {
  if (formName === 'Form 1') return 'Form 2'
  if (formName === 'Form 2') return 'Form 3'
  if (formName === 'Form 3') return 'Form 4'
  if (formName === 'Form 4') return 'Form 5'
  return null
}

export default function NuevaPruebaPage() {
  const { id } = useParams<{ id: string }>()
  const idninos = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Stepper State
  const [step, setStep] = useState(1)

  // Step 1 Form States
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [espCuidado, setEspCuidado] = useState('')
  const [direccionEspCui, setDireccionEspCui] = useState('')
  const [observacion, setObservacion] = useState('')
  const [aprobado, setAprobado] = useState<'Aprobado' | 'No Aprobado' | 'No Evaluado'>('Aprobado')

  // Selected Form State (initially suggested based on age, but manually editable)
  const [selectedForm, setSelectedForm] = useState<'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'>('Form 1')
  const [suggestedForm, setSuggestedForm] = useState<'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'>('Form 1')
  const [edadMeses, setEdadMeses] = useState(0)
  const [edadDias, setEdadDias] = useState(0)
  const [suggestedRangeLabel, setSuggestedRangeLabel] = useState('')

  // Step 2 Question Answers State: { [preguntaId]: 'si' | 'no' }
  const [answers, setAnswers] = useState<Record<number, 'si' | 'no'>>({})

  // Image lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Result modal state (shown after save + RPC call)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultadoFilas, setResultadoFilas] = useState<ResultadoFila[]>([])
  const [dictamenModal, setDictamenModal] = useState<'Aprobado' | 'No Aprobado' | 'No Evaluado'>('Aprobado')
  const [savedPruebaId, setSavedPruebaId] = useState<number | null>(null)

  // 1. Fetch child profile
  const { data: nino, isLoading: isLoadingNino } = useQuery<Nino | null>({
    queryKey: ['nino', id],
    queryFn: async () => {
      if (isNaN(idninos)) return null
      const { data, error } = await supabase
        .from('niños')
        .select('*')
        .eq('idninos', idninos)
        .single()

      if (error) {
        console.error('Error fetching child details:', error)
        throw error
      }
      return data
    }
  })

  // Recalculate age and automatically suggest form when Date changes
  useEffect(() => {
    if (nino?.fecha_nacimiento) {
      const months = calculateAgeInMonths(nino.fecha_nacimiento, fecha)
      const days = calculateAgeInDays(nino.fecha_nacimiento, fecha)
      setEdadMeses(months)
      setEdadDias(days)
      const suggested = getFormByAge(months)
      setSuggestedForm(suggested.form)
      setSelectedForm(suggested.form)
      setSuggestedRangeLabel(suggested.label)
    }
  }, [nino, fecha])

  // 2. Fetch config for the selected form (max_no_pasa threshold)
  const { data: configFormulario } = useQuery<ConfigFormulario | null>({
    queryKey: ['config-formulario', selectedForm],
    enabled: !!selectedForm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_formularios')
        .select('*')
        .eq('formulario', selectedForm)
        .single()
      if (error) return null
      return data
    }
  })

  // 3. Fetch all intervals for selected form, then find the matching one for exact age
  const { data: intervalos } = useQuery({
    queryKey: ['intervalos', selectedForm],
    enabled: !!selectedForm,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervalosevaluacion')
        .select('*')
        .eq('Formulario', selectedForm)
      if (error) throw error
      return data || []
    }
  })

  // Find the interval row matching the child's exact age in days
  const intervaloActivo = intervalos?.find(row => {
    const min = parseEdadToDays(row['Edad Mínima'] ?? '')
    const max = parseEdadToDays(row['Edad Máxima'] ?? '')
    return edadDias >= min && edadDias <= max
  }) ?? null

  // IDs of valid questions for this exact age — memoized so the Set reference
  // stays stable between renders and useEffect dependency comparison works correctly
  const preguntasValidasIds = useMemo(
    () => new Set<number>((intervaloActivo?.['Pregunta de Evaluación'] ?? []).map(Number)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intervaloActivo?.idevaluacion]
  )

  // 4. Fetch questions from preguntas2 where "selectedForm" = true
  const { data: preguntas, isLoading: isLoadingPreguntas } = useQuery<Pregunta2[]>({
    queryKey: ['preguntas-form', selectedForm],
    enabled: !!selectedForm,
    queryFn: async () => {
      console.log('NuevaPruebaPage: Fetching questions for', selectedForm)
      
      const formNum = selectedForm.split(' ')[1]
      const orderColumn = `numero_form${formNum}`

      const { data, error } = await supabase
        .from('preguntas2')
        .select('*')
        .eq(selectedForm, true)
        .order(orderColumn as any, { ascending: true })

      if (error) {
        console.error('Error fetching questions:', error)
        throw error
      }
      
      return data || []
    }
  })

  // Partition questions into Standard and Next-Level ("de no pasa") — memoized for stable references
  const nextLevelCol = getNextFormCol(selectedForm)

  const standardPreguntas = useMemo(
    () => (preguntas || []).filter(p => !nextLevelCol || !p[nextLevelCol as keyof Pregunta2]),
    [preguntas, nextLevelCol]
  )

  const nextLevelPreguntas = useMemo(
    () => nextLevelCol ? (preguntas || []).filter(p => !!p[nextLevelCol as keyof Pregunta2]) : [],
    [preguntas, nextLevelCol]
  )

  const groupedStandardPreguntas = useMemo(
    () => standardPreguntas.reduce<Record<string, Pregunta2[]>>((acc, curr) => {
      const cat = curr.Categoria || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(curr)
      return acc
    }, {}),
    [standardPreguntas]
  )

  // Suggest approval based on:
  // 1. Only questions valid for the child's exact age (from intervalosevaluacion)
  // 2. Among those, count how many "no pasa" (next-level) were failed
  // 3. Compare against max_no_pasa from config_formularios
  useEffect(() => {
    if (!preguntas || preguntas.length === 0) return

    const answeredCount = Object.keys(answers).length
    if (answeredCount === 0) return

    const maxNoPasa = configFormulario?.max_no_pasa ?? 2

    // If we have a valid interval, only evaluate questions within that set
    // Otherwise fall back to all questions (intervalo not found edge case)
    const validIds = preguntasValidasIds.size > 0 ? preguntasValidasIds : null

    // Only "no pasa" (next-level) questions determine approval/rejection
    // Standard questions are recorded but don't block approval
    const noPasaFailed = nextLevelPreguntas.filter(p => {
      if (validIds && !validIds.has(p.id_pregunta)) return false
      return answers[p.id_pregunta] === 'no'
    }).length

    // Valid questions that haven't been answered yet
    const validTotal = validIds
      ? preguntas.filter(p => validIds.has(p.id_pregunta)).length
      : preguntas.length
    const validAnswered = preguntas.filter(p => {
      if (validIds && !validIds.has(p.id_pregunta)) return false
      return answers[p.id_pregunta] !== undefined
    }).length

    if (noPasaFailed >= maxNoPasa) {
      setAprobado('No Aprobado')
    } else if (validAnswered < validTotal) {
      setAprobado('No Evaluado')
    } else {
      setAprobado('Aprobado')
    }
  }, [answers, preguntas, nextLevelPreguntas, standardPreguntas, configFormulario, preguntasValidasIds])

  // 3. Create test mutation: INSERT prueba → INSERT answers → call RPC → show modal
  const createTestMutation = useMutation({
    mutationFn: async () => {
      if (!nino) throw new Error('Child profile not loaded')

      // Step 1: Insert the prueba record
      const { data: pruebaData, error: pruebaError } = await supabase
        .from('Prueba_pre_prunape')
        .insert({
          idniño: idninos,
          Fecha: fecha,
          Aprobado: aprobado,
          Observacion: observacion || null,
          fechanacimiento: nino.fecha_nacimiento,
          formulario: selectedForm,
          estado: 'completo',
          espCuidado: espCuidado || null,
          direccionEspCui: direccionEspCui || null,
          formcreado: true
        })
        .select('id_prueba')
        .single()

      if (pruebaError) throw pruebaError
      const id_prueba = pruebaData.id_prueba

      // Step 2: Insert answers to pregunta_list
      // Map: 'si' → respuesta id=1 (Pasa), 'no' → id=2 (No pasa)
      const answersToInsert = Object.entries(answers).map(([preguntaId, answer]) => ({
        idpreguntacom: Number(preguntaId),
        idrespuestacom: answer === 'si' ? 1 : 2,
        id_ingresoform: id_prueba
      }))

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('pregunta_list')
          .insert(answersToInsert)
        if (answersError) throw answersError
      }

      // Step 3: Call the evaluation RPC function
      const umbral = configFormulario?.max_no_pasa ?? 2
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('ejecutar_consulta_prueba', {
          p_id_prueba: id_prueba,
          form: selectedForm,
          p_umbral: umbral
        })

      if (rpcError) throw rpcError

      return { id_prueba, filas: (rpcData ?? []) as ResultadoFila[] }
    },
    onSuccess: ({ id_prueba, filas }) => {
      setSavedPruebaId(id_prueba)
      setResultadoFilas(filas)
      // Map function result strings to app dictamen values
      // resultado is same on every row: 'Prueba aprobada' or 'No pasa prueba preprunape'
      const resultadoStr = filas.length > 0 ? filas[0].resultado : ''
      let dictamen: 'Aprobado' | 'No Aprobado' | 'No Evaluado' = 'No Evaluado'
      if (resultadoStr === 'Prueba aprobada') dictamen = 'Aprobado'
      else if (resultadoStr === 'No pasa prueba preprunape') dictamen = 'No Aprobado'
      else dictamen = aprobado
      setDictamenModal(dictamen)
      setShowResultModal(true)
      queryClient.invalidateQueries({ queryKey: ['pruebas', id] })
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al guardar la prueba en el servidor.')
    }
  })

  // Confirm dictamen from modal: update Aprobado if changed, then navigate
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!savedPruebaId) return
      await supabase
        .from('Prueba_pre_prunape')
        .update({ Aprobado: dictamenModal })
        .eq('id_prueba', savedPruebaId)
    },
    onSuccess: () => {
      toast.success('¡Prueba Pre-PRUNAPE guardada con éxito!')
      setShowResultModal(false)
      navigate(`/ninos/${id}`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al confirmar el dictamen.')
    }
  })

  // Handlers
  const handleAnswerSelect = (preguntaId: number, option: 'si' | 'no') => {
    setAnswers(prev => ({
      ...prev,
      [preguntaId]: option
    }))
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset answers when moving to step 2 in case the form changed
    setAnswers({})
    setStep(2)
  }

  const handleSave = () => {
    if (Object.keys(answers).length === 0) {
      toast.warning('Por favor, responda al menos una pregunta antes de guardar.')
      return
    }
    createTestMutation.mutate()
  }

  if (isLoadingNino) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f7f9fb]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="font-display font-medium text-on-surface-variant">Cargando paciente...</span>
        </div>
      </div>
    )
  }

  if (!nino) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-20 bg-white rounded-2xl shadow-sm border">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-secondary text-sm mb-6">No se encontró información del niño para iniciar la evaluación.</p>
        <Link to="/" className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-semibold">
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-[1000px] mx-auto w-full space-y-6 bg-[#f7f9fb] min-h-screen">
      {/* Lightbox modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:bg-slate-100 transition-colors z-10"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
            <img
              src={lightboxUrl}
              alt="Imagen de referencia"
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className={`p-6 flex items-center gap-3 border-b ${
              dictamenModal === 'Aprobado' ? 'bg-emerald-50 border-emerald-100' :
              dictamenModal === 'No Aprobado' ? 'bg-red-50 border-red-100' :
              'bg-slate-50 border-slate-100'
            }`}>
              <Trophy className={`h-6 w-6 ${
                dictamenModal === 'Aprobado' ? 'text-emerald-600' :
                dictamenModal === 'No Aprobado' ? 'text-red-500' :
                'text-slate-500'
              }`} />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-on-surface font-display">Resultado de la Evaluación</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Dictamen sugerido por el sistema: <span className={`font-bold ${
                    dictamenModal === 'Aprobado' ? 'text-emerald-600' :
                    dictamenModal === 'No Aprobado' ? 'text-red-600' : 'text-slate-600'
                  }`}>{dictamenModal}</span>
                </p>
              </div>
            </div>

            {/* Questions Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {resultadoFilas.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No se obtuvieron resultados del servidor.</p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-bold border border-slate-100">Pregunta</th>
                      <th className="text-left px-3 py-2 font-bold border border-slate-100 w-28">Categoría</th>
                      <th className="text-left px-3 py-2 font-bold border border-slate-100 w-24">Respuesta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoFilas.map((fila, i) => {
                      // Look up the question id by matching text to determine validity
                      const matchedPregunta = preguntas?.find(p => p.texto_pregunta === fila.pregunta_texto)
                      const isValid = !matchedPregunta || preguntasValidasIds.size === 0 || preguntasValidasIds.has(matchedPregunta.id_pregunta)
                      const isPasa = fila.respuesta_texto === 'Pasa'

                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 transition-colors ${
                            !isValid ? 'opacity-40 bg-slate-50' :
                            isPasa ? 'bg-emerald-50/40' : 'bg-red-50/40'
                          }`}
                        >
                          <td className="px-3 py-2 border border-slate-100 font-medium text-on-surface leading-snug">
                            {fila.pregunta_texto}
                            {!isValid && (
                              <span className="ml-2 text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">No aplica</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border border-slate-100 text-slate-500">{fila.pregunta_categoria}</td>
                          <td className={`px-3 py-2 border border-slate-100 font-bold ${
                            isPasa ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {fila.respuesta_texto}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer: change dictamen + confirm */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Dictamen final:
                </label>
                <select
                  className="flex-1 px-3 py-2 border border-outline rounded-xl bg-white font-semibold text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-primary"
                  value={dictamenModal}
                  onChange={(e) => setDictamenModal(e.target.value as any)}
                >
                  <option value="Aprobado">Aprobado</option>
                  <option value="No Aprobado">No Aprobado</option>
                  <option value="No Evaluado">No Evaluado</option>
                </select>
              </div>
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="bg-primary hover:bg-primary-container text-on-primary px-8 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50 whitespace-nowrap"
              >
                {confirmMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirmar y Cerrar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="flex items-center justify-between pb-4">
        <Link
          to={`/ninos/${id}`}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Perfil
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="font-medium">Paciente:</span>
          <span className="font-bold text-primary">{nino.nombre}</span>
        </div>
      </header>

      {/* Stepper Header */}
      <nav className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-6 w-full max-w-xl mx-auto">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-2.5 flex-1">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? 'bg-primary text-on-primary ring-4 ring-primary/10' : 'bg-slate-100 text-slate-400'
            }`}>
              1
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Paso 1</p>
              <p className={`text-xs font-semibold ${step === 1 ? 'text-primary' : 'text-slate-500'}`}>Datos de la Evaluación</p>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-2.5 flex-1">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? 'bg-primary text-on-primary ring-4 ring-primary/10' : 'bg-slate-100 text-slate-400'
            }`}>
              2
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Paso 2</p>
              <p className={`text-xs font-semibold ${step === 2 ? 'text-primary' : 'text-slate-500'}`}>Formulario de Hitos</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Step 1: Basic test info */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-on-surface font-display">Nueva Prueba Pre-PRUNAPE</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Automatic Age Calculation Panel */}
            <div className="p-5 bg-primary-container/10 border border-primary/20 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha Nac. del Niño</p>
                <p className="text-lg font-bold text-on-surface mt-0.5">
                  {nino.fecha_nacimiento ? new Date(nino.fecha_nacimiento).toLocaleDateString('es-AR') : 'Sin fecha'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Edad al Día de Prueba</p>
                <p className="text-lg font-bold text-primary mt-0.5">
                  {monthsToAgeString(edadMeses)} ({edadMeses} {edadMeses === 1 ? 'mes' : 'meses'})
                </p>
              </div>
              <div className="bg-primary/5 px-4 py-2.5 rounded-xl border border-primary/10 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Formulario Sugerido</span>
                <span className="text-base font-extrabold text-primary font-display">{suggestedForm} ({suggestedRangeLabel})</span>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="fecha">
                  <Calendar className="h-4 w-4 text-primary" />
                  Fecha de la Prueba
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#f7f9fb] transition-all text-sm font-medium"
                  id="fecha"
                  required
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              {/* Formulario Selector (Auto-suggested, but manual editable override) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="formulario">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Formulario
                </label>
                <select
                  id="formulario"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl bg-[#f7f9fb] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value as any)}
                >
                  <option value="Form 1">Form 1 (6 a 11 meses)</option>
                  <option value="Form 2">Form 2 (12 a 17 meses)</option>
                  <option value="Form 3">Form 3 (18 a 29 meses)</option>
                  <option value="Form 4">Form 4 (30 a 47 meses)</option>
                  <option value="Form 5">Form 5 (48 a 71 meses)</option>
                </select>
              </div>

              {/* Espacio de cuidado */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="espCuidado">
                  <Building2 className="h-4 w-4 text-primary" />
                  Espacio de Cuidado / Institución
                </label>
                <select
                  id="espCuidado"
                  required
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl bg-[#f7f9fb] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  value={espCuidado}
                  onChange={(e) => setEspCuidado(e.target.value)}
                >
                  <option value="" disabled>Seleccione una opción</option>
                  <option value="Sala Cuna">Sala Cuna</option>
                  <option value="Jardin Municipal">Jardin Municipal</option>
                  <option value="CCI">CCI</option>
                  <option value="Jardin Maternal Privado">Jardin Maternal Privado</option>
                  <option value="Sala de 3">Sala de 3</option>
                  <option value="Sala de 4">Sala de 4</option>
                  <option value="Sala de 5">Sala de 5</option>
                </select>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="font-semibold text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="direccionEspCui">
                  <MapPin className="h-4 w-4 text-primary" />
                  Dirección del Espacio de Cuidado
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#f7f9fb] transition-all text-sm font-medium"
                  id="direccionEspCui"
                  placeholder="Ej: Av. San Martín 740, Córdoba"
                  type="text"
                  value={direccionEspCui}
                  onChange={(e) => setDireccionEspCui(e.target.value)}
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-xs text-on-surface-variant flex items-center gap-1.5" htmlFor="observacion">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Observaciones Generales / Clínicas
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#f7f9fb] transition-all text-sm min-h-[100px]"
                  id="observacion"
                  placeholder="Detalles adicionales observados durante la evaluación del desarrollo..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary px-8 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/10"
            >
              Cargar Preguntas <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Questionnaire sheet */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-bold text-on-surface font-display">{selectedForm} — Planilla de Preguntas</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
                    Hitos Estándar: {standardPreguntas.length} | Hitos Siguiente Nivel: {nextLevelPreguntas.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Progreso:</span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {Object.keys(answers).length} de {preguntas?.length || 0}
                </span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="p-6 space-y-8">
              {isLoadingPreguntas ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-slate-400">Cargando cuestionario dinámico de hitos...</p>
                </div>
              ) : preguntas?.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed p-6">
                  <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No se encontraron hitos configurados para el {selectedForm}.</p>
                </div>
              ) : (
                <>
                  {/* Standard Questions grouped by Category */}
                  {Object.entries(groupedStandardPreguntas).map(([categoria, items]) => {
                    const answeredInCat = items.filter(it => answers[it.id_pregunta] !== undefined).length
                    
                    return (
                      <section key={categoria} className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="text-sm font-extrabold text-primary font-display uppercase tracking-wider">
                            {categoria}
                          </h4>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase">
                            {answeredInCat} / {items.length} RESPONDIDOS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5">
                          {items.map((pregunta) => {
                            const formNum = selectedForm.split(' ')[1]
                            const orderNum = pregunta[`numero_form${formNum}` as keyof Pregunta2]
                            const isAnswered = answers[pregunta.id_pregunta] !== undefined
                            const selectedAnswer = answers[pregunta.id_pregunta]
                            const isValidForAge = preguntasValidasIds.size === 0 || preguntasValidasIds.has(pregunta.id_pregunta)

                            return (
                              <div
                                key={pregunta.id_pregunta}
                                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                                  !isValidForAge
                                    ? 'border-slate-200 bg-slate-50 opacity-60'
                                    : isAnswered ? 'border-primary/20 bg-primary/5 shadow-sm' : 'border-outline-variant/30 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {String(orderNum ?? '')}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-on-surface leading-snug">
                                      {pregunta.texto_pregunta}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {pregunta['Franja etaria'] && (
                                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                        Franja: {pregunta['Franja etaria']}
                                      </span>
                                    )}
                                    {!isValidForAge && (
                                      <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                                        No aplica para esta edad
                                      </span>
                                    )}
                                    </div>
                                    {pregunta.imagen && (
                                      <button
                                        type="button"
                                        onClick={() => setLightboxUrl(pregunta.imagen!)}
                                        className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                                      >
                                        <img
                                          src={pregunta.imagen}
                                          alt=""
                                          className="w-10 h-10 rounded-lg object-cover border border-primary/20 hover:opacity-80 transition-opacity"
                                        />
                                        <span className="flex items-center gap-1">
                                          <ImageIcon className="h-3 w-3" /> Ver imagen
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 self-end md:self-auto shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerSelect(pregunta.id_pregunta, 'si')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                      selectedAnswer === 'si'
                                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                                        : 'bg-white hover:bg-slate-50 text-slate-600 border-outline-variant'
                                    }`}
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerSelect(pregunta.id_pregunta, 'no')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                      selectedAnswer === 'no'
                                        ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                        : 'bg-white hover:bg-slate-50 text-slate-600 border-outline-variant'
                                    }`}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })}

                  {/* Next-Level Questions Section ("Preguntas del nivel siguiente" / "de no pasa") */}
                  {nextLevelPreguntas.length > 0 && (
                    <section className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4 mt-8">
                      <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                        <Flame className="h-5 w-5 text-amber-600" />
                        <div>
                          <h4 className="text-sm font-extrabold text-amber-800 font-display uppercase tracking-wider">
                            Preguntas del nivel siguiente ({nextLevelCol})
                          </h4>
                          <p className="text-[10px] text-amber-700 font-medium mt-0.5 uppercase">
                            Hitos de nivel avanzado. Es esperable que el niño/a aún no los pase.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5">
                        {nextLevelPreguntas.map((pregunta) => {
                          const formNum = selectedForm.split(' ')[1]
                          const orderNum = pregunta[`numero_form${formNum}` as keyof Pregunta2]
                          const isAnswered = answers[pregunta.id_pregunta] !== undefined
                          const selectedAnswer = answers[pregunta.id_pregunta]
                          const isValidForAge = preguntasValidasIds.size === 0 || preguntasValidasIds.has(pregunta.id_pregunta)

                          return (
                            <div
                              key={pregunta.id_pregunta}
                              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white ${
                                !isValidForAge
                                  ? 'border-slate-200 opacity-60'
                                  : isAnswered ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-amber-200 hover:border-amber-300'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {String(orderNum ?? '')}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                                    {pregunta.texto_pregunta}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">
                                      Avanzado
                                    </span>
                                    {pregunta['Franja etaria'] && (
                                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                                        Franja: {pregunta['Franja etaria']}
                                      </span>
                                    )}
                                    {!isValidForAge && (
                                      <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                                        No aplica para esta edad
                                      </span>
                                    )}
                                  </div>
                                  {pregunta.imagen && (
                                    <button
                                      type="button"
                                      onClick={() => setLightboxUrl(pregunta.imagen!)}
                                      className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 hover:text-amber-600 transition-colors"
                                    >
                                      <img
                                        src={pregunta.imagen}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover border border-amber-300 hover:opacity-80 transition-opacity"
                                      />
                                      <span className="flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" /> Ver imagen
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 self-end md:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAnswerSelect(pregunta.id_pregunta, 'si')}
                                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                    selectedAnswer === 'si'
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAnswerSelect(pregunta.id_pregunta, 'no')}
                                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                    selectedAnswer === 'no'
                                      ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setStep(1)}
              className="bg-white hover:bg-slate-50 text-slate-600 border border-outline-variant px-6 py-2.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            >
              Volver al Paso 1
            </button>
            <button
              onClick={handleSave}
              disabled={createTestMutation.isPending}
              className="bg-primary hover:bg-primary-container text-on-primary px-8 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {createTestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Guardar Evaluación
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
