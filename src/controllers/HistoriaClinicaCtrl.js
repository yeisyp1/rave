import {
  createClinicalHistoryDAO,
  getCurrentDoctorLabelDAO,
  listHistoryCityDepartmentsDAO,
  listClinicalHistoriesByPatientDAO,
} from "../dao/ClinicalHistoriesDAO";
import { listPatientsDAO, updatePatientDAO } from "../dao/PatientsDAO";
import { ClinicalHistoryModel } from "../models/ClinicalHistoryModel";
import { PatientModel } from "../models/PatientModel";

const nowForDatetimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export const HISTORIA_EMPTY_FORM = {
  medio_remision: "",
  fecha: nowForDatetimeLocal(),
  nombre: "",
  tipo_identificacion: "",
  numero_identificacion: "",
  procedencia_identificacion: "",
  direccion: "",
  telefono: "",
  celular: "",
  ciudad_departamento: "",
  correo_electronico: "",
  rh: "",
  eps: "",
  fecha_nacimiento: "",
  edad: "",
  sexo: "",
  estado_civil: "",
  ocupacion: "",
  motivo_consulta: "",
  tratamiento_medico: "",
  ingestion_medicamentos: "",
  reacciones_medicamentos_anestesia: "",
  reacciones_medicamentos_antibioticos: "",
  hemorragias: "",
  irradiaciones: "",
  sinusitis: "",
  enfermedad_respiratoria: "",
  cardiopatias: "",
  observaciones: "",
  ultima_visita_odontologo: "",
  diabetes: "",
  fiebre_reumatica: "",
  hepatitis: "",
  hipertension: "",
  embarazo: "",
  enfermedades_renales: "",
  enfermedades_gastrointestinales: "",
  organos_de_los_sentidos: "",
  otros: "",
  motivo: "",
  temperatura: "",
  pulso: "",
  tension: "",
  respiracion: "",
  higiene_oral: "",
  cepillo_dental: "",
  seda_dental: "",
  enjuague_bucal: "",
  cuantas_veces_al_dia: "",
  atm: "",
  labios: "",
  lengua: "",
  paladar: "",
  piso_de_boca: "",
  carrillos: "",
  glandulas_salivales: "",
  maxilares: "",
  senos_maxilares: "",
  musculos_masticatorios: "",
  ganglios: "",
  oclusion: "",
  frenillos: "",
  mucosas: "",
  encias: "",
  amigdalas: "",
  trauma: "",
  habitos: "",
  super_numerarios: "",
  abrasion: "",
  manchas_cambio_color: "",
  patologia_pulpar_abcesos: "",
  maloclusiones: "",
  incluidos: "",
  bolsas: "",
  movilidad: "",
  placa_blanda: "",
  calculos: "",
  observaciones_examen: "",
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

export const loadHistoryCityDepartmentsCtrl = async () => {
  const { data, error } = await listHistoryCityDepartmentsDAO();
  if (error) throw error;
  return data ?? [];
};

export const createPatientHistoryCtrl = async (
  patientId,
  form,
  originalPatientData = null,
) => {
  if (!form.motivo_consulta?.trim()) {
    return { ok: false, message: "El motivo de consulta es obligatorio" };
  }

  const doctor = await getCurrentDoctorLabelDAO();
  const historyData = {
    ...form,
    doctor: doctor || "",
  };

  const fecha = form.fecha
    ? new Date(form.fecha).toISOString()
    : new Date().toISOString();

  // Detect patient field changes if originalPatientData is provided
  const patientChanges = {};
  if (originalPatientData) {
    const mappings = {
      nombre: "nombre",
      tipo_documento: "tipo_identificacion",
      numero_documento: "numero_identificacion",
      direccion: "direccion",
      telefono: "telefono",
      celular: "celular",
      email: "correo_electronico",
      ciudad_departamento: "ciudad_departamento",
      sexo: "sexo",
      rh: "rh",
      eps: "eps",
    };

    for (const [patientField, formField] of Object.entries(mappings)) {
      const originalValue = originalPatientData[patientField] || "";
      const newValue = form[formField] || "";
      if (originalValue !== newValue) {
        patientChanges[patientField] = newValue;
      }
    }
  }

  // Create clinical history
  const { error: historyError } = await createClinicalHistoryDAO({
    patient_id: patientId,
    doctor: doctor || null,
    medio_remision: form.medio_remision,
    fecha,
    motivo_consulta: form.motivo_consulta,
    history_data: historyData,
  });

  if (historyError)
    return {
      ok: false,
      message: "Error al guardar la historia clínica",
      error: historyError,
    };

  // Update patient fields if there are changes
  if (Object.keys(patientChanges).length > 0) {
    const { error: updateError } = await updatePatientDAO(
      patientId,
      patientChanges,
    );
    if (updateError) {
      console.error("Error actualizando datos del paciente:", updateError);
      return {
        ok: false,
        message:
          "Historia guardada pero hubo un error actualizando los datos del paciente",
        error: updateError,
      };
    }
  }

  return { ok: true, message: "Historia clínica guardada exitosamente" };
};
