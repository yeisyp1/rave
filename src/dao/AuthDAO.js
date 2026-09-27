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

export const checkAuthorizedEmailDAO = async (email) => {
  const { data, error } = await supabase
    .from("authorized_emails")
    .select("email")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
};
