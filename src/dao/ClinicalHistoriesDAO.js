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
