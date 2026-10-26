import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiCheck, FiEdit, FiPlus, FiUserCheck, FiUserX, FiUsers, FiX } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import { showAlertModal } from '../app/store'
import {
  ODONTOLOGO_EMPTY_FORM,
  createOdontologoCtrl,
  loadOdontologosCtrl,
  setOdontologoActiveCtrl,
  updateOdontologoCtrl,
} from '../controllers/OdontologosCtrl'
import '../styles/AdminViewsVW.css'

const OdontologosVW = () => {
  const dispatch = useDispatch()
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState(ODONTOLOGO_EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(ODONTOLOGO_EMPTY_FORM)

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const data = await loadOdontologosCtrl()
      setDoctors(data)
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudo cargar el catálogo de odontólogos: ${error.message}`, variant: 'error' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCount = doctors.filter((doc) => doc.activo).length

  const addDoctor = async (event) => {
    event.preventDefault()
    setSaving(true)

    const result = await createOdontologoCtrl(form)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo guardar el odontólogo: ${result.message}`, variant: 'error' }))
    } else {
      setForm(ODONTOLOGO_EMPTY_FORM)
      await loadDoctors()
    }
    setSaving(false)
  }

  const startEdit = (doctor) => {
    setEditingId(doctor.id)
    setEditForm({
      nombre: doctor.nombre ?? '',
      apellidos: doctor.apellidos ?? '',
      documento_identidad: doctor.documento_identidad ?? '',
      especialidad: doctor.especialidad ?? '',
      registro_profesional: doctor.registro_profesional ?? '',
      correo: doctor.correo ?? '',
      telefono: doctor.telefono ?? '',
      observaciones: doctor.observaciones ?? '',
    })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id) => {
    const result = await updateOdontologoCtrl(id, editForm)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar el odontólogo: ${result.message}`, variant: 'error' }))
      return
    }
    setDoctors((current) => current.map((row) => (row.id === id ? result.data : row)))
    setEditingId(null)
  }

  const toggleActive = async (doctor) => {
    const next = !doctor.activo
    const verb = next ? 'activar' : 'desactivar'
    if (!confirm(`¿Deseas ${verb} a ${doctor.nombre} ${doctor.apellidos}?`)) return

    const result = await setOdontologoActiveCtrl(doctor.id, next)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo ${verb} al odontólogo: ${result.message}`, variant: 'error' }))
      return
    }
    setDoctors((current) => current.map((row) => (row.id === doctor.id ? result.data : row)))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Odontólogos</h1>
          <p className="admin-subtitle">Catálogo de profesionales del consultorio, usado en la agenda y los filtros del dashboard.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{doctors.length}</div><div className="admin-stat-label">registrados</div></div>
          <span className="admin-icon"><FiUsers /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{activeCount}</div><div className="admin-stat-label">activos</div></div>
          <span className="admin-icon"><FiUserCheck /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Nuevo odontólogo</h2>
        <form className="admin-form full" onSubmit={addDoctor}>
          <div className="admin-field">
            <label>Nombre</label>
            <input className="admin-input" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Apellidos</label>
            <input className="admin-input" value={form.apellidos} onChange={(event) => setForm({ ...form, apellidos: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Documento de identidad</label>
            <input className="admin-input" value={form.documento_identidad} onChange={(event) => setForm({ ...form, documento_identidad: event.target.value })} />
          </div>
          <div className="admin-field">
            <label>Especialidad</label>
            <input className="admin-input" value={form.especialidad} onChange={(event) => setForm({ ...form, especialidad: event.target.value })} placeholder="Ej. Odontología general" />
          </div>
          <div className="admin-field">
            <label>Registro profesional</label>
            <input className="admin-input" value={form.registro_profesional} onChange={(event) => setForm({ ...form, registro_profesional: event.target.value })} />
          </div>
          <div className="admin-field">
            <label>Correo</label>
            <input className="admin-input" type="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} />
          </div>
          <div className="admin-field">
            <label>Teléfono</label>
            <input className="admin-input" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
          </div>
          <div className="admin-field span-2">
            <label>Observaciones</label>
            <input className="admin-input" value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiPlus /> {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Catálogo</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Nombre</th><th>Especialidad</th><th>Documento</th><th>Contacto</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando odontólogos..." className="loader-inline" /></td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay odontólogos registrados.</td></tr>
              ) : (
                doctors.map((doctor) => {
                  const isEditing = editingId === doctor.id

                  if (isEditing) {
                    return (
                      <tr key={doctor.id}>
                        <td>
                          <input className="admin-input" value={editForm.nombre} onChange={(event) => setEditForm({ ...editForm, nombre: event.target.value })} placeholder="Nombre" />
                          <input className="admin-input" style={{ marginTop: 4 }} value={editForm.apellidos} onChange={(event) => setEditForm({ ...editForm, apellidos: event.target.value })} placeholder="Apellidos" />
                        </td>
                        <td><input className="admin-input" value={editForm.especialidad} onChange={(event) => setEditForm({ ...editForm, especialidad: event.target.value })} /></td>
                        <td><input className="admin-input" value={editForm.documento_identidad} onChange={(event) => setEditForm({ ...editForm, documento_identidad: event.target.value })} /></td>
                        <td>
                          <input className="admin-input" value={editForm.correo} onChange={(event) => setEditForm({ ...editForm, correo: event.target.value })} placeholder="Correo" />
                          <input className="admin-input" style={{ marginTop: 4 }} value={editForm.telefono} onChange={(event) => setEditForm({ ...editForm, telefono: event.target.value })} placeholder="Teléfono" />
                        </td>
                        <td>-</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn primary" type="button" onClick={() => saveEdit(doctor.id)} title="Guardar"><FiCheck /></button>
                            <button className="admin-btn" type="button" onClick={cancelEdit} title="Cancelar"><FiX /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={doctor.id}>
                      <td>{doctor.nombre} {doctor.apellidos}</td>
                      <td>{doctor.especialidad || '-'}</td>
                      <td>{doctor.documento_identidad || '-'}</td>
                      <td>{doctor.correo || doctor.telefono || '-'}</td>
                      <td><span className={`admin-pill ${doctor.activo ? 'good' : 'bad'}`}>{doctor.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn edit" type="button" onClick={() => startEdit(doctor)} title="Editar"><FiEdit /></button>
                          <button
                            className={`admin-btn ${doctor.activo ? 'danger' : ''}`}
                            type="button"
                            onClick={() => toggleActive(doctor)}
                            title={doctor.activo ? 'Desactivar' : 'Activar'}
                          >
                            {doctor.activo ? <FiUserX /> : <FiUserCheck />}
                          </button>
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

export default OdontologosVW
