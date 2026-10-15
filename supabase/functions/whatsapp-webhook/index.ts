import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// WhatsApp Business Cloud API (Meta). Sin estos secretos la funcion rechaza todo (no hay valores de respaldo):
//   META_VERIFY_TOKEN        texto que tu eliges y pegas en la configuracion del webhook de Meta.
//   META_APP_SECRET          "App secret" de la app de Meta; firma cada POST (X-Hub-Signature-256).
//   META_WA_TOKEN            token de acceso para responder.
//   META_WA_PHONE_NUMBER_ID  id del numero de WhatsApp en Meta.
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_WA_TOKEN = Deno.env.get("META_WA_TOKEN") ?? "";
const META_WA_PHONE_NUMBER_ID = Deno.env.get("META_WA_PHONE_NUMBER_ID") ?? "";
const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v21.0";

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "");

const encoder = new TextEncoder();

const verifySignature = async (rawBody: string, header: string | null) => {
  if (!META_APP_SECRET || !header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const received = header.slice("sha256=".length);
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
};

// Responde dentro de la ventana de 24 h abierta por el mensaje del paciente.
const sendText = async (to: string, body: string) => {
  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_WA_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${META_WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    },
  );
  if (!response.ok) {
    console.error("No se pudo responder por WhatsApp:", await response.text());
  }
};

// Logica del asistente: recibe el mensaje del paciente y devuelve el texto de respuesta.
const handleIncoming = async (phoneDigits: string, body: string): Promise<string> => {
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
    return "Listo, no te enviaremos más mensajes por WhatsApp. Si cambias de opinión, escribe 'alta'. Tu atención en la clínica no se ve afectada.";
  }
  if (command === "alta") {
    if (patient) {
      await supabaseAdmin.from("patients").update({ whatsapp_baja: false }).eq("id", patient.id);
    }
    return "Listo, volverás a recibir recordatorios de tus citas por WhatsApp.";
  }

  if (text.includes("cancel")) {
    if (!patient) {
      return "No encontramos tu número registrado como paciente. Comunícate con la clínica para cancelar tu cita.";
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
      return "No encontramos una próxima cita para cancelar.";
    }

    await supabaseAdmin
      .from("appointments")
      .update({ status: "Cancelación solicitada" })
      .eq("id", upcoming.id);

    return "Recibimos tu solicitud de cancelación. La clínica la confirmará en breve.";
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

    return "Recibimos tu solicitud de cita. La clínica se pondrá en contacto contigo para confirmar fecha y hora.";
  }

  return "Hola, soy el asistente de RAVE. Escribe 'cita' para solicitar una cita o 'cancelar' para cancelar tu próxima cita.";
};

Deno.serve(async (req: Request) => {
  // Verificacion inicial del webhook (Meta llama con GET al registrar la URL).
  if (req.method === "GET") {
    const url = new URL(req.url);
    const ok = META_VERIFY_TOKEN &&
      url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === META_VERIFY_TOKEN;
    return ok
      ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 })
      : new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  if (!(await verifySignature(rawBody, req.headers.get("x-hub-signature-256")))) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Siempre se responde 200 al final: si no, Meta reintenta el mismo mensaje.
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const message of change?.value?.messages ?? []) {
        try {
          const phoneDigits = normalizeDigits(String(message.from || ""));
          if (!phoneDigits || message.type !== "text") continue;

          // Meta reintenta entregas: no se procesa dos veces el mismo mensaje.
          const { data: seen } = await supabaseAdmin
            .from("whatsapp_messages")
            .select("id")
            .eq("direction", "inbound")
            .eq("provider_message_id", message.id)
            .maybeSingle();
          if (seen) continue;

          const body = String(message.text?.body || "");
          await supabaseAdmin.from("whatsapp_messages").insert([
            {
              direction: "inbound",
              phone: phoneDigits,
              body,
              status: "received",
              provider_message_id: message.id,
            },
          ]);

          const reply = await handleIncoming(phoneDigits, body);
          await sendText(phoneDigits, reply);
        } catch (err) {
          console.error("Error procesando mensaje entrante:", err);
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
});
