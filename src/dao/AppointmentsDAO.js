import { supabase, unwrap } from "./SupabaseDAO";

export const upsertAppointmentByGoogleIdDAO = (payload) =>
  unwrap(
    supabase
      .from("appointments")
      .upsert([payload], { onConflict: "google_event_id" })
      .select("*")
      .single()
  );

export const cancelAppointmentByGoogleIdDAO = (googleEventId) =>
  unwrap(
    supabase
      .from("appointments")
      .update({ status: "Cancelada" })
      .eq("google_event_id", googleEventId)
  );

export const markAppointmentNoShowByGoogleIdDAO = async (googleEventId) => {
  const data = await unwrap(
    supabase
      .from("appointments")
      .update({ status: "No asistida" })
      .eq("google_event_id", googleEventId)
      .select("id")
  );
  if (!data?.length) throw new Error("La cita no está registrada en la base de datos.");
};

export const markAppointmentAttendedByGoogleIdDAO = async (googleEventId) => {
  const data = await unwrap(
    supabase
      .from("appointments")
      .update({ status: "Atendida" })
      .eq("google_event_id", googleEventId)
      .select("id")
  );
  if (!data?.length) throw new Error("La cita no está registrada en la base de datos.");
};

// Todas las citas registradas en Supabase (para el dashboard).
export const listAllAppointmentsDAO = async () =>
  (await unwrap(
    supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, start_at, end_at, service_type, status, source, reminder_sent_at, patients(nombre, apellidos)")
      .order("start_at", { ascending: false })
  )) ?? [];

export const listWhatsappAppointmentRequestsDAO = async () =>
  (await unwrap(
    supabase
      .from("appointments")
      .select("*, patients(nombre, apellidos, numero_documento, celular)")
      .in("status", ["Solicitada", "Cancelación solicitada"])
      .order("created_at", { ascending: false })
  )) ?? [];

export const updateAppointmentStatusDAO = (id, status) =>
  unwrap(
    supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single()
  );

export const getPatientContactDAO = (patientId) =>
  unwrap(
    supabase
      .from("patients")
      .select("nombre, celular, telefono")
      .eq("id", patientId)
      .single()
  );

export const getActiveWhatsappTemplateDAO = () =>
  unwrap(
    supabase
      .from("message_templates")
      .select("*")
      .eq("active", true)
      .eq("channel", "WhatsApp")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
  );

export const createOutboundWhatsappMessageDAO = (payload) =>
  unwrap(supabase.from("whatsapp_messages").insert([payload]));

export const checkAppointmentAvailabilityDAO = async (start, end, ignoreGoogleEventId = null) => {
  // Citas confirmadas que se cruzan con el rango [start, end)
  let query = supabase
    .from("appointments")
    .select("id, google_event_id, start_at, end_at, status")
    .eq("status", "Confirmada")
    .lt("start_at", new Date(end).toISOString())
    .gt("end_at", new Date(start).toISOString());

  if (ignoreGoogleEventId) query = query.neq("google_event_id", ignoreGoogleEventId);

  return (await unwrap(query)) ?? [];
};
