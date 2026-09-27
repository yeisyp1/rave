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

export const queueAppointmentConfirmationDAO = async ({ appointmentId, patientId, start, serviceType }) => {
  const { data: patient } = await supabase
    .from("patients")
    .select("nombre, celular, telefono")
    .eq("id", patientId)
    .single();

  const phone = patient?.celular || patient?.telefono;
  if (!phone) return null;

  const { data: template } = await supabase
    .from("message_templates")
    .select("*")
    .eq("active", true)
    .eq("channel", "WhatsApp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fallbackBody = "Hola {{nombre}}, confirmamos tu cita en Clínica RAVE para el {{fecha}} a las {{hora}}.";
  const body = (template?.body || fallbackBody)
    .replace(/{{\s*nombre\s*}}/g, patient?.nombre || "")
    .replace(/{{\s*fecha\s*}}/g, start.toLocaleDateString("es-CO"))
    .replace(/{{\s*hora\s*}}/g, start.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }))
    .replace(/{{\s*servicio\s*}}/g, serviceType || "");

  const { error } = await supabase.from("whatsapp_messages").insert([
    {
      direction: "outbound",
      phone,
      patient_id: patientId,
      appointment_id: appointmentId,
      template_id: template?.id ?? null,
      body,
      status: "pending",
    },
  ]);

  if (error) throw error;
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
