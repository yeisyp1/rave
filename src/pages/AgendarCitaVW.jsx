import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiClock, FiX } from 'react-icons/fi'
import {
  connectGoogleCalendarCtrl,
  createGoogleEventCtrl,
  getGoogleTokenCtrl,
  listAppointmentDoctorsCtrl,
  listAppointmentPatientsCtrl,
  ScheduleConflictError,
} from '../controllers/CalendarCtrl'
import { getPatientByDocumentCtrl } from '../controllers/PatientsCtrl'
import ModalShellVW from '../components/ModalShellVW'
import { toLocalDateInput } from '../utils/dates'
import '../styles/AdminViewsVW.css'
import '../styles/CitaModalVW.css'

const formatInputDate = (date) => toLocalDateInput(date)

const AgendarCitaVW = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location.state?.patient
  const [patients, setPatients] = useState([])
  const [doctorOptions, setDoctorOptions] = useState([])
  const [googleToken, setGoogleToken] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccessNotice, setShowSuccessNotice] = useState(false)
  const [patientValidationError, setPatientValidationError] = useState(null)
  const [form, setForm] = useState({
    patientName: patient ? `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim() : '',
    document: patient?.numero_documento ?? '',
    service: 'Valoración odontológica',
    doctorId: '',
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
    let mounted = true
    listAppointmentDoctorsCtrl()
      .then((data) => { if (mounted) setDoctorOptions(data ?? []) })
      .catch((error) => {
        console.error('No se pudieron cargar los odontólogos para agendar cita:', error)
        if (mounted) setDoctorOptions([])
      })
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

    if (doctorOptions.length > 0 && !form.doctorId) {
      setMessage('Selecciona el odontólogo que atiende la cita.')
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

      const patientExists = await getPatientByDocumentCtrl(document)

      if (!patientExists) {
        setPatientValidationError(
          `El paciente con documento ${document} no está registrado en la base de datos. No se puede guardar la cita.`
        )
        setSaving(false)
        return
      }

      const doctor = doctorOptions.find((item) => String(item.id) === String(form.doctorId))

      await createGoogleEventCtrl(googleToken, {
        title: `${form.patientName} - ${form.service}`,
        description: form.notes.trim(),
        location: form.location,
        start,
        end,
        patientId: patientExists.id,
        service: form.service,
        patientName: form.patientName,
        doctorId: doctor?.id,
        doctorName: doctor ? `${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim() : undefined,
      })
      setMessage('')
      setShowSuccessNotice(true)
    } catch (error) {
      console.error(error)
      if (error instanceof ScheduleConflictError) {
        setMessage('El horario seleccionado ya está ocupado por otra cita. Elige otro horario.')
        return
      }
      setMessage('No se pudo crear la cita. Verifica la conexión con Google Calendar.')
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
            <label htmlFor="cita-paciente">Paciente</label>
            <input
              id="cita-paciente"
              className="admin-input"
              list="appointment-patient-names"
              value={form.patientName}
              onChange={(event) => handlePatientChange('patientName', event.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="cita-documento">Documento</label>
            <input
              id="cita-documento"
              className="admin-input"
              list="appointment-patient-documents"
              value={form.document}
              onChange={(event) => handlePatientChange('document', event.target.value)}
              required
            />
          </div>
          <div className="admin-field span-2">
            <label htmlFor="cita-servicio">Servicio</label>
            <input id="cita-servicio" className="admin-input" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} required />
          </div>
          <div className="admin-field span-2">
            <label htmlFor="cita-odontologo">Odontólogo {doctorOptions.length > 0 && <span className="admin-req">*</span>}</label>
            <select id="cita-odontologo" className="admin-input" value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })}>
              <option value="">Selecciona un odontólogo...</option>
              {doctorOptions.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{`${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim()}</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="cita-fecha">Fecha</label>
            <input id="cita-fecha" className="admin-input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label htmlFor="cita-inicio">Inicio</label>
            <input id="cita-inicio" className="admin-input" type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label htmlFor="cita-fin">Fin</label>
            <input id="cita-fin" className="admin-input" type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label htmlFor="cita-ubicacion">Ubicación</label>
            <input id="cita-ubicacion" className="admin-input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </div>
          <div className="admin-field span-2">
            <label htmlFor="cita-notas">Notas</label>
            <textarea id="cita-notas" className="admin-textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiCheckCircle /> {saving ? 'Guardando...' : 'Guardar cita'}
            </button>
          </div>
        </form>
        <div aria-live="polite">
          {message && <p className="admin-message admin-message-error">{message}</p>}
        </div>
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
            <div className="admin-toast-text">La cita de {form.patientName} se agendó correctamente.</div>
          </div>
        </div>
      )}
      {patientValidationError && (
        <ModalShellVW
          overlayClassName="cl-overlay"
          onClose={() => setPatientValidationError(null)}
          labelledBy="cita-validacion-titulo"
        >
          <div className="cl-modal">
            <div className="cl-modal-header">
              <div>
                <h2 className="cl-modal-title" id="cita-validacion-titulo">Error de validación</h2>
              </div>
              <button
                className="cl-modal-close"
                onClick={() => setPatientValidationError(null)}
                aria-label="Cerrar"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="cl-modal-accent" />

            <div className="cl-modal-body">
              <div className="cl-view-field">
                <p className="cl-view-value">{patientValidationError}</p>
              </div>
            </div>

            <div className="cl-modal-nav">
              <button className="cl-btn-primary" onClick={() => setPatientValidationError(null)}>
                Entendido
              </button>
            </div>
          </div>
        </ModalShellVW>
      )}
    </div>
  )
}

export default AgendarCitaVW
