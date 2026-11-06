import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BUCKET = "radiographies";

// Elimina archivos de Storage sin fila en public.radiographies (huérfanos de subidas
// fallidas cuya compensación también falló). Solo toca archivos de más de 24 h para no
// competir con una subida en curso. Se invoca por cron (ver db/supabase_schema.sql).
Deno.serve(async (_req: Request) => {
  const { data, error } = await supabaseAdmin.rpc("list_orphan_radiography_files", {
    p_older_than: "1 day",
    p_limit: 200,
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const names = ((data as { name: string }[] | null) ?? []).map((row) => row.name);
  if (names.length === 0) {
    return new Response(JSON.stringify({ orphans: 0, removed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: removed, error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove(names);
  if (removeError) {
    return new Response(JSON.stringify({ orphans: names.length, error: removeError.message }), { status: 500 });
  }

  console.log("Radiografías huérfanas eliminadas:", names);
  return new Response(JSON.stringify({ orphans: names.length, removed: removed?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
