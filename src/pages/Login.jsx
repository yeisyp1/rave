import { useState } from "react";
import { supabase } from "../Back/lib/supabase";
import logo from "../assets/logo.png";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState("");

  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    console.log("Usuario logueado:", data.user);
    navigate("/dashboard");
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/oauth/consent"
      }
    });



    if (error) {
      alert(error.message);
    }
  };


  return (
    <div className="rave-root">

      {/* ── Panel izquierdo decorativo ── */}
      <aside className="rave-panel">
        <div className="panel-grid" />
        <div className="panel-inner">

          <div className="logo-center">
            <div style={{ textAlign: "center", marginBottom: "5px" }}>
              <img src={logo} alt="RAVE Logo" style={{ maxWidth: "200px", height: "auto" }} />
            </div>
          </div>

          <div className="hero-tooth-wrap">
            <div className="hero-tooth-glow" />
            <svg viewBox="0 0 60 80" fill="none">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="60" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#c9934a" stopOpacity="0.55" />
                </linearGradient>
              </defs>
              <path
                d="M15 5C8 5 3 11 3 18c0 5 2 9 4 13 3 5 4 12 5 20 1 6 2 16 5 20 2 3 5 3 6 0
                   1-4 2-10 4-14 1-3 2-5 3-5s2 2 3 5c2 4 3 10 4 14 1 3 4 3 6 0 3-4 4-14 5-20
                   1-8 2-15 5-20 2-4 4-8 4-13 0-7-5-13-12-13-4 0-7 2-10 4-3-2-6-4-10-4z"
                fill="url(#hg)"
                stroke="rgba(201,147,74,0.4)"
                strokeWidth="1.5"
              />
              <path
                d="M18 14 C16 16 14 20 14 25"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="panel-headline">
            Tu sonrisa,<br /><em>nuestra pasión</em>
          </div>

          <p className="panel-sub">
            Plataforma de gestión clínica diseñada para brindar atención
            odontológica de excelencia.
          </p>

          <div className="panel-dots">
            <div className="panel-dot on" />
          </div>

        </div>
      </aside>

      {/* ── Lado derecho: formulario ── */}
      <main className="rave-form-side">
        <div className="rave-card">

          {/* Logo solo en móvil */}
          <div className="mobile-logo">
            <div style={{ textAlign: "center", marginBottom: "5px" }}>
              <img src={logo} alt="RAVE Logo" style={{ maxWidth: "150px", height: "auto" }} />
            </div>
          </div>

          <div className="accent-bar" />

          <div className="form-eyebrow">Clínica Odontológica</div>
          <div className="form-title-access">Acceso al sistema</div>   
          <div className="form-subtitle">Ingresa con tus credenciales profesionales</div>

          {errorMsg && (
            <div className="err-box">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0
                     1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <div className="field">
              <label className="field-label">Correo electrónico</label>
              <div className={`field-wrap ${focused === "email" ? "is-on" : ""}`}>
                <svg className="fi" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <input
                  type="email"
                  className="field-input"
                  placeholder="doctor@rave.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="field">
              <label className="field-label">Contraseña</label>
              <div className={`field-wrap ${focused === "password" ? "is-on" : ""}`}>
                <svg className="fi" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5
                       a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7
                           c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4
                           4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414
                           l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3
                           10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514
                           1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path
                        d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335
                           6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7
                           .847 0 1.669-.105 2.454-.303z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* OPCIONES */}
            <div className="options-row">
              <label className="remember">
                <input type="checkbox" id="remember" />
                <span>Recordar sesión</span>
              </label>
              <button type="button" className="forgot">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* SUBMIT */}
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-inner">
                  <span className="spinner" />
                  Verificando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            {/* DIVIDER */}
            <div className="divider">
              <div className="div-line" />
              <span className="div-text">O continúa con</span>
              <div className="div-line" />
            </div>

            {/* GOOGLE */}
            <button type="button" className="google-btn" onClick={handleGoogleLogin}> 
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04
                     2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71
                     1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18
                     C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12
                     1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>

          </form>

          <div className="form-footer">
            RAVE Clínica Odontológica <span>·</span> Sistema de Gestión v1.0
          </div>

        </div>
      </main>
    </div>
  );
};

export default Login;