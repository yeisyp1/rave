import { useEffect, useState } from "react";
import { supabase } from "../Back/lib/supabase";
import ModalPatients from "../components/ModalPatients";
import "../styles/Patients.css";

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
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

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

  const viewHistory = (patientId) => {
    window.location.href = `/historia-clinica/${patientId}`;
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
          <div className="pt-title-eyebrow">Clínica RAVE</div>
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
                        <button className="pt-btn-ghost" onClick={() => viewHistory(p.id)} title="Ver historia clínica">
                          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a1 1 0 100 2H4a1 1 0 100 2h2a1 1 0 000 2H6a2 2 0 01-2-2v-4zm10 0a2 2 0 00-2-2 1 1 0 000 2h-2a1 1 0 100 2h2a1 1 0 100 2h-2a1 1 0 000 2h2a2 2 0 002-2v-4z" clipRule="evenodd"/>
                          </svg>
                        </button>
                        <button className="pt-btn-ghost" onClick={() => editPatient(p)} title="Editar paciente">
                          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                        </button>
                        <button className="pt-btn-danger" onClick={() => deletePatient(p.id)} title="Eliminar paciente">
                          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
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
    </div>
  );
};

export default Patients;