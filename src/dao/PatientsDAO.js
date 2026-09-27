import { supabase } from "./SupabaseDAO";

export const listPatientsDAO = async () => {
  return supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });
};

export const createPatientDAO = async (patient) => {
  return supabase.from("patients").insert([patient]);
};

export const updatePatientDAO = async (id, patient) => {
  return supabase.from("patients").update(patient).eq("id", id);
};

export const deletePatientDAO = async (id) => {
  return supabase.from("patients").delete().eq("id", id);
};

export const getPatientByIdDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (error) throw error;
  return data;
};

export const getPatientByDocumentDAO = async (document) => {
  if (!document || document.trim() === "") return null;

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .ilike("numero_documento", document.trim())
    .single();

  if (error) return null;
  return data;
};
