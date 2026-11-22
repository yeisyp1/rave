import { supabase, unwrap } from "./SupabaseDAO";

export const listTreatmentPlansByPatientDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
  )) ?? [];

// Todos los planes (para los conteos por estado del dashboard).
export const listAllTreatmentPlansDAO = async () =>
  (await unwrap(supabase.from("treatment_plans").select("id, status, created_at"))) ?? [];

export const createTreatmentPlanDAO = (payload) =>
  unwrap(supabase.from("treatment_plans").insert([payload]).select("*").single());

export const updateTreatmentPlanDAO = (planId, payload) =>
  unwrap(supabase.from("treatment_plans").update(payload).eq("id", planId).select("*").single());
