import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import { Loader2, Stethoscope, ClipboardList, TrendingUp } from 'lucide-react'

// Zod validation schema matching RHF
const seguimientoSchema = z.object({
  resultado: z.enum(['Pasó', 'No pasó'], {
    errorMap: () => ({ message: 'El resultado es requerido' })
  }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  observacion: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type SeguimientoFormValues = z.infer<typeof seguimientoSchema>

interface SeguimientoRow {
  id: number
  created_at: string
  id_nino: number
  resultado: 'Pasó' | 'No pasó'
  fecha: string
  observacion: string | null
  usuario_id: string
}

interface SeguimientoPrunapeProps {
  idNino: number
  mode?: 'form' | 'timeline' | 'both'
}

export default function SeguimientoPrunape({ idNino, mode = 'both' }: SeguimientoPrunapeProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // 1. Fetch existing follow-up records
  const { data: seguimientos = [], isLoading } = useQuery<SeguimientoRow[]>({
    queryKey: ['seguimiento-prunape', idNino],
    queryFn: async () => {
      if (!idNino || isNaN(idNino)) return []
      const { data, error } = await supabase
        .from('seguimiento_prunape')
        .select('*')
        .eq('id_nino', idNino)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // 2. Form setup with react-hook-form and zod
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SeguimientoFormValues>({
    resolver: zodResolver(seguimientoSchema),
    defaultValues: {
      resultado: 'Pasó',
      fecha: new Date().toISOString().split('T')[0],
      observacion: ''
    }
  })

  // 3. Mutation for inserting new records
  const mutation = useMutation({
    mutationFn: async (values: SeguimientoFormValues) => {
      const { error } = await supabase
        .from('seguimiento_prunape')
        .insert({
          id_nino: idNino,
          resultado: values.resultado,
          fecha: values.fecha,
          observacion: values.observacion || null,
          usuario_id: user?.id
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguimiento-prunape', idNino] })
      toast.success('Seguimiento registrado')
      reset({
        resultado: 'Pasó',
        fecha: new Date().toISOString().split('T')[0],
        observacion: ''
      })
    },
    onError: (err) => {
      console.error('Error inserting seguimiento:', err)
      toast.error('Error al registrar')
    }
  })

  const onSubmit = (data: SeguimientoFormValues) => {
    mutation.mutate(data)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6 animate-pulse">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-5 bg-slate-200 rounded-full w-12"></div>
        </div>
        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 mt-1 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-12 bg-slate-100 rounded-xl w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDERING OPTION 1: ONLY FORM CARD ---
  if (mode === 'form') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
        {/* Form Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-on-surface font-display">
              Nuevo Registro de PRUNAPE
            </h3>
          </div>
        </div>

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resultado */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Resultado</label>
              <select
                {...register('resultado')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold cursor-pointer"
              >
                <option value="Pasó">Pasó</option>
                <option value="No pasó">No pasó</option>
              </select>
              {errors.resultado && <p className="text-[10px] text-red-500 font-bold">{errors.resultado.message}</p>}
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Fecha</label>
              <input
                type="date"
                {...register('fecha')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold"
              />
              {errors.fecha && <p className="text-[10px] text-red-500 font-bold">{errors.fecha.message}</p>}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Observación (Opcional)</label>
            <textarea
              maxLength={500}
              {...register('observacion')}
              placeholder="Notas del seguimiento..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold placeholder:text-slate-300 resize-none leading-relaxed"
            />
            {errors.observacion && <p className="text-[10px] text-red-500 font-bold">{errors.observacion.message}</p>}
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-on-primary hover:bg-primary-container px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Stethoscope className="h-3.5 w-3.5" />
              )}
              Registrar
            </button>
          </div>
        </form>
      </div>
    )
  }

  // --- RENDERING OPTION 2: ONLY TIMELINE CARD ---
  if (mode === 'timeline') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
        {/* Timeline Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-on-surface font-display">
              Historial de Avance de PRUNAPE
            </h3>
            <span className="bg-purple-100 text-purple-800 border border-purple-200/50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm shrink-0">
              {seguimientos.length} {seguimientos.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </div>
        </div>

        {/* Timeline Content Area */}
        <div className="p-6">
          {seguimientos.length === 0 ? (
            <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 space-y-2.5">
              <ClipboardList className="h-8 w-8 text-slate-400 mx-auto opacity-50" />
              <p className="text-xs font-bold text-slate-500">Sin seguimiento registrado</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Iniciá el proceso cargando el primer registro con el formulario de abajo.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 py-2">
              {seguimientos.map((item) => {
                const isPaso = item.resultado === 'Pasó'
                const dotColor = isPaso 
                  ? 'bg-emerald-500 ring-emerald-100' 
                  : 'bg-red-500 ring-red-100'
                const chipStyle = isPaso 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                  : 'bg-red-50 text-red-700 border-red-200/50'

                return (
                  <div key={item.id} className="relative group">
                    <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 transition-transform group-hover:scale-125`}></span>
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${chipStyle}`}>
                          Resultado: {item.resultado}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDate(item.fecha)}
                        </span>
                      </div>
                      {item.observacion && (
                        <p className="text-xs text-on-surface-variant font-medium bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 max-w-xl leading-relaxed whitespace-pre-wrap">
                          {item.observacion}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- RENDERING OPTION 3: BOTH IN ONE CARD (FALLBACK) ---
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-on-surface font-display">
            Seguimiento PRUNAPE
          </h3>
          <span className="bg-purple-100 text-purple-800 border border-purple-200/50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm shrink-0">
            {seguimientos.length} {seguimientos.length === 1 ? 'REGISTRO' : 'REGISTROS'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Timeline Visual Area */}
        {seguimientos.length === 0 ? (
          <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 space-y-2.5">
            <ClipboardList className="h-8 w-8 text-slate-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-500">Sin seguimiento registrado</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Iniciá el proceso cargando el primer registro con el formulario de abajo.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 py-2">
            {seguimientos.map((item) => {
              const isPaso = item.resultado === 'Pasó'
              const dotColor = isPaso 
                ? 'bg-emerald-500 ring-emerald-100' 
                : 'bg-red-500 ring-red-100'
              const chipStyle = isPaso 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                : 'bg-red-50 text-red-700 border-red-200/50'

              return (
                <div key={item.id} className="relative group">
                  <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 transition-transform group-hover:scale-125`}></span>
                  
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${chipStyle}`}>
                        Resultado: {item.resultado}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatDate(item.fecha)}
                      </span>
                    </div>
                    {item.observacion && (
                      <p className="text-xs text-on-surface-variant font-medium bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 max-w-xl leading-relaxed whitespace-pre-wrap">
                        {item.observacion}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Input Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevo Registro de PRUNAPE</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resultado */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Resultado</label>
              <select
                {...register('resultado')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold cursor-pointer"
              >
                <option value="Pasó">Pasó</option>
                <option value="No pasó">No pasó</option>
              </select>
              {errors.resultado && <p className="text-[10px] text-red-500 font-bold">{errors.resultado.message}</p>}
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Fecha</label>
              <input
                type="date"
                {...register('fecha')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold"
              />
              {errors.fecha && <p className="text-[10px] text-red-500 font-bold">{errors.fecha.message}</p>}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Observación (Opcional)</label>
            <textarea
              maxLength={500}
              {...register('observacion')}
              placeholder="Notas del seguimiento..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold placeholder:text-slate-300 resize-none leading-relaxed"
            />
            {errors.observacion && <p className="text-[10px] text-red-500 font-bold">{errors.observacion.message}</p>}
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-on-primary hover:bg-primary-container px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Stethoscope className="h-3.5 w-3.5" />
              )}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
