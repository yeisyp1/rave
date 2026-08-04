import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'
import {
  connectGoogleCalendarCtrl,
  createGoogleEventCtrl,
  getGoogleTokenCtrl,
  listAppointmentPatientsCtrl,
} from '../controllers/CalendarCtrl'
import { getPatientByDocument } from '../dao/SupabaseDAO'
import '../styles/AdminViewsVW.css'

const formatInputDate = (date) => date.toISOString().slice(0, 10)

const AgendarCitaVW = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location.state?.patient
  const [patients, setPatients] = useState([])
  const [googleToken, setGoogleToken] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccessNotice, setShowSuccessNotice] = useState(false)
  const [patientValidationError, setPatientValidationError] = useState(null)
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

  useEffect(() => {
    let mounted = true
    const loadPatients = async () => {
      try {
        const data = await listAppointmentPatientsCtrl()
        if (mounted) setPatients(data ?? [])
      } catch (error) {
        console.error('No se pudieron cargar los pacientes para agendar cita:', error)
        if (mounted) setPatients([])
      }
    }

    loadPatients()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!patient) return
    setForm((current) => ({
      ...current,
      patientName: `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim(),
      document: patient?.numero_documento ?? '',
    }))
  }, [patient])

  useEffect(() => {
    if (!showSuccessNotice) return undefined

    const timer = window.setTimeout(() => {
      setShowSuccessNotice(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [showSuccessNotice])

  const normalizeText = (value) => String(value ?? '').trim().toLowerCase()

  const findPatientMatch = (field, value) => {
    const normalizedValue = normalizeText(value)
    if (!normalizedValue) return null

    return patients.find((item) => {
      const fullName = `${item.nombre ?? ''} ${item.apellidos ?? ''}`.trim()
      if (field === 'document') return normalizeText(item.numero_documento) === normalizedValue
      return normalizeText(fullName) === normalizedValue
    })
  }

  const handlePatientChange = (field, value) => {
    const matchedPatient = findPatientMatch(field, value)
    if (matchedPatient) {
      setForm((current) => ({
        ...current,
        patientName: `${matchedPatient.nombre ?? ''} ${matchedPatient.apellidos ?? ''}`.trim(),
        document: matchedPatient.numero_documento ?? '',
      }))
      return
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

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
      const document = form.document.trim()

      if (!document) {
        setMessage('El documento del paciente es obligatorio.')
        setSaving(false)
        return
      }

      const patientExists = await getPatientByDocument(document)

      if (!patientExists) {
        setPatientValidationError(
          `El paciente con documento ${document} no está registrado en la base de datos. No se puede guardar la cita.`
        )
        setSaving(false)
        return
      }

      await createGoogleEventCtrl(googleToken, {
        title: `${form.patientName} - ${form.service}`,
        description: `${form.notes}${form.document ? `\nDocumento: ${form.document}` : ''}`,
        location: form.location,
        start,
        end,
      })
      setMessage('')
      setShowSuccessNotice(true)
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

      <div className="admin-card">
        <h2 className="admin-card-title">Datos de la cita</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Paciente</label>
            <input
              className="admin-input"
              list="appointment-patient-names"
              value={form.patientName}
              onChange={(event) => handlePatientChange('patientName', event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label>Documento</label>
            <input
              className="admin-input"
              list="appointment-patient-documents"
              value={form.document}
              onChange={(event) => handlePatientChange('document', event.target.value)}
              required
            />
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

      <datalist id="appointment-patient-names">
        {patients.map((item) => {
          const fullName = `${item.nombre ?? ''} ${item.apellidos ?? ''}`.trim()
          return <option key={item.id} value={fullName}>{item.numero_documento}</option>
        })}
      </datalist>

      <datalist id="appointment-patient-documents">
        {patients.map((item) => {
          const fullName = `${item.nombre ?? ''} ${item.apellidos ?? ''}`.trim()
          return <option key={item.id} value={item.numero_documento}>{fullName}</option>
        })}
      </datalist>

      {showSuccessNotice && (
        <div className="admin-toast" role="status" aria-live="polite">
          <div className="admin-toast-bar" />
          <div>
            <div className="admin-toast-text">La cita de {form.patientName} se agendó correctamete.</div>
          </div>
        </div>
      )}
      {patientValidationError && (
        <div
          className="cl-overlay"
          onClick={() => setPatientValidationError(null)}
        >
          <div
            className="cl-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cl-modal-header">
              <div>
                <h2 className="cl-modal-title">
                  Error de validación
                </h2>
              </div>

              <button
                className="cl-modal-close"
                onClick={() => setPatientValidationError(null)}
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="cl-modal-accent" />

            <div className="cl-modal-body">
              <div className="cl-view-field">
                <p className="cl-view-value">
                  {patientValidationError}
                </p>
              </div>
            </div>

            <div className="cl-modal-nav">
              <button
                className="cl-btn-primary"
                onClick={() => setPatientValidationError(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgendarCitaVW
