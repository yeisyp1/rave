import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiCheck, FiEdit, FiMail, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  MESSAGE_TEMPLATE_EMPTY_FORM,
  createMessageTemplateCtrl,
  deleteMessageTemplateCtrl,
  loadMessageTemplatesCtrl,
  toggleMessageTemplateActiveCtrl,
  updateMessageTemplateCtrl,
} from '../controllers/MessageTemplatesCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const MessageTemplatesVW = () => {
  const dispatch = useDispatch()
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState(MESSAGE_TEMPLATE_EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(MESSAGE_TEMPLATE_EMPTY_FORM)

  const loadTemplates = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await loadMessageTemplatesCtrl()
      setTemplates(data)
    } catch (error) {
      setMessage(`No se pudieron cargar las plantillas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const addTemplate = async (event) => {
    event.preventDefault()
    setSaving(true)

    const result = await createMessageTemplateCtrl(form)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo guardar la plantilla: ${result.message}`, variant: 'error' }))
    } else {
      setForm(MESSAGE_TEMPLATE_EMPTY_FORM)
      await loadTemplates()
    }
    setSaving(false)
  }

  const startEdit = (template) => {
    setEditingId(template.id)
    setEditForm({
      name: template.name ?? '',
      channel: template.channel ?? 'Email',
      subject: template.subject ?? '',
      body: template.body ?? '',
      active: template.active,
    })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id) => {
    const result = await updateMessageTemplateCtrl(id, editForm)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar la plantilla: ${result.message}`, variant: 'error' }))
      return
    }
    setTemplates((current) => current.map((row) => (row.id === id ? result.data : row)))
    setEditingId(null)
  }

  const toggleActive = async (template) => {
    const result = await toggleMessageTemplateActiveCtrl(template)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar la plantilla: ${result.message}`, variant: 'error' }))
      return
    }
    setTemplates((current) => current.map((row) => (row.id === template.id ? result.data : row)))
  }

  const removeTemplate = async (template) => {
    if (!confirm(`¿Eliminar la plantilla "${template.name}"?`)) return

    const result = await deleteMessageTemplateCtrl(template.id)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo eliminar la plantilla: ${result.message}`, variant: 'error' }))
      return
    }
    setTemplates((current) => current.filter((row) => row.id !== template.id))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Plantillas de mensajes</h1>
          <p className="admin-subtitle">Textos reutilizables para recordatorios y comunicaciones con pacientes.</p>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Nueva plantilla</h2>
        <form className="admin-form full" onSubmit={addTemplate}>
          <div className="admin-field">
            <label>Nombre</label>
            <input className="admin-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Canal</label>
            <select className="admin-input" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
              <option value="Email">Email</option>
              <option value="SMS">SMS</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Asunto (opcional)</label>
            <input className="admin-input" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          </div>
          <div className="admin-field full">
            <label>Mensaje</label>
            <textarea
              className="admin-input"
              rows={3}
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              placeholder="Ej. Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}."
              required
            />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiPlus /> {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Plantillas registradas</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Nombre</th><th>Canal</th><th>Asunto</th><th>Mensaje</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando plantillas..." className="loader-inline" /></td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay plantillas registradas.</td></tr>
              ) : (
                templates.map((template) => {
                  const isEditing = editingId === template.id

                  if (isEditing) {
                    return (
                      <tr key={template.id}>
                        <td><input className="admin-input" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></td>
                        <td>
                          <select className="admin-input" value={editForm.channel} onChange={(event) => setEditForm({ ...editForm, channel: event.target.value })}>
                            <option value="Email">Email</option>
                            <option value="SMS">SMS</option>
                            <option value="WhatsApp">WhatsApp</option>
                          </select>
                        </td>
                        <td><input className="admin-input" value={editForm.subject} onChange={(event) => setEditForm({ ...editForm, subject: event.target.value })} /></td>
                        <td><textarea className="admin-input" rows={2} value={editForm.body} onChange={(event) => setEditForm({ ...editForm, body: event.target.value })} /></td>
                        <td>-</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn primary" type="button" onClick={() => saveEdit(template.id)} title="Guardar"><FiCheck /></button>
                            <button className="admin-btn" type="button" onClick={cancelEdit} title="Cancelar"><FiX /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.channel}</td>
                      <td>{template.subject || '-'}</td>
                      <td>{template.body}</td>
                      <td>
                        <button className={`admin-pill ${template.active ? 'good' : 'bad'}`} type="button" onClick={() => toggleActive(template)}>
                          {template.active ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn" type="button" onClick={() => startEdit(template)} title="Editar"><FiEdit /></button>
                          <button className="admin-btn danger" type="button" onClick={() => removeTemplate(template)} title="Eliminar"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MessageTemplatesVW
