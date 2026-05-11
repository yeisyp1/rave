import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi'
import {
  connectGoogleCalendarCtrl,
  createGoogleEventCtrl,
  getGoogleTokenCtrl,
} from '../controllers/CalendarCtrl'
import '../styles/AdminViewsVW.css'

const formatInputDate = (date) => date.toISOString().slice(0, 10)

const AgendarCitaVW = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location.state?.patient
  const [googleToken, setGoogleToken] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    patientName: patient ? `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim() : '',
    document: patient?.numero_documento ?? '',
    service: 'Valoracion odontologica',
    date: formatInputDate(new Date()),
    startTime: '09:00',
    endTime: '09:30',
    location: 'Consultorio 1',
    notes: '',
  })

  useEffect(() => {
    getGoogleTokenCtrl().then(setGoogleToken)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!googleToken) {
      setMessage('Conecta Google Calendar antes de guardar la cita.')
      return
    }

    const start = new Date(`${form.date}T${form.startTime}`)
    const end = new Date(`${form.date}T${form.endTime}`)

    if (end <= start) {
      setMessage('La hora final debe ser posterior a la hora inicial.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      await createGoogleEventCtrl(googleToken, {
        title: `${form.patientName} - ${form.service}`,
        description: `${form.notes}${form.document ? `\nDocumento: ${form.document}` : ''}`,
        location: form.location,
        start,
        end,
      })
      setMessage('Cita creada en Google Calendar.')
    } catch (error) {
      console.error(error)
      setMessage('No se pudo crear la cita. Verifica la conexion con Google Calendar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Agendar cita</h1>
        </div>
        <div className="admin-actions">
          {!googleToken && (
            <button className="admin-btn" onClick={connectGoogleCalendarCtrl}>
              <FiCalendar /> Conectar Google
            </button>
          )}
          <button className="admin-btn" onClick={() => navigate('/calendar')}>
            <FiCalendar /> Ver calendario
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{googleToken ? 'Si' : 'No'}</div><div className="admin-stat-label">Google conectado</div></div>
          <span className="admin-icon"><FiCheckCircle /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{form.startTime}</div><div className="admin-stat-label">hora inicial</div></div>
          <span className="admin-icon"><FiClock /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{form.date}</div><div className="admin-stat-label">fecha</div></div>
          <span className="admin-icon"><FiCalendar /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Datos de la cita</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Paciente</label>
            <input className="admin-input" value={form.patientName} onChange={(event) => setForm({ ...form, patientName: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Documento</label>
            <input className="admin-input" value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} />
          </div>
          <div className="admin-field span-2">
            <label>Servicio</label>
            <input className="admin-input" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Fecha</label>
            <input className="admin-input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Inicio</label>
            <input className="admin-input" type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Fin</label>
            <input className="admin-input" type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Ubicacion</label>
            <input className="admin-input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </div>
          <div className="admin-field span-2">
            <label>Notas</label>
            <textarea className="admin-textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiCheckCircle /> {saving ? 'Guardando...' : 'Guardar cita'}
            </button>
          </div>
        </form>
        {message && <p className="admin-message">{message}</p>}
      </div>
    </div>
  )
}

export default AgendarCitaVW
