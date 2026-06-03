import { z } from 'zod';

export const step1Schema = z.object({
  tipo_hogar: z.enum(
    ['nuclear', 'monoparental_femenina', 'monoparental_masculina', 'extensa', 'ensamblada', 'unipersonal'],
    { errorMap: () => ({ message: 'Seleccione el tipo de hogar' }) }
  ),
  jefatura: z.enum(['femenina', 'masculina', 'compartida'], {
    errorMap: () => ({ message: 'Seleccione el tipo de jefatura' }),
  }),
  cant_personas: z
    .number({ invalid_type_error: 'Debe ingresar un número' })
    .int('Debe ser un número entero')
    .min(1, 'Debe haber al menos 1 persona en el hogar'),
  barrio: z.string().min(1, 'El barrio es requerido'),
  localidad: z.string().min(1, 'La localidad es requerida'),
  tipo_barrio: z.enum(['formal', 'informal'], {
    errorMap: () => ({ message: 'Seleccione el tipo de barrio' }),
  }),
  id_adulto_jefe: z.number().nullable().optional().default(null),
});

export const step2Schema = z.object({
  nivel_educativo_jefe: z.enum(
    [
      'sin_instruccion',
      'primario_incompleto',
      'primario_completo',
      'secundario_incompleto',
      'secundario_completo',
      'terciario_universitario',
    ],
    { errorMap: () => ({ message: 'Seleccione el nivel educativo del jefe' }) }
  ),
  situacion_ocupacional: z.enum(['formal', 'informal', 'desocupado', 'inactivo'], {
    errorMap: () => ({ message: 'Seleccione la situación ocupacional' }),
  }),
  escala_ingresos: z.enum(['menos_1_sml', 'entre_1_2_sml', 'entre_2_3_sml', 'mas_3_sml'], {
    errorMap: () => ({ message: 'Seleccione la escala de ingresos' }),
  }),
  recibe_transferencias_estado: z.boolean().default(false),
  tipo_transferencias: z.array(z.string()).default([]),
});

export const step3Schema = z.object({
  cobertura_salud: z.enum(['obra_social', 'prepaga', 'solo_publico'], {
    errorMap: () => ({ message: 'Seleccione la cobertura de salud' }),
  }),
  tipo_vivienda: z.enum(['casa', 'departamento', 'casilla', 'rancho', 'precaria'], {
    errorMap: () => ({ message: 'Seleccione el tipo de vivienda' }),
  }),
  condicion_tenencia: z.enum(['propietario', 'inquilino', 'ocupante', 'otro'], {
    errorMap: () => ({ message: 'Seleccione la condición de tenencia' }),
  }),
  material_piso: z.enum(['ceramico_mosaico', 'cemento', 'madera', 'tierra'], {
    errorMap: () => ({ message: 'Seleccione el material del piso' }),
  }),
  cant_ambientes: z
    .number({ invalid_type_error: 'Debe ingresar un número' })
    .int('Debe ser un número entero')
    .min(1, 'Debe haber al menos 1 ambiente'),
  hacinamiento: z.enum(['sin_hacinamiento', 'hacinamiento', 'hacinamiento_critico']).default('sin_hacinamiento'),
});

export const step4Schema = z.object({
  agua: z.enum(['red_publica', 'pozo', 'otra'], {
    errorMap: () => ({ message: 'Seleccione el acceso al agua' }),
  }),
  saneamiento: z.enum(['red_cloacal', 'pozo', 'sin_sistema'], {
    errorMap: () => ({ message: 'Seleccione el sistema de saneamiento' }),
  }),
  electricidad: z.enum(['con_medidor', 'irregular', 'sin_acceso'], {
    errorMap: () => ({ message: 'Seleccione la electricidad' }),
  }),
  combustible_coccion: z.enum(['gas_red', 'garrafa', 'lena', 'electricidad'], {
    errorMap: () => ({ message: 'Seleccione el combustible de cocción' }),
  }),
  tiene_internet: z.boolean().default(false),
});

export const step5Schema = z.object({
  tiene_red_apoyo: z.boolean().default(false),
  tipo_red_apoyo: z.array(z.string()).default([]),
  participa_organizacion: z.boolean().default(false),
  tipo_organizacion: z.array(z.string()).default([]),
  observaciones: z.string().max(1000, 'Máximo 1000 caracteres').default(''),
});

// Esquema completo para el formulario
export const hogarSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
});

export type HogarSchemaType = z.infer<typeof hogarSchema>;
export type Step1SchemaType = z.infer<typeof step1Schema>;
export type Step2SchemaType = z.infer<typeof step2Schema>;
export type Step3SchemaType = z.infer<typeof step3Schema>;
export type Step4SchemaType = z.infer<typeof step4Schema>;
export type Step5SchemaType = z.infer<typeof step5Schema>;
