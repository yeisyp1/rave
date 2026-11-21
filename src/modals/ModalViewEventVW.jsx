import { useId, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiX, FiSave, FiTrash2, FiEdit } from 'react-icons/fi'
import moment from 'moment'
import '../styles/CitaModalVW.css'
import '../styles/ModalViewEventVW.css'
import { showAlertModal } from '../app/store'
import ModalShellVW from '../components/ModalShellVW'
import { confirmAction } from '../utils/confirmDialog'
import { toLocalDateInput, toLocalTimeInput } from '../utils/dates'
import { getPatientFullName, getPatientLabel, findPatientByText } from '../utils/patientLabel'

/* MODAL VER CITA */
const ModalViewEventVW = ({ event, patientOptions = [], doctorOptions = [], onEdit, onDelete, onNoShow, onAttended, onClose, deleting }) => {
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const today = toLocalDateInput(new Date())
  const originalDate = toLocalDateInput(event?.start ?? new Date())
  const uid = useId()
  const fieldId = (name) => `${uid}-${name}`

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
    startTime:   toLocalTimeInput(event?.start ?? new Date()),
    endTime:     toLocalTimeInput(event?.end ?? new Date()),
    date:        toLocalDateInput(event?.start ?? new Date()),
    doctorId:    event?.resource?.doctorId || '',
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
    
    const patientName = getPatientFullName(patient)
    const service = form.service.trim()
    onEdit({
      ...form,
      patientId: patient.id,
      patientName,
      service,
      doctorId: doctor?.id,
      doctorName: doctor ? `${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim() : undefined,
      title: `${patientName} - ${service}`,
      start,
      end,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: 'Eliminar la cita',
      message: `La cita "${event.title}" se eliminará de Google Calendar. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (confirmed) onDelete()
  }

  const handleNoShow = async () => {
    const confirmed = await confirmAction({
      title: 'Marcar como no asistida',
      message: `La cita "${event.title}" quedará registrada como no asistida.`,
      confirmLabel: 'Marcar no asistida',
    })
    if (confirmed) onNoShow()
  }

  const handleAttended = async () => {
    const confirmed = await confirmAction({
      title: 'Marcar como atendida',
      message: `La cita "${event.title}" quedará registrada como atendida.`,
      confirmLabel: 'Marcar atendida',
    })
    if (confirmed) onAttended()
  }

  const canMarkNoShow = onNoShow && !event?.allDay && new Date(event?.start) <= new Date()
  const canMarkAttended = onAttended && !event?.allDay && new Date(event?.start) <= new Date()

  return (
    <ModalShellVW
      overlayClassName="cl-overlay"
      onClose={onClose}
      closeOnBackdrop={!isEditing}
      labelledBy={fieldId('title')}
    >
      <div className="cl-modal">
        <div className="cl-modal-header">
          <div>
            <h2 className="cl-modal-title" id={fieldId('title')}>
              {isEditing ? 'Editar cita' : 'Detalles de la cita'}
            </h2>
          </div>
          <button className="cl-modal-close" onClick={onClose} disabled={isEditing} aria-label="Cerrar">
            <FiX size={16} />
          </button>
        </div>

        <div className="cl-modal-accent" />

        <div className="cl-modal-body">
          {isEditing ? (
            <>
              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('patient')}>Paciente <span className="cl-req">*</span></label>
                <input id={fieldId('patient')} name="patientName" list="edit-patient-list" value={form.patientName} onChange={handlePatientChange} placeholder="Buscar paciente por nombre o documento" className="cl-input" autoFocus/>
                <datalist id="edit-patient-list">
                  {patientOptions.map((patient) => (
                    <option key={patient.id} value={getPatientLabel(patient)} />
                  ))}
                </datalist>
              </div>

              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('service')}>Servicio <span className="cl-req">*</span></label>
                <input id={fieldId('service')} name="service" value={form.service} onChange={handleChange} placeholder="Ej. Limpieza dental, ortodoncia..." className="cl-input"/>
              </div>

              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('doctor')}>Odontólogo {doctorOptions.length > 0 && <span className="cl-req">*</span>}</label>
                <select id={fieldId('doctor')} name="doctorId" value={form.doctorId} onChange={handleChange} className="cl-input">
                  <option value="">Selecciona un odontólogo...</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{`${doctor.nombre ?? ''} ${doctor.apellidos ?? ''}`.trim()}</option>
                  ))}
                </select>
              </div>

              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('notes')}>Notas</label>
                <input id={fieldId('notes')} name="description" value={form.description} onChange={handleChange} placeholder="Observaciones de la cita" className="cl-input"/>
              </div>

              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('location')}>Ubicación</label>
                <input id={fieldId('location')} name="location" value={form.location} onChange={handleChange} placeholder="Ej. Consultorio 1" className="cl-input"/>
              </div>

              <div className="cl-field-row">
                <div className="cl-field">
                  <label className="cl-label" htmlFor={fieldId('start')}>Hora inicio</label>
                  <input id={fieldId('start')} type="time" name="startTime" value={form.startTime} onChange={handleChange} className="cl-input"/>
                </div>
                <div className="cl-field">
                  <label className="cl-label" htmlFor={fieldId('end')}>Hora fin</label>
                  <input id={fieldId('end')} type="time" name="endTime" value={form.endTime} onChange={handleChange} className="cl-input"/>
                </div>
              </div>

              <div className="cl-field">
                <label className="cl-label" htmlFor={fieldId('date')}>Fecha</label>
                <input id={fieldId('date')} type="date" name="date" value={form.date} min={today} onChange={handleChange} className="cl-input" />
              </div>
            </>
          ) : (
            <>
              <div className="cl-view-field">
                <span className="cl-label">Paciente</span>
                <p className="cl-view-value">{event?.resource?.patient || '-'}</p>
              </div>

              <div className="cl-view-field">
                <span className="cl-label">Servicio</span>
                <p className="cl-view-value">{event?.resource?.service || '-'}</p>
              </div>

              <div className="cl-view-field">
                <span className="cl-label">Odontólogo</span>
                <p className="cl-view-value">{event?.resource?.doctorName || '-'}</p>
              </div>

              <div className="cl-view-field">
                <span className="cl-label">Notas</span>
                <p className="cl-view-value">{event?.resource?.description || 'Sin notas'}</p>
              </div>

              <div className="cl-view-field">
                <span className="cl-label">Ubicación</span>
                <p className="cl-view-value">{event?.resource?.location || 'Sin ubicación'}</p>
              </div>

              <div className="cl-view-field-row">
                <div className="cl-view-field">
                  <span className="cl-label">Hora inicio</span>
                  <p className="cl-view-value">{moment(event?.start).format('HH:mm')}</p>
                </div>
                <div className="cl-view-field">
                  <span className="cl-label">Hora fin</span>
                  <p className="cl-view-value">{moment(event?.end).format('HH:mm')}</p>
                </div>
              </div>

              <div className="cl-view-field">
                <span className="cl-label">Fecha</span>
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
              {canMarkAttended && (
                <button className="cl-btn-ghost" onClick={handleAttended}>Marcar atendida</button>
              )}
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
    </ModalShellVW>
  )
}

export default ModalViewEventVW
