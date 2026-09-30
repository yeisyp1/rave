import {
  createLaboratoryCaseDAO,
  deleteLaboratoryCaseDAO,
  listLaboratoryCasesDAO,
  listPatientProceduresForLaboratoryDAO,
  listPatientsForLaboratoryDAO,
  listProcedureCatalogDAO,
  updateLaboratoryCaseDAO,
  updateLaboratoryCaseStatusDAO,
} from "../dao/LaboratoryDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const LABORATORY_EMPTY_FORM = { patient: "", treatmentId: "", work: "", lab: "", due: "", status: "Pendiente" };

export const getLaboratoryPatientLabel = (patient) => `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim();

export const loadLaboratoryDataCtrl = async () => {
  const [cases, patients, procedures] = await Promise.all([
    listLaboratoryCasesDAO(),
    listPatientsForLaboratoryDAO(),
    listProcedureCatalogDAO(),
  ]);
  return { cases, patients, procedures };
};

export const findLaboratoryPatient = (patients, label) =>
  patients.find((patient) => getLaboratoryPatientLabel(patient) === label) ?? null;

export const loadLaboratoryPatientTreatmentsCtrl = (patientId) =>
  patientId ? listPatientProceduresForLaboratoryDAO(patientId) : Promise.resolve([]);

export const getLaboratoryTreatmentLabel = (treatment) =>
  [treatment.procedure_date, treatment.procedure_catalog?.name, treatment.tooth_number ? `pieza ${treatment.tooth_number}` : null]
    .filter(Boolean)
    .join(" · ");

export const computeLaboratoryStatsCtrl = (cases) => ({
  pending: cases.filter((item) => item.status === "Pendiente").length,
  progress: cases.filter((item) => item.status === "En proceso").length,
  delivered: cases.filter((item) => item.status === "Entregado").length,
});

// CU-12: el trabajo puede ligarse al tratamiento del paciente que lo origina.
export const createLaboratoryCaseCtrl = ({ form, patients, procedures, treatments }) => {
  const selectedPatient = findLaboratoryPatient(patients, form.patient);
  if (!selectedPatient) return Promise.resolve({ ok: false, message: "Selecciona un paciente valido de la lista." });

  const selectedProcedure = procedures.find((procedure) => procedure.name === form.work);
  if (!selectedProcedure) return Promise.resolve({ ok: false, message: "Selecciona un procedimiento valido de la lista." });

  const selectedTreatment = treatments.find((treatment) => String(treatment.id) === String(form.treatmentId)) ?? null;

  return runCtrlAction(() =>
    createLaboratoryCaseDAO({
      patient_id: selectedPatient.id,
      patient_procedure_id: selectedTreatment?.id ?? null,
      procedure_catalog_id: selectedProcedure.id,
      work_name: form.work.trim(),
      lab_name: form.lab.trim() || null,
      due_date: form.due,
      status: form.status,
    })
  );
};

export const updateLaboratoryCaseStatusCtrl = (id, status) =>
  runCtrlAction(() => updateLaboratoryCaseStatusDAO(id, status));

export const updateLaboratoryCaseCtrl = (id, form) =>
  runCtrlAction(() =>
    updateLaboratoryCaseDAO(id, {
      work_name: form.work_name.trim(),
      lab_name: form.lab_name.trim() || null,
      due_date: form.due_date || null,
    })
  );

export const deleteLaboratoryCaseCtrl = (id) => runCtrlAction(() => deleteLaboratoryCaseDAO(id));
