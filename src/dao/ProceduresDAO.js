import { supabase } from "./SupabaseDAO";

export const listLegacyProceduresDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
};

export const listPatientProceduresDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .select("*, procedure_catalog(name)")
    .eq("patient_id", patientId)
    .order("procedure_date", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
};
