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

export const unwrap = async (queryPromise) => {
  const { data, error } = await queryPromise;
  if (error) throw error;
  return data;
};
