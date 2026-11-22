import { supabase, unwrap } from "./SupabaseDAO";

export const listInformedConsentsByPatientDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("informed_consents")
      .select("*, treatment_plans(title)")
      .eq("patient_id", patientId)
      .order("signed_at", { ascending: false })
  )) ?? [];

export const createInformedConsentDAO = (payload) =>
  unwrap(supabase.from("informed_consents").insert([payload]).select("*").single());
