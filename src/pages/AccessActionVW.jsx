import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  checkSessionExistsCtrl,
  createAccountCtrl,
  sendPasswordRecoveryCtrl,
  updatePasswordCtrl,
  validatePasswordCtrl,
} from '../controllers/AuthCtrl'
import logo from '../assets/logo1.png'
import '../styles/PublicPagesVW.css'

const AccessActionVW = ({ mode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const isReset = mode === 'reset'
  const isCreate = mode === 'create'

  useEffect(() => {
    if (isReset || isCreate) checkSessionExistsCtrl().then((sessionExists) => {
      setHasSession(sessionExists)
      if (isReset && !sessionExists) setError('El enlace no es válido o ya expiró. Solicita otro enlace.')
    })
  }, [isReset, isCreate])

  const handleCreate = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    if (hasSession) {
      const passwordError = validatePasswordCtrl(password, confirmation)
      if (passwordError) { setError(passwordError); setLoading(false); return }
      const result = await updatePasswordCtrl(password)
      setLoading(false)
      if (!result.ok) setError(result.message)
      else setMessage('Contraseña creada correctamente. Ya puedes iniciar sesión.')
      return
    }

    const passwordError = validatePasswordCtrl(password, confirmation)
    if (passwordError) { setError(passwordError); setLoading(false); return }

    const result = await createAccountCtrl({ email, password })
    setLoading(false)
    if (!result.ok) { setError(result.message); return }
    setMessage(result.message)
  }

  const handleRecover = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const result = await sendPasswordRecoveryCtrl(email)
    setLoading(false)
    if (!result.ok) setError(result.message)
    else setMessage(result.message)
  }

  const handleReset = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const passwordError = validatePasswordCtrl(password, confirmation)
    if (passwordError) { setError(passwordError); setLoading(false); return }
    const result = await updatePasswordCtrl(password)
    setLoading(false)
    if (!result.ok) setError(result.message)
    else setMessage('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
  }

  const submit = isReset ? handleReset : isCreate ? handleCreate : handleRecover
  const title = isReset ? 'Restablecer contraseña' : isCreate ? 'Crear contraseña' : 'Recuperar contraseña'
  const description = isReset ? 'Escribe tu nueva contraseña para continuar.' : isCreate ? 'Usa el correo que el administrador autorizó en RAVE.' : 'Te enviaremos un enlace seguro a tu correo electrónico.'

  return (
    <main className="access-page">
      <section className="access-card">
        <Link to="/"><img src={logo} alt="RAVE Odontología" className="access-logo" /></Link>
        <p className="public-kicker">RAVE Odontología</p>
        <h1>{title}</h1>
        <p className="access-description">{description}</p>
        {!isReset && !hasSession && <label>Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>}
        {(isCreate || isReset) && <><label>Nueva contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength="8" required /></label><label>Confirmar contraseña<input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} minLength="8" required /></label></>}
        {error && <p className="access-error">{error}</p>}
        {message && <p className="access-message">{message}</p>}
        {(!message || isReset) && <form onSubmit={submit}><button className="public-button" disabled={loading}>{loading ? 'Procesando...' : isReset ? 'Guardar contraseña' : isCreate ? 'Crear contraseña' : 'Enviar enlace'}</button></form>}
        <Link to="/login" className="access-back">Volver al inicio de sesión</Link>
      </section>
    </main>
  )
}

export default AccessActionVW
