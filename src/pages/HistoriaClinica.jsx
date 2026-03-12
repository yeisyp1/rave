import { useEffect, useState } from "react";
import { supabase } from "../Back/lib/supabase";
import ModalHistoriaClinica from "../modals/ModalHistoriaClinica";
import "../styles/historiaClinica.css";

const HistoriaClinica = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar pacientes
  const getPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) console.error("Error cargando pacientes:", error);
    else setPatients(data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    getPatients();
  }, []);

  // Filtro de búsqueda
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q) ||
      p.numero_documento?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const handleViewHistories = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  return (
    <div className="hc-page">
      {/* ── HEADER ── */}
      <div className="hc-header">
        <div className="hc-header-left">
          <h1 className="hc-title">Historias Clínicas</h1>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="hc-toolbar">
        <div className="hc-search-wrap">
          <svg className="hc-search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
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

      {/* ── TABLA ── */}
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
                  <th>Número Documento</th>
                  <th>Edad</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="hc-empty">
                      <div className="hc-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                        </svg>
                      </div>
                      <p>{search ? "Sin resultados para la búsqueda" : "No hay pacientes registrados"}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hc-row">
                      <td>
                        <div className="hc-patient-cell">
                          <div className="hc-avatar">{(p.nombre?.[0] ?? "?").toUpperCase()}</div>
                          <div className="hc-patient-info">
                            <div className="hc-name">{p.nombre} {p.apellidos}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.tipo_documento || "—"}</td>
                      <td>{p.numero_documento || "—"}</td>
                      <td>{p.edad ? `${p.edad} años` : "—"}</td>
                      <td>{p.celular || "—"}</td>
                      <td className="hc-actions">
                        <button
                          className="hc-btn-action"
                          onClick={() => handleViewHistories(p)}
                          title="Ver historias clínicas"
                        >
                          📋
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

      {/* ── MODAL DE HISTORIAS ── */}
      {showModal && (
        <ModalHistoriaClinica
          patient={selectedPatient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default HistoriaClinica;
