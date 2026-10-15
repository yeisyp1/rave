export const ROLES = {
  ADMIN: "admin",
  DENTIST: "dentist",
  ASSISTANT: "assistant",
};

export const isAdmin = (profile) => profile?.role === ROLES.ADMIN;
export const isDentist = (profile) => profile?.role === ROLES.DENTIST;
export const isAssistant = (profile) => profile?.role === ROLES.ASSISTANT;

// Admin + dentist: historias clinicas, radiografias, laboratorio, inventario (lectura).
export const isClinicalStaff = (profile) => isAdmin(profile) || isDentist(profile);

// Cualquier rol autenticado del staff.
export const isStaff = (profile) =>
  isAdmin(profile) || isDentist(profile) || isAssistant(profile);

export const hasRole = (profile, allowedRoles) => allowedRoles.includes(profile?.role);
