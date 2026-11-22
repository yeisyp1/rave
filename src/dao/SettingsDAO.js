import { supabase, unwrap } from "./SupabaseDAO";

export const getSystemSettingsDAO = () =>
  unwrap(
    supabase.from("system_settings").select("*").order("id", { ascending: true }).limit(1).single()
  );

export const updateSystemSettingsDAO = (id, payload) =>
  unwrap(supabase.from("system_settings").update(payload).eq("id", id).select("*").single());
