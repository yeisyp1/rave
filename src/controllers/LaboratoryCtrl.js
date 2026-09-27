import {
  createLaboratoryCaseDAO,
  deleteLaboratoryCaseDAO,
  listLaboratoryCasesDAO,
  listPatientsForLaboratoryDAO,
  listProcedureCatalogDAO,
  updateLaboratoryCaseDAO,
  updateLaboratoryCaseStatusDAO,
} from "../dao/LaboratoryDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const LABORATORY_EMPTY_FORM = { patient: "", work: "", lab: "", due: "", status: "Pendiente" };

export const getLaboratoryPatientLabel = (patient) => `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim();

export const loadLaboratoryDataCtrl = async () => {
  const [cases, patients, procedures] = await Promise.all([
    listLaboratoryCasesDAO(),
    listPatientsForLaboratoryDAO(),
    listProcedureCatalogDAO(),
  ]);
  return { cases, patients, procedures };
};

export const computeLaboratoryStatsCtrl = (cases) => ({
  pending: cases.filter((item) => item.status === "Pendiente").length,
  progress: cases.filter((item) => item.status === "En proceso").length,
  delivered: cases.filter((item) => item.status === "Entregado").length,
});

export const createLaboratoryCaseCtrl = ({ form, patients, procedures }) => {
  const selectedPatient = patients.find((patient) => getLaboratoryPatientLabel(patient) === form.patient);
  if (!selectedPatient) return Promise.resolve({ ok: false, message: "Selecciona un paciente valido de la lista." });

  const selectedProcedure = procedures.find((procedure) => procedure.name === form.work);
  if (!selectedProcedure) return Promise.resolve({ ok: false, message: "Selecciona un procedimiento valido de la lista." });

  return runCtrlAction(() =>
    createLaboratoryCaseDAO({
      patient_id: selectedPatient.id,
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
