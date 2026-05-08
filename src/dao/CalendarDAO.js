import { supabase } from "./SupabaseDAO";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const getGoogleTokenDAO = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
};

export const fetchGoogleEventsDAO = async (token) => {
  const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: past,
        timeMax: future,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      }),
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) throw new Error(`Google API error: ${response.status}`);
  const data = await response.json();
  return data.items ?? [];
};

export const createGoogleEventDAO = async (
  token,
  { title, start, end, description = "", location = "" },
) => {
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: title,
      description,
      location,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
  });

  if (!response.ok) throw new Error(`Error creando evento: ${response.status}`);
  return response.json();
};

export const deleteGoogleEventDAO = async (token, googleId) => {
  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${googleId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Error eliminando evento: ${response.status}`);
  }
};

export const updateGoogleEventDAO = async (
  token,
  googleId,
  { title, start, end, description = "", location = "" },
) => {
  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${googleId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: title,
        description,
        location,
        start: {
          dateTime: start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    },
  );

  if (!response.ok)
    throw new Error(`Error actualizando evento: ${response.status}`);
  return response.json();
};

export const signInGoogleCalendarDAO = async () => {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "https://www.googleapis.com/auth/calendar",
      redirectTo: `${window.location.origin}/calendar`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
};

export const listAppointmentPatientsDAO = async () => {
  const { data, error } = await supabase
    .from("patients")
    .select("id,nombre,apellidos,numero_documento")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const listAppointmentServiceTypesDAO = async () => {
  const { data, error } = await supabase
    .from("procedure_catalog")
    .select("name")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(500);

  if (error) throw error;

  const serviceNames = (data ?? [])
    .map((row) => String(row.name || "").trim())
    .filter(Boolean);

  return [...new Set(serviceNames)];
};
