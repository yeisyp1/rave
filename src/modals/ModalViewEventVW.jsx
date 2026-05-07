import { useState } from 'react'
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
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
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
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
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
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Eliminar
                  </>
                )}
              </button>
              <button className="cl-btn-ghost" onClick={onClose}>Cerrar</button>
              <button className="cl-btn-primary" onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
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
