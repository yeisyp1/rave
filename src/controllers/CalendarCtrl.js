import {
  createGoogleEventDAO,
  deleteGoogleEventDAO,
  fetchGoogleEventsDAO,
  getGoogleTokenDAO,
  signInGoogleCalendarDAO,
} from "../dao/CalendarDAO";
import { CalendarEventModel } from "../models/CalendarEventModel";

export const getGoogleTokenCtrl = getGoogleTokenDAO;

export const syncGoogleEventsCtrl = async (token) => {
  const events = await fetchGoogleEventsDAO(token);
  return events.map((event) => CalendarEventModel.fromGoogleEvent(event));
};

export const createGoogleEventCtrl = async (token, payload) => {
  const event = await createGoogleEventDAO(token, payload);
  return CalendarEventModel.fromGoogleEvent(event);
};

export const deleteGoogleEventCtrl = deleteGoogleEventDAO;
export const connectGoogleCalendarCtrl = signInGoogleCalendarDAO;
