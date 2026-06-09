import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useUserRole } from '../hooks/useUserRole'
import { toast } from 'sonner'
import {
  Baby,
  Users,
  Save,
  X,
  Loader2
} from 'lucide-react'

// Zod validation schema in Spanish matching RHF exact types
const registerSchema = z.object({
  // NNyA (Niño/a) Fields
  nombre: z.string().min(1, 'El nombre completo del NNyA es requerido'),
  dni: z.string().min(1, 'El DNI es requerido').regex(/^\d+$/, 'El DNI debe contener solo números'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  genero: z.string().min(1, 'El género es requerido'),
  Direccion: z.string(),
  Localidad: z.string(),
  Telefonocontacto: z.number().or(z.nan()),
  pesoNac: z.string(),
  prematuro: z.boolean(),
  semanas: z.number().or(z.nan()).optional(),
  fecha_nac_real: z.string(),
  otras_características: z.string(),

  // Adulto Responsable Fields
  adulto_NombreyApellido: z.string().min(1, 'El nombre y apellido del adulto es requerido'),
  adulto_DNI: z.string(),
  adulto_Edad: z.string(),
  adulto_genero: z.string(),
  adulto_Parentezco: z.string(),
  adulto_telefono: z.string(),
  adulto_Barrio: z.string(),
  adulto_NivelEducativo: z.string(),
  adulto_observaciones: z.string(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function NuevoNinoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAgente, localidad: localidadAgente } = useUserRole()

  const { data: localidades = [] } = useQuery<{ id: number; Localidad: string }[]>({
    queryKey: ['localidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Localidad')
        .select('id, Localidad')
        .order('Localidad', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      dni: '',
      fecha_nacimiento: '',
      genero: '',
      prematuro: false,
      semanas: undefined,
      adulto_NombreyApellido: '',
      Direccion: '',
      Localidad: (isAgente && localidadAgente) ? localidadAgente : '',
      Telefonocontacto: undefined,
      pesoNac: '',
      fecha_nac_real: '',
      otras_características: '',
      adulto_DNI: '',
      adulto_Edad: '',
      adulto_genero: '',
      adulto_Parentezco: '',
      adulto_telefono: '',
      adulto_Barrio: '',
      adulto_NivelEducativo: '',
      adulto_observaciones: '',
    }
  })

  // Sincroniza localidad cuando el perfil del agente termina de cargar
  useEffect(() => {
    if (isAgente && localidadAgente) {
      setValue('Localidad', localidadAgente)
    }
  }, [isAgente, localidadAgente, setValue])

  // Watch prematuro toggle to render conditional fields
  const isPrematuro = watch('prematuro')

  // Sequenced insertion mutation
  const insertMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      // Safe conversions for numbers
      const phoneVal = (values.Telefonocontacto === undefined || values.Telefonocontacto === null || Number.isNaN(values.Telefonocontacto)) 
        ? null 
        : values.Telefonocontacto

      const weeksVal = (values.semanas === undefined || values.semanas === null || Number.isNaN(values.semanas)) 
        ? null 
        : values.semanas

      // 1. Insert in "niños" table
      const { data: ninoData, error: ninoError } = await supabase
        .from('niños')
        .insert({
          nombre: values.nombre.toUpperCase(),
          fecha_nacimiento: values.fecha_nacimiento,
          genero: values.genero,
          dni: parseInt(values.dni, 10),
          Direccion: values.Direccion || null,
          Localidad: values.Localidad || null,
          Telefonocontacto: phoneVal,
          prematuro: values.prematuro ? 'Sí' : 'No',
          semanas: values.prematuro ? weeksVal : null,
          fecha_nac_real: (values.prematuro && values.fecha_nac_real) ? values.fecha_nac_real : null,
          pesoNac: values.pesoNac || null,
          otras_características: values.otras_características || null,
          adultoresponsable: null // Field legacy to be left null
        })
        .select('idninos')
        .single()

      if (ninoError) {
        if (ninoError.message.includes('niños_DNI_key') || ninoError.code === '23505')
          throw new Error('Ya existe un NNyA registrado con ese DNI. Verificá el número ingresado.')
        throw new Error(`Error al registrar NNyA: ${ninoError.message}`)
      }
      if (!ninoData) throw new Error('No se pudo obtener el ID del NNyA registrado.')

      const idninos = ninoData.idninos

      // 2. Insert in "adultos" table
      const { data: adultoData, error: adultoError } = await supabase
        .from('adultos')
        .insert({
          NombreyApellido: values.adulto_NombreyApellido,
          DNI: values.adulto_DNI || null,
          Edad: values.adulto_Edad || null,
          genero: values.adulto_genero || null,
          Parentezco: values.adulto_Parentezco || null,
          telefono: values.adulto_telefono || null,
          Barrio: values.adulto_Barrio || null,
          NivelEducativo: values.adulto_NivelEducativo || null,
          observaciones: values.adulto_observaciones || null,
          idNNyA: idninos
        })
        .select('id')
        .single()

      if (adultoError) throw new Error(`Error al registrar adulto responsable: ${adultoError.message}`)
      if (!adultoData) throw new Error('No se pudo obtener el ID del adulto responsable.')

      const idAdulto = adultoData.id

      // 3. Actualizar niño con referencia al adulto y nombre legacy
      await supabase
        .from('niños')
        .update({
          adultoresponsable: values.adulto_NombreyApellido,
          idAdulto: idAdulto
        })
        .eq('idninos', idninos)

      // 4. Insert in intermediary table "adultoyNNyA"
      const { error: interError } = await supabase
        .from('adultoyNNyA')
        .insert({
          idNNyA: idninos,
          idAdulto: idAdulto
        })

      if (interError) throw new Error(`Error al vincular NNyA con Adulto: ${interError.message}`)

      return idninos
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ninos'] })
      toast.success('¡NNyA y Adulto Responsable registrados con éxito!')
      navigate('/')
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Ocurrió un error inesperado al procesar el registro.')
    }
  })

  const onSubmit = (data: RegisterFormValues) => {
    insertMutation.mutate(data)
  }

  const onInvalid = (errors: any) => {
    console.error('Validación fallida:', errors)
    toast.error('Completá los campos requeridos antes de guardar.')
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-display leading-tight">
            Registrar Nuevo Niño/a
          </h2>
          <p className="text-sm text-slate-500">
            Complete el expediente completo del niño/a junto a su adulto de referencia.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION 1 — Datos del NNyA */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Baby className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface font-display">Datos del NNyA</h3>
                <p className="text-xs text-slate-400">Niño, Niña o Adolescente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Nombre Completo */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="nombre">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="nombre"
                  placeholder="Ej. THIAGO ALEJANDRO MORENO"
                  type="text"
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <span className="text-xs text-red-500 mt-1 font-medium">{errors.nombre.message}</span>
                )}
              </div>

              {/* DNI */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="dni">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="dni"
                  placeholder="Sólo números"
                  type="text"
                  inputMode="numeric"
                  {...register('dni')}
                />
                {errors.dni && (
                  <span className="text-xs text-red-500 mt-1 font-medium">{errors.dni.message}</span>
                )}
              </div>

              {/* Fecha de Nacimiento */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="fecha_nacimiento">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="fecha_nacimiento"
                  type="date"
                  {...register('fecha_nacimiento')}
                />
                {errors.fecha_nacimiento && (
                  <span className="text-xs text-red-500 mt-1 font-medium">{errors.fecha_nacimiento.message}</span>
                )}
              </div>

              {/* Género */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="genero">
                  Género <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="genero"
                  {...register('genero')}
                >
                  <option value="" disabled>Seleccione género</option>
                  <option value="Varon">Varon</option>
                  <option value="Mujer">Mujer</option>
                </select>
                {errors.genero && (
                  <span className="text-xs text-red-500 mt-1 font-medium">{errors.genero.message}</span>
                )}
              </div>

              {/* Peso al Nacer */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="pesoNac">
                  Peso al Nacer (g / kg)
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="pesoNac"
                  placeholder="Ej. 3200g o 3.2kg"
                  type="text"
                  {...register('pesoNac')}
                />
              </div>

              {/* Dirección */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="Direccion">
                  Dirección
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="Direccion"
                  placeholder="Calle, número, depto"
                  type="text"
                  {...register('Direccion')}
                />
              </div>

              {/* Localidad */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="Localidad">
                  Localidad
                </label>
                {isAgente && localidadAgente ? (
                  <div className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-600 font-semibold flex items-center justify-between">
                    <span>{localidadAgente}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Asignada</span>
                  </div>
                ) : (
                  <select
                    className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                    id="Localidad"
                    {...register('Localidad')}
                  >
                    <option value="">Seleccione localidad</option>
                    {localidades.map(l => (
                      <option key={l.id} value={l.Localidad}>{l.Localidad}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Teléfono de Contacto */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="Telefonocontacto">
                  Teléfono de Contacto
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  id="Telefonocontacto"
                  placeholder="Sólo números"
                  type="number"
                  {...register('Telefonocontacto', { valueAsNumber: true })}
                />
              </div>

              {/* Prematuro Toggle */}
              <div className="col-span-1 md:col-span-2 flex items-center gap-3 py-2 bg-slate-50/50 p-4 rounded-xl border border-dashed border-outline-variant/60">
                <input
                  className="h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20"
                  id="prematuro"
                  type="checkbox"
                  {...register('prematuro')}
                />
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-on-surface cursor-pointer select-none" htmlFor="prematuro">
                    ¿Es prematuro/a?
                  </label>
                  <span className="text-[10px] text-slate-400">Marque si nació antes de término.</span>
                </div>
              </div>

              {/* Conditional Prematuro Fields */}
              {isPrematuro && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-outline-variant/40">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="semanas">
                      Semanas de Gestación
                    </label>
                    <input
                      className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                      id="semanas"
                      placeholder="Ej. 34"
                      type="number"
                      {...register('semanas', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="fecha_nac_real">
                      Fecha de Nacimiento Real
                    </label>
                    <input
                      className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                      id="fecha_nac_real"
                      type="date"
                      {...register('fecha_nac_real')}
                    />
                  </div>
                </div>
              )}

              {/* Otras Características */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="otras_características">
                  Otras Características / Notas
                </label>
                <textarea
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-24 resize-none"
                  id="otras_características"
                  placeholder="Detalles adicionales relevantes..."
                  {...register('otras_características')}
                />
              </div>

            </div>
          </div>

          {/* SECTION 2 — Adulto Responsable */}
          <div className="bg-slate-50 rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-2 rounded-xl text-secondary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface font-display">Adulto Responsable</h3>
                  <p className="text-xs text-slate-400">Tutor de referencia familiar</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Requerido
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Nombre y Apellido */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_NombreyApellido">
                  Nombre y Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_NombreyApellido"
                  placeholder="Ej. EVELYN DÍAZ"
                  type="text"
                  {...register('adulto_NombreyApellido')}
                />
                {errors.adulto_NombreyApellido && (
                  <span className="text-xs text-red-500 mt-1 font-medium">{errors.adulto_NombreyApellido.message}</span>
                )}
              </div>

              {/* DNI */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_DNI">
                  DNI (Adulto)
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_DNI"
                  placeholder="Ej. 36728912"
                  type="text"
                  {...register('adulto_DNI')}
                />
              </div>

              {/* Edad */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_Edad">
                  Edad
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_Edad"
                  placeholder="Ej. 32"
                  type="text"
                  {...register('adulto_Edad')}
                />
              </div>

              {/* Género Adulto */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_genero">
                  Género
                </label>
                <select
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_genero"
                  {...register('adulto_genero')}
                >
                  <option value="">Seleccione género</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Varon">Varon</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Parentesco */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_Parentezco">
                  Parentesco
                </label>
                <select
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_Parentezco"
                  {...register('adulto_Parentezco')}
                >
                  <option value="">Seleccione parentesco</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Tutor/a">Tutor/a</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Teléfono */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_telefono">
                  Teléfono
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_telefono"
                  placeholder="Ej. 3513976327"
                  type="text"
                  {...register('adulto_telefono')}
                />
              </div>

              {/* Barrio */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_Barrio">
                  Barrio
                </label>
                <input
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_Barrio"
                  placeholder="Ej. Centro"
                  type="text"
                  {...register('adulto_Barrio')}
                />
              </div>

              {/* Nivel Educativo */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_NivelEducativo">
                  Nivel Educativo
                </label>
                <select
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  id="adulto_NivelEducativo"
                  {...register('adulto_NivelEducativo')}
                >
                  <option value="">Seleccione nivel educativo</option>
                  <option value="Primaria incompleta">Primaria incompleta</option>
                  <option value="Primaria completa">Primaria completa</option>
                  <option value="Secundaria incompleta">Secundaria incompleta</option>
                  <option value="Secundaria completa">Secundaria completa</option>
                  <option value="Terciaria/Universitaria">Terciaria/Universitaria</option>
                </select>
              </div>

              {/* Observaciones */}
              <div className="col-span-1 md:col-span-2 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="adulto_observaciones">
                  Observaciones adicionales
                </label>
                <textarea
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white h-24 resize-none"
                  id="adulto_observaciones"
                  placeholder="Notas, antecedentes familiares, etc..."
                  {...register('adulto_observaciones')}
                />
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => navigate('/')}
            type="button"
            className="px-6 py-2.5 border border-outline-variant rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          
          <button
            disabled={insertMutation.isPending}
            type="submit"
            className="bg-primary hover:brightness-110 active:scale-95 text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/10 disabled:opacity-75 disabled:pointer-events-none"
          >
            {insertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Registrar NNyA y Adulto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
