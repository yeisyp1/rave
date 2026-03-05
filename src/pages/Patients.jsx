import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Back/lib/supabase";
import ModalPatients from "../modals/ModalPatients";
import ModalViewPatient from "../modals/ModalViewPatients";
import "../styles/Patients.css";
import { CIcon } from '@coreui/icons-react'

import * as icons from '@coreui/icons'

/* ── Calcula edad automáticamente desde fecha_nacimiento ── */
const calcAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
};

const EMPTY_FORM = {
  tipo_documento: "",
  numero_documento: "",
  nombre: "",
  apellidos: "",
  fecha_nacimiento: "",
  edad: "",
  direccion: "",
  telefono: "",
  celular: "",
  ocupacion: "",
  sexo: "",
  email: "",
  tipo_sangre: "",
  eps: "",
  acudiente_nombre: "",
  acudiente_direccion: "",
  acudiente_parentesco: "",
  acudiente_celular: "",
};

const STEPS = ["Documento", "Datos personales", "Contacto & Salud", "Acudiente"];

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);

  /* ── Cargar pacientes ── */
  const getPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error cargando pacientes:", error);
    else setPatients(data);
    setLoading(false);
  };

  useEffect(() => { getPatients(); }, []);

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "fecha_nacimiento") updated.edad = String(calcAge(value));
    setForm(updated);
  };

  const resetForm = () => { setForm(EMPTY_FORM); setStep(0); };

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
    if (!form.tipo_documento || !form.numero_documento) return alert("Documento obligatorio");
    if (!form.nombre || !form.apellidos) return alert("Nombre y apellidos obligatorios");

    if (editingId) {
      // Actualizar paciente
      const { error } = await supabase
        .from("patients")
        .update(form)
        .eq("id", editingId);
      if (error) {
        console.error(error);
        alert("Error al actualizar");
        return;
      }
      alert("Paciente actualizado");
    } else {
      // Crear nuevo paciente
      const { error } = await supabase.from("patients").insert([form]);
      if (error) {
        if (error.code === "23505") alert("Este documento ya existe");
        else { console.error(error); alert("Error al guardar"); }
        return;
      }
      alert("Paciente registrado");
    }
    closeModal();
    getPatients();
  };

  const deletePatient = async (id) => {
    if (!confirm("¿Eliminar paciente?")) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) alert("Error al eliminar");
    else getPatients();
  };

  /* ── Validación por paso ── */
  const canNext = () => {
    if (step === 0) return form.tipo_documento && form.numero_documento;
    if (step === 1) return form.nombre && form.apellidos && form.fecha_nacimiento;
    return true;
  };

  /* ── Filtro de búsqueda ── */
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q) ||
      p.numero_documento?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

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
      <ModalPatients
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
      <ModalViewPatient
        show={!!viewPatient}
        patient={viewPatient}
        onClose={() => setViewPatient(null)}
      />


    </div>
  );
};

export default Patients;