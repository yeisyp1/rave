import {
  createGoogleEventDAO,
  deleteGoogleEventDAO,
  fetchGoogleEventsDAO,
  getGoogleTokenDAO,
  listAppointmentPatientsDAO,
  listAppointmentServiceTypesDAO,
  signInGoogleCalendarDAO,
} from "../dao/CalendarDAO";
import { CalendarEventModel } from "../models/CalendarEventModel";
import { updateGoogleEventDAO } from "../dao/CalendarDAO";
import {
  cancelAppointmentByGoogleIdDAO,
  queueAppointmentConfirmationDAO,
  upsertAppointmentByGoogleIdDAO,
} from "../dao/AppointmentsDAO";

export const getGoogleTokenCtrl = getGoogleTokenDAO;

export const syncGoogleEventsCtrl = async (token) => {
  const events = await fetchGoogleEventsDAO(token);
  return events.map((event) => CalendarEventModel.fromGoogleEvent(event));
};

const mirrorAppointment = async ({ googleEventId, patientId, start, end, serviceType }) => {
  try {
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
    return await upsertAppointmentByGoogleIdDAO(row);
  } catch (error) {
    console.error("No se pudo espejar la cita en Supabase:", error);
    return null;
  }
};

export const createGoogleEventCtrl = async (token, payload) => {
  const event = await createGoogleEventDAO(token, payload);
  const mirrored = await mirrorAppointment({
    googleEventId: event.id,
    patientId: payload.patientId,
    start: payload.start,
    end: payload.end,
    serviceType: payload.service,
  });

  if (mirrored && payload.patientId) {
    try {
      await queueAppointmentConfirmationDAO({
        appointmentId: mirrored.id,
        patientId: payload.patientId,
        start: payload.start,
        serviceType: payload.service,
      });
    } catch (error) {
      console.error("No se pudo encolar la confirmación por WhatsApp:", error);
    }
  }

  return CalendarEventModel.fromGoogleEvent(event);
};

export const deleteGoogleEventCtrl = async (token, googleId) => {
  await deleteGoogleEventDAO(token, googleId);
  try {
    await cancelAppointmentByGoogleIdDAO(googleId);
  } catch (error) {
    console.error("No se pudo marcar la cita como cancelada en Supabase:", error);
  }
};
export const connectGoogleCalendarCtrl = signInGoogleCalendarDAO;
export const listAppointmentPatientsCtrl = listAppointmentPatientsDAO;
export const listAppointmentServiceTypesCtrl = listAppointmentServiceTypesDAO;
export const updateGoogleEventCtrl = async (token, googleId, payload) => {
  const event = await updateGoogleEventDAO(token, googleId, payload);
  await mirrorAppointment({
    googleEventId: googleId,
    patientId: payload.patientId,
    start: payload.start,
    end: payload.end,
    serviceType: payload.service,
  });
  return CalendarEventModel.fromGoogleEvent(event);
};
