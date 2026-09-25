import { supabase } from "./SupabaseDAO";

export const getSystemSettingsDAO = async () => {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const updateSystemSettingsDAO = async (id, payload) => {
  const { data, error } = await supabase
    .from("system_settings")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
