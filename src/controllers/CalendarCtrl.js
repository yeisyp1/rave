import {
  createGoogleEventDAO,
  deleteGoogleEventDAO,
  fetchGoogleEventsDAO,
  getGoogleTokenDAO,
  listAppointmentPatientsDAO,
  listAppointmentServiceTypesDAO,
  signInGoogleCalendarDAO,
  updateGoogleEventDAO,
} from "../dao/CalendarDAO";
import { CalendarEventModel } from "../models/CalendarEventModel";
import {
  cancelAppointmentMirrorCtrl,
  mirrorAppointmentCtrl,
  queueAppointmentConfirmationCtrl,
} from "./AppointmentsCtrl";

export const getGoogleTokenCtrl = getGoogleTokenDAO;

export const syncGoogleEventsCtrl = async (token) => {
  const events = await fetchGoogleEventsDAO(token);
  return events.map((event) => CalendarEventModel.fromGoogleEvent(event));
};

// Best-effort: the Supabase mirror and WhatsApp confirmation are secondary to
// the Google Calendar write, so failures here are logged, not thrown -
// the appointment must still be considered booked from the user's perspective.
const mirrorAppointmentAfterGoogleWrite = async (params) => {
  try {
    return await mirrorAppointmentCtrl(params);
  } catch (error) {
    console.error("No se pudo espejar la cita en Supabase:", error);
    return null;
  }
};

const queueConfirmationAfterBooking = async (params) => {
  try {
    await queueAppointmentConfirmationCtrl(params);
  } catch (error) {
    console.error("No se pudo encolar la confirmación por WhatsApp:", error);
  }
};

export const createGoogleEventCtrl = async (token, payload) => {
  const event = await createGoogleEventDAO(token, payload);

  const mirrored = await mirrorAppointmentAfterGoogleWrite({
    googleEventId: event.id,
    patientId: payload.patientId,
    start: payload.start,
    end: payload.end,
    serviceType: payload.service,
  });

  if (mirrored && payload.patientId) {
    await queueConfirmationAfterBooking({
      appointmentId: mirrored.id,
      patientId: payload.patientId,
      start: payload.start,
      serviceType: payload.service,
    });
  }

  return CalendarEventModel.fromGoogleEvent(event);
};

export const updateGoogleEventCtrl = async (token, googleId, payload) => {
  const event = await updateGoogleEventDAO(token, googleId, payload);

  await mirrorAppointmentAfterGoogleWrite({
    googleEventId: googleId,
    patientId: payload.patientId,
    start: payload.start,
    end: payload.end,
    serviceType: payload.service,
  });

  return CalendarEventModel.fromGoogleEvent(event);
};

export const deleteGoogleEventCtrl = async (token, googleId) => {
  await deleteGoogleEventDAO(token, googleId);

  try {
    await cancelAppointmentMirrorCtrl(googleId);
  } catch (error) {
    console.error("No se pudo marcar la cita como cancelada en Supabase:", error);
  }
};

export const connectGoogleCalendarCtrl = signInGoogleCalendarDAO;
export const listAppointmentPatientsCtrl = listAppointmentPatientsDAO;
export const listAppointmentServiceTypesCtrl = listAppointmentServiceTypesDAO;
