import { supabase } from "./SupabaseDAO";

export const listLaboratoryCasesDAO = async () => {
  const { data, error } = await supabase
    .from("laboratory_cases")
    .select("*")
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
    .select("*")
    .single();

  if (error) throw error;
  return data;
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
