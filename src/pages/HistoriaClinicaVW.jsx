import { useEffect, useState } from 'react'
import {
  filterHistoriaPatientsCtrl,
  loadHistoriaPatientsCtrl,
} from '../controllers/HistoriaClinicaCtrl'
import { FiSearch, FiUser } from 'react-icons/fi'
import ModalHistoriaClinicaVW from '../modals/ModalHistoriaClinicaVW'
import LoaderVW from '../components/LoaderVW'
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
          <FiSearch className="hc-search-icon" />
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
          <LoaderVW text="Cargando pacientes..." className="loader-inline" />
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
                        <FiUser size={48} />
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
