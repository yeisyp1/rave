import { createDoctorDAO, listAllDoctorsDAO, setDoctorActiveDAO, updateDoctorDAO } from "../dao/DoctorsDAO";
import { runCtrlAction } from "../utils/ctrlResult";

// Catálogo de odontólogos del consultorio (RF-06), distinto de "Usuarios"
// (authorized_emails/profiles), que gestiona el acceso al sistema.
export const ODONTOLOGO_EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  documento_identidad: "",
  especialidad: "",
  registro_profesional: "",
  correo: "",
  telefono: "",
  observaciones: "",
};

export const loadOdontologosCtrl = () => listAllDoctorsDAO();

const buildDoctorPayload = (form) => ({
  nombre: form.nombre.trim(),
  apellidos: form.apellidos.trim(),
  documento_identidad: form.documento_identidad.trim() || null,
  especialidad: form.especialidad.trim() || null,
  registro_profesional: form.registro_profesional.trim() || null,
  correo: form.correo.trim() || null,
  telefono: form.telefono.trim() || null,
  observaciones: form.observaciones.trim() || null,
});

const validateDoctorForm = (form) => {
  if (!form.nombre.trim() || !form.apellidos.trim()) return "Nombre y apellidos son obligatorios.";
  return null;
};

export const createOdontologoCtrl = (form) => {
  const error = validateDoctorForm(form);
  if (error) return Promise.resolve({ ok: false, message: error });
  return runCtrlAction(() => createDoctorDAO(buildDoctorPayload(form)));
};

export const updateOdontologoCtrl = (id, form) => {
  const error = validateDoctorForm(form);
  if (error) return Promise.resolve({ ok: false, message: error });
  return runCtrlAction(() => updateDoctorDAO(id, buildDoctorPayload(form)));
};

export const setOdontologoActiveCtrl = (id, active) => runCtrlAction(() => setDoctorActiveDAO(id, active));
