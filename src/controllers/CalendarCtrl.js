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
import { checkAppointmentAvailabilityDAO } from "../dao/AppointmentsDAO";
import { CalendarEventModel } from "../models/CalendarEventModel";
import {
  cancelAppointmentMirrorCtrl,
  markAppointmentNoShowCtrl,
  mirrorAppointmentCtrl,
  queueAppointmentConfirmationCtrl,
} from "./AppointmentsCtrl";

export const getGoogleTokenCtrl = getGoogleTokenDAO;

export const syncGoogleEventsCtrl = async (token) => {
  const events = await fetchGoogleEventsDAO(token);
  return events.map((event) => CalendarEventModel.fromGoogleEvent(event));
};

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

export class ScheduleConflictError extends Error {
  constructor(conflicts) {
    super("El horario seleccionado se cruza con otra cita.");
    this.name = "ScheduleConflictError";
    this.conflicts = conflicts;
  }
}

export const verificarDisponibilidad = async (start, end) => {
  // Verify appointment availability against confirmed appointments in database
  try {
    const conflictingAppointments = await checkAppointmentAvailabilityDAO(start, end);
    return {
      available: conflictingAppointments.length === 0,
      conflicts: conflictingAppointments,
    };
  } catch (error) {
    console.error("Error checking appointment availability:", error);
    throw error;
  }
};

const assertSlotAvailable = async (token, { start, end }, ignoreGoogleId) => {
  const newStart = new Date(start);
  const newEnd = new Date(end);

  // Check Google Calendar events
  const events = await syncGoogleEventsCtrl(token);
  const googleConflicts = events.filter(
    (event) =>
      !event.allDay &&
      event.id !== ignoreGoogleId &&
      event.start < newEnd &&
      newStart < event.end,
  );

  // Check database confirmed appointments
  const dbConflicts = await checkAppointmentAvailabilityDAO(start, end);

  const allConflicts = [...googleConflicts, ...dbConflicts];

  if (allConflicts.length > 0) throw new ScheduleConflictError(allConflicts);
};

export const createGoogleEventCtrl = async (token, payload) => {
  await assertSlotAvailable(token, payload);
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
  await assertSlotAvailable(token, payload, googleId);
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

export { markAppointmentNoShowCtrl };

export const connectGoogleCalendarCtrl = signInGoogleCalendarDAO;
export const listAppointmentPatientsCtrl = listAppointmentPatientsDAO;
export const listAppointmentServiceTypesCtrl = listAppointmentServiceTypesDAO;
