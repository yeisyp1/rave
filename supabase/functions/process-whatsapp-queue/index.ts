import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// WhatsApp Business Cloud API (Meta). Secrets: META_WA_TOKEN, META_WA_PHONE_NUMBER_ID y,
// para recordatorios fuera de la ventana de 24 h, META_WA_TEMPLATE_NAME (plantilla aprobada).
const META_WA_TOKEN = Deno.env.get("META_WA_TOKEN");
const META_WA_PHONE_NUMBER_ID = Deno.env.get("META_WA_PHONE_NUMBER_ID");
const META_WA_TEMPLATE_NAME = Deno.env.get("META_WA_TEMPLATE_NAME");
const META_WA_TEMPLATE_LANG = Deno.env.get("META_WA_TEMPLATE_LANG") ?? "es";
const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v21.0";

const isMetaConfigured = Boolean(META_WA_TOKEN && META_WA_PHONE_NUMBER_ID);

const sendViaMeta = async (
  phone: string,
  body: string,
  variables?: Record<string, string> | null,
) => {
  const to = phone.replace(/\D/g, "");

  // Fuera de la ventana de 24 h WhatsApp solo permite plantillas aprobadas.
  const payload = META_WA_TEMPLATE_NAME && variables
    ? {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: META_WA_TEMPLATE_NAME,
        language: { code: META_WA_TEMPLATE_LANG },
        components: [{
          type: "body",
          parameters: Object.keys(variables)
            .sort((x, y) => Number(x) - Number(y))
            .map((key) => ({ type: "text", text: String(variables[key]) })),
        }],
      },
    }
    : { messaging_product: "whatsapp", to, type: "text", text: { body } };

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_WA_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Meta error ${response.status}`);
  }
  return data.messages?.[0]?.id as string;
};

Deno.serve(async (_req: Request) => {
  const { data: pending, error } = await supabaseAdmin
    .from("whatsapp_messages")
    .select("*")
    .eq("direction", "outbound")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Los pacientes que dieron de baja WhatsApp no reciben mensajes (Ley 1581): se omiten.
  const patientIds = [...new Set(pending.map((row) => row.patient_id).filter(Boolean))];
  const optedOut = new Set<string>();
  if (patientIds.length > 0) {
    const { data: bajas } = await supabaseAdmin
      .from("patients")
      .select("id")
      .in("id", patientIds)
      .eq("whatsapp_baja", true);
    (bajas || []).forEach((row) => optedOut.add(row.id));
  }
  const skippedIds = pending.filter((row) => optedOut.has(row.patient_id)).map((row) => row.id);
  if (skippedIds.length > 0) {
    await supabaseAdmin
      .from("whatsapp_messages")
      .update({ status: "skipped", error: "El paciente dio de baja WhatsApp" })
      .in("id", skippedIds);
  }
  const queue = pending.filter((row) => !optedOut.has(row.patient_id));
  if (queue.length === 0) {
    return new Response(JSON.stringify({ processed: 0, skipped: skippedIds.length }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isMetaConfigured) {
    const ids = queue.map((row) => row.id);
    await supabaseAdmin
      .from("whatsapp_messages")
      .update({ status: "no_provider", error: "Meta WhatsApp no configurado (faltan secrets)" })
      .in("id", ids);

    return new Response(
      JSON.stringify({ processed: 0, skipped: ids.length, reason: "no_provider" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  let sent = 0;
  let failed = 0;

  for (const message of queue) {
    try {
      const providerMessageId = await sendViaMeta(
        message.phone,
        message.body,
        message.template_variables,
      );
      await supabaseAdmin
        .from("whatsapp_messages")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerMessageId })
        .eq("id", message.id);
      sent += 1;
    } catch (err) {
      await supabaseAdmin
        .from("whatsapp_messages")
        .update({ status: "failed", error: String(err instanceof Error ? err.message : err) })
        .eq("id", message.id);
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ processed: queue.length, sent, failed, skipped: skippedIds.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
