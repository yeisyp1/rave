import { supabase, unwrap } from "./SupabaseDAO";

// status: "activos" (por defecto), "inactivos" o "todos"
export const listPatientsDAO = async (status = "activos") => {
  let query = supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (status === "activos") query = query.eq("activo", true);
  if (status === "inactivos") query = query.eq("activo", false);
  return query;
};

export const createPatientDAO = (patient) =>
  unwrap(supabase.from("patients").insert([patient]));

export const updatePatientDAO = (id, patient) =>
  unwrap(supabase.from("patients").update(patient).eq("id", id));

// Soft delete: mark patient as inactive instead of deleting
export const deletePatientDAO = (id) =>
  unwrap(supabase.from("patients").update({ activo: false }).eq("id", id));

export const reactivatePatientDAO = (id) =>
  unwrap(supabase.from("patients").update({ activo: true }).eq("id", id));

export const getPatientByIdDAO = (patientId) =>
  unwrap(supabase.from("patients").select("*").eq("id", patientId).single());

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
