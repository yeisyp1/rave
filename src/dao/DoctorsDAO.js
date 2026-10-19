import { supabase } from "./SupabaseDAO";

export const listAuthorizedUsersDAO = () =>
  supabase.from("authorized_emails").select("*").order("created_at", { ascending: false });

export const listStaffProfilesDAO = () =>
  supabase.from("profiles").select("*").order("full_name", { ascending: true });

// Odontólogos activos (tabla doctors) para el dashboard y filtros.
export const listActiveDoctorsDAO = async () => {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, nombre, apellidos, especialidad")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const upsertAuthorizedUserDAO = (payload) =>
  supabase.from("authorized_emails").upsert(payload, { onConflict: "email" });

export const setAuthorizedUserActiveDAO = (id, active) =>
  supabase.from("authorized_emails").update({ active }).eq("id", id);


export const syncProfileRoleDAO = (email, role) =>
  supabase.from("profiles").update({ role }).eq("email", email);
