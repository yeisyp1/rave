import {
  listAuthorizedUsersDAO,
  listStaffProfilesDAO,
  setAuthorizedUserActiveDAO,
  upsertAuthorizedUserDAO,
} from "../dao/DoctorsDAO";
import { signInWithOtpDAO } from "../dao/AuthDAO";

export const DOCTOR_EMPTY_FORM = { full_name: "", email: "", role: "assistant" };

export const DOCTOR_ROLE_LABELS = {
  admin: "Administrador",
  dentist: "Odontóloga",
  assistant: "Asistente",
};

export const normalizeUserEmailCtrl = (email) => email.trim().toLowerCase();

export const getPasswordActionLabel = (hasProfile) => (hasProfile ? "actualizar" : "asignar");

export const loadAuthorizedUsersCtrl = async () => {
  const [authorizedResult, profilesResult] = await Promise.all([
    listAuthorizedUsersDAO(),
    listStaffProfilesDAO(),
  ]);

  return {
    authorizedUsers: authorizedResult.data ?? [],
    authorizedError: authorizedResult.error,
    profiles: profilesResult.data ?? [],
    profilesError: profilesResult.error,
  };
};

export const authorizeUserCtrl = async (form) => {
  const payload = {
    email: normalizeUserEmailCtrl(form.email),
    full_name: form.full_name.trim(),
    role: form.role,
  };

  const { error } = await upsertAuthorizedUserDAO(payload);
  if (error) return { ok: false, message: `No se pudo autorizar el usuario: ${error.message}` };
  return { ok: true, message: "Usuario autorizado. Cuando inicie sesion se validara contra su perfil." };
};

export const setAuthorizedUserActiveCtrl = async (id, active) => {
  const { error } = await setAuthorizedUserActiveDAO(id, active);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
};

export const sendPasswordSetupEmailCtrl = async (row, hasProfile) => {
  if (!row.active) {
    return { ok: false, message: "Activa primero este usuario para enviarle el correo." };
  }

  const actionLabel = getPasswordActionLabel(hasProfile);
  const { error } = await signInWithOtpDAO(
    normalizeUserEmailCtrl(row.email),
    `${window.location.origin}/crear-contrasena`
  );

  if (error) return { ok: false, message: `No se pudo enviar el correo: ${error.message}` };
  return {
    ok: true,
    message: `Correo enviado a ${row.email}. El usuario podrá ${actionLabel} su contraseña desde el enlace.`,
  };
};

export const computeDoctorsStatsCtrl = (authorizedUsers, profileByEmail) => ({
  totalAdmins: authorizedUsers.filter((user) => user.role === "admin").length,
  totalDentists: authorizedUsers.filter((user) => user.role === "dentist").length,
  totalAssistants: authorizedUsers.filter((user) => user.role === "assistant").length,
  totalActive: authorizedUsers.filter((user) => profileByEmail.has(normalizeUserEmailCtrl(user.email ?? ""))).length,
});
