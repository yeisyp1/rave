import { useEffect, useState } from 'react'
import {
  filterHistoriaPatientsCtrl,
  loadHistoriaPatientsCtrl,
} from '../controllers/HistoriaClinicaCtrl'
import ModalHistoriaClinicaVW from '../modals/ModalHistoriaClinicaVW'
import '../styles/HistoriaClinicaVW.css'

const HistoriaClinicaVW = () => {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const getPatients = async () => {
    setLoading(true)
    try {
      const data = await loadHistoriaPatientsCtrl()
      setPatients(data)
    } catch (error) {
      console.error('Error cargando pacientes:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    getPatients()
  }, [])

  const filtered = filterHistoriaPatientsCtrl(patients, search)

  const handleViewHistories = (patient) => {
    setSelectedPatient(patient)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPatient(null)
  }

  return (
    <div className="hc-page">
      <div className="hc-header">
        <div className="hc-header-left">
          <h1 className="hc-title">Historias Clinicas</h1>
        </div>
      </div>

      <div className="hc-toolbar">
        <div className="hc-search-wrap">
          <svg className="hc-search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            className="hc-search"
            placeholder="Buscar paciente por nombre o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="hc-stat">
          <span className="hc-stat-num">{filtered.length}</span>
          <span className="hc-stat-label">pacientes</span>
        </div>
      </div>

      <div className="hc-card">
        {loading ? (
          <div className="hc-loading">
            <div className="hc-spinner" />
            <span>Cargando pacientes...</span>
          </div>
        ) : (
          <div className="hc-table-wrap">
            <table className="hc-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Tipo Documento</th>
                  <th>Numero Documento</th>
                  <th>Edad</th>
                  <th>Telefono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="hc-empty">
                      <div className="hc-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </div>
                      <p>{search ? 'Sin resultados para la busqueda' : 'No hay pacientes registrados'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((patient) => (
                    <tr key={patient.id} className="hc-row">
                      <td>
                        <div className="hc-patient-cell">
                          <div className="hc-avatar">{(patient.nombre?.[0] ?? '?').toUpperCase()}</div>
                          <div className="hc-patient-info">
                            <div className="hc-name">{patient.nombre} {patient.apellidos}</div>
                          </div>
                        </div>
                      </td>
                      <td>{patient.tipo_documento || '—'}</td>
                      <td>{patient.numero_documento || '—'}</td>
                      <td>{patient.edad ? `${patient.edad} anos` : '—'}</td>
                      <td>{patient.celular || '—'}</td>
                      <td className="hc-actions">
                        <button
                          className="hc-btn-action"
                          onClick={() => handleViewHistories(patient)}
                          title="Ver historias clinicas"
                        >
                          Listar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalHistoriaClinicaVW
          patient={selectedPatient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default HistoriaClinicaVW
