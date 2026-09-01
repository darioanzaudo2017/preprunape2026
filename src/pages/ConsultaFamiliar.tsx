import React, { useState } from 'react';
import {
  HeartPulse,
  Search,
  User,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  Sun,
  Printer,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smile,
  ShieldCheck,
  Award,
  Lightbulb
} from 'lucide-react';

interface NinoApiData {
  id: number;
  nombre: string;
  fecha_nacimiento?: string;
  genero?: string;
  edad_meses?: number;
  total_pruebas: number;
  hitos_no_pasa?: Record<string, string[]>;
  ultimo_resultado?: string;
  ultima_fecha?: string;
}

interface AdultoApiResponse {
  adulto_id: number;
  adulto_nombre: string;
  ninos: NinoApiData[];
}

interface SugerenciasApiResponse {
  nino_nombre: string;
  edad_anios: number;
  edad_meses_resto: number;
  total_pruebas: number;
  ultimo_resultado: string;
  hitos_no_pasa?: Record<string, string[]>;
  sugerencias: string;
}

const API_BASE_URL = 'https://wbhshrxibzleubcsistn.supabase.co/functions/v1/consulta-familiar';

// Preguntas del Cuestionario
const PREGUNTA_1_OPCIONES = ['Adentro', 'Afuera', 'Los dos por igual'];
const PREGUNTA_2_OPCIONES = ['Solo/a', 'Con otros niños', 'Le da igual'];
const PREGUNTA_3_OPCIONES = [
  'Correr y saltar',
  'Dibujar o pintar',
  'Música y canciones',
  'Jugar con agua o arena',
  'Armar y construir',
  'Ver videos',
];

