import { supabase, unwrap } from "./SupabaseDAO";

export const listMessageTemplatesDAO = async () =>
  (await unwrap(
    supabase.from("message_templates").select("*").order("created_at", { ascending: false })
  )) ?? [];

export const createMessageTemplateDAO = (payload) =>
  unwrap(supabase.from("message_templates").insert([payload]).select("*").single());

export const updateMessageTemplateDAO = (id, payload) =>
  unwrap(supabase.from("message_templates").update(payload).eq("id", id).select("*").single());

export const deleteMessageTemplateDAO = (id) =>
  unwrap(supabase.from("message_templates").delete().eq("id", id));
