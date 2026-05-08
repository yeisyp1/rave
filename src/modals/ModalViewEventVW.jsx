import { useState } from 'react'
import { FiX, FiSave, FiTrash2, FiEdit } from 'react-icons/fi'
import moment from 'moment'
import '../styles/ModalViewEventVW.css'

/* MODAL VER CITA */
const ModalViewEventVW = ({ event, onEdit, onDelete, onClose, deleting }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    title:       event?.title || '',
    description: event?.resource?.description || '',
    location:    event?.resource?.location || '',
    startTime:   moment(event?.start).format('HH:mm'),
    endTime:     moment(event?.end).format('HH:mm'),
    date:        moment(event?.start).format('YYYY-MM-DD'),
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = () => {
    if (!form.title.trim()) return alert('El título es obligatorio')

    // Build start/end from selected date + times
    const [year, month, day] = form.date.split('-').map(Number)
    const start = new Date(year, month - 1, day)
    const [sh, sm] = form.startTime.split(':')
    start.setHours(Number(sh), Number(sm), 0, 0)

    const end = new Date(year, month - 1, day)
    const [eh, em] = form.endTime.split(':')
    end.setHours(Number(eh), Number(em), 0, 0)

    if (end <= start) return alert('La hora de fin debe ser posterior a la de inicio')
    
    onEdit({ ...form, start, end })
    setIsEditing(false)
  }

  const handleDelete = () => {
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar la cita "${event.title}"?`)
    if (confirm) onDelete()
  }

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
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ej. Juan Pérez - Limpieza" className="cl-input" autoFocus/>
              </div>

              <div className="cl-field">
                <label className="cl-label">Descripción / Servicio</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Ej. Limpieza dental, ortodoncia..." className="cl-input"/>
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
                <input type="date" name="date" value={form.date} onChange={handleChange} className="cl-input" />
              </div>
            </>
          ) : (
            <>
              <div className="cl-view-field">
                <label className="cl-label">Paciente / Evento</label>
                <p className="cl-view-value">{event?.title || '-'}</p>
              </div>

              <div className="cl-view-field">
                <label className="cl-label">Descripción</label>
                <p className="cl-view-value">{event?.resource?.description || 'Sin descripción'}</p>
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
