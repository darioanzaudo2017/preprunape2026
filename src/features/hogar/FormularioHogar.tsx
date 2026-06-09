import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hogarSchema, type HogarSchemaType } from './hogarSchema';
import { useHogar } from './useHogar';
import type {
  FormularioHogarData,
  Hacinamiento,
  TipoHogar,
  JefaturaHogar,
  TipoBarrio,
  NivelEducativoJefe,
  SituacionOcupacional,
  EscalaIngresos,
  CoberturaSalud,
  TipoVivienda,
  CondicionTenencia,
  MaterialPiso,
  AccesoAgua,
  Saneamiento,
  Electricidad,
  CombustibleCoccion
} from './hogar.types';
import { Button } from '../../components/ui/button';
import {
  Home,
  BookOpen,
  Shield,
  Droplets,
  HeartHandshake,
  ArrowRight,
  ArrowLeft,
  Save,
  Loader2,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X
} from 'lucide-react';

interface FormularioHogarProps {
  idNino: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function FormularioHogar({ idNino, onSuccess, onClose }: FormularioHogarProps) {
  const [step, setStep] = useState(1);
  const { localidades, adultos, hogarData, isLoading, isSaving, saveHogar } = useHogar(idNino);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<HogarSchemaType>({
    resolver: zodResolver(hogarSchema),
    defaultValues: {
      tipo_hogar: 'nuclear',
      jefatura: 'compartida',
      cant_personas: 4,
      barrio: '',
      localidad: '',
      tipo_barrio: 'formal',
      id_adulto_jefe: null,
      nivel_educativo_jefe: 'secundario_completo',
      situacion_ocupacional: 'formal',
      escala_ingresos: 'entre_1_2_sml',
      recibe_transferencias_estado: false,
      tipo_transferencias: [],
      cobertura_salud: 'obra_social',
      tipo_vivienda: 'casa',
      condicion_tenencia: 'propietario',
      material_piso: 'ceramico_mosaico',
      cant_ambientes: 3,
      hacinamiento: 'sin_hacinamiento',
      agua: 'red_publica',
      saneamiento: 'red_cloacal',
      electricidad: 'con_medidor',
      combustible_coccion: 'gas_red',
      tiene_internet: false,
      tiene_red_apoyo: false,
      tipo_red_apoyo: [],
      participa_organizacion: false,
      tipo_organizacion: [],
      observaciones: ''
    }
  });

  // Pre-cargar datos si ya existe un hogar registrado
  useEffect(() => {
    if (hogarData) {
      reset({
        tipo_hogar: (hogarData.hogar?.tipo_hogar || 'nuclear') as TipoHogar,
        jefatura: (hogarData.hogar?.jefatura || 'compartida') as JefaturaHogar,
        cant_personas: hogarData.hogar?.cant_personas || 4,
        barrio: hogarData.hogar?.barrio || '',
        localidad: hogarData.hogar?.localidad || '',
        tipo_barrio: (hogarData.hogar?.tipo_barrio || 'formal') as TipoBarrio,
        id_adulto_jefe: hogarData.hogar?.id_adulto_jefe || null,
        nivel_educativo_jefe: (hogarData.snapshot?.nivel_educativo_jefe || 'secundario_completo') as NivelEducativoJefe,
        situacion_ocupacional: (hogarData.snapshot?.situacion_ocupacional || 'formal') as SituacionOcupacional,
        escala_ingresos: (hogarData.snapshot?.escala_ingresos || 'entre_1_2_sml') as EscalaIngresos,
        recibe_transferencias_estado: hogarData.snapshot?.recibe_transferencias_estado || false,
        tipo_transferencias: (hogarData.snapshot?.tipo_transferencias as string[]) || [],
        cobertura_salud: (hogarData.snapshot?.cobertura_salud || 'obra_social') as CoberturaSalud,
        tipo_vivienda: (hogarData.snapshot?.tipo_vivienda || 'casa') as TipoVivienda,
        condicion_tenencia: (hogarData.snapshot?.condicion_tenencia || 'propietario') as CondicionTenencia,
        material_piso: (hogarData.snapshot?.material_piso || 'ceramico_mosaico') as MaterialPiso,
        cant_ambientes: hogarData.snapshot?.cant_ambientes || 3,
        hacinamiento: (hogarData.snapshot?.hacinamiento || 'sin_hacinamiento') as Hacinamiento,
        agua: (hogarData.snapshot?.agua || 'red_publica') as AccesoAgua,
        saneamiento: (hogarData.snapshot?.saneamiento || 'red_cloacal') as Saneamiento,
        electricidad: (hogarData.snapshot?.electricidad || 'con_medidor') as Electricidad,
        combustible_coccion: (hogarData.snapshot?.combustible_coccion || 'gas_red') as CombustibleCoccion,
        tiene_internet: hogarData.snapshot?.tiene_internet || false,
        tiene_red_apoyo: hogarData.snapshot?.tiene_red_apoyo || false,
        tipo_red_apoyo: (hogarData.snapshot?.tipo_red_apoyo as string[]) || [],
        participa_organizacion: hogarData.snapshot?.participa_organizacion || false,
        tipo_organizacion: (hogarData.snapshot?.tipo_organizacion as string[]) || [],
        observaciones: hogarData.snapshot?.observaciones || ''
      });
    }
  }, [hogarData, reset]);

  // Observar personas y ambientes para calcular hacinamiento en tiempo real (Sección 3)
  const watchCantPersonas = watch('cant_personas');
  const watchCantAmbientes = watch('cant_ambientes');

  const [ratioHacinamiento, setRatioHacinamiento] = useState(0);
  const [computedHacinamiento, setComputedHacinamiento] = useState<Hacinamiento>('sin_hacinamiento');

  useEffect(() => {
    const personas = Number(watchCantPersonas) || 0;
    const ambientes = Number(watchCantAmbientes) || 1;
    const ratio = personas / (ambientes || 1);
    setRatioHacinamiento(ratio);

    let hac: Hacinamiento = 'sin_hacinamiento';
    if (ratio > 3) {
      hac = 'hacinamiento_critico';
    } else if (ratio > 2) {
      hac = 'hacinamiento';
    }

    setComputedHacinamiento(hac);
    setValue('hacinamiento', hac);
  }, [watchCantPersonas, watchCantAmbientes, setValue]);

  // Observar condicionales para subsecciones
  const watchRecibeTransferencias = watch('recibe_transferencias_estado');
  const watchTieneRedApoyo = watch('tiene_red_apoyo');
  const watchParticipaOrganizaciones = watch('participa_organizacion');

  // Definición de pasos
  const steps = [
    { id: 1, label: 'Estructura', icon: Home, fields: ['tipo_hogar', 'jefatura', 'cant_personas', 'barrio', 'localidad', 'tipo_barrio', 'id_adulto_jefe'] },
    { id: 2, label: 'Educación & Empleo', icon: BookOpen, fields: ['nivel_educativo_jefe', 'situacion_ocupacional', 'escala_ingresos', 'recibe_transferencias_estado', 'tipo_transferencias'] },
    { id: 3, label: 'Vivienda & Salud', icon: Shield, fields: ['cobertura_salud', 'tipo_vivienda', 'condicion_tenencia', 'material_piso', 'cant_ambientes', 'hacinamiento'] },
    { id: 4, label: 'Servicios Básicos', icon: Droplets, fields: ['agua', 'saneamiento', 'electricidad', 'combustible_coccion', 'tiene_internet'] },
    { id: 5, label: 'Redes & Notas', icon: HeartHandshake, fields: ['tiene_red_apoyo', 'tipo_red_apoyo', 'participa_organizacion', 'tipo_organizacion', 'observaciones'] }
  ];

  // Controlar navegación entre pasos con validación parcial
  const handleNext = async () => {
    const currentStepFields = steps[step - 1].fields as any[];
    const isStepValid = await trigger(currentStepFields);
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: HogarSchemaType) => {
    try {
      await saveHogar(data as FormularioHogarData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando datos socioeconómicos del hogar...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface font-display flex items-center gap-2">
            <Home className="h-5.5 w-5.5 text-primary" />
            Contexto Socioeconómico y Habitacional
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {hogarData?.idHogar
              ? `Actualizando datos para el hogar asignado (ID: ${hogarData.idHogar})`
              : 'Registrando datos de un nuevo hogar para el niño/a'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hogarData?.snapshot?.fecha && (
            <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Último Snapshot: {new Date(hogarData.snapshot.fecha).toLocaleDateString('es-AR')}
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              title="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-100">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={async () => {
                  // Permitir retroceder libremente, pero para avanzar hay que validar
                  if (s.id < step) {
                    setStep(s.id);
                  } else if (s.id > step) {
                    // Validar pasos intermedios secuencialmente
                    let canAdvance = true;
                    for (let i = step; i < s.id; i++) {
                      const valid = await trigger(steps[i - 1].fields as any[]);
                      if (!valid) {
                        canAdvance = false;
                        setStep(i);
                        break;
                      }
                    }
                    if (canAdvance) setStep(s.id);
                  }
                }}
                className={`flex flex-col items-center gap-1 bg-white px-2 focus:outline-none`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-primary bg-primary text-white scale-110 shadow-sm'
                      : isCompleted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
        {/* STEP 1: ESTRUCTURA DEL HOGAR */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              1. Estructura y Composición del Hogar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Hogar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tipo de Hogar <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tipo_hogar')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="nuclear">Nuclear (Pareja con o sin hijos)</option>
                  <option value="monoparental_femenina">Monoparental con Jefatura Femenina (Madre sola con hijos)</option>
                  <option value="monoparental_masculina">Monoparental con Jefatura Masculina (Padre solo con hijos)</option>
                  <option value="extensa">Extensa (Hogar nuclear + otros parientes)</option>
                  <option value="ensamblada">Ensamblada (Pareja reconstruida con hijos de uniones anteriores)</option>
                  <option value="unipersonal">Unipersonal (Una sola persona)</option>
                </select>
                {errors.tipo_hogar && <p className="text-xs text-destructive font-semibold">{errors.tipo_hogar.message}</p>}
              </div>

              {/* Cantidad de Personas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cantidad de Personas en el Hogar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej. 4"
                  {...register('cant_personas', { valueAsNumber: true })}
                  className="w-full h-10 px-4 py-2 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {errors.cant_personas && <p className="text-xs text-destructive font-semibold">{errors.cant_personas.message}</p>}
              </div>

              {/* Jefatura */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Jefatura del Hogar <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="jefatura"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'femenina', label: 'Femenina (Mujer a cargo)' },
                        { value: 'masculina', label: 'Masculina (Hombre a cargo)' },
                        { value: 'compartida', label: 'Compartida (Ambos a cargo)' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.jefatura && <p className="text-xs text-destructive font-semibold">{errors.jefatura.message}</p>}
              </div>

              {/* Localidad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Localidad <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('localidad')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">Seleccione una localidad</option>
                  {localidades.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {errors.localidad && <p className="text-xs text-destructive font-semibold">{errors.localidad.message}</p>}
              </div>

              {/* Barrio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Barrio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Barrio Centro"
                  {...register('barrio')}
                  className="w-full h-10 px-4 py-2 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {errors.barrio && <p className="text-xs text-destructive font-semibold">{errors.barrio.message}</p>}
              </div>

              {/* Tipo de Barrio */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Tipo de Barrio / Urbanización <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="tipo_barrio"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: 'formal', label: 'Formal (Trazado urbano regular, servicios planificados)' },
                        { value: 'informal', label: 'Informal (Asentamiento, villa, trazado irregular)' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.tipo_barrio && <p className="text-xs text-destructive font-semibold">{errors.tipo_barrio.message}</p>}
              </div>

              {/* Adulto Jefe de Hogar */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Jefe de Hogar (Adulto Referente) <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <Controller
                  name="id_adulto_jefe"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Ninguno / No registrado en el sistema</option>
                      {adultos.map((ad) => (
                        <option key={ad.id} value={ad.id}>
                          {ad.NombreyApellido} {ad.DNI ? `(DNI: ${ad.DNI})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EDUCACION E INSERCION LABORAL */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              2. Nivel Educativo y Situación Socio-Laboral
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nivel Educativo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nivel Educativo del Jefe/a de Hogar <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('nivel_educativo_jefe')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="sin_instruccion">Sin instrucción / Primario incompleto</option>
                  <option value="primario_incompleto">Primario Incompleto</option>
                  <option value="primario_completo">Primario Completo</option>
                  <option value="secundario_incompleto">Secundario Incompleto</option>
                  <option value="secundario_completo">Secundario Completo</option>
                  <option value="terciario_universitario">Terciario o Universitario (Completo o Incompleto)</option>
                </select>
                {errors.nivel_educativo_jefe && <p className="text-xs text-destructive font-semibold">{errors.nivel_educativo_jefe.message}</p>}
              </div>

              {/* Situación Ocupacional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Situación Ocupacional del Jefe/a <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('situacion_ocupacional')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="formal">Ocupado Formal (Asalariado con aportes, profesional)</option>
                  <option value="informal">Ocupado Informal (Changarín, subocupado, sin aportes)</option>
                  <option value="desocupado">Desocupado (Busca trabajo activamente)</option>
                  <option value="inactivo">Inactivo (Jubilado, ama de casa, no busca trabajo)</option>
                </select>
                {errors.situacion_ocupacional && <p className="text-xs text-destructive font-semibold">{errors.situacion_ocupacional.message}</p>}
              </div>

              {/* Escala de Ingresos */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ingresos del Hogar (Escala en Salarios Mínimos Vitales y Móviles - SMVM) <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('escala_ingresos')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="menos_1_sml">Menos de 1 SMVM (Pobreza Extrema / Indigencia)</option>
                  <option value="entre_1_2_sml">Entre 1 y 2 SMVM (Bajo la línea de pobreza)</option>
                  <option value="entre_2_3_sml">Entre 2 y 3 SMVM (Ingresos Medios-Bajos)</option>
                  <option value="mas_3_sml">Más de 3 SMVM (Ingresos Medios / Altos)</option>
                </select>
                {errors.escala_ingresos && <p className="text-xs text-destructive font-semibold">{errors.escala_ingresos.message}</p>}
              </div>

              {/* Recibe transferencias del Estado */}
              <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">¿Recibe transferencias o subsidios estatales?</h4>
                    <p className="text-xs text-slate-400">Por ejemplo: AUH, Tarjeta Alimentar, pensiones, becas, programas sociales.</p>
                  </div>
                  <Controller
                    name="recibe_transferencias_estado"
                    control={control}
                    render={({ field }) => (
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) {
                              setValue('tipo_transferencias', []); // Limpiar los checkboxes si se desmarca el switch
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    )}
                  />
                </div>

                {/* Checkboxes de tipo de transferencias */}
                {watchRecibeTransferencias && (
                  <div className="pt-3 border-t border-slate-200/60 animate-fade-in">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
                      Seleccione los beneficios que recibe:
                    </label>
                    <Controller
                      name="tipo_transferencias"
                      control={control}
                      render={({ field }) => {
                        const currentValues = field.value || [];
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              { value: 'auh_alimentar', label: 'AUH / Tarjeta Alimentar' },
                              { value: 'jubilacion', label: 'Jubilación mínima' },
                              { value: 'pension', label: 'Pensión No Contributiva (PNC / discapacidad)' },
                              { value: 'beca', label: 'Beca Progresar / Estudiantil' },
                              { value: 'potenciar', label: 'Potenciar Trabajo / Empleo social' },
                              { value: 'otro', label: 'Otro tipo de asistencia municipal/provincial' }
                            ].map((t) => (
                              <label
                                key={t.value}
                                className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                  currentValues.includes(t.value)
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  value={t.value}
                                  checked={currentValues.includes(t.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, t.value]);
                                    } else {
                                      field.onChange(currentValues.filter((v: string) => v !== t.value));
                                    }
                                  }}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-xs font-bold text-slate-700">{t.label}</span>
                              </label>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: COBERTURA DE SALUD Y VIVIENDA */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" />
              3. Cobertura de Salud y Condiciones de Vivienda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cobertura de Salud */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Cobertura de Salud Familiar <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="cobertura_salud"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'obra_social', label: 'Obra Social (Sindical, PAMI, etc.)' },
                        { value: 'prepaga', label: 'Medicina Prepaga' },
                        { value: 'solo_publico', label: 'Solo Cobertura Pública (Hospitales/CAPS)' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.cobertura_salud && <p className="text-xs text-destructive font-semibold">{errors.cobertura_salud.message}</p>}
              </div>

              {/* Tipo de Vivienda */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tipo de Vivienda <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tipo_vivienda')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="casa">Casa de material</option>
                  <option value="departamento">Departamento</option>
                  <option value="casilla">Casilla (Madera, chapas, etc.)</option>
                  <option value="rancho">Rancho (Adobe, paja)</option>
                  <option value="precaria">Vivienda Precaria / Pieza de inquilinato</option>
                </select>
                {errors.tipo_vivienda && <p className="text-xs text-destructive font-semibold">{errors.tipo_vivienda.message}</p>}
              </div>

              {/* Condición de Tenencia */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Condición de Tenencia del Terreno/Vivienda <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('condicion_tenencia')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="propietario">Propietario de la vivienda y terreno</option>
                  <option value="inquilino">Inquilino / Arrendatario</option>
                  <option value="ocupante">Ocupante (en relación de comodato, préstamo, de hecho)</option>
                  <option value="otro">Otra condición</option>
                </select>
                {errors.condicion_tenencia && <p className="text-xs text-destructive font-semibold">{errors.condicion_tenencia.message}</p>}
              </div>

              {/* Material del Piso */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Material Predominante del Piso <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('material_piso')}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-xl border-slate-200 bg-[#f7f9fb] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="ceramico_mosaico">Mosaico, baldosa, cerámico o madera</option>
                  <option value="cemento">Carpeta de cemento / Hormigón</option>
                  <option value="madera">Madera rústica / Ladrillo suelto</option>
                  <option value="tierra">Tierra apisonada</option>
                </select>
                {errors.material_piso && <p className="text-xs text-destructive font-semibold">{errors.material_piso.message}</p>}
              </div>

              {/* Cantidad de Ambientes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cantidad de Habitaciones/Ambientes <span className="text-slate-400 font-normal">(sin contar baño ni cocina)</span> <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej. 2"
                  {...register('cant_ambientes', { valueAsNumber: true })}
                  className="w-full h-10 px-4 py-2 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {errors.cant_ambientes && <p className="text-xs text-destructive font-semibold">{errors.cant_ambientes.message}</p>}
              </div>

              {/* Real-time Overcrowding (Hacinamiento) Widget */}
              <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-slate-50 border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">Cálculo de Hacinamiento en Tiempo Real</h4>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {(ratioHacinamiento || 0).toFixed(2)} pers / amb
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Se calcula dividiendo las {watchCantPersonas || 0} personas del hogar entre los {watchCantAmbientes || 0} ambientes.
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  {computedHacinamiento === 'sin_hacinamiento' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Sin Hacinamiento
                    </span>
                  )}
                  {computedHacinamiento === 'hacinamiento' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-200 animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      Hacinamiento Moderado
                    </span>
                  )}
                  {computedHacinamiento === 'hacinamiento_critico' && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-200 animate-bounce">
                      <AlertTriangle className="h-4 w-4" />
                      Hacinamiento Crítico
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SERVICIOS BASICOS */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Droplets className="h-4.5 w-4.5 text-primary" />
              4. Acceso a Servicios Básicos e Internet
            </h3>

            <div className="space-y-6">
              {/* Acceso al agua */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Acceso al Agua <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="agua"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'red_publica', label: 'Red Pública (Agua corriente)' },
                        { value: 'pozo', label: 'Pozo o Bomba de extracción' },
                        { value: 'otra', label: 'Otra fuente (Aljibe, camión cisterna)' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.agua && <p className="text-xs text-destructive font-semibold">{errors.agua.message}</p>}
              </div>

              {/* Saneamiento */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Sistema de Saneamiento (Excretas / Efluentes) <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="saneamiento"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'red_cloacal', label: 'Red Cloacal pública' },
                        { value: 'pozo', label: 'Cámara séptica y pozo absorbente' },
                        { value: 'sin_sistema', label: 'Letrina / Pozo ciego / Sin sistema' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.saneamiento && <p className="text-xs text-destructive font-semibold">{errors.saneamiento.message}</p>}
              </div>

              {/* Electricidad */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Acceso a Electricidad <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="electricidad"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'con_medidor', label: 'Red Formal (con medidor individual)' },
                        { value: 'irregular', label: 'Conexión Informal (medidor comunitario / "enganchado")' },
                        { value: 'sin_acceso', label: 'Sin acceso a red eléctrica' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.electricidad && <p className="text-xs text-destructive font-semibold">{errors.electricidad.message}</p>}
              </div>

              {/* Combustible de cocción */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Combustible Principal para Cocinar <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="combustible_coccion"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {[
                        { value: 'gas_red', label: 'Gas de Red' },
                        { value: 'garrafa', label: 'Garrafa / Gas envasado' },
                        { value: 'lena', label: 'Leña / Carbón' },
                        { value: 'electricidad', label: 'Electricidad' }
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                            field.value === opt.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="h-4.5 w-4.5 text-primary border-slate-300 focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.combustible_coccion && <p className="text-xs text-destructive font-semibold">{errors.combustible_coccion.message}</p>}
              </div>

              {/* Internet */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800">¿Tiene conexión a Internet?</h4>
                  <p className="text-xs text-slate-400">Ya sea a través de Wi-Fi domiciliario o plan de datos móvil estable.</p>
                </div>
                <Controller
                  name="tiene_internet"
                  control={control}
                  render={({ field }) => (
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REDES DE APOYO Y OBSERVACIONES */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <HeartHandshake className="h-4.5 w-4.5 text-primary" />
              5. Redes de Apoyo Comunitario y Observaciones
            </h3>

            <div className="space-y-6">
              {/* Red de apoyo */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">¿Cuenta con red de apoyo externa?</h4>
                    <p className="text-xs text-slate-400">Familiares externos, vecinos o instituciones ante emergencias o cuidado infantil.</p>
                  </div>
                  <Controller
                    name="tiene_red_apoyo"
                    control={control}
                    render={({ field }) => (
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) setValue('tipo_red_apoyo', []);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    )}
                  />
                </div>

                {watchTieneRedApoyo && (
                  <div className="pt-3 border-t border-slate-200/60 animate-fade-in">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
                      Seleccione los tipos de apoyo con los que cuenta:
                    </label>
                    <Controller
                      name="tipo_red_apoyo"
                      control={control}
                      render={({ field }) => {
                        const currentValues = field.value || [];
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { value: 'familiar', label: 'Apoyo Familiar (abuelos, tíos, hermanos)' },
                              { value: 'vecinal', label: 'Apoyo Vecinal / Amigos cercanos' },
                              { value: 'institucional', label: 'Apoyo Institucional (CAPS, acción social, etc.)' }
                            ].map((t) => (
                              <label
                                key={t.value}
                                className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                  currentValues.includes(t.value)
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  value={t.value}
                                  checked={currentValues.includes(t.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, t.value]);
                                    } else {
                                      field.onChange(currentValues.filter((v: string) => v !== t.value));
                                    }
                                  }}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-xs font-bold text-slate-700">{t.label}</span>
                              </label>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Organizacion comunitaria */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">¿Participa de organizaciones comunitarias?</h4>
                    <p className="text-xs text-slate-400">Algún miembro del hogar participa activamente en comedores, clubes, iglesias, etc.</p>
                  </div>
                  <Controller
                    name="participa_organizacion"
                    control={control}
                    render={({ field }) => (
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) setValue('tipo_organizacion', []);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    )}
                  />
                </div>

                {watchParticipaOrganizaciones && (
                  <div className="pt-3 border-t border-slate-200/60 animate-fade-in">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
                      Seleccione las organizaciones en las que participa:
                    </label>
                    <Controller
                      name="tipo_organizacion"
                      control={control}
                      render={({ field }) => {
                        const currentValues = field.value || [];
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              { value: 'comedor', label: 'Comedor comunitario / Copa de leche' },
                              { value: 'club', label: 'Club social / deportivo' },
                              { value: 'cooperativa', label: 'Cooperativa de trabajo / microemprendimiento' },
                              { value: 'iglesia', label: 'Iglesia / Grupo religioso' },
                              { value: 'centro_vecinal', label: 'Centro vecinal o sociedad de fomento' },
                              { value: 'otro', label: 'Otras agrupaciones' }
                            ].map((t) => (
                              <label
                                key={t.value}
                                className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                  currentValues.includes(t.value)
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  value={t.value}
                                  checked={currentValues.includes(t.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, t.value]);
                                    } else {
                                      field.onChange(currentValues.filter((v: string) => v !== t.value));
                                    }
                                  }}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-xs font-bold text-slate-700">{t.label}</span>
                              </label>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Observaciones Generales de la Visita o Entrevista
                </label>
                <textarea
                  placeholder="Detalles sobre las condiciones de vida detectadas, clima familiar o particularidades de la entrevista..."
                  rows={4}
                  {...register('observaciones')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                />
                {errors.observaciones && <p className="text-xs text-destructive font-semibold">{errors.observaciones.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-1.5 h-10.5 px-5 font-bold transition-all rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 h-10.5 px-5 font-bold transition-all bg-primary hover:bg-primary/95 text-white rounded-xl"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 h-10.5 px-6 font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Datos
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
