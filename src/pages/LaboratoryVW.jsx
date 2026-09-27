import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiCheckCircle, FiClock, FiEdit, FiPlus, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  LABORATORY_EMPTY_FORM,
  computeLaboratoryStatsCtrl,
  createLaboratoryCaseCtrl,
  deleteLaboratoryCaseCtrl,
  getLaboratoryPatientLabel,
  loadLaboratoryDataCtrl,
  updateLaboratoryCaseCtrl,
  updateLaboratoryCaseStatusCtrl,
} from '../controllers/LaboratoryCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const LaboratoryVW = () => {
  const dispatch = useDispatch()
  const [cases, setCases] = useState([])
  const [form, setForm] = useState(LABORATORY_EMPTY_FORM)
  const [patients, setPatients] = useState([])
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ work_name: '', lab_name: '', due_date: '' })

  const loadData = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { cases: casesData, patients: patientsData, procedures: proceduresData } = await loadLaboratoryDataCtrl()
      setCases(casesData)
      setPatients(patientsData)
      setProcedures(proceduresData)
    } catch (error) {
      setMessage(`No se pudo cargar laboratorio: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => computeLaboratoryStatsCtrl(cases), [cases])

  const addCase = async (event) => {
    event.preventDefault()

    setSaving(true)

    const result = await createLaboratoryCaseCtrl({ form, patients, procedures })
    if (!result.ok) {
      dispatch(showAlertModal({ message: result.message, variant: 'error' }))
    } else {
      setForm(LABORATORY_EMPTY_FORM)
      await loadData()
    }
    setSaving(false)
  }

  const updateStatus = async (id, status) => {
    const result = await updateLaboratoryCaseStatusCtrl(id, status)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar el estado: ${result.message}`, variant: 'error' }))
      return
    }
    setCases((current) => current.map((item) => (item.id === id ? result.data : item)))
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      work_name: item.work_name ?? '',
      lab_name: item.lab_name ?? '',
      due_date: item.due_date ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id) => {
    const result = await updateLaboratoryCaseCtrl(id, editForm)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar el trabajo: ${result.message}`, variant: 'error' }))
      return
    }
    setCases((current) => current.map((item) => (item.id === id ? result.data : item)))
    setEditingId(null)
  }

  const removeCase = async (item) => {
    if (!confirm(`¿Eliminar el trabajo "${item.work_name}"?`)) return

    const result = await deleteLaboratoryCaseCtrl(item.id)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo eliminar el trabajo: ${result.message}`, variant: 'error' }))
      return
    }
    setCases((current) => current.filter((row) => row.id !== item.id))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Laboratorio</h1>
          <p className="admin-subtitle">Seguimiento de trabajos enviados a laboratorio dental.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.pending}</div><div className="admin-stat-label">pendientes</div></div>
          <span className="admin-icon"><FiClock /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.progress}</div><div className="admin-stat-label">en proceso</div></div>
          <span className="admin-icon"><FiClock /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{stats.delivered}</div><div className="admin-stat-label">entregados</div></div>
          <span className="admin-icon"><FiCheckCircle /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Nuevo trabajo</h2>
        <form className="admin-form full" onSubmit={addCase}>
          <div className="admin-field">
            <label>Paciente</label>
            <input className="admin-input" list="lab-patient-list" value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} required />
            <datalist id="lab-patient-list">
              {patients.map((patient) => (
                <option key={patient.id} value={getLaboratoryPatientLabel(patient)} />
              ))}
            </datalist>
          </div>
          <div className="admin-field">
            <label>Trabajo</label>
            <input className="admin-input" list="lab-procedure-list" value={form.work} onChange={(event) => setForm({ ...form, work: event.target.value })} required />
            <datalist id="lab-procedure-list">
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.name} />
              ))}
            </datalist>
          </div>
          <div className="admin-field">
            <label>Laboratorio</label>
            <input className="admin-input" value={form.lab} onChange={(event) => setForm({ ...form, lab: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Entrega</label>
            <input className="admin-input" type="date" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} required />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}><FiPlus /> {saving ? 'Guardando...' : 'Agregar'}</button>
          </div>
        </form>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Trabajos activos</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Paciente</th><th>Trabajo</th><th>Laboratorio</th><th>Entrega</th><th>Estado</th><th>Actualizar</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando laboratorio..." className="loader-inline" /></td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay trabajos registrados.</td></tr>
              ) : (
                cases.map((item) => {
                  const patientLabel = item.patient_id ? getLaboratoryPatientLabel(patients.find((patient) => patient.id === item.patient_id) || {}) : '-'
                  const isEditing = editingId === item.id

                  if (isEditing) {
                    return (
                      <tr key={item.id}>
                        <td>{patientLabel || '-'}</td>
                        <td><input className="admin-input" value={editForm.work_name} onChange={(event) => setEditForm({ ...editForm, work_name: event.target.value })} /></td>
                        <td><input className="admin-input" value={editForm.lab_name} onChange={(event) => setEditForm({ ...editForm, lab_name: event.target.value })} /></td>
                        <td><input className="admin-input" type="date" value={editForm.due_date || ''} onChange={(event) => setEditForm({ ...editForm, due_date: event.target.value })} /></td>
                        <td>-</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn primary" type="button" onClick={() => saveEdit(item.id)} title="Guardar"><FiCheck /></button>
                            <button className="admin-btn" type="button" onClick={cancelEdit} title="Cancelar"><FiX /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={item.id}>
                      <td>{patientLabel || '-'}</td>
                      <td>{item.work_name}</td>
                      <td>{item.lab_name || '-'}</td>
                      <td>{item.due_date || '-'}</td>
                      <td><span className={`admin-pill ${item.status === 'Entregado' ? 'good' : item.status === 'En proceso' ? 'warn' : ''}`}>{item.status}</span></td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn" type="button" onClick={() => updateStatus(item.id, 'En proceso')}>Proceso</button>
                          <button className="admin-btn" type="button" onClick={() => updateStatus(item.id, 'Entregado')}>Entregado</button>
                          <button className="admin-btn" type="button" onClick={() => startEdit(item)} title="Editar"><FiEdit /></button>
                          <button className="admin-btn danger" type="button" onClick={() => removeCase(item)} title="Eliminar"><FiTrash2 /></button>
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

export default LaboratoryVW
