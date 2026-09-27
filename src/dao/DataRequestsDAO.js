import { supabase } from "./SupabaseDAO";

export const listDataRequestsDAO = async () => {
  const { data, error } = await supabase
    .from("data_rectification_requests")
    .select("*, patients(nombre, apellidos, numero_documento)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const listDataRequestsByPatientDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("data_rectification_requests")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createDataRequestDAO = async (payload) => {
  const { data, error } = await supabase
    .from("data_rectification_requests")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateDataRequestStatusDAO = async (id, { status, resolution_notes }) => {
  const payload = { status };
  if (resolution_notes !== undefined) payload.resolution_notes = resolution_notes;
  if (status === "Resuelta" || status === "Rechazada") payload.resolved_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("data_rectification_requests")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
