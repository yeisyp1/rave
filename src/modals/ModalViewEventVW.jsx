import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiX, FiSave, FiTrash2, FiEdit } from 'react-icons/fi'
import moment from 'moment'
import '../styles/ModalViewEventVW.css'
import { showAlertModal } from '../app/store'
import { getPatientFullName, getPatientLabel, findPatientByText } from '../utils/patientLabel'

/* MODAL VER CITA */
const ModalViewEventVW = ({ event, patientOptions = [], onEdit, onDelete, onNoShow, onClose, deleting }) => {
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const today = moment().format('YYYY-MM-DD')
  const originalDate = moment(event?.start).format('YYYY-MM-DD')

  const findPatient = (text) => findPatientByText(patientOptions, text)

  // Citas nuevas traen patientId; las viejas se buscan por el texto del título
  const initialPatient =
    patientOptions.find((p) => String(p.id) === String(event?.resource?.patientId)) ||
    findPatient(event?.resource?.patient)
  const [form, setForm] = useState({
    patientName: initialPatient ? getPatientFullName(initialPatient) : (event?.resource?.patient || ''),
    service:     event?.resource?.service || '',
    description: event?.resource?.description || '',
    location:    event?.resource?.location || '',
    startTime:   moment(event?.start).format('HH:mm'),
    endTime:     moment(event?.end).format('HH:mm'),
    date:        moment(event?.start).format('YYYY-MM-DD'),
  })

  const handlePatientChange = (e) => {
    const value = e.target.value
    const selected = findPatient(value)
    setForm((prev) => ({ ...prev, patientName: selected ? getPatientFullName(selected) : value }))
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = () => {
    if (!form.patientName.trim()) return dispatch(showAlertModal({ message: 'El paciente es obligatorio', variant: 'error' }))
    const patient = findPatient(form.patientName)
    if (!patient) return dispatch(showAlertModal({ message: 'Selecciona un paciente registrado en la base de datos', variant: 'error' }))
    if (form.date < today && form.date !== originalDate) return dispatch(showAlertModal({ message: 'No puedes elegir una fecha anterior a hoy', variant: 'error' }))
    if (!form.service.trim()) return dispatch(showAlertModal({ message: 'El servicio es obligatorio', variant: 'error' }))

    // Build start/end from selected date + times
    const [year, month, day] = form.date.split('-').map(Number)
    const start = new Date(year, month - 1, day)
    const [sh, sm] = form.startTime.split(':')
    start.setHours(Number(sh), Number(sm), 0, 0)

    const end = new Date(year, month - 1, day)
    const [eh, em] = form.endTime.split(':')
    end.setHours(Number(eh), Number(em), 0, 0)

    if (end <= start) return dispatch(showAlertModal({ message: 'La hora de fin debe ser posterior a la de inicio', variant: 'error' }))
    
    const patientName = getPatientFullName(patient)
    const service = form.service.trim()
    onEdit({ ...form, patientId: patient.id, patientName, service, title: `${patientName} - ${service}`, start, end })
    setIsEditing(false)
  }

  const handleDelete = () => {
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar la cita "${event.title}"?`)
    if (confirm) onDelete()
  }

  const handleNoShow = () => {
    if (window.confirm(`¿Marcar la cita "${event.title}" como no asistida?`)) onNoShow()
  }

  const canMarkNoShow = onNoShow && !event?.allDay && new Date(event?.start) <= new Date()

  return (
    <div className="cl-overlay" onClick={(e) => e.target === e.currentTarget && !isEditing && onClose()}>
      <div className="cl-modal">
        <div className="cl-modal-header">
          <div>
            <h2 className="cl-modal-title">
              {isEditing ? 'Editar Cita' : 'Detalles de la Cita'}
            </h2>
          </div>
          <button className="cl-modal-close" onClick={onClose} disabled={isEditing}>
            <FiX size={16} />
          </button>
        </div>

        <div className="cl-modal-accent" />

        <div className="cl-modal-body">
          {isEditing ? (
            <>
              <div className="cl-field">
                <label className="cl-label">Paciente <span className="cl-req">*</span></label>
                <input name="patientName" list="edit-patient-list" value={form.patientName} onChange={handlePatientChange} placeholder="Buscar paciente por nombre o documento" className="cl-input" autoFocus/>
                <datalist id="edit-patient-list">
                  {patientOptions.map((patient) => (
                    <option key={patient.id} value={getPatientLabel(patient)} />
                  ))}
                </datalist>
              </div>

              <div className="cl-field">
                <label className="cl-label">Servicio <span className="cl-req">*</span></label>
                <input name="service" value={form.service} onChange={handleChange} placeholder="Ej. Limpieza dental, ortodoncia..." className="cl-input"/>
              </div>

              <div className="cl-field">
                <label className="cl-label">Notas</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Observaciones de la cita" className="cl-input"/>
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
            </>
          ) : (
            <>
              <div className="cl-view-field">
                <label className="cl-label">Paciente</label>
                <p className="cl-view-value">{event?.resource?.patient || '-'}</p>
              </div>

              <div className="cl-view-field">
                <label className="cl-label">Servicio</label>
                <p className="cl-view-value">{event?.resource?.service || '-'}</p>
              </div>

              <div className="cl-view-field">
                <label className="cl-label">Notas</label>
                <p className="cl-view-value">{event?.resource?.description || 'Sin notas'}</p>
              </div>

              <div className="cl-view-field">
                <label className="cl-label">Ubicación</label>
                <p className="cl-view-value">{event?.resource?.location || 'Sin ubicación'}</p>
              </div>

              <div className="cl-view-field-row">
                <div className="cl-view-field">
                  <label className="cl-label">Hora Inicio</label>
                  <p className="cl-view-value">{moment(event?.start).format('HH:mm')}</p>
                </div>
                <div className="cl-view-field">
                  <label className="cl-label">Hora Fin</label>
                  <p className="cl-view-value">{moment(event?.end).format('HH:mm')}</p>
                </div>
              </div>

              <div className="cl-view-field">
                <label className="cl-label">Fecha</label>
                <p className="cl-view-value">{moment(event?.start).format('dddd, D [de] MMMM [de] YYYY')}</p>
              </div>
            </>
          )}
        </div>

        <div className="cl-modal-nav">
          {isEditing ? (
            <>
              <button className="cl-btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
              <button className="cl-btn-primary" onClick={handleSave}>
                <FiSave size={14} style={{ verticalAlign: 'middle' }} />
                Guardar cambios
              </button>
            </>
          ) : (
            <>
              <button 
                className="cl-btn-danger" 
                onClick={handleDelete} 
                disabled={deleting}
              >
                {deleting ? (
                  <><span className="cl-spinner" /> Eliminando...</>
                ) : (
                  <>
                      <FiTrash2 size={14} style={{ verticalAlign: 'middle' }} />
                      Eliminar
                  </>
                )}
              </button>
              {canMarkNoShow && (
                <button className="cl-btn-ghost" onClick={handleNoShow}>No asistió</button>
              )}
              <button className="cl-btn-ghost" onClick={onClose}>Cerrar</button>
              <button className="cl-btn-primary" onClick={() => setIsEditing(true)}>
                <FiEdit size={14} style={{ verticalAlign: 'middle' }} />
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalViewEventVW
