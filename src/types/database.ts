export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRol = 'admin' | 'coordinador' | 'agente_municipio'

export interface Database {
  public: {
    Tables: {
      "niños": {
        Row: {
          idninos: number
          nombre: string | null
          fecha_nacimiento: string | null
          fecha_nac_real: string | null
          genero: string | null
          dni: number | null
          Direccion: string | null
          Localidad: string | null
          Telefonocontacto: number | null
          adultoresponsable: string | null
          ultEvaluacion: string | null
          Edad: string | null
          pesoNac: string | null
          idAdulto: number | null
          prematuro: string | null
          semanas: number | null
          otras_características: string | null
        }
        Insert: {
          idninos?: number
          nombre?: string | null
          fecha_nacimiento?: string | null
          fecha_nac_real?: string | null
          genero?: string | null
          dni?: number | null
          Direccion?: string | null
          Localidad?: string | null
          Telefonocontacto?: number | null
          adultoresponsable?: string | null
          ultEvaluacion?: string | null
          Edad?: string | null
          pesoNac?: string | null
          idAdulto?: number | null
          prematuro?: string | null
          semanas?: number | null
          otras_características?: string | null
        }
        Update: {
          idninos?: number
          nombre?: string | null
          fecha_nacimiento?: string | null
          fecha_nac_real?: string | null
          genero?: string | null
          dni?: number | null
          Direccion?: string | null
          Localidad?: string | null
          Telefonocontacto?: number | null
          adultoresponsable?: string | null
          ultEvaluacion?: string | null
          Edad?: string | null
          pesoNac?: string | null
          idAdulto?: number | null
          prematuro?: string | null
          semanas?: number | null
          otras_características?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ninos_idAdulto_fkey"
            columns: ["idAdulto"]
            referencedRelation: "adultos"
            referencedColumns: ["id"]
          }
        ]
      }
      adultos: {
        Row: {
          id: number
          NombreyApellido: string | null
          DNI: string | null
          telefono: string | null
          Parentezco: string | null
          Barrio: string | null
          NivelEducativo: string | null
          genero: string | null
          Edad: string | null
          idNNyA: number | null
          observaciones: string | null
          created_at: string
        }
        Insert: {
          id?: number
          NombreyApellido?: string | null
          DNI?: string | null
          telefono?: string | null
          Parentezco?: string | null
          Barrio?: string | null
          NivelEducativo?: string | null
          genero?: string | null
          Edad?: string | null
          idNNyA?: number | null
          observaciones?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          NombreyApellido?: string | null
          DNI?: string | null
          telefono?: string | null
          Parentezco?: string | null
          Barrio?: string | null
          NivelEducativo?: string | null
          genero?: string | null
          Edad?: string | null
          idNNyA?: number | null
          observaciones?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adultos_idNNyA_fkey"
            columns: ["idNNyA"]
            referencedRelation: "niños"
            referencedColumns: ["idninos"]
          }
        ]
      }
      adultoyNNyA: {
        Row: {
          id: number
          idNNyA: number | null
          idAdulto: number | null
          created_at: string
        }
        Insert: {
          id?: number
          idNNyA?: number | null
          idAdulto?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          idNNyA?: number | null
          idAdulto?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adultoyNNyA_idNNyA_fkey"
            columns: ["idNNyA"]
            referencedRelation: "niños"
            referencedColumns: ["idninos"]
          },
          {
            foreignKeyName: "adultoyNNyA_idAdulto_fkey"
            columns: ["idAdulto"]
            referencedRelation: "adultos"
            referencedColumns: ["id"]
          }
        ]
      }
      Prueba_pre_prunape: {
        Row: {
          id_prueba: number
          idniño: number | null
          Fecha: string | null
          Aprobado: string | null
          Observacion: string | null
          observacion: string | null
          fechanacimiento: string | null
          formulario: string | null
          estado: string | null
          idpreguntas: number | null
          formcreado: boolean | null
          espCuidado: string | null
          direccionEspCui: string | null
          created_at: string
        }
        Insert: {
          id_prueba?: number
          idniño?: number | null
          Fecha?: string | null
          Aprobado?: string | null
          Observacion?: string | null
          observacion?: string | null
          fechanacimiento?: string | null
          formulario?: string | null
          estado?: string | null
          idpreguntas?: number | null
          formcreado?: boolean | null
          espCuidado?: string | null
          direccionEspCui?: string | null
          created_at?: string
        }
        Update: {
          id_prueba?: number
          idniño?: number | null
          Fecha?: string | null
          Aprobado?: string | null
          Observacion?: string | null
          observacion?: string | null
          fechanacimiento?: string | null
          formulario?: string | null
          estado?: string | null
          idpreguntas?: number | null
          formcreado?: boolean | null
          espCuidado?: string | null
          direccionEspCui?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Prueba_pre_prunape_idniño_fkey"
            columns: ["idniño"]
            referencedRelation: "niños"
            referencedColumns: ["idninos"]
          }
        ]
      }
      users: {
        Row: {
          id: number
          iduser: string
          display_name: string | null
          photo_url: string | null
          shortDescription: string | null
          DNI: number | null
          Telefono: string | null
          Localidad: string | null
          estado: string | null
          rol: UserRol
          created_at: string
        }
        Insert: {
          id?: number
          iduser: string
          display_name?: string | null
          photo_url?: string | null
          shortDescription?: string | null
          DNI?: number | null
          Telefono?: string | null
          Localidad?: string | null
          estado?: string | null
          rol?: UserRol
          created_at?: string
        }
        Update: {
          id?: number
          iduser?: string
          display_name?: string | null
          photo_url?: string | null
          shortDescription?: string | null
          DNI?: number | null
          Telefono?: string | null
          Localidad?: string | null
          estado?: string | null
          rol?: UserRol
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_iduser_fkey"
            columns: ["iduser"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_Localidad_fkey"
            columns: ["Localidad"]
            referencedRelation: "Localidad"
            referencedColumns: ["Localidad"]
          }
        ]
      }
      Localidad: {
        Row: {
          id: number
          Localidad: string
          created_at: string
        }
        Insert: {
          id?: number
          Localidad: string
          created_at?: string
        }
        Update: {
          id?: number
          Localidad?: string
          created_at?: string
        }
        Relationships: []
      }
      mapa_servicios: {
        Row: {
          id: number
          id_instituciones: number | null
          wkt: string | null
          nombre: string | null
          nombre_de_la_entidad: string | null
          institucion: string | null
          departamento: string | null
          localidad: string | null
          denominacion_barrial: string | null
          domicilio: string | null
          categoria: string | null
          servicio: string | null
        }
        Insert: {
          id?: number
          id_instituciones?: number | null
          wkt?: string | null
          nombre?: string | null
          nombre_de_la_entidad?: string | null
          institucion?: string | null
          departamento?: string | null
          localidad?: string | null
          denominacion_barrial?: string | null
          domicilio?: string | null
          categoria?: string | null
          servicio?: string | null
        }
        Update: {
          id?: number
          id_instituciones?: number | null
          wkt?: string | null
          nombre?: string | null
          nombre_de_la_entidad?: string | null
          institucion?: string | null
          departamento?: string | null
          localidad?: string | null
          denominacion_barrial?: string | null
          domicilio?: string | null
          categoria?: string | null
          servicio?: string | null
        }
        Relationships: []
      }
      institucionesredPI: {
        Row: {
          id: number
          "Marca temporal": string | null
          "Institución": string | null
          "Nombre de la institución": string | null
          Localidad: string | null
          Direccion: string | null
          "Código Postal": string | null
          "Eje de trabajo (se puede elegir más de una opción)": string | null
          "Descripción del Programa/ abordaje en marcha": string | null
          "Franja etaria con la que trabajan": string | null
          "¿Qué va a sumar tu institución?": string | null
          "¿A qué cantidad de NNyA alcanzan el programa?.": string | null
          "Contacto de referencia": string | null
          "Redes sociales de la institución": string | null
          "¿Qué tipo de recurso puede sumar mi institución?": string | null
          "Si tenés un documento para subir, podés cargarlo acá:": string | null
          logo: string | null
        }
        Insert: {
          id?: number
          "Marca temporal"?: string | null
          "Institución"?: string | null
          "Nombre de la institución"?: string | null
          Localidad?: string | null
          Direccion?: string | null
          "Código Postal"?: string | null
          "Eje de trabajo (se puede elegir más de una opción)"?: string | null
          "Descripción del Programa/ abordaje en marcha"?: string | null
          "Franja etaria con la que trabajan"?: string | null
          "¿Qué va a sumar tu institución?"?: string | null
          "¿A qué cantidad de NNyA alcanzan el programa?."?: string | null
          "Contacto de referencia"?: string | null
          "Redes sociales de la institución"?: string | null
          "¿Qué tipo de recurso puede sumar mi institución?"?: string | null
          "Si tenés un documento para subir, podés cargarlo acá:"?: string | null
          logo?: string | null
        }
        Update: {
          id?: number
          "Marca temporal"?: string | null
          "Institución"?: string | null
          "Nombre de la institución"?: string | null
          Localidad?: string | null
          Direccion?: string | null
          "Código Postal"?: string | null
          "Eje de trabajo (se puede elegir más de una opción)"?: string | null
          "Descripción del Programa/ abordaje en marcha"?: string | null
          "Franja etaria con la que trabajan"?: string | null
          "¿Qué va a sumar tu institución?"?: string | null
          "¿A qué cantidad de NNyA alcanzan el programa?."?: string | null
          "Contacto de referencia"?: string | null
          "Redes sociales de la institución"?: string | null
          "¿Qué tipo de recurso puede sumar mi institución?"?: string | null
          "Si tenés un documento para subir, podés cargarlo acá:"?: string | null
          logo?: string | null
        }
        Relationships: []
      }
      preguntas: {
        Row: {
          id_pregunta: number
          texto_pregunta: string | null
          Categoria: string | null
          form1: boolean | null
          form2: boolean | null
          form3: boolean | null
          form4: boolean | null
          form5: boolean | null
        }
        Insert: {
          id_pregunta?: number
          texto_pregunta?: string | null
          Categoria?: string | null
          form1?: boolean | null
          form2?: boolean | null
          form3?: boolean | null
          form4?: boolean | null
          form5?: boolean | null
        }
        Update: {
          id_pregunta?: number
          texto_pregunta?: string | null
          Categoria?: string | null
          form1?: boolean | null
          form2?: boolean | null
          form3?: boolean | null
          form4?: boolean | null
          form5?: boolean | null
        }
        Relationships: []
      }
      preguntas2: {
        Row: {
          id_pregunta: number
          texto_pregunta: string | null
          Categoria: string | null
          "Franja etaria": string | null
          "Form 1": boolean | null
          numero_form1: number | null
          "Form 2": boolean | null
          numero_form2: string | null
          "Form 3": boolean | null
          numero_form3: string | null
          "Form 4": boolean | null
          numero_form4: string | null
          "Form 5": boolean | null
          numero_form5: string | null
          imagen: string | null
        }
        Insert: {
          id_pregunta?: number
          texto_pregunta?: string | null
          Categoria?: string | null
          "Franja etaria"?: string | null
          "Form 1"?: boolean | null
          numero_form1?: number | null
          "Form 2"?: boolean | null
          numero_form2?: string | null
          "Form 3"?: boolean | null
          numero_form3?: string | null
          "Form 4"?: boolean | null
          numero_form4?: string | null
          "Form 5"?: boolean | null
          numero_form5?: string | null
          imagen?: string | null
        }
        Update: {
          id_pregunta?: number
          texto_pregunta?: string | null
          Categoria?: string | null
          "Franja etaria"?: string | null
          "Form 1"?: boolean | null
          numero_form1?: number | null
          "Form 2"?: boolean | null
          numero_form2?: string | null
          "Form 3"?: boolean | null
          numero_form3?: string | null
          "Form 4"?: boolean | null
          numero_form4?: string | null
          "Form 5"?: boolean | null
          numero_form5?: string | null
          imagen?: string | null
        }
        Relationships: []
      }
      pregunta_list: {
        Row: {
          id: number
          idpreguntacom: number | null
          idrespuestacom: number | null
          id_ingresoform: number | null
          created_at: string
        }
        Insert: {
          id?: number
          idpreguntacom?: number | null
          idrespuestacom?: number | null
          id_ingresoform?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          idpreguntacom?: number | null
          idrespuestacom?: number | null
          id_ingresoform?: number | null
          created_at?: string
        }
        Relationships: []
      }
      respuestas: {
        Row: {
          id: number
          Respuesta: string | null
          created_at: string
        }
        Insert: {
          id?: number
          Respuesta?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          Respuesta?: string | null
          created_at?: string
        }
        Relationships: []
      }
      intervalosevaluacion: {
        Row: {
          id: number
          Formulario: string | null
          "Edad Mínima": string | null
          "Edad Máxima": string | null
          "Pregunta de Evaluación": number[] | null
          idevaluacion: number | null
        }
        Insert: {
          id?: number
          Formulario?: string | null
          "Edad Mínima"?: string | null
          "Edad Máxima"?: string | null
          "Pregunta de Evaluación"?: number[] | null
          idevaluacion?: number | null
        }
        Update: {
          id?: number
          Formulario?: string | null
          "Edad Mínima"?: string | null
          "Edad Máxima"?: string | null
          "Pregunta de Evaluación"?: number[] | null
          idevaluacion?: number | null
        }
        Relationships: []
      }
      rango_formulario: {
        Row: {
          formulario: string
          edad_minima_meses: number | null
          edad_maxima_meses: number | null
        }
        Insert: {
          formulario: string
          edad_minima_meses?: number | null
          edad_maxima_meses?: number | null
        }
        Update: {
          formulario?: string
          edad_minima_meses?: number | null
          edad_maxima_meses?: number | null
        }
        Relationships: []
      }
      config_formularios: {
        Row: {
          formulario: string
          max_no_pasa: number
          descripcion: string | null
          updated_at: string
        }
        Insert: {
          formulario: string
          max_no_pasa?: number
          descripcion?: string | null
          updated_at?: string
        }
        Update: {
          formulario?: string
          max_no_pasa?: number
          descripcion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tablacron: {
        Row: {
          id: number
          fecha: string | null
          numero: number | null
          created_at: string
        }
        Insert: {
          id?: number
          fecha?: string | null
          numero?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          fecha?: string | null
          numero?: number | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Nino = Database['public']['Tables']['niños']['Row']
export type NinoInsert = Database['public']['Tables']['niños']['Insert']
export type NinoUpdate = Database['public']['Tables']['niños']['Update']

export type Adulto = Database['public']['Tables']['adultos']['Row']
export type AdultoInsert = Database['public']['Tables']['adultos']['Insert']
export type AdultoUpdate = Database['public']['Tables']['adultos']['Update']

export type AdultoyNNyA = Database['public']['Tables']['adultoyNNyA']['Row']

export type PruebaPrePrunape = Database['public']['Tables']['Prueba_pre_prunape']['Row']
export type PruebaInsert = Database['public']['Tables']['Prueba_pre_prunape']['Insert']

export type UserProfile = Database['public']['Tables']['users']['Row']
export type UserProfileInsert = Database['public']['Tables']['users']['Insert']

export type LocalidadRow = Database['public']['Tables']['Localidad']['Row']

export type MapaServicio = Database['public']['Tables']['mapa_servicios']['Row']
export type InstitucionRedPI = Database['public']['Tables']['institucionesredPI']['Row']

export type Pregunta = Database['public']['Tables']['preguntas']['Row']
export type Pregunta2 = Database['public']['Tables']['preguntas2']['Row']
export type RangoFormulario = Database['public']['Tables']['rango_formulario']['Row']
export type ConfigFormulario = Database['public']['Tables']['config_formularios']['Row']
