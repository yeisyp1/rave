import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getCurrentUserIdDAO = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export const getPatients = async () => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return null;
  }

  return data;
};
