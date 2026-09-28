import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const renderTemplate = (body: string, vars: Record<string, string>) =>
  body.replace(/{{\s*(\w+)\s*}}/g, (_match, key: string) => vars[key] ?? "");

Deno.serve(async (_req: Request) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select("*, patients(nombre, apellidos, celular, telefono)")
    .eq("status", "Confirmada")
    .is("reminder_sent_at", null)
    .not("patient_id", "is", null)
    .gte("start_at", windowStart.toISOString())
    .lte("start_at", windowEnd.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!appointments || appointments.length === 0) {
    return new Response(JSON.stringify({ queued: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: template } = await supabaseAdmin
    .from("message_templates")
    .select("*")
    .eq("active", true)
    .eq("channel", "WhatsApp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fallbackBody =
    "Hola {{nombre}}, te recordamos tu cita en Clínica RAVE el {{fecha}} a las {{hora}}.";

  let queued = 0;

  for (const appointment of appointments) {
    const patient = appointment.patients;
    const phone = patient?.celular || patient?.telefono;
    if (!phone) continue;

    const start = new Date(appointment.start_at);
    const body = renderTemplate(template?.body || fallbackBody, {
      nombre: patient?.nombre || "",
      fecha: start.toLocaleDateString("es-CO"),
      hora: start.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }),
    });

    const { error: insertError } = await supabaseAdmin.from("whatsapp_messages").insert([
      {
        direction: "outbound",
        phone,
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        template_id: template?.id ?? null,
        body,
        status: "pending",
      },
    ]);

    if (!insertError) {
      await supabaseAdmin
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);
      queued += 1;
    }
  }

  return new Response(JSON.stringify({ queued }), {
    headers: { "Content-Type": "application/json" },
  });
});
