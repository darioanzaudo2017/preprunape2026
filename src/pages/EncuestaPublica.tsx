import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hogarSchema, type HogarSchemaType } from '../features/hogar/hogarSchema';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
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
  CheckCircle2,
  Info,
  FileText,
  HeartPulse,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EncuestaPublica() {
  const { token } = useParams<{ token: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUsado, setIsUsado] = useState(false);
  const [isExpirado, setIsExpirado] = useState(false);
  const [nino, setNino] = useState<{ nombre: string; fecha_nacimiento: string; Localidad?: string } | null>(null);

  const [step, setStep] = useState(1);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
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

  // Fetch localities on mount
  useEffect(() => {
    supabase
      .from('Localidad')
      .select('Localidad')
      .order('Localidad', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching localities:', error);
        } else if (data) {
          setLocalidades(data.map((r) => r.Localidad as string));
        }
      });
  }, []);

  // Validate Token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidationError('Token inválido');
        setIsValidating(false);
        return;
      }
      try {
        const rawUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseUrl = rawUrl?.replace(/\/$/, '');
        const response = await fetch(`${supabaseUrl}/functions/v1/encuesta-hogar?token=${token}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          const errMsg = data.error || 'Error al validar el enlace';
          setValidationError(errMsg);
          if (data.usado === true || errMsg.toLowerCase().includes('usado') || errMsg.toLowerCase().includes('completado')) {
            setIsUsado(true);
          } else if (data.expirado === true || errMsg.toLowerCase().includes('expir') || errMsg.toLowerCase().includes('venc') || errMsg.toLowerCase().includes('plazo')) {
            setIsExpirado(true);
          }
        } else {
          setNino(data.nino);
          if (data.nino?.Localidad) {
            setValue('localidad', data.nino.Localidad);
          }
        }
      } catch (err: any) {
        console.error(err);
        setValidationError('No se pudo establecer conexión con el servidor. Reintente en unos instantes.');
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token, setValue]);

  // Hacinamiento calculation
  const watchCantPersonas = watch('cant_personas');
  const watchCantAmbientes = watch('cant_ambientes');
  const [ratioHacinamiento, setRatioHacinamiento] = useState(0);
  const [computedHacinamiento, setComputedHacinamiento] = useState<'sin_hacinamiento' | 'hacinamiento' | 'hacinamiento_critico'>('sin_hacinamiento');

  useEffect(() => {
    const personas = Number(watchCantPersonas) || 0;
    const ambientes = Number(watchCantAmbientes) || 1;
    const ratio = personas / (ambientes || 1);
    setRatioHacinamiento(ratio);

    let hac: 'sin_hacinamiento' | 'hacinamiento' | 'hacinamiento_critico' = 'sin_hacinamiento';
    if (ratio > 3) {
      hac = 'hacinamiento_critico';
    } else if (ratio > 2) {
      hac = 'hacinamiento';
    }

    setComputedHacinamiento(hac);
    setValue('hacinamiento', hac);
  }, [watchCantPersonas, watchCantAmbientes, setValue]);

  const watchRecibeTransferencias = watch('recibe_transferencias_estado');
  const watchTieneRedApoyo = watch('tiene_red_apoyo');
  const watchParticipaOrganizaciones = watch('participa_organizacion');

  const steps = [
    { id: 1, label: 'Estructura Familiar', icon: Home, fields: ['tipo_hogar', 'jefatura', 'cant_personas', 'barrio', 'localidad', 'tipo_barrio'] },
    { id: 2, label: 'Educación & Empleo', icon: BookOpen, fields: ['nivel_educativo_jefe', 'situacion_ocupacional', 'escala_ingresos', 'recibe_transferencias_estado', 'tipo_transferencias'] },
    { id: 3, label: 'Vivienda & Salud', icon: Shield, fields: ['cobertura_salud', 'tipo_vivienda', 'condicion_tenencia', 'material_piso', 'cant_ambientes', 'hacinamiento'] },
    { id: 4, label: 'Servicios Básicos', icon: Droplets, fields: ['agua', 'saneamiento', 'electricidad', 'combustible_coccion', 'tiene_internet'] },
    { id: 5, label: 'Redes & Notas', icon: HeartHandshake, fields: ['tiene_red_apoyo', 'tipo_red_apoyo', 'participa_organizacion', 'tipo_organizacion', 'observaciones'] }
  ];

  const handleNext = async () => {
    const currentStepFields = steps[step - 1].fields as any[];
    const isStepValid = await trigger(currentStepFields);
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (formData: HogarSchemaType) => {
    setIsSaving(true);
    try {
      const rawUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseUrl = rawUrl?.replace(/\/$/, '');

      // Separar campos de hogar (estructurales) de snapshot (socioeconómicos)
      const { barrio, localidad, tipo_barrio, tipo_hogar, jefatura, cant_personas, ...rest } = formData;
      const hogarData = { barrio, localidad, tipo_barrio, tipo_hogar, jefatura, cant_personas };
      const snapshotData = rest;

      const response = await fetch(`${supabaseUrl}/functions/v1/encuesta-hogar?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hogarData, snapshotData })
      });

      const resData = await response.json();
      if (!response.ok || resData.error) {
        throw new Error(resData.error || 'Error al guardar los datos de la encuesta');
      }

      setIsSuccess(true);
      toast.success('¡Encuesta enviada con éxito!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar los datos de la encuesta.');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-md max-w-sm w-full text-center border border-slate-100">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <span className="font-bold text-slate-700">Verificando el enlace de la encuesta...</span>
          <p className="text-xs text-slate-400">Por favor espere unos momentos mientras validamos su acceso.</p>
        </div>
      </div>
    );
  }

  // 2. Success screen after completion
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">¡Formulario completado!</h2>
          <p className="text-sm text-slate-600">
            Los datos de la encuesta han sido registrados correctamente. Agradecemos mucho su tiempo y colaboración.
          </p>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
            Ya puede cerrar esta pestaña de forma segura.
          </div>
        </div>
      </div>
    );
  }

  // 3. Error screens
  if (validationError) {
    if (isUsado) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Encuesta ya completada</h2>
            <p className="text-sm text-slate-600">
              Ya has completado este formulario previamente. ¡Muchísimas gracias por tu colaboración!
            </p>
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
              Cualquier consulta adicional, comuníquese con el agente a cargo.
            </div>
          </div>
        </div>
      );
    }

    if (isExpirado) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">El enlace ha expirado</h2>
            <p className="text-sm text-slate-600">
              Este enlace de acceso ha expirado por motivos de seguridad (los enlaces tienen una validez de 7 días).
            </p>
            <p className="text-xs text-slate-500">
              Por favor, solicite un nuevo enlace al agente de seguimiento.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Enlace inválido o incorrecto</h2>
          <p className="text-sm text-slate-600">
            {validationError === 'Token inválido'
              ? 'El enlace al que intenta acceder no es válido. Verifique que la dirección URL sea correcta.'
              : validationError}
          </p>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
            Por favor, vuelva a intentar con el link proporcionado por el agente.
          </div>
        </div>
      </div>
    );
  }

  // 4. Main form render
  const activeStep = steps[step - 1];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f9fb] to-slate-100 flex flex-col">
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-150 h-16 flex items-center px-4 sm:px-8 shadow-sm justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <HeartPulse className="h-6.5 w-6.5 text-[#00685f]" />
          <div>
            <h1 className="font-display font-bold text-base leading-tight text-slate-800">Serene</h1>
            <p className="text-[10px] text-[#00685f] font-black tracking-wider uppercase">PEDIATRICS</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-[#00685f]/10 rounded-full text-xs font-bold text-[#00685f]">
          Encuesta Pública
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 flex flex-col">
        {/* Child Information Header Banner */}
        {nino && (
          <div className="bg-[#00685f]/5 border border-[#00685f]/10 rounded-2xl p-4 sm:p-5 mb-5 shadow-xs">
            <span className="text-[10px] font-extrabold text-[#00685f]/80 uppercase tracking-widest block">
              Completar datos de hogar para:
            </span>
            <h2 className="text-lg font-black text-slate-800 mt-1">{nino.nombre}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-slate-500">
              <span>F. Nacimiento: {nino.fecha_nacimiento ? new Date(nino.fecha_nacimiento).toLocaleDateString('es-AR') : '-'}</span>
              {nino.Localidad && <span>Localidad: {nino.Localidad}</span>}
            </div>
          </div>
        )}

        {/* Form Card Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-100 relative">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* Stepper info header */}
          <div className="p-4 sm:p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center shrink-0">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Paso {step} de 5</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">{activeStep.label}</h3>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
            {/* Step 1: Estructura Familiar */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in flex-1">
                {/* Tipo de Hogar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Composición / Tipo de Hogar <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('tipo_hogar')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="nuclear">Nuclear (Madre y/o padre con hijos)</option>
                    <option value="monoparental_femenina">Monoparental con Jefatura Femenina (Solo madre con hijos)</option>
                    <option value="monoparental_masculina">Monoparental con Jefatura Masculina (Solo padre con hijos)</option>
                    <option value="extensa">Extensa (Padres e hijos más otros parientes como abuelos, tíos)</option>
                    <option value="ensamblada">Ensamblada (Pareja con hijos de uniones anteriores)</option>
                    <option value="unipersonal">Unipersonal (Persona sola)</option>
                  </select>
                  {errors.tipo_hogar && <p className="text-xs text-destructive font-semibold">{errors.tipo_hogar.message}</p>}
                </div>

                {/* Tipo de Jefatura */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Jefatura del Hogar <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="jefatura"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { value: 'compartida', label: 'Compartida' },
                          { value: 'femenina', label: 'Femenina' },
                          { value: 'masculina', label: 'Masculina' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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

                {/* Cantidad de Personas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Cantidad total de personas que habitan el hogar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register('cant_personas', { valueAsNumber: true })}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {errors.cant_personas && <p className="text-xs text-destructive font-semibold">{errors.cant_personas.message}</p>}
                </div>

                {/* Localidad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Localidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('localidad')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">-- Seleccione una localidad --</option>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Barrio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Barrio Centro, Las Flores, etc."
                    {...register('barrio')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {errors.barrio && <p className="text-xs text-destructive font-semibold">{errors.barrio.message}</p>}
                </div>

                {/* Tipo de Barrio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Tipo de Urbanización / Barrio <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="tipo_barrio"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { value: 'formal', label: 'Barrio Formal / Consolidado' },
                          { value: 'informal', label: 'Asentamiento / Barrio Informal' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
              </div>
            )}

            {/* Step 2: Educación & Empleo */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in flex-1">
                {/* Nivel Educativo Jefe */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Nivel Educativo alcanzado por el Jefe de Hogar <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('nivel_educativo_jefe')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="sin_instruccion">Sin instrucción / Primario incompleto</option>
                    <option value="primario_incompleto">Primario incompleto</option>
                    <option value="primario_completo">Primario completo</option>
                    <option value="secundario_incompleto">Secundario incompleto</option>
                    <option value="secundario_completo">Secundario completo</option>
                    <option value="terciario_universitario">Terciario o Universitario completo/incompleto</option>
                  </select>
                  {errors.nivel_educativo_jefe && <p className="text-xs text-destructive font-semibold">{errors.nivel_educativo_jefe.message}</p>}
                </div>

                {/* Situación Ocupacional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Situación Ocupacional del Jefe de Hogar <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('situacion_ocupacional')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="formal">Empleo Formal (En blanco, con aportes)</option>
                    <option value="informal">Empleo Informal (En negro, changas, cuentapropista informal)</option>
                    <option value="desocupado">Desocupado (Buscando trabajo activamente)</option>
                    <option value="inactivo">Inactivo (Jubilado, ama de casa, estudiante, no busca trabajo)</option>
                  </select>
                  {errors.situacion_ocupacional && <p className="text-xs text-destructive font-semibold">{errors.situacion_ocupacional.message}</p>}
                </div>

                {/* Escala de Ingresos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Escala de Ingresos Totales del Hogar <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('escala_ingresos')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="menos_1_sml">Menos de 1 Salario Mínimo</option>
                    <option value="entre_1_2_sml">Entre 1 y 2 Salarios Mínimos</option>
                    <option value="entre_2_3_sml">Entre 2 y 3 Salarios Mínimos</option>
                    <option value="mas_3_sml">Más de 3 Salarios Mínimos</option>
                  </select>
                  {errors.escala_ingresos && <p className="text-xs text-destructive font-semibold">{errors.escala_ingresos.message}</p>}
                </div>

                {/* Recibe Transferencias */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800">¿Recibe transferencias o ayuda del Estado?</h4>
                      <p className="text-xs text-slate-400">Asignaciones, planes sociales, pensiones no contributivas, etc.</p>
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
                              if (!e.target.checked) setValue('tipo_transferencias', []);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-[#00685f] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      )}
                    />
                  </div>

                  {watchRecibeTransferencias && (
                    <div className="pt-3 border-t border-slate-200/60 animate-fade-in">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
                        Seleccione los beneficios que percibe el hogar:
                      </label>
                      <Controller
                        name="tipo_transferencias"
                        control={control}
                        render={({ field }) => {
                          const currentValues = field.value || [];
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {[
                                { value: 'auh', label: 'AUH (Asignación Universal por Hijo)' },
                                { value: 'alimentar', label: 'Tarjeta Alimentar' },
                                { value: 'pension', label: 'Pensión No Contributiva / Otras Pensiones' },
                                { value: 'potenciar', label: 'Programas de Empleo / Municipal / Provincial' },
                                { value: 'otro', label: 'Otros subsidios o ayudas' }
                              ].map((t) => (
                                <label
                                  key={t.value}
                                  className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                    currentValues.includes(t.value)
                                      ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
            )}

            {/* Step 3: Vivienda & Salud */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in flex-1">
                {/* Cobertura de Salud */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Cobertura de Salud familiar <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="cobertura_salud"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { value: 'solo_publico', label: 'Solo Cobertura Pública / Hospital' },
                          { value: 'obra_social', label: 'Obra Social (por empleo formal)' },
                          { value: 'prepaga', label: 'Medicina Prepaga / Particular' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Tipo de Vivienda <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('tipo_vivienda')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="casa">Casa</option>
                    <option value="departamento">Departamento</option>
                    <option value="casilla">Casilla (Laminas de madera/metal, precaria)</option>
                    <option value="rancho">Rancho (Construcción con caña, barro, paja)</option>
                    <option value="precaria">Habitación de hotel/inquilinato o estructura precaria</option>
                  </select>
                  {errors.tipo_vivienda && <p className="text-xs text-destructive font-semibold">{errors.tipo_vivienda.message}</p>}
                </div>

                {/* Condición de Tenencia */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Condición de Tenencia de la vivienda <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('condicion_tenencia')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="propietario">Propietario de la vivienda y terreno</option>
                    <option value="inquilino">Inquilino / Arrendatario</option>
                    <option value="ocupante">Ocupante (de hecho / con permiso / prestada)</option>
                    <option value="otro">Otra situación</option>
                  </select>
                  {errors.condicion_tenencia && <p className="text-xs text-destructive font-semibold">{errors.condicion_tenencia.message}</p>}
                </div>

                {/* Material del Piso */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Material principal del Piso <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('material_piso')}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="ceramico_mosaico">Cerámico / Mosaico / Madera</option>
                    <option value="cemento">Cemento / Carpeta de hormigón</option>
                    <option value="madera">Madera / Ladrillo suelto</option>
                    <option value="tierra">Tierra / Sin revestimiento</option>
                  </select>
                  {errors.material_piso && <p className="text-xs text-destructive font-semibold">{errors.material_piso.message}</p>}
                </div>

                {/* Cantidad de Ambientes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Cantidad de ambientes / habitaciones (sin contar baño y cocina) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register('cant_ambientes', { valueAsNumber: true })}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {errors.cant_ambientes && <p className="text-xs text-destructive font-semibold">{errors.cant_ambientes.message}</p>}
                </div>

                {/* Indicador de Hacinamiento en tiempo real */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      Indicador de Hacinamiento Estimado
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Calculado automáticamente en base a personas ({watchCantPersonas}) y ambientes ({watchCantAmbientes}).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500">
                      Ratio: {ratioHacinamiento.toFixed(1)} pers./amb.
                    </span>
                    {computedHacinamiento === 'sin_hacinamiento' && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-black">
                        Sin hacinamiento
                      </span>
                    )}
                    {computedHacinamiento === 'hacinamiento' && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-black">
                        Hacinamiento medio
                      </span>
                    )}
                    {computedHacinamiento === 'hacinamiento_critico' && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-black">
                        Hacinamiento Crítico
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Servicios Básicos */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in flex-1">
                {/* Agua */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Acceso y Origen del Agua <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="agua"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { value: 'red_publica', label: 'Red Pública / Agua corriente' },
                          { value: 'pozo', label: 'Pozo o Bomba de extracción' },
                          { value: 'otra', label: 'Otra fuente (Aljibe, cisterna)' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
                  {errors.agua && <p className="text-xs text-destructive font-semibold">{errors.agua.message}</p>}
                </div>

                {/* Saneamiento */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Sistema de Saneamiento <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="saneamiento"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { value: 'red_cloacal', label: 'Red Cloacal pública' },
                          { value: 'pozo', label: 'Cámara séptica y pozo absorbente' },
                          { value: 'sin_sistema', label: 'Letrina / Pozo ciego / Sin sistema' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { value: 'con_medidor', label: 'Red Formal (con medidor)' },
                          { value: 'irregular', label: 'Conexión Informal ("enganchado")' },
                          { value: 'sin_acceso', label: 'Sin acceso a red eléctrica' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { value: 'gas_red', label: 'Gas de Red' },
                          { value: 'garrafa', label: 'Garrafa / Envase' },
                          { value: 'lena', label: 'Leña / Carbón' },
                          { value: 'electricidad', label: 'Electricidad' }
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2 p-3.5 border rounded-xl cursor-pointer transition-all ${
                              field.value === opt.value
                                ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
                                : 'border-slate-200 hover:bg-slate-50 bg-[#f7f9fb]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              className="h-4 w-4 text-primary border-slate-300 focus:ring-primary"
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
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">¿Tiene conexión a Internet?</h4>
                    <p className="text-xs text-slate-400">Wi-Fi en casa o plan de datos móvil estable.</p>
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
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-[#00685f] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Redes & Notas */}
            {step === 5 && (
              <div className="space-y-5 animate-fade-in flex-1">
                {/* Red de apoyo */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800">¿Cuenta con red de apoyo externa?</h4>
                      <p className="text-xs text-slate-400">Familiares externos, vecinos o instituciones ante emergencias.</p>
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
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-[#00685f] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {[
                                { value: 'familiar', label: 'Apoyo Familiar (abuelos, tíos, hermanos)' },
                                { value: 'vecinal', label: 'Apoyo Vecinal / Amigos' },
                                { value: 'institucional', label: 'Apoyo Institucional (CAPS, Acción Social)' }
                              ].map((t) => (
                                <label
                                  key={t.value}
                                  className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                    currentValues.includes(t.value)
                                      ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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

                {/* Organizaciones Comunitarias */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800">¿Participa en organizaciones comunitarias?</h4>
                      <p className="text-xs text-slate-400">Comedores, clubes, iglesias, cooperativas, etc.</p>
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
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-[#00685f] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {[
                                { value: 'comedor', label: 'Comedor comunitario / Copa de leche' },
                                { value: 'club', label: 'Club social / deportivo' },
                                { value: 'cooperativa', label: 'Cooperativa de trabajo' },
                                { value: 'iglesia', label: 'Iglesia / Grupo religioso' },
                                { value: 'centro_vecinal', label: 'Centro vecinal o fomento' },
                                { value: 'otro', label: 'Otras agrupaciones' }
                              ].map((t) => (
                                <label
                                  key={t.value}
                                  className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                    currentValues.includes(t.value)
                                      ? 'border-[#00685f] bg-[#00685f]/5 ring-1 ring-[#00685f]'
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
                    Observaciones o comentarios adicionales del hogar
                  </label>
                  <textarea
                    placeholder="Detalles sobre las condiciones de vida, clima familiar o cualquier otra aclaración que desee realizar..."
                    rows={4}
                    {...register('observaciones')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                  />
                  {errors.observaciones && <p className="text-xs text-destructive font-semibold">{errors.observaciones.message}</p>}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-1.5 h-11 px-5 font-bold transition-all rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 h-11 px-5 font-bold transition-all bg-[#00685f] hover:bg-[#00685f]/95 text-white rounded-xl"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 h-11 px-6 font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enviar Encuesta
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
