import { useEffect, useState } from 'react'
import AdminMessageVW from '../components/AdminMessageVW'
import { FiSave } from 'react-icons/fi'
import { loadSystemSettingsCtrl, saveSystemSettingsCtrl } from '../controllers/SettingsCtrl'
import LoaderVW from '../components/LoaderVW'
import '../styles/AdminViewsVW.css'

const SettingsVW = () => {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadSettings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { settings: data, form: initialForm } = await loadSystemSettingsCtrl()
      setSettings(data)
      setForm(initialForm)
    } catch (error) {
      setMessage({ text: `No se pudo cargar la configuración: ${error.message}`, tone: 'error' })
    }
    setLoading(false)
  }

  useEffect(() => {
    // Carga inicial de la configuración al montar la vista.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await saveSystemSettingsCtrl(settings.id, form)
    if (!result.ok) {
      setMessage({ text: `No se pudo guardar la configuración: ${result.message}`, tone: 'error' })
    } else {
      setSettings(result.data)
      setMessage({ text: 'Configuración guardada.', tone: 'ok' })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="admin-page">
        <LoaderVW text="Cargando configuración..." className="loader-inline" />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Configuración</h1>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Parámetros del consultorio</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="settings-duracion-estandar-de-cita-minutos">Duración estándar de cita (minutos)</label>
            <input id="settings-duracion-estandar-de-cita-minutos"
              className="admin-input"
              type="number"
              min="1"
              value={form.appointment_duration_minutes}
              onChange={(event) => setForm({ ...form, appointment_duration_minutes: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="settings-hora-de-apertura">Hora de apertura</label>
            <input id="settings-hora-de-apertura"
              className="admin-input"
              type="time"
              value={form.business_hours_start}
              onChange={(event) => setForm({ ...form, business_hours_start: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="settings-hora-de-cierre">Hora de cierre</label>
            <input id="settings-hora-de-cierre"
              className="admin-input"
              type="time"
              value={form.business_hours_end}
              onChange={(event) => setForm({ ...form, business_hours_end: event.target.value })}
              required
            />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiSave /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
        <AdminMessageVW text={message?.text} tone={message?.tone} />
      </div>
    </div>
  )
}

export default SettingsVW
