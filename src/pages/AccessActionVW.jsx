import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../dao/SupabaseDAO'
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
    if (isReset || isCreate) supabase.auth.getSession().then(({ data }) => {
      const sessionExists = Boolean(data.session)
      setHasSession(sessionExists)
      if (isReset && !sessionExists) setError('El enlace no es válido o ya expiró. Solicita otro enlace.')
    })
  }, [isReset, isCreate])

  const validPasswords = () => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    if (password !== confirmation) return 'Las contraseñas no coinciden.'
    return ''
  }

  const handleCreate = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    if (hasSession) {
      const passwordError = validPasswords()
      if (passwordError) { setError(passwordError); setLoading(false); return }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (updateError) setError(updateError.message)
      else setMessage('Contraseña creada correctamente. Ya puedes iniciar sesión.')
      return
    }
    const normalizedEmail = email.trim().toLowerCase()
    const { data: authorized, error: authError } = await supabase
      .from('authorized_emails').select('email').eq('email', normalizedEmail).eq('active', true).maybeSingle()
    if (authError || !authorized) {
      setError('Este correo no está autorizado. Solicita al administrador que lo registre en RAVE.')
      setLoading(false); return
    }
    const passwordError = validPasswords()
    if (passwordError) { setError(passwordError); setLoading(false); return }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail, password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Este correo ya tiene una cuenta. Usa “Recuperar contraseña”.' : signUpError.message)
      return
    }
    setMessage(data.session ? 'Contraseña creada. Ya puedes entrar a RAVE.' : 'Te enviamos un correo para confirmar tu cuenta. Después podrás entrar a RAVE.')
  }

  const handleRecover = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    })
    setLoading(false)
    if (resetError) setError(resetError.message)
    else setMessage('Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.')
  }

  const handleReset = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    const passwordError = validPasswords()
    if (passwordError) { setError(passwordError); setLoading(false); return }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) setError(updateError.message)
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
