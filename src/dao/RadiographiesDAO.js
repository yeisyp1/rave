import { supabase } from "./SupabaseDAO";

export const RADIOGRAPHY_BUCKET = "radiographies";

export const listPatientRadiographiesDAO = async (patientId, limit = 6) => {
  const { data, error } = await supabase
    .from("radiographies")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

export const listHistoryRadiographiesDAO = async (patientId, historyId, limit = 6) => {
  const { data, error } = await supabase
    .from("radiographies")
    .select("*")
    .eq("patient_id", patientId)
    .eq("clinical_history_id", historyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

export const createRadiographiesDAO = async (rows) => {
  const { error } = await supabase.from("radiographies").insert(rows);
  if (error) throw new Error(error.message || "No se pudo guardar el registro de radiografía");
};

export const annulRadiographyDAO = async (id, motivo, userId) => {
  const { error } = await supabase
    .from("radiographies")
    .update({
      anulada: true,
      motivo_anulacion: motivo,
      anulada_por: userId,
      anulada_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
};

export const getRadiographySignedUrlDAO = async (filePath) => {
  const { data, error } = await supabase.storage
    .from(RADIOGRAPHY_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (error) return null;
  return data?.signedUrl ?? null;
};

export const getRadiographyPublicUrlDAO = (filePath) => {
  const { data } = supabase.storage.from(RADIOGRAPHY_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl ?? "";
};

export const uploadRadiographyFileDAO = async (filePath, file) => {
  const { error } = await supabase.storage.from(RADIOGRAPHY_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) throw new Error(error.message || "No se pudo subir la radiografía a Storage");
};
