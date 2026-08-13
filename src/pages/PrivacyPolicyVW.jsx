import { Link } from 'react-router-dom'
import '../styles/PublicPagesVW.css'

const PrivacyPolicyVW = () => (
  <main className="legal-page">
    <header className="legal-header">
      <Link to="/" className="legal-back">← RAVE</Link>
      <Link to="/login" className="public-login">Acceso al sistema</Link>
    </header>
    <article className="legal-card">
      <p className="public-kicker">RAVE</p>
      <h1>Política de privacidad</h1>
      <p className="legal-updated">Última actualización: 13 de agosto de 2026</p>
      <h2>1. Responsable</h2>
      <p>RAVE es una plataforma de gestión clínica para consultorios odontológicos. Esta política explica cómo se trata la información utilizada por la aplicación.</p>
      <h2>2. Información que se gestiona</h2>
      <p>La plataforma puede gestionar datos de usuarios autorizados, pacientes, citas, historias clínicas, odontogramas, facturación e inventario, según las funciones habilitadas por la clínica.</p>
      <h2>3. Uso de la información</h2>
      <p>La información se utiliza para administrar la atención odontológica, coordinar citas, mantener registros clínicos y apoyar los procesos administrativos de la clínica.</p>
      <h2>4. Servicios integrados</h2>
      <p>RAVE puede integrarse con Supabase para autenticación y almacenamiento, y con Google Calendar cuando el usuario autoriza esa función. Cada servicio aplica sus propias políticas de privacidad y seguridad.</p>
      <h2>5. Seguridad y acceso</h2>
      <p>El acceso a la información está limitado a usuarios autorizados por la clínica. No compartimos información clínica con terceros para fines publicitarios.</p>
      <h2>6. Contacto</h2>
      <p>Para consultas sobre privacidad, solicita a la clínica administradora el canal de contacto correspondiente.</p>
      <p className="legal-note">Esta página es informativa y debe actualizarse con la razón social, correo y dirección oficiales de la clínica antes de solicitar la verificación definitiva.</p>
    </article>
  </main>
)

export default PrivacyPolicyVW
