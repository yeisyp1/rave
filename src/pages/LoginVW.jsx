import { useState } from "react";
import { supabase } from "../dao/SupabaseDAO";
import logo from "../assets/logo.png";
import "../styles/LoginVW.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FiAlertCircle, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

const Login = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const flag = localStorage.getItem('no_autorizado');
      if (flag) {
        setErrorMsg('Tu cuenta no está autorizada para usar esta aplicación. Contacta al administrador.');
        localStorage.removeItem('no_autorizado');
      }
    } catch (e) {
      // ignore
    }
  }, []);


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
        scopes: "https://www.googleapis.com/auth/calendar",  
        redirectTo: "http://localhost:5173/oauth/consent",
        queryParams: {
          access_type: "offline",  
          prompt: "consent",       
          include_granted_scopes: "true",
        },
      }
    });
    if (error) alert(error.message);
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
                stroke="rgba(255, 255, 255, 0.93)"
                strokeWidth="3"
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
              <FiAlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <div className="field">
              <label className="field-label">Correo electrónico</label>
              <div className={`field-wrap ${focused === "email" ? "is-on" : ""}`}>
                <FiMail className="fi" />
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
                <FiLock className="fi" />
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
                  {showPassword ? <FiEye /> : <FiEyeOff />}
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