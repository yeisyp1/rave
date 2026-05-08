import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  createLaboratoryCaseDAO,
  listLaboratoryCasesDAO,
  listPatientsForLaboratoryDAO,
  listProcedureCatalogDAO,
  updateLaboratoryCaseStatusDAO,
} from '../dao/LaboratoryDAO'
import '../styles/AdminViewsVW.css'

const LaboratoryVW = () => {
  const [cases, setCases] = useState([])
  const [form, setForm] = useState({ patient: '', work: '', lab: '', due: '', status: 'Pendiente' })
  const [patients, setPatients] = useState([])
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const getPatientLabel = (patient) => `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim()

  const loadData = async () => {
    setLoading(true)
    setMessage('')

    try {
      const [casesData, patientsData, proceduresData] = await Promise.all([
        listLaboratoryCasesDAO(),
        listPatientsForLaboratoryDAO(),
        listProcedureCatalogDAO(),
      ])

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

  const stats = useMemo(() => ({
    pending: cases.filter((item) => item.status === 'Pendiente').length,
    progress: cases.filter((item) => item.status === 'En proceso').length,
    delivered: cases.filter((item) => item.status === 'Entregado').length,
  }), [cases])

  const addCase = async (event) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    try {
      const selectedPatient = patients.find((patient) => getPatientLabel(patient) === form.patient)
      const selectedProcedure = procedures.find((procedure) => procedure.name === form.work)

      if (!selectedPatient) {
        setMessage('Selecciona un paciente valido de la lista.')
        return
      }

      if (!selectedProcedure) {
        setMessage('Selecciona un procedimiento valido de la lista.')
        return
      }

      await createLaboratoryCaseDAO({
        patient_id: selectedPatient.id,
        procedure_catalog_id: selectedProcedure.id,
        work_name: form.work.trim(),
        lab_name: form.lab.trim() || null,
        due_date: form.due,
        status: form.status,
      })

      setForm({ patient: '', work: '', lab: '', due: '', status: 'Pendiente' })
      await loadData()
    } catch (error) {
      setMessage(`No se pudo guardar laboratorio: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const updated = await updateLaboratoryCaseStatusDAO(id, status)
      setCases((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (error) {
      setMessage(`No se pudo actualizar el estado: ${error.message}`)
    }
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
                <option key={patient.id} value={getPatientLabel(patient)} />
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
                  const patientLabel = item.patient_id ? getPatientLabel(patients.find((patient) => patient.id === item.patient_id) || {}) : '-'
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
