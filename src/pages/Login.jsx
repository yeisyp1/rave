import { useState } from "react";
import { supabase } from "../Back/lib/supabase";
import "../pages/Calendar";
import "../styles/login.css";
import {CIcon} from '@coreui/icons-react';
import logo from "../assets/logo.png";

import {
  cilAt,
  cilLockLocked,
  cibGoogle
} from '@coreui/icons';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    console.log("Usuario logueado:", data.user);

    window.location.href = "/dashboard";
  };

  return (
    
    <div className="login-container">
      
      <div className="logo-center">
        <div style={{ textAlign: "center", marginBottom: "5px" }}>
          <img src={logo} alt="RAVE Logo" style={{ maxWidth: "250px", height: "auto" }} />
        </div>
      </div>

      <form className="form" onSubmit={handleLogin}>

        {/* ERROR */}
        {errorMsg && (
          <p style={{ color: "red", textAlign: "center" }}>
            {errorMsg}
          </p>
        )}

        {/* EMAIL */}
        <div className="flex-column">
          <label>Email</label>
        </div>

        <div className="inputForm">
          <CIcon icon={cilAt} size="md" />

          <input
            type="email"
            className="input"
            placeholder="Ingrese su correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="flex-column">
          <label>Password</label>
        </div>

        <div className="inputForm">
          <CIcon icon={cilLockLocked} size="md" />

          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* OPTIONS */}
        <div className="flex-row">
          <div>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember"> Remember me</label>
          </div>

          <span className="span">¿Olvidaste tu contraseña?</span>
        </div>

        {/* SUBMIT */}
        <button
          className="button-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>

        <p className="p line">O continúa con</p>

        {/* GOOGLE LOGIN (FUTURO) */}
        <button type="button" className="btn google">
          <CIcon icon={cibGoogle} size="md" />
          Google
        </button>

      </form>
    </div>
  );
};

export default Login;
