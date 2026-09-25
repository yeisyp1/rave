import { useEffect, useState } from 'react'
import { FiSave } from 'react-icons/fi'
import { getSystemSettingsDAO, updateSystemSettingsDAO } from '../dao/SettingsDAO'
import LoaderVW from '../components/LoaderVW'
import '../styles/AdminViewsVW.css'

const SettingsVW = () => {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadSettings = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await getSystemSettingsDAO()
      setSettings(data)
      setForm({
        appointment_duration_minutes: data.appointment_duration_minutes,
        business_hours_start: data.business_hours_start?.slice(0, 5) ?? '',
        business_hours_end: data.business_hours_end?.slice(0, 5) ?? '',
      })
    } catch (error) {
      setMessage(`No se pudo cargar la configuración: ${error.message}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const updated = await updateSystemSettingsDAO(settings.id, {
        appointment_duration_minutes: Number(form.appointment_duration_minutes),
        business_hours_start: form.business_hours_start,
        business_hours_end: form.business_hours_end,
      })
      setSettings(updated)
      setMessage('Configuración guardada.')
    } catch (error) {
      setMessage(`No se pudo guardar la configuración: ${error.message}`)
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
            <label>Duración estándar de cita (minutos)</label>
            <input
              className="admin-input"
              type="number"
              min="1"
              value={form.appointment_duration_minutes}
              onChange={(event) => setForm({ ...form, appointment_duration_minutes: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label>Hora de apertura</label>
            <input
              className="admin-input"
              type="time"
              value={form.business_hours_start}
              onChange={(event) => setForm({ ...form, business_hours_start: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label>Hora de cierre</label>
            <input
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
        {message && <p className="admin-message">{message}</p>}
      </div>
    </div>
  )
}

export default SettingsVW
