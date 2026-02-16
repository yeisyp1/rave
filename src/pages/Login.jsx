import { useState } from 'react'
import '../styles/login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>RAVE Dental System</h1>
        <p>Acceso al Panel de Administración</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo</label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login">Iniciar Sesión</button>
        </form>

        <p className="login-footer">© 2025 RAVE Dental System</p>
      </div>
    </div>
  )
}

export default Login