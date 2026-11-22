import { supabase, unwrap } from "./SupabaseDAO";

export const listPatientProceduresDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("patient_procedures")
      .select("*, procedure_catalog(name)")
      .eq("patient_id", patientId)
      .order("procedure_date", { ascending: false })
      .limit(10)
  )) ?? [];

// Todos los tratamientos del paciente con sus materiales de inventario (CU-10/CU-11).
export const listPatientTreatmentsDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("patient_procedures")
      .select("*, procedure_catalog(name), treatment_inventory_items(id, quantity, deducted_at, inventory_items(id, name, unit))")
      .eq("patient_id", patientId)
      .order("procedure_date", { ascending: true })
      .order("id", { ascending: true })
  )) ?? [];

// Tratamientos realizados con las facturas en que aparecen, para saber cuales faltan por facturar.
export const listRealizedProceduresWithInvoicesDAO = async (patientId) =>
  (await unwrap(
    supabase
      .from("patient_procedures")
      .select("id, procedure_date, tooth_number, quantity, unit_price, total_price, procedure_catalog(name), invoice_items(id, billing_invoices(status))")
      .eq("patient_id", patientId)
      .eq("status", "Realizado")
      .order("procedure_date", { ascending: true })
  )) ?? [];

export const listProcedureCatalogWithPricesDAO = async () =>
  (await unwrap(
    supabase
      .from("procedure_catalog")
      .select("id, name, price")
      .eq("active", true)
      .order("name", { ascending: true })
  )) ?? [];

export const createPatientProcedureDAO = (payload) =>
  unwrap(supabase.from("patient_procedures").insert([payload]).select("*").single());

export const updatePatientProcedureDAO = (procedureId, payload) =>
  unwrap(
    supabase.from("patient_procedures").update(payload).eq("id", procedureId).select("*").single()
  );

export const addTreatmentMaterialDAO = (payload) =>
  unwrap(supabase.from("treatment_inventory_items").insert([payload]).select("*").single());

export const removeTreatmentMaterialDAO = (materialId) =>
  unwrap(supabase.from("treatment_inventory_items").delete().eq("id", materialId));
