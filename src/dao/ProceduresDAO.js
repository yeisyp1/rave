import { supabase } from "./SupabaseDAO";

export const listLegacyProceduresDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
};

export const listPatientProceduresDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .select("*, procedure_catalog(name)")
    .eq("patient_id", patientId)
    .order("procedure_date", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
};

// Todos los tratamientos del paciente con sus materiales de inventario (CU-10/CU-11).
export const listPatientTreatmentsDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .select("*, procedure_catalog(name), treatment_inventory_items(id, quantity, deducted_at, inventory_items(id, name, unit))")
    .eq("patient_id", patientId)
    .order("procedure_date", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

// Tratamientos realizados con las facturas en que aparecen, para saber cuales faltan por facturar.
export const listRealizedProceduresWithInvoicesDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .select("id, procedure_date, tooth_number, quantity, unit_price, total_price, procedure_catalog(name), invoice_items(id, billing_invoices(status))")
    .eq("patient_id", patientId)
    .eq("status", "Realizado")
    .order("procedure_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const listProcedureCatalogWithPricesDAO = async () => {
  const { data, error } = await supabase
    .from("procedure_catalog")
    .select("id, name, price")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createPatientProcedureDAO = async (payload) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updatePatientProcedureDAO = async (procedureId, payload) => {
  const { data, error } = await supabase
    .from("patient_procedures")
    .update(payload)
    .eq("id", procedureId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const addTreatmentMaterialDAO = async (payload) => {
  const { data, error } = await supabase
    .from("treatment_inventory_items")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const removeTreatmentMaterialDAO = async (materialId) => {
  const { error } = await supabase.from("treatment_inventory_items").delete().eq("id", materialId);
  if (error) throw error;
};
