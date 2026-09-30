import { createTreatmentPlanDAO, listTreatmentPlansByPatientDAO, updateTreatmentPlanDAO } from "../dao/TreatmentPlansDAO";
import {
  addTreatmentMaterialDAO,
  createPatientProcedureDAO,
  listPatientTreatmentsDAO,
  listProcedureCatalogWithPricesDAO,
  removeTreatmentMaterialDAO,
  updatePatientProcedureDAO,
} from "../dao/ProceduresDAO";
import { listInformedConsentsByPatientDAO } from "../dao/InformedConsentDAO";
import { listInventoryItemsDAO } from "../dao/InventoryDAO";
import { loadPatientHistoriesCtrl } from "./HistoriaClinicaCtrl";
import { submitConsentCtrl } from "./PatientDetailCtrl";
import { runCtrlAction } from "../utils/ctrlResult";

export const TREATMENT_STATUSES = ["Pendiente", "En proceso", "Realizado", "Cancelado"];

const OPEN_TREATMENT_STATUSES = ["Pendiente", "En proceso"];

// El ultimo consentimiento registrado para el plan es el que vale (CU-18).
const getConsentStatus = (consents) => {
  if (consents.length === 0) return "Sin consentimiento";
  return consents[0].aceptado ? "Aceptado" : "Rechazado";
};

export const loadTreatmentPlansCtrl = async (patientId) => {
  const [plans, treatments, consents, catalog, inventoryItems, histories] = await Promise.all([
    listTreatmentPlansByPatientDAO(patientId),
    listPatientTreatmentsDAO(patientId),
    listInformedConsentsByPatientDAO(patientId),
    listProcedureCatalogWithPricesDAO(),
    listInventoryItemsDAO(),
    loadPatientHistoriesCtrl(patientId),
  ]);

  return {
    plans: plans.map((plan) => {
      const planConsents = consents.filter((consent) => consent.treatment_plan_id === plan.id);
      return {
        ...plan,
        treatments: treatments.filter((treatment) => treatment.treatment_plan_id === plan.id),
        consents: planConsents,
        consentStatus: getConsentStatus(planConsents),
      };
    }),
    unplannedTreatments: treatments.filter((treatment) => !treatment.treatment_plan_id),
    catalog,
    inventoryItems: inventoryItems.filter((item) => item.active),
    histories: histories.filter((history) => !history.anulada),
  };
};

// CU-10: el plan se asocia a una historia clinica existente del paciente.
export const createTreatmentPlanCtrl = (patientId, form) => {
  if (!form.title.trim()) return Promise.resolve({ ok: false, message: "Escribe un título para el plan." });
  if (!form.clinical_history_id) {
    return Promise.resolve({ ok: false, message: "Selecciona la historia clínica a la que pertenece el plan." });
  }

  return runCtrlAction(() =>
    createTreatmentPlanDAO({
      patient_id: patientId,
      clinical_history_id: Number(form.clinical_history_id),
      title: form.title.trim(),
      diagnosis: form.diagnosis.trim() || null,
      notes: form.notes.trim() || null,
    })
  );
};

export const updateTreatmentPlanCtrl = (planId, form) => {
  if (!form.title.trim()) return Promise.resolve({ ok: false, message: "Escribe un título para el plan." });

  return runCtrlAction(() =>
    updateTreatmentPlanDAO(planId, {
      title: form.title.trim(),
      diagnosis: form.diagnosis.trim() || null,
      notes: form.notes.trim() || null,
    })
  );
};

// ROC-18: el plan sigue abierto mientras tenga tratamientos por hacer.
export const closeTreatmentPlanCtrl = (plan, closingNotes) => {
  if (plan.treatments.some((treatment) => OPEN_TREATMENT_STATUSES.includes(treatment.status))) {
    return Promise.resolve({
      ok: false,
      message: "El plan tiene tratamientos pendientes o en proceso: márcalos como realizados o cancelados antes de cerrarlo.",
    });
  }

  return runCtrlAction(() =>
    updateTreatmentPlanDAO(plan.id, { status: "Cerrado", closing_notes: closingNotes?.trim() || null })
  );
};

// Cancelar el plan cancela tambien sus tratamientos que no se alcanzaron a realizar.
export const cancelTreatmentPlanCtrl = (plan, motivo) => {
  if (!motivo?.trim()) return Promise.resolve({ ok: false, message: "Indica el motivo de cancelación del plan." });

  return runCtrlAction(async () => {
    const pending = plan.treatments.filter((treatment) => OPEN_TREATMENT_STATUSES.includes(treatment.status));
    for (const treatment of pending) {
      await updatePatientProcedureDAO(treatment.id, { status: "Cancelado" });
    }
    return updateTreatmentPlanDAO(plan.id, { status: "Cancelado", closing_notes: motivo.trim() });
  });
};

export const reopenTreatmentPlanCtrl = (planId) =>
  runCtrlAction(() => updateTreatmentPlanDAO(planId, { status: "Abierto" }));

export const addTreatmentCtrl = ({ patientId, plan, form, catalog }) => {
  const catalogItem = catalog.find((item) => String(item.id) === String(form.procedure_catalog_id));
  if (!catalogItem) return Promise.resolve({ ok: false, message: "Selecciona un procedimiento del catálogo." });

  const quantity = Number(form.quantity) || 1;
  const unitPrice = form.unit_price === "" ? Number(catalogItem.price) : Number(form.unit_price);
  if (!(quantity > 0) || !(unitPrice >= 0)) {
    return Promise.resolve({ ok: false, message: "Revisa la cantidad y el valor del tratamiento." });
  }

  return runCtrlAction(() =>
    createPatientProcedureDAO({
      patient_id: patientId,
      treatment_plan_id: plan.id,
      procedure_catalog_id: catalogItem.id,
      tooth_number: form.tooth_number.trim() || null,
      procedure_date: form.procedure_date,
      quantity,
      unit_price: unitPrice,
      notes: form.notes.trim() || null,
    })
  );
};

// Al pasar a 'Realizado' la base de datos exige consentimiento aceptado y descuenta los materiales.
export const updateTreatmentStatusCtrl = (treatmentId, status) =>
  runCtrlAction(() => updatePatientProcedureDAO(treatmentId, { status }));

export const addTreatmentMaterialCtrl = (treatmentId, form) => {
  const quantity = Number(form.quantity);
  if (!form.inventory_item_id) return Promise.resolve({ ok: false, message: "Selecciona un material del inventario." });
  if (!(quantity > 0)) return Promise.resolve({ ok: false, message: "Indica una cantidad mayor a cero." });

  return runCtrlAction(() =>
    addTreatmentMaterialDAO({
      patient_procedure_id: treatmentId,
      inventory_item_id: Number(form.inventory_item_id),
      quantity,
    })
  );
};

export const removeTreatmentMaterialCtrl = (materialId) => runCtrlAction(() => removeTreatmentMaterialDAO(materialId));

export const registerPlanConsentCtrl = async ({ patientId, planId, form }) => {
  try {
    return await submitConsentCtrl({ patientId, form: { ...form, treatment_plan_id: planId } });
  } catch (error) {
    return { ok: false, message: error.message };
  }
};
