import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deletePatientCtrl,
  filterPatientsCtrl,
  loadPatientsCtrl,
} from "../controllers/PatientsCtrl";
import { usePatientModal } from "../hooks/usePatientModal";
import ModalPatientsVW from "../modals/ModalPatientsVW";
import ModalViewPatientsVW from "../modals/ModalViewPatientsVW";
import LoaderVW from "../components/LoaderVW";
import "../styles/PatientsVW.css";
import { FiPlus, FiSearch, FiUser, FiFileText, FiBookOpen, FiEdit, FiTrash2 } from 'react-icons/fi'

const PatientsVW = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewPatient, setViewPatient] = useState(null);

  // Usar el custom hook para la lógica del modal
  const patientModal = usePatientModal(() => getPatients());

  /* ── Cargar pacientes ── */
  const getPatients = async () => {
    setLoading(true);
    try {
      const data = await loadPatientsCtrl();
      setPatients(data);
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    }
    setLoading(false);
  };

  useEffect(() => { getPatients(); }, []);

  /* ── Handlers ── */
  const viewHistory = (patient) => {
    setViewPatient(patient);
  };

  const scheduleAppointment = (patient) => {
    navigate('/agendarcita', { state: { patient } });
  };

  const deletePatient = async (id) => {
    if (!confirm("¿Eliminar paciente?")) return;
    const result = await deletePatientCtrl(id);
    if (!result.ok) alert(result.message);
    else getPatients();
  };

  /* ── Filtro de búsqueda ── */
  const filtered = filterPatientsCtrl(patients, search);

  return (
    <div className="pt-page">

      {/* ── HEADER ── */}
      <div className="pt-header"> 
        <div className="pt-header-left">
          <h1 className="pt-title">Pacientes</h1>
        </div>
        <button className="pt-btn-primary" onClick={() => patientModal.openEditModal()}>
          <FiPlus size={16} />
          Nuevo Paciente
        </button>
      </div>

      {/* ── SEARCH + STATS ── */}
      <div className="pt-toolbar">
        <div className="pt-search-wrap">
          <FiSearch className="pt-search-icon" />
          <input
            className="pt-search"
            placeholder="Buscar por nombre, documento o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pt-stat">
          <span className="pt-stat-num">{patients.length}</span>
          <span className="pt-stat-label">Pacientes</span>
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="pt-card">
        {loading ? (
          <LoaderVW text="Cargando pacientes..." className="loader-inline" />
        ) : (
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Paciente</th>
                  <th>Edad</th>
                  <th>Celular</th>
                  <th>EPS</th>
                  <th>Email</th>
                  <th>Opciones</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="pt-empty">
                      <div className="pt-empty-icon">
                        <FiUser size={48} />
                      </div>
                      <p>{search ? "Sin resultados para la búsqueda" : "No hay pacientes registrados"}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="pt-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <td>
                        <span className="pt-doc-badge">{p.tipo_documento}</span>
                        {p.numero_documento}
                      </td>
                      <td>
                        <div className="pt-patient-name">
                          <div className="pt-avatar">
                            {(p.nombre?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <div className="pt-name">{p.nombre} {p.apellidos}</div>
                            <div className="pt-sexo">{p.sexo === "M" ? "Masculino" : p.sexo === "F" ? "Femenino" : p.sexo ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.edad ? `${p.edad} años` : "—"}</td>
                      <td>{p.celular || "—"}</td>
                      <td>{p.eps || "—"}</td>
                      <td>{p.email || "—"}</td>

                      <td className="pt-actions">

                        {/* Historia */}
                        <button
                          className="pt-btn-action"
                          onClick={(e) => { e.stopPropagation(); viewHistory(p); }}
                          title="Ver historia clínica"
                        >
                          <FiFileText size={16} />
                        </button>

                        {/* Agendar Cita */}
                        <button
                          className="pt-btn-action"
                          onClick={(e) => { e.stopPropagation(); scheduleAppointment(p); }}
                          title="Agendar cita"
                        >
                          <FiBookOpen size={16} />
                        </button>

                        {/* Editar */}
                        <button
                          className="pt-btn-action"
                          onClick={(e) => { e.stopPropagation(); patientModal.openEditModal(p); }}
                          title="Editar paciente"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Eliminar */}
                        <button
                          className="pt-btn-action pt-btn-action-danger"
                          onClick={(e) => { e.stopPropagation(); deletePatient(p.id); }}
                          title="Eliminar paciente"
                        >
                          <FiTrash2 size={16} />
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

      {/* ── MODAL ── */}
      <ModalPatientsVW
        showModal={patientModal.showModal}
        closeModal={patientModal.closeModal}
        form={patientModal.form}
        setForm={patientModal.setForm}
        step={patientModal.step}
        setStep={patientModal.setStep}
        handleSubmit={patientModal.handleSubmit}
        canNext={patientModal.canNext}
        isEditing={!!patientModal.editingId}
      />

      {/* ── MODAL HISTORIA CLÍNICA (PORTAL) ── */}
      <ModalViewPatientsVW
        show={!!viewPatient}
        patient={viewPatient}
        onClose={() => setViewPatient(null)}
      />


    </div>
  );
};

export default PatientsVW;
