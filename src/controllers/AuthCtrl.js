import {
  checkAuthorizedEmailDAO,
  getSessionDAO,
  resetPasswordForEmailDAO,
  signInWithGoogleDAO,
  signInWithOtpDAO,
  signInWithPasswordDAO,
  signUpDAO,
  updateUserPasswordDAO,
} from "../dao/AuthDAO";

export const loginWithPasswordCtrl = async (email, password) => {
  const { data, error } = await signInWithPasswordDAO(email, password);
  if (error) return { ok: false, message: error.message };
  return { ok: true, user: data.user };
};

export const loginWithGoogleCtrl = async () => {
  const { error } = await signInWithGoogleDAO(`${window.location.origin}/oauth/consent`);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
};

export const sendMagicLinkCtrl = async (email) => {
  if (!email.trim()) {
    return { ok: false, message: "Escribe tu correo para enviarte el enlace de acceso." };
  }

  const { error } = await signInWithOtpDAO(email.trim().toLowerCase(), `${window.location.origin}/login`);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Revisa tu correo: te enviamos un enlace de acceso sin contraseña." };
};

export const validatePasswordCtrl = (password, confirmation) => {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return "";
};

export const checkSessionExistsCtrl = async () => {
  const { data } = await getSessionDAO();
  return Boolean(data.session);
};

export const getOAuthSessionCtrl = async () => {
  const { data, error } = await getSessionDAO();
  if (error) throw error;
  return data.session;
};

export const updatePasswordCtrl = async (password) => {
  const { error } = await updateUserPasswordDAO(password);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
};

export const createAccountCtrl = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const authorized = await checkAuthorizedEmailDAO(normalizedEmail).catch(() => null);
  if (!authorized) {
    return { ok: false, message: "Este correo no está autorizado. Solicita al administrador que lo registre en RAVE." };
  }

  const { data, error } = await signUpDAO(normalizedEmail, password, `${window.location.origin}/login`);
  if (error) {
    return {
      ok: false,
      message: error.message.includes("already registered")
        ? "Este correo ya tiene una cuenta. Usa “Recuperar contraseña”."
        : error.message,
    };
  }

  return {
    ok: true,
    message: data.session
      ? "Contraseña creada. Ya puedes entrar a RAVE."
      : "Te enviamos un correo para confirmar tu cuenta. Después podrás entrar a RAVE.",
  };
};

export const sendPasswordRecoveryCtrl = async (email) => {
  const { error } = await resetPasswordForEmailDAO(
    email.trim().toLowerCase(),
    `${window.location.origin}/restablecer-contrasena`
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña." };
};
