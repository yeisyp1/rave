import { supabase } from "./SupabaseDAO";

export const listInformedConsentsByPatientDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("informed_consents")
    .select("*, treatment_plans(title)")
    .eq("patient_id", patientId)
    .order("signed_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createInformedConsentDAO = async (payload) => {
  const { data, error } = await supabase
    .from("informed_consents")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
