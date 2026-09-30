import { supabase } from "./SupabaseDAO";

export const listLaboratoryCasesDAO = async () => {
  const { data, error } = await supabase
    .from("laboratory_cases")
    .select("*, patient_procedures(procedure_date, tooth_number)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createLaboratoryCaseDAO = async (payload) => {
  const { data, error } = await supabase
    .from("laboratory_cases")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateLaboratoryCaseStatusDAO = async (id, status) => {
  const { data, error } = await supabase
    .from("laboratory_cases")
    .update({ status })
    .eq("id", id)
    .select("*, patient_procedures(procedure_date, tooth_number)")
    .single();

  if (error) throw error;
  return data;
};

export const updateLaboratoryCaseDAO = async (id, payload) => {
  const { data, error } = await supabase
    .from("laboratory_cases")
    .update(payload)
    .eq("id", id)
    .select("*, patient_procedures(procedure_date, tooth_number)")
    .single();

  if (error) throw error;
  return data;
};

export const deleteLaboratoryCaseDAO = async (id) => {
  const { error } = await supabase.from("laboratory_cases").delete().eq("id", id);
  if (error) throw error;
};

export const listPatientsForLaboratoryDAO = async () => {
  const { data, error } = await supabase
    .from("patients")
    .select("id,nombre,apellidos,numero_documento")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const listProcedureCatalogDAO = async () => {
  const { data, error } = await supabase
    .from("procedure_catalog")
    .select("id,name")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

// Tratamientos del paciente a los que se puede ligar un trabajo de laboratorio.
export const listPatientProceduresForLaboratoryDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .select("id, procedure_date, tooth_number, status, procedure_catalog_id, procedure_catalog(name)")
    .eq("patient_id", patientId)
    .neq("status", "Cancelado")
    .order("procedure_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
};
