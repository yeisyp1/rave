import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

const isTwilioConfigured = Boolean(
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM,
);

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
};

const sendViaTwilio = async (phone: string, body: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `whatsapp:${normalizePhone(phone)}`,
      From: `whatsapp:${normalizePhone(TWILIO_WHATSAPP_FROM!)}`,
      Body: body,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || `Twilio error ${response.status}`);
  }
  return data.sid as string;
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

  if (!isTwilioConfigured) {
    const ids = pending.map((row) => row.id);
    await supabaseAdmin
      .from("whatsapp_messages")
      .update({ status: "no_provider", error: "Twilio no configurado (faltan secrets)" })
      .in("id", ids);

    return new Response(
      JSON.stringify({ processed: 0, skipped: ids.length, reason: "no_provider" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  let sent = 0;
  let failed = 0;

  for (const message of pending) {
    try {
      const providerMessageId = await sendViaTwilio(message.phone, message.body);
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

  return new Response(JSON.stringify({ processed: pending.length, sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
