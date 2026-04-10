import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../Back/lib/supabase";
import "../styles/modalHistoriaClinica.css";

const ModalHistoriaClinica = ({ patient, onClose }) => {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    motivo_consulta: "",
    diagnostico: "",
    tratamiento: "",
    notas: "",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  // Cargar historias clínicas del paciente
  useEffect(() => {
    fetchHistories();
  }, [patient.id]);

  const fetchHistories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clinical_histories")
      .select("*")
      .eq("patient_id", patient.id)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando historias:", error);
    } else {
      setHistories(data || []);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.motivo_consulta.trim()) {
      alert("El motivo de consulta es obligatorio");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("clinical_histories").insert([
      {
        patient_id: patient.id,
        motivo_consulta: form.motivo_consulta,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        notas: form.notas,
        fecha: form.fecha,
      },
    ]);

    if (error) {
      console.error("Error guardando historia:", error);
      alert("Error al guardar la historia clínica");
    } else {
      alert("Historia clínica guardada exitosamente");
      setForm({
        motivo_consulta: "",
        diagnostico: "",
        tratamiento: "",
        notas: "",
        fecha: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchHistories();
    }
    setSaving(false);
  };

  if (!patient) return null;

  return createPortal(
    <div
      className="mhc-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mhc-modal">
        {/* Header */}
        <div className="mhc-modal-header">
          <div>
            <h2 className="mhc-modal-title">Historias Clínicas</h2>
            <p className="mhc-patient-name">
              {patient.nombre} {patient.apellidos}
            </p>
          </div>
          <div className="mhc-header-actions">
            <button
              className="mhc-btn-odontogram"
              onClick={() => {
                onClose();
                navigate(`/odontograma/${patient.id}`);
              }}
              title="Ver odontograma del paciente"
            >
              🦷 Odontograma
            </button>
            <button className="mhc-modal-close" onClick={onClose}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Accent line */}
        <div className="mhc-modal-accent" />

        {/* Body */}
        <div className="mhc-modal-body">
          {/* New history form */}
          {showForm && (
            <div className="mhc-form-container">
              <h3 className="mhc-form-title">Nueva Historia Clínica</h3>
              <form onSubmit={handleSubmit} className="mhc-form">
                <div className="mhc-field">
                  <label className="mhc-label">
                    Motivo de Consulta <span className="mhc-req">*</span>
                  </label>
                  <textarea
                    name="motivo_consulta"
                    value={form.motivo_consulta}
                    onChange={handleChange}
                    placeholder="Describa el motivo de la consulta..."
                    className="mhc-textarea"
                    rows="3"
                  />
                </div>

                <div className="mhc-field">
                  <label className="mhc-label">Diagnóstico</label>
                  <textarea
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    placeholder="Diagnóstico provisional o confirmado..."
                    className="mhc-textarea"
                    rows="3"
                  />
                </div>

                <div className="mhc-field">
                  <label className="mhc-label">Tratamiento</label>
                  <textarea
                    name="tratamiento"
                    value={form.tratamiento}
                    onChange={handleChange}
                    placeholder="Tratamiento recomendado..."
                    className="mhc-textarea"
                    rows="3"
                  />
                </div>

                <div className="mhc-field">
                  <label className="mhc-label">Notas Adicionales</label>
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={handleChange}
                    placeholder="Notas adicionales..."
                    className="mhc-textarea"
                    rows="2"
                  />
                </div>

                <div className="mhc-field">
                  <label className="mhc-label">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    className="mhc-input"
                  />
                </div>

                <div className="mhc-form-actions">
                  <button
                    type="button"
                    className="mhc-btn-ghost"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="mhc-btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar Historia"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Histories list */}
          {!showForm && (
            <div className="mhc-histories-container">
              <div className="mhc-histories-header">
                <h3>Historias Registradas</h3>
                <button
                  className="mhc-btn-new"
                  onClick={() => setShowForm(true)}
                >
                  + Nueva Historia
                </button>
              </div>

              {loading ? (
                <div className="mhc-loading">
                  <div className="mhc-spinner" />
                  <span>Cargando historias...</span>
                </div>
              ) : histories.length === 0 ? (
                <div className="mhc-empty">
                  <p>No hay historias clínicas registradas</p>
                  <button
                    className="mhc-btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    Crear primera historia
                  </button>
                </div>
              ) : (
                <div className="mhc-histories-list">
                  {histories.map((history) => (
                    <div key={history.id} className="mhc-history-card">
                      <div className="mhc-history-date">
                        {new Date(history.fecha).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>

                      {history.motivo_consulta && (
                        <div className="mhc-history-section">
                          <span className="mhc-history-label">Motivo:</span>
                          <p>{history.motivo_consulta}</p>
                        </div>
                      )}

                      {history.diagnostico && (
                        <div className="mhc-history-section">
                          <span className="mhc-history-label">Diagnóstico:</span>
                          <p>{history.diagnostico}</p>
                        </div>
                      )}

                      {history.tratamiento && (
                        <div className="mhc-history-section">
                          <span className="mhc-history-label">Tratamiento:</span>
                          <p>{history.tratamiento}</p>
                        </div>
                      )}

                      {history.notas && (
                        <div className="mhc-history-section">
                          <span className="mhc-history-label">Notas:</span>
                          <p>{history.notas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalHistoriaClinica;
