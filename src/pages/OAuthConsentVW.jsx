import { useEffect } from "react";
import { getOAuthSessionCtrl } from "../controllers/AuthCtrl";
import { useNavigate } from "react-router-dom";

export default function OAuthConsent() {

  const navigate = useNavigate();

  useEffect(() => {

    const handleOAuth = async () => {
      let session;
      try {
        session = await getOAuthSessionCtrl();
      } catch (error) {
        console.error("Error sesión:", error);
        return;
      }

      if (!session) {
        navigate("/login");
        return;
      }

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