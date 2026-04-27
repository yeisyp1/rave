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
