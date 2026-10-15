import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Fallback used only until WEBHOOK_SHARED_SECRET is set as a Supabase Edge
// Function secret (supabase secrets set WEBHOOK_SHARED_SECRET=...). Configure
// Twilio's webhook URL with ?secret=<the value> so only Twilio can reach this
// endpoint.
const WEBHOOK_SHARED_SECRET =
  Deno.env.get("WEBHOOK_SHARED_SECRET") ?? "7f4d51a4af8307b93ff8b54c27f6620d9373187cd65c3cd3";

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "");

const twiml = (message: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</Message></Response>`;

const twimlResponse = (message: string) =>
  new Response(twiml(message), {
    headers: { "Content-Type": "text/xml" },
  });

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== WEBHOOK_SHARED_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const contentType = req.headers.get("content-type") || "";
  let from = "";
  let body = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    from = String(form.get("From") || "");
    body = String(form.get("Body") || "");
  } else {
    const json = await req.json().catch(() => ({}));
    from = String(json.From || json.from || "");
    body = String(json.Body || json.body || "");
  }

  const phoneDigits = normalizeDigits(from.replace("whatsapp:", ""));
  if (!phoneDigits) {
    return twimlResponse("No pudimos identificar tu número. Intenta de nuevo.");
  }

  await supabaseAdmin.from("whatsapp_messages").insert([
    {
      direction: "inbound",
      phone: phoneDigits,
      body,
      status: "received",
    },
  ]);

  const { data: patients } = await supabaseAdmin
    .from("patients")
    .select("id, nombre, apellidos, celular, telefono");

  const patient = (patients || []).find((row) => {
    const celular = normalizeDigits(row.celular || "");
    const telefono = normalizeDigits(row.telefono || "");
    return (
      (celular && phoneDigits.endsWith(celular)) ||
      (telefono && phoneDigits.endsWith(telefono))
    );
  });

  const text = stripAccents(body.toLowerCase());
  const command = text.trim().replace(/[^a-z ]/g, "").trim();

  // Baja / alta del canal de WhatsApp (Ley 1581: el titular puede dejar de recibir mensajes).
  if (["baja", "stop", "parar", "detener", "no mas mensajes"].includes(command)) {
    if (patient) {
      await supabaseAdmin
        .from("patients")
        .update({ whatsapp_baja: true, whatsapp_baja_motivo: "Solicitada por el paciente por WhatsApp" })
        .eq("id", patient.id);
    }
    return twimlResponse(
      "Listo, no te enviaremos más mensajes por WhatsApp. Si cambias de opinión, escribe 'alta'. Tu atención en la clínica no se ve afectada.",
    );
  }
  if (command === "alta") {
    if (patient) {
      await supabaseAdmin.from("patients").update({ whatsapp_baja: false }).eq("id", patient.id);
    }
    return twimlResponse("Listo, volverás a recibir recordatorios de tus citas por WhatsApp.");
  }

  if (text.includes("cancel")) {
    if (!patient) {
      return twimlResponse(
        "No encontramos tu número registrado como paciente. Comunícate con la clínica para cancelar tu cita.",
      );
    }

    const { data: upcoming } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("status", "Confirmada")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!upcoming) {
      return twimlResponse("No encontramos una próxima cita para cancelar.");
    }

    await supabaseAdmin
      .from("appointments")
      .update({ status: "Cancelación solicitada" })
      .eq("id", upcoming.id);

    return twimlResponse(
      "Recibimos tu solicitud de cancelación. La clínica la confirmará en breve.",
    );
  }

  if (text.includes("cita") || text.includes("agendar") || text.includes("turno")) {
    await supabaseAdmin.from("appointments").insert([
      {
        patient_id: patient?.id ?? null,
        status: "Solicitada",
        source: "WhatsApp",
        requester_phone: phoneDigits,
        notes: body,
      },
    ]);

    return twimlResponse(
      "Recibimos tu solicitud de cita. La clínica se pondrá en contacto contigo para confirmar fecha y hora.",
    );
  }

  return twimlResponse(
    "Hola, soy el asistente de Clínica RAVE. Escribe 'cita' para solicitar una cita o 'cancelar' para cancelar tu próxima cita.",
  );
});
