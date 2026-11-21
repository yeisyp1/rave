import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  deletePatientCtrl,
  filterPatientsCtrl,
  loadPatientsCtrl,
  reactivatePatientCtrl,
} from "../controllers/PatientsCtrl";
import { usePatientModal } from "../hooks/usePatientModal";
import { confirmAction } from "../utils/confirmDialog";
import ModalPatientsVW from "../modals/ModalPatientsVW";
import LoaderVW from "../components/LoaderVW";
import "../styles/PatientsVW.css";
import { FiPlus, FiSearch, FiUser, FiFileText, FiBookOpen, FiEdit, FiTrash2, FiRotateCcw } from 'react-icons/fi'
import { showAlertModal } from "../app/store";

const SEXO_LABELS = { M: "Masculino", F: "Femenino", O: "Otro" };

const PatientsVW = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("buscar") ?? "");
  const [statusFilter, setStatusFilter] = useState("activos");

  const patientModal = usePatientModal(() => getPatients());

  const getPatients = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await loadPatientsCtrl(statusFilter);
      setPatients(data);
    } catch (error) {
      console.error("Error cargando pacientes:", error);
      setPatients([]);
      setLoadError(error.message || "No se pudo cargar la lista de pacientes.");
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { getPatients(); }, [statusFilter]);

  useEffect(() => {
    const term = searchParams.get("buscar") ?? "";
    setSearch(term);
  }, [searchParams]);

  const updateSearch = (value) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("buscar", value);
    else next.delete("buscar");
    setSearchParams(next, { replace: true });
  };

  /* ── Handlers ── */
  // Lleva a la pestaña "Historial médico" del detalle del paciente (antes abría
  // un resumen que no era la historia clínica real).
  const viewHistory = (patient) => {
    navigate(`/pacientes/${patient.id}`, { state: { tab: 'history' } });
  };

  const scheduleAppointment = (patient) => {
    navigate('/agendarcita', { state: { patient } });
  };

  const deletePatient = async (id) => {
    const confirmed = await confirmAction({
      title: "Inactivar el paciente",
      message: "El paciente dejará de aparecer en la lista de activos. Sus datos se conservan y puedes reactivarlo cuando quieras.",
      confirmLabel: "Inactivar",
    });
    if (!confirmed) return;
    const result = await deletePatientCtrl(id);
    if (!result.ok) dispatch(showAlertModal({ message: result.message, variant: "error" }));
    else {
      dispatch(showAlertModal({ message: result.message, variant: "success" }));
      getPatients();
    }
  };

  const reactivatePatient = async (id) => {
    const result = await reactivatePatientCtrl(id);
    dispatch(showAlertModal({ message: result.message, variant: result.ok ? "success" : "error" }));
    if (result.ok) getPatients();
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
          Nuevo paciente
        </button>
      </div>

      {/* ── SEARCH + STATS ── */}
      <div className="pt-toolbar">
        <div className="pt-search-wrap">
          <FiSearch className="pt-search-icon" />
          <input
            className="pt-search"
            placeholder="Buscar por nombre, documento o correo..."
            aria-label="Buscar pacientes"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>
        <div className="pt-select-wrap">
          <select
            className="pt-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar pacientes por estado"
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
        <div className="pt-stat">
          <span className="pt-stat-num">{filtered.length}</span>
          <span className="pt-stat-label">
            {search
              ? `de ${patients.length}`
              : statusFilter === "activos" ? "Pacientes" : "Inactivos"}
          </span>
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
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="pt-empty">
                      <div className="pt-empty-icon">
                        <FiUser size={48} />
                      </div>
                      {loadError ? (
                        <>
                          <p>No se pudo cargar la lista de pacientes.</p>
                          <p className="pt-empty-detail">{loadError}</p>
                          <button type="button" className="pt-btn-primary" onClick={getPatients}>
                            <FiRotateCcw size={15} /> Reintentar
                          </button>
                        </>
                      ) : (
                        <p>{search ? "Sin resultados para la búsqueda" : statusFilter === "activos" ? "No hay pacientes registrados" : "No hay pacientes inactivos"}</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="pt-row"
                      style={{ cursor: 'pointer' }}
                      tabIndex={0}
                      aria-label={`Abrir la ficha de ${p.nombre} ${p.apellidos}`}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/pacientes/${p.id}`);
                        }
                      }}
                    >
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
                            <div className="pt-sexo">{SEXO_LABELS[p.sexo] ?? "Sin registrar"}</div>
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
                          title="Ver historia clínica" aria-label={`Ver la historia clínica de ${p.nombre} ${p.apellidos}`}
                        >
                          <FiFileText size={16} />
                        </button>

                        {/* Agendar Cita */}
                        <button
                          className="pt-btn-action"
                          onClick={(e) => { e.stopPropagation(); scheduleAppointment(p); }}
                          title="Agendar cita" aria-label={`Agendar una cita para ${p.nombre} ${p.apellidos}`}
                        >
                          <FiBookOpen size={16} />
                        </button>

                        {/* Editar */}
                        <button
                          className="pt-btn-action"
                          onClick={(e) => { e.stopPropagation(); patientModal.openEditModal(p); }}
                          title="Editar paciente" aria-label={`Editar a ${p.nombre} ${p.apellidos}`}
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Inactivar / Reactivar */}
                        {p.activo === false ? (
                          <button
                            className="pt-btn-action"
                            onClick={(e) => { e.stopPropagation(); reactivatePatient(p.id); }}
                            title="Reactivar paciente" aria-label={`Reactivar a ${p.nombre} ${p.apellidos}`}
                          >
                            <FiRotateCcw size={16} />
                          </button>
                        ) : (
                          <button
                            className="pt-btn-action pt-btn-action-danger"
                            onClick={(e) => { e.stopPropagation(); deletePatient(p.id); }}
                            title="Inactivar paciente" aria-label={`Inactivar a ${p.nombre} ${p.apellidos}`}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}

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

    </div>
  );
};

export default PatientsVW;
