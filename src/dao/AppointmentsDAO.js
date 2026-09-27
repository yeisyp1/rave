import { supabase } from "./SupabaseDAO";

export const upsertAppointmentByGoogleIdDAO = async (payload) => {
  const { data, error } = await supabase
    .from("appointments")
    .upsert([payload], { onConflict: "google_event_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const cancelAppointmentByGoogleIdDAO = async (googleEventId) => {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "Cancelada" })
    .eq("google_event_id", googleEventId);

  if (error) throw error;
};

export const listWhatsappAppointmentRequestsDAO = async () => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, patients(nombre, apellidos, numero_documento, celular)")
    .in("status", ["Solicitada", "Cancelación solicitada"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const updateAppointmentStatusDAO = async (id, status) => {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const getPatientContactDAO = async (patientId) => {
  const { data, error } = await supabase
    .from("patients")
    .select("nombre, celular, telefono")
    .eq("id", patientId)
    .single();

  if (error) throw error;
  return data;
};

export const getActiveWhatsappTemplateDAO = async () => {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("active", true)
    .eq("channel", "WhatsApp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createOutboundWhatsappMessageDAO = async (payload) => {
  const { error } = await supabase.from("whatsapp_messages").insert([payload]);
  if (error) throw error;
};
