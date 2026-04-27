import { useEffect } from "react";
import { supabase } from "../dao/SupabaseDAO";
import { useNavigate } from "react-router-dom";

export default function OAuthConsent() {

  const navigate = useNavigate();

  useEffect(() => {

    const handleOAuth = async () => {

      // Obtener sesión después del login Google
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error sesión:", error);
        return;
      }

      if (!data.session) {
        console.log("No hay sesión");
        navigate("/login");
        return;
      }

      console.log("Sesión Google:", data.session);

      const accessToken = data.session.provider_token;
      const refreshToken =
        data.session.provider_refresh_token ||
        data.session.refresh_token;
        console.log("Access:", accessToken);
        console.log("Refresh:", refreshToken);

      navigate("/dashboard");
    };

    handleOAuth();

  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h3>Conectando con Google Calendar...</h3>
    </div>
  );
}