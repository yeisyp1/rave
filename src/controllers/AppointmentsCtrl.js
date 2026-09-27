import {
  cancelAppointmentByGoogleIdDAO,
  createOutboundWhatsappMessageDAO,
  getActiveWhatsappTemplateDAO,
  getPatientContactDAO,
  upsertAppointmentByGoogleIdDAO,
} from "../dao/AppointmentsDAO";

const FALLBACK_CONFIRMATION_BODY =
  "Hola {{nombre}}, confirmamos tu cita en Clínica RAVE para el {{fecha}} a las {{hora}}.";

export const renderMessageTemplateCtrl = (body, vars) =>
  Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value ?? ""),
    body
  );

export const mirrorAppointmentCtrl = async ({ googleEventId, patientId, start, end, serviceType }) => {
  const row = {
    google_event_id: googleEventId,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status: "Confirmada",
    source: "App",
  };
  // omit patient_id/service_type when not provided so an upsert on conflict
  // (e.g. reprogramming from the calendar edit form) doesn't wipe the link
  // captured when the appointment was first created.
  if (patientId !== undefined) row.patient_id = patientId;
  if (serviceType !== undefined) row.service_type = serviceType;
  return upsertAppointmentByGoogleIdDAO(row);
};

export const cancelAppointmentMirrorCtrl = (googleEventId) => cancelAppointmentByGoogleIdDAO(googleEventId);

export const queueAppointmentConfirmationCtrl = async ({ appointmentId, patientId, start, serviceType }) => {
  const patient = await getPatientContactDAO(patientId);
  const phone = patient?.celular || patient?.telefono;
  if (!phone) return null;

  const template = await getActiveWhatsappTemplateDAO();

  const body = renderMessageTemplateCtrl(template?.body || FALLBACK_CONFIRMATION_BODY, {
    nombre: patient?.nombre,
    fecha: start.toLocaleDateString("es-CO"),
    hora: start.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }),
    servicio: serviceType,
  });

  return createOutboundWhatsappMessageDAO({
    direction: "outbound",
    phone,
    patient_id: patientId,
    appointment_id: appointmentId,
    template_id: template?.id ?? null,
    body,
    status: "pending",
  });
};
