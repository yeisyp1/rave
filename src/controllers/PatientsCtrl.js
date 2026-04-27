import {
  createPatientDAO,
  deletePatientDAO,
  listPatientsDAO,
  updatePatientDAO,
} from "../dao/PatientsDAO";
import { PatientModel } from "../models/PatientModel";

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
};

export const PATIENT_STEPS = [
  "Documento",
  "Datos personales",
  "Contacto & Salud",
  "Acudiente",
];

export const calcPatientAgeCtrl = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate()))
    age -= 1;
  return age >= 0 ? String(age) : "";
};

export const loadPatientsCtrl = async () => {
  const { data, error } = await listPatientsDAO();
  if (error) throw error;
  return (data ?? []).map((item) => new PatientModel(item));
};

export const savePatientCtrl = async ({ form, editingId }) => {
  if (!form.tipo_documento || !form.numero_documento) {
    return { ok: false, message: "Documento obligatorio" };
  }
  if (!form.nombre || !form.apellidos) {
    return { ok: false, message: "Nombre y apellidos obligatorios" };
  }

  if (editingId) {
    const { error } = await updatePatientDAO(editingId, form);
    if (error) return { ok: false, message: "Error al actualizar", error };
    return { ok: true, message: "Paciente actualizado" };
  }

  const { error } = await createPatientDAO(form);
  if (error?.code === "23505")
    return { ok: false, message: "Este documento ya existe", error };
  if (error) return { ok: false, message: "Error al guardar", error };
  return { ok: true, message: "Paciente registrado" };
};

export const deletePatientCtrl = async (id) => {
  const { error } = await deletePatientDAO(id);
  if (error) return { ok: false, message: "Error al eliminar", error };
  return { ok: true };
};

export const canNextPatientStepCtrl = (step, form) => {
  if (step === 0) return Boolean(form.tipo_documento && form.numero_documento);
  if (step === 1)
    return Boolean(form.nombre && form.apellidos && form.fecha_nacimiento);
  return true;
};

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
