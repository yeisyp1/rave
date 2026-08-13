import { Link } from 'react-router-dom'
import logo from '../assets/logo1.png'
import '../styles/PublicPagesVW.css'

const PublicHomeVW = () => (
  <main className="public-page">
    <nav className="public-nav" aria-label="Navegación principal">
      <Link to="/" className="public-brand">
        <img src={logo} alt="RAVE" />
      </Link>
      <Link to="/login" className="public-login">Acceso al sistema</Link>
    </nav>

    <section className="public-hero">
      <div className="public-copy">
        <p className="public-kicker">RAVE</p>
        <h1>Gestión clínica para brindar una mejor atención.</h1>
        <p className="public-lead">
          RAVE es una plataforma para que clínicas y consultorios odontológicos
          administren pacientes, historias clínicas, odontogramas, citas,
          facturación e inventario desde un solo lugar.
        </p>
        <div className="public-actions">
          <Link to="/login" className="public-button">Ingresar a RAVE</Link>
          <a href="#funciones" className="public-secondary">Conocer la plataforma</a>
        </div>
      </div>
      <div className="public-visual" aria-hidden="true">
        <div className="public-tooth">✦</div>
        <span>Pacientes</span><span>Citas</span><span>Historias clínicas</span>
      </div>
    </section>

    <section id="funciones" className="public-features">
      <article><h2>Pacientes</h2><p>Información clínica y administrativa organizada y disponible para el equipo autorizado.</p></article>
      <article><h2>Citas</h2><p>Agenda odontológica integrada con Google Calendar para facilitar la planificación.</p></article>
      <article><h2>Gestión clínica</h2><p>Historias clínicas, odontogramas, facturación e inventario en una misma plataforma.</p></article>
    </section>

    <footer className="public-footer">
      <span>© {new Date().getFullYear()} RAVE</span>
      <Link to="/politica-privacidad">Política de privacidad</Link>
    </footer>
  </main>
)

export default PublicHomeVW
