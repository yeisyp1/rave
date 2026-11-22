import { supabase, unwrap } from "./SupabaseDAO";

export const listAuthorizedUsersDAO = () =>
  supabase.from("authorized_emails").select("*").order("created_at", { ascending: false });

export const listStaffProfilesDAO = () =>
  supabase.from("profiles").select("*").order("full_name", { ascending: true });

// Odontólogos activos (tabla doctors) para el dashboard y filtros.
export const listActiveDoctorsDAO = async () =>
  (await unwrap(
    supabase
      .from("doctors")
      .select("id, nombre, apellidos, especialidad")
      .eq("activo", true)
      .order("nombre", { ascending: true })
  )) ?? [];

// Catálogo completo de odontólogos (activos e inactivos) para su gestión (RF-06).
export const listAllDoctorsDAO = async () =>
  (await unwrap(
    supabase.from("doctors").select("*").order("nombre", { ascending: true })
  )) ?? [];

export const createDoctorDAO = (payload) =>
  unwrap(supabase.from("doctors").insert([payload]).select("*").single());

export const updateDoctorDAO = (id, payload) =>
  unwrap(supabase.from("doctors").update(payload).eq("id", id).select("*").single());

// No se elimina (consistente con el resto del sistema): solo se activa/desactiva.
export const setDoctorActiveDAO = (id, active) =>
  unwrap(
    supabase.from("doctors").update({ activo: active }).eq("id", id).select("*").single()
  );

export const upsertAuthorizedUserDAO = (payload) =>
  supabase.from("authorized_emails").upsert(payload, { onConflict: "email" });

export const setAuthorizedUserActiveDAO = (id, active) =>
  supabase.from("authorized_emails").update({ active }).eq("id", id);


export const syncProfileRoleDAO = (email, role) =>
  supabase.from("profiles").update({ role }).eq("email", email);
