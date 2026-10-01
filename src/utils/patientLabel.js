// Etiqueta para buscar en listas: "Nombre Apellidos - documento"
export const getPatientFullName = (patient) =>
  `${patient?.nombre ?? ''} ${patient?.apellidos ?? ''}`.trim();

export const getPatientLabel = (patient) => {
  const document = patient?.numero_documento ? ` - ${patient.numero_documento}` : '';
  return `${getPatientFullName(patient)}${document}`.trim();
};

// Busca un paciente de la BD por etiqueta (con documento) o por nombre completo único.
export const findPatientByText = (patients, text) => {
  const value = String(text ?? '').trim().toLowerCase();
  if (!value) return null;
  const byLabel = patients.find((p) => getPatientLabel(p).toLowerCase() === value);
  if (byLabel) return byLabel;
  const byName = patients.filter((p) => getPatientFullName(p).toLowerCase() === value);
  return byName.length === 1 ? byName[0] : null;
};
