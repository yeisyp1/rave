import { supabase } from "./SupabaseDAO";

export const signInWithPasswordDAO = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signInWithGoogleDAO = (redirectTo) =>
  supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: "https://www.googleapis.com/auth/calendar",
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
      },
    },
  });

export const signInWithOtpDAO = (email, emailRedirectTo) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });

export const getSessionDAO = () => supabase.auth.getSession();

export const updateUserPasswordDAO = (password) => supabase.auth.updateUser({ password });

export const signUpDAO = (email, password, emailRedirectTo) =>
  supabase.auth.signUp({ email, password, options: { emailRedirectTo } });

export const resetPasswordForEmailDAO = (email, redirectTo) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo });

// Antes de iniciar sesión no hay JWT, así que RLS bloquea la lectura directa de
// authorized_emails (solo admins o el propio usuario ya autenticado pueden verla).
// Esta función RPC (security definer) expone únicamente un booleano para que un
// visitante anónimo pueda verificar su propia autorización en /crear-contrasena.
export const checkAuthorizedEmailDAO = async (email) => {
  const { data, error } = await supabase.rpc("check_authorized_email", { p_email: email });

  if (error) throw error;
  return data;
};