export default function ConsultaFamiliar() {
  // Estado de Paso
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Búsqueda por DNI
  const [dni, setDni] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Paso 2: Datos de consulta
  const [adultoData, setAdultoData] = useState<AdultoApiResponse | null>(null);
  const [selectedNinoId, setSelectedNinoId] = useState<number | null>(null);
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [q3, setQ3] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Paso 3: Sugerencias
  const [resultadoData, setResultadoData] = useState<SugerenciasApiResponse | null>(null);

  // Helper para formatear edad en texto amigable
  const formatEdadMeses = (meses?: number) => {
    if (meses === undefined || meses === null) return '';
    const anios = Math.floor(meses / 12);
    const restoMeses = meses % 12;
    if (anios === 0) return `${restoMeses} meses`;
    if (restoMeses === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
    return `${anios} ${anios === 1 ? 'año' : 'años'} y ${restoMeses} ${restoMeses === 1 ? 'mes' : 'meses'}`;
  };

  // Handler: Buscar por DNI (Paso 1)
  const handleBuscarDni = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const dniLimpio = dni.trim().replace(/\D/g, '');

    if (!dniLimpio || dniLimpio.length < 6) {
      setSearchError('Por favor ingresá un número de DNI válido (mínimo 6 dígitos).');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`${API_BASE_URL}?dni=${encodeURIComponent(dniLimpio)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setSearchError(
            'No encontramos registros con ese DNI. Si creés que es un error, consultá con la institución donde se evaluó tu hijo/a.'
          );
        } else {
          setSearchError(
            data.error || 'Hubo un problema de conexión. Intentá nuevamente.'
          );
        }
        return;
      }

      if (!data.ninos || data.ninos.length === 0) {
        setSearchError(
          'No encontramos ningún niño/a asociado a este DNI. Consultá con la institución correspondiente.'
        );
        return;
      }

      setAdultoData(data);
      setSelectedNinoId(data.ninos[0].id);
      setPaso(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al consultar DNI:', err);
      setSearchError('Hubo un problema de conexión. Intentá nuevamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handler: Generar sugerencias (Paso 2)
  const handleGenerarSugerencias = async () => {
    if (!selectedNinoId || !adultoData) return;
    if (!q1 || !q2 || !q3) {
      setGenerateError('Por favor responde las 3 preguntas para personalizar las sugerencias.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_nino: selectedNinoId,
          adulto_id: adultoData.adulto_id,
          q1,
          q2,
          q3,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setGenerateError('No autorizado para consultar este niño/a.');
        } else {
          setGenerateError(
            data.error || 'Hubo un problema al procesar la solicitud. Intentá nuevamente.'
          );
        }
        return;
      }

      setResultadoData(data);
      setPaso(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al generar sugerencias:', err);
      setGenerateError('Hubo un problema de conexión con el servidor. Intentá nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Reiniciar consulta
  const handleNuevaConsulta = () => {
    setPaso(1);
    setDni('');
    setSearchError(null);
    setAdultoData(null);
    setSelectedNinoId(null);
    setQ1('');
    setQ2('');
    setQ3('');
    setGenerateError(null);
    setResultadoData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ninoSeleccionado = adultoData?.ninos.find((n) => n.id === selectedNinoId);

  // Helper para renderizar texto en línea con negrita (**texto**)
  const renderInlineFormatted = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  // Parser manual de Markdown para las secciones de sugerencias
  const renderMarkdownSections = (markdownText: string) => {
    if (!markdownText) return null;

    // Dividimos por encabezados ##
    const rawSections = markdownText.split(/(?=^##\s+)/m).filter((s) => s.trim().length > 0);

    return (
      <div className="space-y-6">
        {rawSections.map((sectionText, idx) => {
          const lines = sectionText.trim().split('\n');
          let heading = '';
          const bodyLines: string[] = [];

          if (lines[0].startsWith('## ')) {
            heading = lines[0].replace(/^##\s+/, '').trim();
            bodyLines.push(...lines.slice(1));
          } else {
            bodyLines.push(...lines);
          }

          // Detectamos el tipo de sección para aplicar colores e íconos temáticos
          const headingLower = heading.toLowerCase();
          let theme = {
            cardBg: 'bg-white',
            borderColor: 'border-slate-200',
            headerBg: 'bg-slate-50',
            textColor: 'text-slate-800',
            iconBg: 'bg-slate-100 text-slate-600',
            icon: <BookOpen className="w-5 h-5 text-slate-600" />,
          };

          if (
            headingLower.includes('familia') ||
            headingLower.includes('significan') ||
            headingLower.includes('resultados')
          ) {
            // Sección Azul
            theme = {
              cardBg: 'bg-blue-50/30',
              borderColor: 'border-blue-200',
              headerBg: 'bg-blue-100/60',
              textColor: 'text-blue-950',
              iconBg: 'bg-blue-500 text-white',
              icon: <BookOpen className="w-5 h-5 text-white" />,
            };
          } else if (
            headingLower.includes('actividad') ||
            headingLower.includes('casa') ||
            headingLower.includes('juegos')
          ) {
            // Sección Verde
            theme = {
              cardBg: 'bg-emerald-50/30',
              borderColor: 'border-emerald-200',
              headerBg: 'bg-emerald-100/60',
              textColor: 'text-emerald-950',
              iconBg: 'bg-emerald-500 text-white',
              icon: <Smile className="w-5 h-5 text-white" />,
            };
          } else if (
            headingLower.includes('consejo') ||
            headingLower.includes('día a día') ||
            headingLower.includes('rutina')
          ) {
            // Sección Naranja
            theme = {
              cardBg: 'bg-amber-50/30',
              borderColor: 'border-amber-200',
              headerBg: 'bg-amber-100/60',
              textColor: 'text-amber-950',
              iconBg: 'bg-amber-500 text-white',
              icon: <Sun className="w-5 h-5 text-white" />,
            };
          } else {
            // Otra sección destacada
            theme = {
              cardBg: 'bg-indigo-50/20',
              borderColor: 'border-indigo-200',
              headerBg: 'bg-indigo-100/50',
              textColor: 'text-indigo-950',
              iconBg: 'bg-indigo-500 text-white',
              icon: <Sparkles className="w-5 h-5 text-white" />,
            };
          }

          // Parseamos las líneas internas (subtítulos ###, viñetas • / -, párrafos)
          const elements: React.ReactNode[] = [];
          let currentListItems: string[] = [];

          const flushList = () => {
            if (currentListItems.length > 0) {
              elements.push(
                <ul key={`ul-${elements.length}`} className="space-y-2.5 my-3 pl-1">
                  {currentListItems.map((item, lIdx) => (
                    <li key={lIdx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-sm sm:text-base">
                      <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-teal-600 mt-2 flex-shrink-0" />
                      <span className="flex-1">{renderInlineFormatted(item)}</span>
                    </li>
                  ))}
                </ul>
              );
              currentListItems = [];
            }
          };

          bodyLines.forEach((line, lineIdx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              flushList();
              return;
            }

            // Subtítulos ###
            if (trimmed.startsWith('### ')) {
              flushList();
              elements.push(
                <h3
                  key={`h3-${lineIdx}`}
                  className="text-base sm:text-lg font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {renderInlineFormatted(trimmed.replace(/^###\s+/, ''))}
                </h3>
              );
            }
            // Viñetas: •, -, *, o enumeraciones 1., 2.
            else if (
              trimmed.startsWith('•') ||
              trimmed.startsWith('- ') ||
              trimmed.startsWith('* ') ||
              /^\d+\.\s/.test(trimmed)
            ) {
              const itemText = trimmed.replace(/^([•\-\*]|\d+\.)\s+/, '');
              currentListItems.push(itemText);
            }
            // Párrafo regular
            else {
              flushList();
              elements.push(
                <p key={`p-${lineIdx}`} className="text-slate-700 leading-relaxed my-2 text-sm sm:text-base">
                  {renderInlineFormatted(trimmed)}
                </p>
              );
            }
          });

          flushList();

          return (
            <div
              key={idx}
              className={`rounded-3xl border ${theme.borderColor} ${theme.cardBg} shadow-sm overflow-hidden transition-all duration-300`}
            >
              {heading && (
                <div className={`p-4 sm:p-5 ${theme.headerBg} border-b ${theme.borderColor} flex items-center gap-3`}>
                  <div className={`p-2 rounded-xl shadow-xs flex-shrink-0 ${theme.iconBg}`}>
                    {theme.icon}
                  </div>
                  <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${theme.textColor}`}>
                    {heading}
                  </h2>
                </div>
              )}
              <div className="p-5 sm:p-7">{elements}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 font-sans flex flex-col justify-between">
      {/* Header Institucional */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 leading-none tracking-tight">
                  PrepPRUNAPE
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  Familias
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Consulta para familias • Defensoría de NNyA Córdoba
              </p>
            </div>
          </div>

          {paso > 1 && (
            <button
              onClick={handleNuevaConsulta}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer print:hidden"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva</span> Consulta
            </button>
          )}
        </div>
      </header>

      {/* Indicador de Pasos (Progreso) */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 pb-2 print:hidden">
        <div className="flex items-center justify-between relative max-w-md mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          
          {/* Paso 1 Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                paso >= 1
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {paso > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-1">DNI</span>
          </div>

          {/* Paso 2 Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                paso >= 2
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white border-2 border-slate-300 text-slate-400'
              }`}
            >
              {paso > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-1">Cuestionario</span>
          </div>

          {/* Paso 3 Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                paso === 3
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white border-2 border-slate-300 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-1">Sugerencias</span>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        {/* ========================================================================= */}
        {/* PASO 1: INGRESO DE DNI                                                    */}
        {/* ========================================================================= */}
        {paso === 1 && (
          <div className="max-w-lg mx-auto transition-opacity duration-300">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <User className="w-8 h-8" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Consulta Familiar de Desarrollo
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
                Ingresá tu número de DNI como padre, madre o tutor para consultar las
                evaluaciones y recibir sugerencias personalizadas de juego y estimulación.
              </p>

              <form onSubmit={handleBuscarDni} className="space-y-4 text-left">
                <div>
                  <label htmlFor="dni" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    DNI del adulto responsable
                  </label>
                  <div className="relative">
                    <input
                      id="dni"
                      type="text"
                      inputMode="numeric"
                      value={dni}
                      onChange={(e) => {
                        setDni(e.target.value);
                        if (searchError) setSearchError(null);
                      }}
                      placeholder="Ej: 32456789 (sin puntos)"
                      className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-base focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      disabled={isSearching}
                      autoFocus
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {searchError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{searchError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearching || !dni.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Buscando registros...</span>
                    </>
                  ) : (
                    <>
                      <span>Buscar evaluaciones</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Consulta segura y confidencial • PrepPRUNAPE</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: RESULTADOS + CUESTIONARIO                                         */}
        {/* ========================================================================= */}
        {paso === 2 && adultoData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Tarjeta de Bienvenida y Selección de Niño */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-teal-700 text-sm font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Adulto identificado</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    ¡Hola, {adultoData.adulto_nombre}!
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Encontramos {adultoData.ninos.length}{' '}
                    {adultoData.ninos.length === 1 ? 'niño/a vinculado/a' : 'niños vinculados'} a tu DNI.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar DNI
                </button>
              </div>

              {/* Selector si hay más de 1 niño */}
              {adultoData.ninos.length > 1 && (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Seleccioná a quién deseás consultar:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {adultoData.ninos.map((n) => {
                      const isSelected = n.id === selectedNinoId;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSelectedNinoId(n.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-base">{n.nombre}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatEdadMeses(n.edad_meses)} • {n.total_pruebas}{' '}
                              {n.total_pruebas === 1 ? 'evaluación' : 'evaluaciones'}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumen del Niño Seleccionado */}
              {ninoSeleccionado && (
                <div className="mt-6 space-y-5">
                  <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                        {ninoSeleccionado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {ninoSeleccionado.nombre}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                          {ninoSeleccionado.edad_meses !== undefined && (
                            <span className="inline-flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded-md border border-teal-200/60 text-teal-800">
                              <Calendar className="w-3 h-3 text-teal-600" />
                              {formatEdadMeses(ninoSeleccionado.edad_meses)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded-md border border-teal-200/60 text-teal-800">
                            <Award className="w-3 h-3 text-teal-600" />
                            {ninoSeleccionado.total_pruebas}{' '}
                            {ninoSeleccionado.total_pruebas === 1 ? 'evaluación realizada' : 'evaluaciones realizadas'}
                          </span>
                          {ninoSeleccionado.ultima_fecha && (
                            <span className="inline-flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded-md border border-teal-200/60 text-teal-800">
                              Fecha: {ninoSeleccionado.ultima_fecha}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {ninoSeleccionado.ultimo_resultado && (
                        ninoSeleccionado.ultimo_resultado === 'Aprobado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-200">
                            <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
                            {ninoSeleccionado.ultimo_resultado}
                          </span>
                        )
                      )}
                      <span className="text-xs text-teal-900 bg-teal-100/70 py-1.5 px-3 rounded-xl font-medium">
                        PrepPRUNAPE
                      </span>
                    </div>
                  </div>

                  {/* Sección: Estos son los hitos que podemos trabajar juntos */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-indigo-950">
                        Estos son los hitos que podemos trabajar juntos
                      </h3>
                    </div>

                    {ninoSeleccionado.hitos_no_pasa &&
                    Object.keys(ninoSeleccionado.hitos_no_pasa).length > 0 &&
                    Object.values(ninoSeleccionado.hitos_no_pasa).some((arr) => arr && arr.length > 0) ? (
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 mb-4">
                          Son habilidades que tu hijo/a está desarrollando y que podemos fortalecer con juegos en el hogar:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {Object.entries(ninoSeleccionado.hitos_no_pasa).map(([area, hitos]) => {
                            if (!hitos || hitos.length === 0) return null;
                            return (
                              <div
                                key={area}
                                className="bg-white p-4 rounded-xl border border-indigo-100/80 shadow-xs"
                              >
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                                  Área: {area}
                                </h4>
                                <ul className="space-y-1.5 text-sm text-slate-700">
                                  {hitos.map((hito, hIdx) => (
                                    <li key={hIdx} className="flex items-start gap-2">
                                      <span className="text-indigo-500 font-bold leading-none mt-0.5">•</span>
                                      <span className="leading-snug">{hito}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          ¡Muy bien! No hay hitos pendientes registrados.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CUESTIONARIO DE 3 PREGUNTAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  Cuestionario Familiar
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  ¿Cómo juega y se divierte {ninoSeleccionado?.nombre || 'tu hijo/a'}?
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Respondé estas 3 preguntas sencillas para que la Inteligencia Artificial genere
                  actividades y sugerencias adaptadas a sus gustos en el hogar.
                </p>
              </div>

              <div className="space-y-6">
                {/* PREGUNTA 1 */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-3">
                    1. ¿Tu hijo/a prefiere jugar adentro o afuera de la casa?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PREGUNTA_1_OPCIONES.map((opcion) => {
                      const isSelected = q1 === opcion;
                      return (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => setQ1(opcion)}
                          className={`p-4 rounded-2xl border text-center font-medium text-sm sm:text-base transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opcion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PREGUNTA 2 */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-3">
                    2. ¿Se siente más cómodo/a jugando solo/a o con otros niños?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PREGUNTA_2_OPCIONES.map((opcion) => {
                      const isSelected = q2 === opcion;
                      return (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => setQ2(opcion)}
                          className={`p-4 rounded-2xl border text-center font-medium text-sm sm:text-base transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opcion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PREGUNTA 3 */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-3">
                    3. ¿Qué actividad le genera más entusiasmo?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {PREGUNTA_3_OPCIONES.map((opcion) => {
                      const isSelected = q3 === opcion;
                      return (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => setQ3(opcion)}
                          className={`p-4 rounded-2xl border text-center font-medium text-sm sm:text-base transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opcion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {generateError && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{generateError}</span>
                </div>
              )}

              {/* Botón de Generar Sugerencias */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 order-2 sm:order-1">
                  {!q1 || !q2 || !q3
                    ? 'Completá las 3 respuestas para continuar.'
                    : '¡Todo listo para consultar a la IA!'}
                </p>

                <button
                  type="button"
                  onClick={handleGenerarSugerencias}
                  disabled={isGenerating || !q1 || !q2 || !q3}
                  className="w-full sm:w-auto order-1 sm:order-2 py-4 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Consultando a la IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Generar sugerencias para mi hijo/a</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: SUGERENCIAS DE LA IA                                              */}
        {/* ========================================================================= */}
        {paso === 3 && resultadoData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header del Informe */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Orientación personalizada
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Sugerencias para {resultadoData.nino_nombre}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Edad: {resultadoData.edad_anios}{' '}
                    {resultadoData.edad_anios === 1 ? 'año' : 'años'} y {resultadoData.edad_meses_resto}{' '}
                    {resultadoData.edad_meses_resto === 1 ? 'mes' : 'meses'} •{' '}
                    {resultadoData.total_pruebas}{' '}
                    {resultadoData.total_pruebas === 1 ? 'evaluación' : 'evaluaciones'} realizadas
                  </p>
                </div>

                {/* Badge de resultado general */}
                <div className="self-start sm:self-center">
                  {resultadoData.ultimo_resultado === 'Aprobado' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Desarrollo esperado para la edad</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-sm">
                      <HeartPulse className="w-4 h-4 text-amber-600" />
                      <span>Oportunidades de estimulación y juego</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hitos que podemos trabajar juntos (si existen) */}
              {resultadoData.hitos_no_pasa &&
                Object.keys(resultadoData.hitos_no_pasa).length > 0 && (
                  <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <Users className="w-4 h-4" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                        Estos son los hitos que podemos trabajar juntos
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-4">
                      Son habilidades que tu hijo/a está aprendiendo y que podemos fortalecer con juegos en casa:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(resultadoData.hitos_no_pasa).map(([area, hitos]) => (
                        <div key={area} className="bg-white p-4 rounded-xl border border-indigo-100/80 shadow-xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                            Área: {area}
                          </h4>
                          <ul className="space-y-1.5 text-sm text-slate-700">
                            {hitos.map((hito, hIdx) => (
                              <li key={hIdx} className="flex items-start gap-2">
                                <span className="text-indigo-500 font-bold leading-none mt-0.5">•</span>
                                <span className="leading-snug">{hito}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* SECCIONES FORMATEADAS DE LA IA */}
            <div className="space-y-6">
              {renderMarkdownSections(resultadoData.sugerencias)}
            </div>

            {/* Botones de Acción (Imprimir / Guardar PDF / Nueva Consulta) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <button
                type="button"
                onClick={handleNuevaConsulta}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Realizar otra consulta</span>
              </button>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Modificar respuestas</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Público */}
      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 mt-8 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">PrepPRUNAPE • Defensoría de NNyA de Córdoba</p>
            <p className="mt-0.5">Programa de Pesquisa Rápida del Desarrollo Infantil</p>
          </div>
          <p>Esta herramienta brinda recomendaciones de acompañamiento y no reemplaza la consulta pediátrica.</p>
        </div>
      </footer>
    </div>
  );
}
