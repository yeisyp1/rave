import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiCalendar, FiCheck, FiPhone, FiXCircle } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import { listWhatsappAppointmentRequestsDAO, updateAppointmentStatusDAO } from '../dao/AppointmentsDAO'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const WhatsappRequestsVW = () => {
  const dispatch = useDispatch()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await listWhatsappAppointmentRequestsDAO()
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

  const stats = useMemo(() => ({
    newAppointments: requests.filter((item) => item.status === 'Solicitada').length,
    cancellations: requests.filter((item) => item.status === 'Cancelación solicitada').length,
  }), [requests])

  const getPatientLabel = (item) => {
    const patient = item.patients
    if (patient) return `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim() || patient.numero_documento
    return item.requester_phone || 'Paciente sin identificar'
  }

  const markHandled = async (item, status) => {
    try {
      const updated = await updateAppointmentStatusDAO(item.id, status)
      setRequests((current) => current.filter((row) => row.id !== item.id || updated.status === row.status))
      await loadRequests()
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudo actualizar la solicitud: ${error.message}`, variant: 'error' }))
    }
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
                    <td>{getPatientLabel(item)}</td>
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
        <h2 className="admin-card-title">Configuración pendiente</h2>
        <p className="admin-subtitle">
          <FiPhone size={14} style={{ verticalAlign: 'middle', marginRight: '.35rem' }} />
          Esta bandeja se llena automáticamente cuando conectes una cuenta de WhatsApp Business (Twilio o Meta Cloud API)
          al webhook <code>whatsapp-webhook</code> desplegado en Supabase Edge Functions.
        </p>
      </div>
    </div>
  )
}

export default WhatsappRequestsVW
