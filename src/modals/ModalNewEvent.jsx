import { useState } from 'react'
import moment from 'moment'

/* MODAL NUEVA CITA */
const NewEventModal = ({ slot, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    location:    '',
    startTime:   moment(slot?.start).format('HH:mm'),
    endTime:     moment(slot?.end).format('HH:mm'),
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = () => {
    if (!form.title.trim()) return alert('El título es obligatorio')

    const start = new Date(slot.start)
    const [sh, sm] = form.startTime.split(':')
    start.setHours(Number(sh), Number(sm), 0, 0)

    const end = new Date(slot.start)
    const [eh, em] = form.endTime.split(':')
    end.setHours(Number(eh), Number(em), 0, 0)

    if (end <= start) return alert('La hora de fin debe ser posterior a la de inicio')
    onSave({ ...form, start, end })
  }

  return (
    <div className="cl-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cl-modal">
        <div className="cl-modal-header">
          <div>
            <h2 className="cl-modal-title">Nueva Cita</h2>
          </div>
          <button className="cl-modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <div className="cl-modal-accent" />

        <div className="cl-modal-body">
          <div className="cl-field">
            <label className="cl-label">Título / Paciente <span className="cl-req">*</span></label>
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
            <div className="cl-date-display">
              {moment(slot?.start).format('dddd, D [de] MMMM [de] YYYY')}
            </div>
          </div>
        </div>

        <div className="cl-modal-nav">
          <button className="cl-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="cl-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><span className="cl-spinner" /> Guardando...</>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
                Guardar en Google Calendar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEventModal
