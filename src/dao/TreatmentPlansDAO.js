import { supabase } from "./SupabaseDAO";

export const listTreatmentPlansByPatientDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createTreatmentPlanDAO = async (payload) => {
  const { data, error } = await supabase
    .from("treatment_plans")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateTreatmentPlanDAO = async (planId, payload) => {
  const { data, error } = await supabase
    .from("treatment_plans")
    .update(payload)
    .eq("id", planId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
