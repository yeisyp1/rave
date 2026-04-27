import {
  createClinicalHistoryDAO,
  listClinicalHistoriesByPatientDAO,
} from "../dao/ClinicalHistoriesDAO";
import { listPatientsDAO } from "../dao/PatientsDAO";
import { ClinicalHistoryModel } from "../models/ClinicalHistoryModel";
import { PatientModel } from "../models/PatientModel";

export const HISTORIA_EMPTY_FORM = {
  motivo_consulta: "",
  diagnostico: "",
  tratamiento: "",
  notas: "",
  fecha: new Date().toISOString().split("T")[0],
};

export const loadHistoriaPatientsCtrl = async () => {
  const { data, error } = await listPatientsDAO();
  if (error) throw error;
  return (data ?? []).map((item) => new PatientModel(item));
};

export const filterHistoriaPatientsCtrl = (patients, search) => {
  const q = search.toLowerCase();
  return patients.filter((patient) => {
    return (
      `${patient.nombre} ${patient.apellidos}`.toLowerCase().includes(q) ||
      patient.numero_documento?.includes(q) ||
      patient.email?.toLowerCase().includes(q)
    );
  });
};

export const loadPatientHistoriesCtrl = async (patientId) => {
  const { data, error } = await listClinicalHistoriesByPatientDAO(patientId);
  if (error) throw error;
  return (data ?? []).map((item) => new ClinicalHistoryModel(item));
};

export const createPatientHistoryCtrl = async (patientId, form) => {
  if (!form.motivo_consulta?.trim()) {
    return { ok: false, message: "El motivo de consulta es obligatorio" };
  }

  const { error } = await createClinicalHistoryDAO({
    patient_id: patientId,
    motivo_consulta: form.motivo_consulta,
    diagnostico: form.diagnostico,
    tratamiento: form.tratamiento,
    notas: form.notas,
    fecha: form.fecha,
  });

  if (error)
    return {
      ok: false,
      message: "Error al guardar la historia clínica",
      error,
    };
  return { ok: true, message: "Historia clínica guardada exitosamente" };
};
