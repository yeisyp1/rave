import { supabase } from "./SupabaseDAO";

export const listClinicalHistoriesByPatientDAO = async (patientId) => {
  return supabase
    .from("clinical_histories")
    .select("*")
    .eq("patient_id", patientId)
    .order("fecha", { ascending: false });
};

export const createClinicalHistoryDAO = async (payload) => {
  return supabase.from("clinical_histories").insert([payload]);
};
