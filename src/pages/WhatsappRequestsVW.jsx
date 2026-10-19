import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiCalendar, FiCheck, FiMessageSquare, FiSettings, FiXCircle } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  computeWhatsappRequestStatsCtrl,
  getWhatsappRequestPatientLabel,
  loadWhatsappRequestsCtrl,
  updateWhatsappRequestStatusCtrl,
} from '../controllers/WhatsappRequestsCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

// La integración de WhatsApp corre en Edge Functions de Supabase + Meta Cloud API.
// Los secrets se configuran en Supabase (Dashboard → Edge Functions → Secrets),
// no en la app; esta tarjeta solo documenta qué hace falta y dónde.
const WA_SECRETS = [
  ['META_VERIFY_TOKEN', 'Texto que inventas; lo pegas también en Meta al registrar el webhook.'],
  ['META_APP_SECRET', 'App Dashboard → Settings → Basic → App secret. Firma cada petición de Meta.'],
  ['META_WA_TOKEN', 'Token de acceso (permanente de usuario del sistema, o temporal para pruebas).'],
  ['META_WA_PHONE_NUMBER_ID', 'WhatsApp → API Setup → Phone number ID.'],
  ['META_WA_TEMPLATE_NAME', 'Plantilla aprobada para recordatorios (cuerpo con {{1}} fecha y {{2}} hora).'],
  ['META_WA_TEMPLATE_LANG', 'Opcional, por defecto "es".'],
]

const WA_COMMANDS = [
  ['cita / agendar / turno', 'crea una solicitud de cita'],
  ['cancelar', 'crea una solicitud de cancelación'],
  ['BAJA / ALTA', 'el paciente se da de baja o se reactiva para recibir mensajes'],
]

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const WEBHOOK_URL = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/whatsapp-webhook` : ''

const WhatsappRequestsVW = () => {
  const dispatch = useDispatch()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await loadWhatsappRequestsCtrl()
      setRequests(data)
    } catch (error) {
      setMessage(`No se pudieron cargar las solicitudes: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const stats = useMemo(() => computeWhatsappRequestStatsCtrl(requests), [requests])

  const markHandled = async (item, status) => {
    const result = await updateWhatsappRequestStatusCtrl(item.id, status)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar la solicitud: ${result.message}`, variant: 'error' }))
      return
    }
    setRequests((current) => current.filter((row) => row.id !== item.id || result.data.status === row.status))
    await loadRequests()
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Solicitudes por WhatsApp</h1>
          <p className="admin-subtitle">Citas solicitadas o canceladas por pacientes desde WhatsApp, pendientes de revisión.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.newAppointments}</div><div className="admin-stat-label">solicitudes de cita</div></div>
          <span className="admin-icon"><FiCalendar /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.cancellations}</div><div className="admin-stat-label">solicitudes de cancelación</div></div>
          <span className="admin-icon"><FiXCircle /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Pendientes de gestionar</h2>
        <p className="admin-subtitle" style={{ marginTop: '-.5rem' }}>
          Las solicitudes de cita nuevas debes agendarlas manualmente en Calendario; las de cancelación debes cancelarlas ahí mismo. Luego marca la solicitud como gestionada.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Fecha solicitud</th><th>Paciente</th><th>Teléfono</th><th>Tipo</th><th>Detalle</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando solicitudes..." className="loader-inline" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay solicitudes pendientes.</td></tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString('es-CO')}</td>
                    <td>{getWhatsappRequestPatientLabel(item)}</td>
                    <td>{item.requester_phone || item.patients?.celular || '-'}</td>
                    <td><span className={`admin-pill ${item.status === 'Solicitada' ? 'warn' : 'bad'}`}>{item.status}</span></td>
                    <td>{item.notes || (item.status === 'Cancelación solicitada' ? `Cita del ${item.start_at ? new Date(item.start_at).toLocaleString('es-CO') : '—'}` : '-')}</td>
                    <td>
                      <div className="admin-actions">
                        {item.status === 'Solicitada' ? (
                          <button className="admin-btn primary" type="button" onClick={() => markHandled(item, 'Confirmada')} title="Ya la agendé en Calendario">
                            <FiCheck /> Agendada
                          </button>
                        ) : (
                          <button className="admin-btn primary" type="button" onClick={() => markHandled(item, 'Cancelada')} title="Ya la cancelé en Calendario">
                            <FiCheck /> Cancelada
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Configuración de la integración</h2>
        <p className="admin-subtitle" style={{ marginTop: '-.5rem' }}>
          Los recordatorios y respuestas automáticas corren en Edge Functions de Supabase sobre la Cloud API de Meta.
          La configuración sensible vive fuera de la app: en Supabase (Dashboard → Edge Functions → Secrets) y en Meta.
        </p>

        <div className="wa-config">
          <div className="wa-config-block">
            <h3 className="wa-config-title">1. Webhook en Meta</h3>
            <p className="wa-config-text">Regístralo en WhatsApp → Configuration → Webhook, suscrito al campo <code>messages</code>:</p>
            <div className="wa-config-url">
              <code>{WEBHOOK_URL || 'Configura VITE_SUPABASE_URL para ver la URL del webhook'}</code>
            </div>
            <p className="wa-config-text">El <em>Verify token</em> debe coincidir con el secret <code>META_VERIFY_TOKEN</code>.</p>
          </div>

          <div className="wa-config-block">
            <h3 className="wa-config-title">2. Secrets requeridos en Supabase</h3>
            <ul className="wa-config-list">
              {WA_SECRETS.map(([name, desc]) => (
                <li key={name}><code>{name}</code><span>{desc}</span></li>
              ))}
            </ul>
            <p className="wa-config-text">Sin estos secrets, las funciones rechazan las peticiones (no hay valores de respaldo en el código).</p>
          </div>

          <div className="wa-config-block">
            <h3 className="wa-config-title">3. Palabras clave del paciente</h3>
            <ul className="wa-config-list">
              {WA_COMMANDS.map(([cmd, desc]) => (
                <li key={cmd}><code>{cmd}</code><span>{desc}</span></li>
              ))}
            </ul>
          </div>

          <div className="wa-config-block">
            <h3 className="wa-config-title">Gestión dentro de la app</h3>
            <div className="wa-config-links">
              <Link className="admin-btn" to="/plantillas"><FiMessageSquare /> Plantillas de mensajes</Link>
              <Link className="admin-btn" to="/settings"><FiSettings /> Configuración general</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsappRequestsVW
