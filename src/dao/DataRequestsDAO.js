import { supabase, unwrap } from "./SupabaseDAO";

export const listDataRequestsDAO = async () =>
  (await unwrap(
    supabase
      .from("data_rectification_requests")
      .select("*, patients(nombre, apellidos, numero_documento)")
      .order("created_at", { ascending: false })
  )) ?? [];

export const listDataRequestsByPatientDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("data_rectification_requests")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
  )) ?? [];

export const createDataRequestDAO = (payload) =>
  unwrap(
    supabase
      .from("data_rectification_requests")
      .insert([payload])
      .select("*")
      .single()
  );

export const updateDataRequestStatusDAO = (id, { status, resolution_notes }) => {
  const payload = { status };
  if (resolution_notes !== undefined) payload.resolution_notes = resolution_notes;
  if (status === "Resuelta" || status === "Rechazada") payload.resolved_at = new Date().toISOString();

  return unwrap(
    supabase
      .from("data_rectification_requests")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()
  );
};

// Supresion o revocatoria: elimina datos de contacto y conserva la historia clinica (ver apply_data_request).
export const applyDataRequestDAO = (id, notes) =>
  unwrap(
    supabase.rpc("apply_data_request", {
      p_request_id: id,
      p_notes: notes ?? null,
    })
  );
