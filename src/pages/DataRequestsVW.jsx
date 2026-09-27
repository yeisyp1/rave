import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiCheckCircle, FiClock, FiShield } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  DATA_REQUEST_STATUS_OPTIONS,
  computeDataRequestStatsCtrl,
  getDataRequestPatientLabel,
  loadDataRequestsCtrl,
  updateDataRequestStatusCtrl,
} from '../controllers/DataRequestsCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const DataRequestsVW = () => {
  const dispatch = useDispatch()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await loadDataRequestsCtrl()
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

  const stats = useMemo(() => computeDataRequestStatsCtrl(requests), [requests])

  const changeStatus = async (id, status) => {
    const result = await updateDataRequestStatusCtrl(id, status)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar la solicitud: ${result.message}`, variant: 'error' }))
      return
    }
    setRequests((current) => current.map((item) => (item.id === id ? { ...item, ...result.data } : item)))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Solicitudes de datos personales</h1>
          <p className="admin-subtitle">Gestión de solicitudes de rectificación, actualización y supresión (Ley 1581 de 2012).</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.pending}</div><div className="admin-stat-label">activas</div></div>
          <span className="admin-icon"><FiClock /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.resolved}</div><div className="admin-stat-label">resueltas</div></div>
          <span className="admin-icon"><FiCheckCircle /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{requests.length}</div><div className="admin-stat-label">total</div></div>
          <span className="admin-icon"><FiShield /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Solicitudes registradas</h2>
        <p className="admin-subtitle" style={{ marginTop: '-.5rem' }}>
          Las solicitudes se registran desde la ficha de cada paciente, en la pestaña "Consentimiento y datos".
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Descripción</th><th>Estado</th><th>Actualizar</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando solicitudes..." className="loader-inline" /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay solicitudes registradas.</td></tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleDateString('es-CO')}</td>
                    <td>{getDataRequestPatientLabel(item)}</td>
                    <td>{item.request_type}</td>
                    <td>{item.description}</td>
                    <td><span className={`admin-pill ${item.status === 'Resuelta' ? 'good' : item.status === 'Rechazada' ? 'bad' : 'warn'}`}>{item.status}</span></td>
                    <td>
                      <div className="admin-actions">
                        <select
                          className="admin-input"
                          value={item.status}
                          onChange={(event) => changeStatus(item.id, event.target.value)}
                        >
                          {DATA_REQUEST_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
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
    </div>
  )
}

export default DataRequestsVW
