import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LegalTextVW from '../components/LegalTextVW'
import { getDataControllerDAO, getLatestLegalDocumentDAO } from '../dao/LegalDocumentsDAO'
import '../styles/PublicPagesVW.css'

const PrivacyPolicyVW = () => {
  const [doc, setDoc] = useState(null)
  const [controller, setController] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    Promise.all([getLatestLegalDocumentDAO('politica_privacidad'), getDataControllerDAO()])
      .then(([policy, data]) => {
        if (!active) return
        setDoc(policy)
        setController(data)
        setStatus(policy ? 'ok' : 'empty')
      })
      .catch(() => active && setStatus('error'))
    return () => { active = false }
  }, [])

  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-back">← RAVE</Link>
        <Link to="/login" className="public-login">Acceso al sistema</Link>
      </header>
      <article className="legal-card">
        <p className="public-kicker">RAVE</p>
        <h1>{doc?.title || 'Política de tratamiento de datos personales'}</h1>
        {doc && (
          <p className="legal-updated">
            Versión {doc.version} · Vigente desde el {new Date(doc.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {controller && (
          <section className="legal-controller">
            <strong>{controller.razon_social}</strong>
            <span>NIT: {controller.nit}</span>
            <span>{controller.direccion}, {controller.ciudad}</span>
            <span>Correo para datos personales: {controller.correo_datos_personales}</span>
            <span>Teléfono: {controller.telefono}</span>
          </section>
        )}
        {status === 'loading' && <p>Cargando…</p>}
        {status === 'error' && <p className="legal-note">No se pudo cargar la política. Inténtalo de nuevo más tarde o solicítala en la clínica.</p>}
        {status === 'empty' && <p className="legal-note">La política aún no ha sido publicada. Solicítala en la clínica.</p>}
        {doc && <LegalTextVW content={doc.content} />}
      </article>
    </main>
  )
}

export default PrivacyPolicyVW
