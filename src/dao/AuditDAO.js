import { supabase } from "./SupabaseDAO";

// Deja constancia en la bitacora de que el usuario consulto la ficha o historia de un paciente.
export const logPatientAccessDAO = async (patientId, context) => {
  const { error } = await supabase.rpc("log_patient_access", {
    p_patient_id: patientId,
    p_context: context ?? null,
  });
  if (error) throw error;
};
