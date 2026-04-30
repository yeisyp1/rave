import { useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi'
import '../styles/AdminViewsVW.css'

const initialCases = [
  { id: 1, patient: 'Juan Perez', work: 'Corona zirconio', lab: 'Dental Lab Norte', due: '2026-05-02', status: 'En proceso' },
  { id: 2, patient: 'Maria Gomez', work: 'Retenedor superior', lab: 'OrthoLab', due: '2026-05-04', status: 'Pendiente' },
  { id: 3, patient: 'Laura Diaz', work: 'Protesis parcial', lab: 'RAVE Lab', due: '2026-05-08', status: 'Entregado' },
]

const LaboratoryVW = () => {
  const [cases, setCases] = useState(initialCases)
  const [form, setForm] = useState({ patient: '', work: '', lab: '', due: '', status: 'Pendiente' })

  const stats = useMemo(() => ({
    pending: cases.filter((item) => item.status === 'Pendiente').length,
    progress: cases.filter((item) => item.status === 'En proceso').length,
    delivered: cases.filter((item) => item.status === 'Entregado').length,
  }), [cases])

  const addCase = (event) => {
    event.preventDefault()
    setCases((current) => [{ id: Date.now(), ...form }, ...current])
    setForm({ patient: '', work: '', lab: '', due: '', status: 'Pendiente' })
  }

  const updateStatus = (id, status) => {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status } : item))
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
            <input className="admin-input" value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Trabajo</label>
            <input className="admin-input" value={form.work} onChange={(event) => setForm({ ...form, work: event.target.value })} required />
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
            <button className="admin-btn primary" type="submit"><FiPlus /> Agregar</button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Trabajos activos</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Paciente</th><th>Trabajo</th><th>Laboratorio</th><th>Entrega</th><th>Estado</th><th>Actualizar</th></tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id}>
                  <td>{item.patient}</td>
                  <td>{item.work}</td>
                  <td>{item.lab}</td>
                  <td>{item.due}</td>
                  <td><span className={`admin-pill ${item.status === 'Entregado' ? 'good' : item.status === 'En proceso' ? 'warn' : ''}`}>{item.status}</span></td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn" onClick={() => updateStatus(item.id, 'En proceso')}>Proceso</button>
                      <button className="admin-btn" onClick={() => updateStatus(item.id, 'Entregado')}>Entregado</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LaboratoryVW
