import { supabase, unwrap } from "./SupabaseDAO";

// Deja constancia en la bitacora de que el usuario consulto la ficha o historia de un paciente.
export const logPatientAccessDAO = (patientId, context) =>
  unwrap(
    supabase.rpc("log_patient_access", {
      p_patient_id: patientId,
      p_context: context ?? null,
    })
  );
