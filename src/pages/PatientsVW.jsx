import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calcPatientAgeCtrl,
  canNextPatientStepCtrl,
  deletePatientCtrl,
  filterPatientsCtrl,
  loadPatientsCtrl,
  PATIENT_EMPTY_FORM,
  savePatientCtrl,
} from "../controllers/PatientsCtrl";
import ModalPatientsVW from "../modals/ModalPatientsVW";
import ModalViewPatientsVW from "../modals/ModalViewPatientsVW";
import "../styles/PatientsVW.css";
import { CIcon } from '@coreui/icons-react'

import * as icons from '@coreui/icons'

const PatientsVW = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(PATIENT_EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);

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
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "fecha_nacimiento") updated.edad = calcPatientAgeCtrl(value);
    setForm(updated);
  };

  const resetForm = () => { setForm(PATIENT_EMPTY_FORM); setStep(0); };

  const openModal = () => { resetForm(); setEditingId(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); resetForm(); setEditingId(null); };

  const editPatient = (patient) => {
    setForm(patient);
    setEditingId(patient.id);
    setStep(0);
    setShowModal(true);
  };

  const viewHistory = (patient) => {
    setViewPatient(patient);
  };

  const scheduleAppointment = (patient) => {
    navigate('/agendarcita', { state: { patient } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await savePatientCtrl({ form, editingId });
    if (!result.ok) {
      if (result.error) console.error(result.error);
      alert(result.message);
      return;
    }

    alert(result.message);
    closeModal();
    getPatients();
  };

  const deletePatient = async (id) => {
    if (!confirm("¿Eliminar paciente?")) return;
    const result = await deletePatientCtrl(id);
    if (!result.ok) alert(result.message);
    else getPatients();
  };

  /* ── Validación por paso ── */
  const canNext = () => canNextPatientStepCtrl(step, form);

  /* ── Filtro de búsqueda ── */
  const filtered = filterPatientsCtrl(patients, search);

  return (
    <div className="pt-page">

      {/* ── HEADER ── */}
      <div className="pt-header"> 
        <div className="pt-header-left">
          <h1 className="pt-title">Pacientes</h1>
        </div>
        <button className="pt-btn-primary" onClick={openModal}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Nuevo Paciente
        </button>
      </div>

      {/* ── SEARCH + STATS ── */}
      <div className="pt-toolbar">
        <div className="pt-search-wrap">
          <svg className="pt-search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            className="pt-search"
            placeholder="Buscar por nombre, documento o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pt-stat">
          <span className="pt-stat-num">{patients.length}</span>
          <span className="pt-stat-label">pacientes</span>
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="pt-card">
        {loading ? (
          <div className="pt-loading">
            <div className="pt-spinner" />
            <span>Cargando pacientes...</span>
          </div>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                        </svg>
                      </div>
                      <p>{search ? "Sin resultados para la búsqueda" : "No hay pacientes registrados"}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="pt-row">
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
                          onClick={() => viewHistory(p)}
                          title="Ver historia clínica"
                        >
                          <CIcon icon={icons.cilNotes} size="sm" />
                        </button>

                        {/* Agendar Cita */}
                        <button
                          className="pt-btn-action"
                          onClick={() => scheduleAppointment(p)}
                          title="Agendar cita"
                        >
                          <CIcon icon={icons.cilAddressBook} size="sm" />
                        </button>

                        {/* Editar */}
                        <button
                          className="pt-btn-action"
                          onClick={() => editPatient(p)}
                          title="Editar paciente"
                        >
                          <CIcon icon={icons.cilPencil} size="sm" />
                        </button>

                        {/* Eliminar */}
                        <button
                          className="pt-btn-action pt-btn-action-danger"
                          onClick={() => deletePatient(p.id)}
                          title="Eliminar paciente"
                        >
                          <CIcon icon={icons.cilTrash} size="sm" />
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
        showModal={showModal}
        closeModal={closeModal}
        form={form}
        setForm={setForm}
        step={step}
        setStep={setStep}
        handleSubmit={handleSubmit}
        canNext={canNext}
        isEditing={!!editingId}
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