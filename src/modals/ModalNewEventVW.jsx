import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiX } from 'react-icons/fi'
import moment from 'moment'
import { showAlertModal } from '../app/store'
import { getPatientFullName, getPatientLabel, findPatientByText } from '../utils/patientLabel'

/* MODAL NUEVA CITA */
const NewEventModal = ({
  slot,
  onSave,
  onClose,
  saving,
  patientOptions = [],
  serviceOptions = [],
  doctorOptions = [],
}) => {
  const dispatch = useDispatch()
  const today = moment().format('YYYY-MM-DD')

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: moment(slot?.start).format('HH:mm'),
    endTime: moment(slot?.end).format('HH:mm'),
    date: moment(slot?.start).format('YYYY-MM-DD'),
    serviceType: '',
    doctorId: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handlePatientChange = (e) => {
    const value = e.target.value
    // Al elegir de la lista se guarda solo el nombre; el documento queda enlazado por patientId
    const selectedPatient = findPatientByText(patientOptions, value)

    setForm((prev) => ({
      ...prev,
      title: selectedPatient ? getPatientFullName(selectedPatient) : value,
    }))
  }

  const handleServiceTypeChange = (e) => {
    const serviceType = e.target.value
    setForm((prev) => ({
      ...prev,
      serviceType,
    }))
  }

  const handleSave = () => {
    if (!form.title.trim()) return dispatch(showAlertModal({ message: 'El paciente es obligatorio', variant: 'error' }))
    const patient = findPatientByText(patientOptions, form.title)
    if (!patient) return dispatch(showAlertModal({ message: 'Selecciona un paciente registrado en la base de datos', variant: 'error' }))
    if (form.date < today) return dispatch(showAlertModal({ message: 'No puedes elegir una fecha anterior a hoy', variant: 'error' }))
    if (!form.serviceType.trim()) return dispatch(showAlertModal({ message: 'El tipo de servicio es obligatorio', variant: 'error' }))
    if (doctorOptions.length > 0 && !form.doctorId) return dispatch(showAlertModal({ message: 'Selecciona el odontólogo que atiende la cita', variant: 'error' }))
    const doctor = doctorOptions.find((item) => String(item.id) === String(form.doctorId))

    // Build start/end from selected date + times
    const [year, month, day] = form.date.split('-').map(Number)
    const start = new Date(year, month - 1, day)
    const [sh, sm] = form.startTime.split(':')
    start.setHours(Number(sh), Number(sm), 0, 0)

    const end = new Date(year, month - 1, day)
    const [eh, em] = form.endTime.split(':')
    end.setHours(Number(eh), Number(em), 0, 0)

    if (end <= start) return dispatch(showAlertModal({ message: 'La hora de fin debe ser posterior a la de inicio', variant: 'error' }))

    onSave({
      ...form,
      title: `${getPatientFullName(patient)} - ${form.serviceType}`,
      description: form.description,
      patientName: getPatientFullName(patient),
      patientId: patient.id,
      doctorId: doctor?.id,
      doctorName: doctor ? `${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim() : undefined,
      start,
      end,
    })
  }

  return (
    <div className="cl-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cl-modal">
        <div className="cl-modal-header">
          <div>
            <h2 className="cl-modal-title">Nueva Cita</h2>
          </div>
          <button className="cl-modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        <div className="cl-modal-accent" />

        <div className="cl-modal-body">
          <div className="cl-field">
            <label className="cl-label">Paciente <span className="cl-req">*</span></label>
            <input
              name="title"
              list="patient-list"
              value={form.title}
              onChange={handlePatientChange}
              placeholder="Buscar paciente por nombre o documento"
              className="cl-input"
              autoFocus
            />
            <datalist id="patient-list">
              {patientOptions.map((patient) => (
                <option key={patient.id} value={getPatientLabel(patient)} />
              ))}
            </datalist>
          </div>

          <div className="cl-field">
            <label className="cl-label">Tipo de servicio <span className="cl-req">*</span></label>
            <input
              name="serviceType"
              list="service-type-list"
              value={form.serviceType}
              onChange={handleServiceTypeChange}
              placeholder="Buscar tipo de servicio"
              className="cl-input"
            />
            <datalist id="service-type-list">
              {serviceOptions.map((service) => (
                <option key={service} value={service} />
              ))}
            </datalist>
          </div>

          <div className="cl-field">
            <label className="cl-label">Odontólogo {doctorOptions.length > 0 && <span className="cl-req">*</span>}</label>
            <select name="doctorId" value={form.doctorId} onChange={handleChange} className="cl-input">
              <option value="">Selecciona un odontólogo...</option>
              {doctorOptions.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{`${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim()}</option>
              ))}
            </select>
          </div>

          <div className="cl-field">
            <label className="cl-label">Ubicación</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Ej. Consultorio 1" className="cl-input"/>
          </div>

          <div className="cl-field-row">
            <div className="cl-field">
              <label className="cl-label">Hora inicio</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="cl-input"/>
            </div>
            <div className="cl-field">
              <label className="cl-label">Hora fin</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="cl-input"/>
            </div>
          </div>

          <div className="cl-field">
            <label className="cl-label">Fecha</label>
            <input type="date" name="date" value={form.date} min={today} onChange={handleChange} className="cl-input" />
          </div>
        </div>

        <div className="cl-modal-nav">
          <button className="cl-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="cl-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><span className="cl-spinner" /> Guardando...</>
            ) : (
              <>
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEventModal
