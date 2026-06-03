import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { FormularioHogarData } from './hogar.types';
import { toast } from 'sonner';

export function useHogar(idNino: number) {
  const queryClient = useQueryClient();

  // 1. Fetch info de localidad para el select
  const { data: localidades = [], isLoading: isLoadingLocalidades } = useQuery({
    queryKey: ['localidades-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Localidad')
        .select('Localidad')
        .order('Localidad', { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => row.Localidad as string);
    },
  });

  // 2. Fetch de adultos para poder seleccionar el jefe de hogar
  const { data: adultos = [], isLoading: isLoadingAdultos } = useQuery({
    queryKey: ['adultos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adultos')
        .select('id, NombreyApellido, DNI')
        .order('NombreyApellido', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Obtener el hogar actual del niño y su último snapshot
  const { data: hogarData = null, isLoading: isLoadingHogar, error: errorHogar } = useQuery({
    queryKey: ['hogar-nino', idNino],
    queryFn: async () => {
      if (!idNino || isNaN(idNino)) return null;

      // Buscar si el niño tiene un hogar activo
      const { data: activeRelation, error: relError } = await supabase
        .from('hogar_ninos')
        .select('id_hogar')
        .eq('id_nino', idNino)
        .is('fecha_egreso', null)
        .maybeSingle();

      if (relError) throw relError;
      if (!activeRelation) return null;

      const idHogar = activeRelation.id_hogar;

      // Obtener datos estructurales del hogar
      const { data: hogar, error: hogarError } = await supabase
        .from('hogar')
        .select('*')
        .eq('id', idHogar)
        .single();

      if (hogarError) throw hogarError;

      // Obtener el último snapshot socioeconómico del hogar
      const { data: snapshot, error: snapError } = await supabase
        .from('hogar_snapshot')
        .select('*')
        .eq('id_hogar', idHogar)
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (snapError) throw snapError;

      return {
        hogar,
        snapshot,
        idHogar,
      };
    },
    enabled: !!idNino && !isNaN(idNino),
  });

  // 4. Mutation para guardar (crear nuevo hogar o actualizar snapshot de hogar existente)
  const saveHogarMutation = useMutation({
    mutationFn: async (formData: FormularioHogarData) => {
      if (!idNino || isNaN(idNino)) {
        throw new Error('ID de niño inválido');
      }

      const isUpdate = !!hogarData?.idHogar;
      const today = new Date().toISOString().split('T')[0];

      if (!isUpdate) {
        // --- MODO 1: NUEVO HOGAR ---
        // 1. Insertar en la tabla hogar
        const { data: newHogar, error: hogarInsertError } = await supabase
          .from('hogar')
          .insert({
            barrio: formData.barrio || null,
            localidad: formData.localidad || null,
            tipo_barrio: formData.tipo_barrio || null,
            tipo_hogar: formData.tipo_hogar || null,
            jefatura: formData.jefatura || null,
            cant_personas: formData.cant_personas || null,
            id_adulto_jefe: formData.id_adulto_jefe || null,
          })
          .select()
          .single();

        if (hogarInsertError) throw hogarInsertError;
        if (!newHogar) throw new Error('No se pudo crear el hogar.');

        // 2. Asociar el niño a este hogar
        const { error: relInsertError } = await supabase
          .from('hogar_ninos')
          .insert({
            id_hogar: newHogar.id,
            id_nino: idNino,
            fecha_ingreso: today,
            fecha_egreso: null,
          });

        if (relInsertError) throw relInsertError;

        // 3. Crear el primer snapshot socioeconómico
        const { error: snapInsertError } = await supabase
          .from('hogar_snapshot')
          .insert({
            id_hogar: newHogar.id,
            fecha: new Date().toISOString(),
            nivel_educativo_jefe: formData.nivel_educativo_jefe || null,
            situacion_ocupacional: formData.situacion_ocupacional || null,
            escala_ingresos: formData.escala_ingresos || null,
            recibe_transferencias_estado: formData.recibe_transferencias_estado,
            tipo_transferencias: formData.tipo_transferencias || [],
            cobertura_salud: formData.cobertura_salud || null,
            tipo_vivienda: formData.tipo_vivienda || null,
            condicion_tenencia: formData.condicion_tenencia || null,
            material_piso: formData.material_piso || null,
            cant_ambientes: formData.cant_ambientes || null,
            hacinamiento: formData.hacinamiento || null,
            agua: formData.agua || null,
            saneamiento: formData.saneamiento || null,
            electricidad: formData.electricidad || null,
            combustible_coccion: formData.combustible_coccion || null,
            tiene_internet: formData.tiene_internet,
            tiene_red_apoyo: formData.tiene_red_apoyo,
            tipo_red_apoyo: formData.tipo_red_apoyo || [],
            participa_organizacion: formData.participa_organizacion,
            tipo_organizacion: formData.tipo_organizacion || [],
            observaciones: formData.observaciones || null,
          });

        if (snapInsertError) throw snapInsertError;
        return { success: true, mode: 'create', idHogar: newHogar.id };
      } else {
        // --- MODO 2: ACTUALIZACIÓN (NUEVO SNAPSHOT) ---
        const idHogar = hogarData.idHogar;

        // 1. Opcionalmente actualizamos datos estructurales actuales en la tabla hogar
        const { error: hogarUpdateError } = await supabase
          .from('hogar')
          .update({
            barrio: formData.barrio || null,
            localidad: formData.localidad || null,
            tipo_barrio: formData.tipo_barrio || null,
            tipo_hogar: formData.tipo_hogar || null,
            jefatura: formData.jefatura || null,
            cant_personas: formData.cant_personas || null,
            id_adulto_jefe: formData.id_adulto_jefe || null,
          })
          .eq('id', idHogar);

        if (hogarUpdateError) throw hogarUpdateError;

        // 2. Insertamos un nuevo snapshot en el historial
        const { error: snapInsertError } = await supabase
          .from('hogar_snapshot')
          .insert({
            id_hogar: idHogar,
            fecha: new Date().toISOString(),
            nivel_educativo_jefe: formData.nivel_educativo_jefe || null,
            situacion_ocupacional: formData.situacion_ocupacional || null,
            escala_ingresos: formData.escala_ingresos || null,
            recibe_transferencias_estado: formData.recibe_transferencias_estado,
            tipo_transferencias: formData.tipo_transferencias || [],
            cobertura_salud: formData.cobertura_salud || null,
            tipo_vivienda: formData.tipo_vivienda || null,
            condicion_tenencia: formData.condicion_tenencia || null,
            material_piso: formData.material_piso || null,
            cant_ambientes: formData.cant_ambientes || null,
            hacinamiento: formData.hacinamiento || null,
            agua: formData.agua || null,
            saneamiento: formData.saneamiento || null,
            electricidad: formData.electricidad || null,
            combustible_coccion: formData.combustible_coccion || null,
            tiene_internet: formData.tiene_internet,
            tiene_red_apoyo: formData.tiene_red_apoyo,
            tipo_red_apoyo: formData.tipo_red_apoyo || [],
            participa_organizacion: formData.participa_organizacion,
            tipo_organizacion: formData.tipo_organizacion || [],
            observaciones: formData.observaciones || null,
          });

        if (snapInsertError) throw snapInsertError;
        return { success: true, mode: 'update', idHogar };
      }
    },
    onSuccess: (data) => {
      toast.success(
        data.mode === 'create'
          ? '¡Hogar creado y asociado al paciente correctamente!'
          : '¡Historial socioeconómico actualizado con un nuevo registro!'
      );
      // Invalidar queries para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ['hogar-nino', idNino] });
    },
    onError: (error: any) => {
      console.error('Error al guardar datos del hogar:', error);
      toast.error(error.message || 'Error al guardar la información del hogar.');
    },
  });

  return {
    localidades,
    adultos,
    hogarData,
    isLoading: isLoadingHogar || isLoadingLocalidades || isLoadingAdultos,
    error: errorHogar,
    saveHogar: saveHogarMutation.mutateAsync,
    isSaving: saveHogarMutation.isPending,
  };
}
