export type TipoBarrio = 'formal' | 'informal';

export type TipoHogar =
  | 'nuclear'
  | 'monoparental_femenina'
  | 'monoparental_masculina'
  | 'extensa'
  | 'ensamblada'
  | 'unipersonal';

export type JefaturaHogar = 'femenina' | 'masculina' | 'compartida';

export type NivelEducativoJefe =
  | 'sin_instruccion'
  | 'primario_incompleto'
  | 'primario_completo'
  | 'secundario_incompleto'
  | 'secundario_completo'
  | 'terciario_universitario';

export type SituacionOcupacional = 'formal' | 'informal' | 'desocupado' | 'inactivo';

export type EscalaIngresos = 'menos_1_sml' | 'entre_1_2_sml' | 'entre_2_3_sml' | 'mas_3_sml';

export type CoberturaSalud = 'obra_social' | 'prepaga' | 'solo_publico';

export type TipoVivienda = 'casa' | 'departamento' | 'casilla' | 'rancho' | 'precaria';

export type CondicionTenencia = 'propietario' | 'inquilino' | 'ocupante' | 'otro';

export type MaterialPiso = 'ceramico_mosaico' | 'cemento' | 'madera' | 'tierra';

export type Hacinamiento = 'sin_hacinamiento' | 'hacinamiento' | 'hacinamiento_critico';

export type AccesoAgua = 'red_publica' | 'pozo' | 'otra';

export type Saneamiento = 'red_cloacal' | 'pozo' | 'sin_sistema';

export type Electricidad = 'con_medidor' | 'irregular' | 'sin_acceso';

export type CombustibleCoccion = 'gas_red' | 'garrafa' | 'lena' | 'electricidad';

export interface Hogar {
  id: number;
  barrio: string | null;
  localidad: string | null;
  tipo_barrio: TipoBarrio | null;
  tipo_hogar: TipoHogar | null;
  jefatura: JefaturaHogar | null;
  cant_personas: number | null;
  id_adulto_jefe: number | null;
}

export interface HogarSnapshot {
  id: number;
  id_hogar: number;
  fecha: string;
  nivel_educativo_jefe: NivelEducativoJefe | null;
  situacion_ocupacional: SituacionOcupacional | null;
  escala_ingresos: EscalaIngresos | null;
  recibe_transferencias_estado: boolean | null;
  tipo_transferencias: string[] | null;
  cobertura_salud: CoberturaSalud | null;
  tipo_vivienda: TipoVivienda | null;
  condicion_tenencia: CondicionTenencia | null;
  material_piso: MaterialPiso | null;
  cant_ambientes: number | null;
  hacinamiento: Hacinamiento | null;
  agua: AccesoAgua | null;
  saneamiento: Saneamiento | null;
  electricidad: Electricidad | null;
  combustible_coccion: CombustibleCoccion | null;
  tiene_internet: boolean | null;
  tiene_red_apoyo: boolean | null;
  tipo_red_apoyo: string[] | null;
  participa_organizacion: boolean | null;
  tipo_organizacion: string[] | null;
  nbi_count: number;
  observaciones: string | null;
}

export interface HogarNinos {
  id: number;
  id_hogar: number;
  id_nino: number;
  fecha_ingreso: string;
  fecha_egreso: string | null;
}

// Interfaz que engloba los datos de las tablas combinadas para el formulario
export interface FormularioHogarData {
  // Sección 1: Estructura del hogar
  tipo_hogar: TipoHogar;
  jefatura: JefaturaHogar;
  cant_personas: number;
  barrio: string;
  localidad: string;
  tipo_barrio: TipoBarrio;
  id_adulto_jefe: number | null;

  // Sección 2: Educación e inserción laboral
  nivel_educativo_jefe: NivelEducativoJefe;
  situacion_ocupacional: SituacionOcupacional;
  escala_ingresos: EscalaIngresos;
  recibe_transferencias_estado: boolean;
  tipo_transferencias: string[]; // checkboxes

  // Sección 3: Cobertura de salud y vivienda
  cobertura_salud: CoberturaSalud;
  tipo_vivienda: TipoVivienda;
  condicion_tenencia: CondicionTenencia;
  material_piso: MaterialPiso;
  cant_ambientes: number;
  hacinamiento: Hacinamiento; // calculado o seleccionado

  // Sección 4: Servicios básicos
  agua: AccesoAgua;
  saneamiento: Saneamiento;
  electricidad: Electricidad;
  combustible_coccion: CombustibleCoccion;
  tiene_internet: boolean;

  // Sección 5: Redes de apoyo
  tiene_red_apoyo: boolean;
  tipo_red_apoyo: string[]; // checkboxes
  participa_organizacion: boolean;
  tipo_organizacion: string[]; // checkboxes
  observaciones: string;
}
