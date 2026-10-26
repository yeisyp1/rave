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

// Catálogo completo de odontólogos (activos e inactivos) para su gestión (RF-06).
export const listAllDoctorsDAO = async () => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createDoctorDAO = async (payload) => {
  const { data, error } = await supabase
    .from("doctors")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateDoctorDAO = async (id, payload) => {
  const { data, error } = await supabase
    .from("doctors")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

// No se elimina (consistente con el resto del sistema): solo se activa/desactiva.
export const setDoctorActiveDAO = async (id, active) => {
  const { data, error } = await supabase
    .from("doctors")
    .update({ activo: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const upsertAuthorizedUserDAO = (payload) =>
  supabase.from("authorized_emails").upsert(payload, { onConflict: "email" });

export const setAuthorizedUserActiveDAO = (id, active) =>
  supabase.from("authorized_emails").update({ active }).eq("id", id);


export const syncProfileRoleDAO = (email, role) =>
  supabase.from("profiles").update({ role }).eq("email", email);
