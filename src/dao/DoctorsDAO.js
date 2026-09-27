import { supabase } from "./SupabaseDAO";

export const listAuthorizedUsersDAO = () =>
  supabase.from("authorized_emails").select("*").order("created_at", { ascending: false });

export const listStaffProfilesDAO = () =>
  supabase.from("profiles").select("*").order("full_name", { ascending: true });

export const upsertAuthorizedUserDAO = (payload) =>
  supabase.from("authorized_emails").upsert(payload, { onConflict: "email" });

export const setAuthorizedUserActiveDAO = (id, active) =>
  supabase.from("authorized_emails").update({ active }).eq("id", id);
