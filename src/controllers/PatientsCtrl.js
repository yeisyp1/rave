import {
  createPatientDAO,
  deletePatientDAO,
  getPatientByDocumentDAO,
  listPatientsDAO,
  reactivatePatientDAO,
  updatePatientDAO,
} from "../dao/PatientsDAO";
import { PatientModel } from "../models/PatientModel";
import { parseLocalDate } from "../utils/dates";

export const PATIENT_EMPTY_FORM = {
  tipo_documento: "",
  numero_documento: "",
  nombre: "",
  apellidos: "",
  fecha_nacimiento: "",
  edad: "",
  direccion: "",
  telefono: "",
  celular: "",
  ocupacion: "",
  sexo: "",
  email: "",
  tipo_sangre: "",
  eps: "",
  acudiente_nombre: "",
  acudiente_direccion: "",
  acudiente_parentesco: "",
  acudiente_celular: "",
  autorizacion_datos: false,
  autorizacion_datos_fecha: null,
};

export const PATIENT_STEPS = [
  "Documento",
  "Datos personales",
  "Contacto & Salud",
  "Acudiente",
  "Autorización de datos",
];

export const calcPatientAgeCtrl = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = parseLocalDate(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate()))
    age -= 1;
  return age >= 0 ? String(age) : "";
};

export const loadPatientsCtrl = async (status = "activos") => {
  const { data, error } = await listPatientsDAO(status);
  if (error) throw error;
  return (data ?? []).map((item) => new PatientModel(item));
};

export const getPatientByDocumentCtrl = (document) => getPatientByDocumentDAO(document);

export const savePatientCtrl = async ({ form, editingId }) => {
  if (!form.tipo_documento || !form.numero_documento) {
    return { ok: false, message: "Documento obligatorio" };
  }
  if (!form.nombre || !form.apellidos) {
    return { ok: false, message: "Nombre y apellidos obligatorios" };
  }
  if (!form.autorizacion_datos) {
    return { ok: false, message: "Se requiere la autorización de tratamiento de datos personales (Ley 1581 de 2012)" };
  }

  if (editingId) {
    try {
      await updatePatientDAO(editingId, form);
      return { ok: true, message: "Paciente actualizado" };
    } catch (error) {
      return { ok: false, message: "Error al actualizar", error };
    }
  }

  try {
    await createPatientDAO(form);
    return { ok: true, message: "Paciente registrado" };
  } catch (error) {
    if (error?.code === "23505")
      return { ok: false, message: "Este documento ya existe", error };
    return { ok: false, message: "Error al guardar", error };
  }
};

export const deletePatientCtrl = async (id) => {
  // Soft delete: inactivates the patient
  try {
    await deletePatientDAO(id);
    return { ok: true, message: "Paciente inactivado correctamente" };
  } catch (error) {
    return { ok: false, message: "Error al inactivar el paciente", error };
  }
};

export const inactivatePatientCtrl = deletePatientCtrl;

export const reactivatePatientCtrl = async (id) => {
  try {
    await reactivatePatientDAO(id);
    return { ok: true, message: "Paciente reactivado correctamente" };
  } catch (error) {
    return { ok: false, message: "Error al reactivar el paciente", error };
  }
};

export const canNextPatientStepCtrl = (step, form) => {
  if (step === 0) return Boolean(form.tipo_documento && form.numero_documento);
  if (step === 1)
    return Boolean(form.nombre && form.apellidos && form.fecha_nacimiento);
  return true;
};

export const setDataAuthorizationCtrl = (form, checked) => ({
  ...form,
  autorizacion_datos: checked,
  autorizacion_datos_fecha: checked ? new Date().toISOString() : null,
});

export const filterPatientsCtrl = (patients, search) => {
  const q = search.toLowerCase();
  return patients.filter((patient) => {
    return (
      `${patient.nombre} ${patient.apellidos}`.toLowerCase().includes(q) ||
      patient.numero_documento?.includes(q) ||
      patient.email?.toLowerCase().includes(q)
    );
  });
};
