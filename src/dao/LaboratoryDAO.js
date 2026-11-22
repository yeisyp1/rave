import { supabase, unwrap } from "./SupabaseDAO";

export const listLaboratoryCasesDAO = async () =>
  (await unwrap(
    supabase
      .from("laboratory_cases")
      .select("*, patient_procedures(procedure_date, tooth_number)")
      .order("created_at", { ascending: false })
  )) ?? [];

export const createLaboratoryCaseDAO = (payload) =>
  unwrap(supabase.from("laboratory_cases").insert([payload]).select("*").single());

export const updateLaboratoryCaseStatusDAO = (id, status) =>
  unwrap(
    supabase
      .from("laboratory_cases")
      .update({ status })
      .eq("id", id)
      .select("*, patient_procedures(procedure_date, tooth_number)")
      .single()
  );

export const updateLaboratoryCaseDAO = (id, payload) =>
  unwrap(
    supabase
      .from("laboratory_cases")
      .update(payload)
      .eq("id", id)
      .select("*, patient_procedures(procedure_date, tooth_number)")
      .single()
  );

export const deleteLaboratoryCaseDAO = (id) =>
  unwrap(supabase.from("laboratory_cases").delete().eq("id", id));

export const listPatientsForLaboratoryDAO = async () =>
  (await unwrap(
    supabase
      .from("patients")
      .select("id,nombre,apellidos,numero_documento")
      .order("nombre", { ascending: true })
  )) ?? [];

export const listProcedureCatalogDAO = async () =>
  (await unwrap(
    supabase
      .from("procedure_catalog")
      .select("id,name")
      .eq("active", true)
      .order("name", { ascending: true })
  )) ?? [];

// Tratamientos del paciente a los que se puede ligar un trabajo de laboratorio.
export const listPatientProceduresForLaboratoryDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("patient_procedures")
      .select("id, procedure_date, tooth_number, status, procedure_catalog_id, procedure_catalog(name)")
      .eq("patient_id", patientId)
      .neq("status", "Cancelado")
      .order("procedure_date", { ascending: false })
  )) ?? [];
