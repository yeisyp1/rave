import { useState } from "react";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("Login:", { email, password });

  };

  return (
    <div className="login-container">
      <form className="form" onSubmit={handleLogin}>
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
          RAVE Dental System
        </h2>

        {/* EMAIL */}
        <div className="flex-column">
          <label>Email</label>
        </div>

        <div className="inputForm">
          <svg
            height="20"
            viewBox="0 0 32 32"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082..." />
          </svg>

          <input
            type="email"
            className="input"
            placeholder="Ingresa tu correo"
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
          <svg
            height="20"
            viewBox="-64 0 512 512"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m336 512h-288c-26.453125..." />
          </svg>

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
        <button className="button-submit" type="submit">
          Iniciar Sesión
        </button>

        <p className="p">¿No tienes cuenta? <span className="span">Regístrate</span></p>

        <p className="p line">O continúa con</p>

        {/* GOOGLE LOGIN */}
        <button
          type="button"
          className="btn google"
          onClick={() => window.location.href = "http://localhost:3000/auth/google"}
        >
          Google
        </button>
      </form>
    </div>
  );
};

export default Login;
