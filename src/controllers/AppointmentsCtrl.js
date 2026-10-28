import {
  cancelAppointmentByGoogleIdDAO,
  createOutboundWhatsappMessageDAO,
  getActiveWhatsappTemplateDAO,
  getPatientContactDAO,
  markAppointmentAttendedByGoogleIdDAO,
  markAppointmentNoShowByGoogleIdDAO,
  upsertAppointmentByGoogleIdDAO,
} from "../dao/AppointmentsDAO";

// Nota: {{hora}} ya viene con punto final ("12:00 a. m.") por el formato es-CO,
// así que la plantilla no debe agregar otro punto después (quedaría "a. m..").
const FALLBACK_CONFIRMATION_BODY =
  "Hola {{nombre}}, confirmamos tu cita en Clínica RAVE para el {{fecha}} a las {{hora}}";

export const renderMessageTemplateCtrl = (body, vars) =>
  Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value ?? ""),
    body
  );

export const mirrorAppointmentCtrl = async ({ googleEventId, patientId, doctorId, start, end, serviceType }) => {
  const row = {
    google_event_id: googleEventId,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    status: "Confirmada",
    source: "App",
  };
  // omit patient_id/doctor_id/service_type when not provided so an upsert on conflict
  // (e.g. reprogramming from the calendar edit form) doesn't wipe the link
  // captured when the appointment was first created.
  if (patientId !== undefined) row.patient_id = patientId;
  if (doctorId !== undefined) row.doctor_id = doctorId;
  if (serviceType !== undefined) row.service_type = serviceType;
  return upsertAppointmentByGoogleIdDAO(row);
};

export const cancelAppointmentMirrorCtrl = (googleEventId) => cancelAppointmentByGoogleIdDAO(googleEventId);

export const markAppointmentNoShowCtrl = (googleEventId) => markAppointmentNoShowByGoogleIdDAO(googleEventId);

export const markAppointmentAttendedCtrl = (googleEventId) => markAppointmentAttendedByGoogleIdDAO(googleEventId);

export const queueAppointmentConfirmationCtrl = async ({ appointmentId, patientId, start, serviceType }) => {
  const patient = await getPatientContactDAO(patientId);
  const phone = patient?.celular || patient?.telefono;
  if (!phone) return null;

  const template = await getActiveWhatsappTemplateDAO();

  const fecha = start.toLocaleDateString("es-CO");
  const hora = start.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

  const body = renderMessageTemplateCtrl(template?.body || FALLBACK_CONFIRMATION_BODY, {
    nombre: patient?.nombre,
    fecha,
    hora,
    servicio: serviceType,
  });

  return createOutboundWhatsappMessageDAO({
    direction: "outbound",
    phone,
    patient_id: patientId,
    appointment_id: appointmentId,
    template_id: template?.id ?? null,
    body,
    // Sin esto, process-whatsapp-queue manda el mensaje como texto libre en vez
    // de la plantilla aprobada de Meta, y WhatsApp lo rechaza si el paciente no
    // escribió en las últimas 24h. "_plantilla" elige la plantilla de confirmación
    // (META_WA_TEMPLATE_CONFIRMATION) y no la del recordatorio.
    template_variables: { "1": patient?.nombre || "paciente", "2": fecha, "3": hora, _plantilla: "confirmacion" },
    status: "pending",
  });
};
