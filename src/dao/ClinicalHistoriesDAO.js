import { supabase } from "./SupabaseDAO";

export const listClinicalHistoriesByPatientDAO = async (patientId) => {
  return supabase
    .from("clinical_histories")
    .select("*")
    .eq("patient_id", patientId)
    .order("fecha", { ascending: false });
};

export const createClinicalHistoryDAO = async (payload) => {
  return supabase
    .from("clinical_histories")
    .insert([payload])
    .select("id")
    .single();
};

export const updateClinicalHistoryDAO = async (historyId, payload) => {
  return supabase
    .from("clinical_histories")
    .update(payload)
    .eq("id", historyId)
    .select("id")
    .single();
};

export const annulClinicalHistoryDAO = async (historyId, motivo, userId) => {
  return supabase
    .from("clinical_histories")
    .update({
      anulada: true,
      motivo_anulacion: motivo,
      anulada_por: userId,
      anulada_at: new Date().toISOString(),
    })
    .eq("id", historyId)
    .select("id")
    .single();
};

export const getClinicalHistoryByIdDAO = async (historyId) => {
  return supabase
    .from("clinical_histories")
    .select("*")
    .eq("id", historyId)
    .single();
};

const HISTORY_LOCATION_FIELDS = [
  "ciudad_departamento",
  "city_departamento",
  "ciudad",
  "departamento",
  "municipio",
  "location",
];

export const listHistoryCityDepartmentsDAO = async () => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return { data: [], error };

  const options = new Set();

  for (const row of data ?? []) {
    const candidate = HISTORY_LOCATION_FIELDS.map((field) => row?.[field]).find(
      (value) => String(value ?? "").trim(),
    );

    if (candidate) options.add(String(candidate).trim());
  }

  return {
    data: Array.from(options).sort((a, b) => a.localeCompare(b, "es")),
    error: null,
  };
};

export const getLatestOdontogramDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("clinical_histories")
    .select("odontograma")
    .eq("patient_id", patientId)
    .not("odontograma", "is", null)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.odontograma ?? null;
};

export const saveOdontogramDAO = async (patientId, odontogramData) => {
  // Get the latest clinical history or create a new one
  const { data: histories, error: getError } = await supabase
    .from("clinical_histories")
    .select("id")
    .eq("patient_id", patientId)
    .order("fecha", { ascending: false })
    .limit(1);

  if (getError) throw getError;

  const doctor = await getCurrentDoctorLabelDAO();
  const timestamp = new Date().toISOString();

  if (histories && histories.length > 0) {
    // Update existing latest history
    const { error: updateError } = await supabase
      .from("clinical_histories")
      .update({
        odontograma: odontogramData,
        updated_at: timestamp,
      })
      .eq("id", histories[0].id);

    if (updateError) throw updateError;
    return { id: histories[0].id, created: false };
  } else {
    // Create new history record with odontogram
    const { data: newHistory, error: insertError } = await supabase
      .from("clinical_histories")
      .insert([
        {
          patient_id: patientId,
          doctor: doctor || null,
          fecha: timestamp,
          motivo_consulta: "Actualización de odontograma",
          history_data: { tipo: "odontograma_update" },
          odontograma: odontogramData,
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;
    return { id: newHistory.id, created: true };
  }
};

export const getCurrentDoctorLabelDAO = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Doctor"
  );
};
