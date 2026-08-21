import { useEffect, useState } from "react";
import { supabase } from "../dao/SupabaseDAO";

export function useAuthSessionCtrl() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchProfileForUser = async (u) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data ?? null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const createProfileForAuthorizedUser = async (u) => {
    const email = u.email?.trim().toLowerCase();
    if (!email) return null;

    const { data: authorized, error: authError } = await supabase
      .from("authorized_emails")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();

    if (authError || !authorized) {
      if (authError) console.error("Error checking authorized email:", authError);
      return null;
    }

    const fullName =
      authorized.full_name ||
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      email;

    const profilePayload = {
      id: u.id,
      full_name: fullName,
      email,
      role: authorized.role || "user",
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session) => {
      if (!session || !session.user) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setUnauthorized(false);
        }
        return;
      }

      const u = session.user;
      let prof = await fetchProfileForUser(u);

      if (!prof) {
        prof = await createProfileForAuthorizedUser(u);
      }

      if (!prof) {
        // No profile -> user is not authorized to use the app.
        // Log a warning to help debugging authorized vs. non-authorized users
        // before taking action (useful in dev environments).
        try {
          console.warn('Usuario autenticado pero sin profile:', u.email, 'uid:', u.id);
        } catch (e) {
        }

        // Mark a flag so the login page can show a message and sign out.
        try {
          localStorage.setItem('no_autorizado', '1');
        } catch (e) {
          // ignore
        }

        await supabase.auth.signOut();

        if (mounted) {
          setUser(null);
          setProfile(null);
          setUnauthorized(true);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(u);
        setProfile(prof);
        setUnauthorized(false);
        setLoading(false);
      }
    };

    // initial session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        handleSession(data.session ?? null);
      })
      .catch((e) => {
        console.error("getSession error", e);
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleSession(session ?? null);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, unauthorized };
}
