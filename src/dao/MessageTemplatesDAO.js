import { supabase } from "./SupabaseDAO";

export const listMessageTemplatesDAO = async () => {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createMessageTemplateDAO = async (payload) => {
  const { data, error } = await supabase
    .from("message_templates")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateMessageTemplateDAO = async (id, payload) => {
  const { data, error } = await supabase
    .from("message_templates")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const deleteMessageTemplateDAO = async (id) => {
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) throw error;
};
