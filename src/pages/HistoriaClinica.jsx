import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../Back/lib/supabase";
import "../styles/historiaClinica.css";

const HistoriaClinica = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("datos");

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        navigate("/pacientes");
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) {
        console.error("Error cargando paciente:", error);
        alert("Paciente no encontrado");
        navigate("/pacientes");
        return;
      }

      setPatient(data);
      setLoading(false);
    };

    fetchPatient();
  }, [patientId, navigate]);

  if (loading) {
    return (
      <div className="hc-page">
        <div className="hc-loading">
          <div className="hc-spinner" />
          <span>Cargando historia clínica...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="hc-page">
        <div className="hc-error">Paciente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="hc-page">
      {/* Header */}
      <div className="hc-header">
        <button className="hc-back-btn" onClick={() => navigate("/pacientes")}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
          </svg>
          Volver
        </button>
        <div className="hc-header-title">
          <h1>Historia Clínica</h1>
          <p className="hc-patient-name">{patient.nombre} {patient.apellidos}</p>
        </div>
      </div>

      {/* Patient Card */}
      <div className="hc-card hc-patient-card">
        <div className="hc-patient-info">
          <div className="hc-avatar-lg">
            {(patient.nombre?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="hc-patient-details">
            <div className="hc-detail-row">
              <span className="hc-label">Documento:</span>
              <span className="hc-value">{patient.tipo_documento} {patient.numero_documento}</span>
            </div>
            <div className="hc-detail-row">
              <span className="hc-label">Edad:</span>
              <span className="hc-value">{patient.edad ? `${patient.edad} años` : "—"}</span>
            </div>
            <div className="hc-detail-row">
              <span className="hc-label">Sexo:</span>
              <span className="hc-value">{patient.sexo === "M" ? "Masculino" : patient.sexo === "F" ? "Femenino" : "—"}</span>
            </div>
            <div className="hc-detail-row">
              <span className="hc-label">Tipo de sangre:</span>
              <span className="hc-value">{patient.tipo_sangre || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hc-tabs">
        <button
          className={`hc-tab ${activeTab === "datos" ? "active" : ""}`}
          onClick={() => setActiveTab("datos")}
        >
          Datos Personales
        </button>
        <button
          className={`hc-tab ${activeTab === "contacto" ? "active" : ""}`}
          onClick={() => setActiveTab("contacto")}
        >
          Contacto
        </button>
        <button
          className={`hc-tab ${activeTab === "salud" ? "active" : ""}`}
          onClick={() => setActiveTab("salud")}
        >
          Información de Salud
        </button>
        <button
          className={`hc-tab ${activeTab === "acudiente" ? "active" : ""}`}
          onClick={() => setActiveTab("acudiente")}
        >
          Acudiente
        </button>
      </div>

      {/* Content */}
      <div className="hc-content">
        {activeTab === "datos" && (
          <div className="hc-card">
            <h3 className="hc-card-title">Datos Personales</h3>
            <div className="hc-grid">
              <div className="hc-field">
                <label>Nombre</label>
                <p>{patient.nombre}</p>
              </div>
              <div className="hc-field">
                <label>Apellidos</label>
                <p>{patient.apellidos}</p>
              </div>
              <div className="hc-field">
                <label>Fecha de nacimiento</label>
                <p>{patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString("es-ES") : "—"}</p>
              </div>
              <div className="hc-field">
                <label>Ocupación</label>
                <p>{patient.ocupacion || "—"}</p>
              </div>
              <div className="hc-field hc-field-full">
                <label>Dirección</label>
                <p>{patient.direccion || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacto" && (
          <div className="hc-card">
            <h3 className="hc-card-title">Información de Contacto</h3>
            <div className="hc-grid">
              <div className="hc-field">
                <label>Teléfono</label>
                <p>{patient.telefono || "—"}</p>
              </div>
              <div className="hc-field">
                <label>Celular</label>
                <p>{patient.celular || "—"}</p>
              </div>
              <div className="hc-field hc-field-full">
                <label>Correo electrónico</label>
                <p>{patient.email || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "salud" && (
          <div className="hc-card">
            <h3 className="hc-card-title">Información de Salud</h3>
            <div className="hc-grid">
              <div className="hc-field">
                <label>Tipo de sangre</label>
                <p>{patient.tipo_sangre || "—"}</p>
              </div>
              <div className="hc-field">
                <label>EPS</label>
                <p>{patient.eps || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "acudiente" && (
          <div className="hc-card">
            <h3 className="hc-card-title">Datos del Acudiente</h3>
            <div className="hc-grid">
              <div className="hc-field">
                <label>Nombre</label>
                <p>{patient.acudiente_nombre || "—"}</p>
              </div>
              <div className="hc-field">
                <label>Parentesco</label>
                <p>{patient.acudiente_parentesco || "—"}</p>
              </div>
              <div className="hc-field">
                <label>Celular</label>
                <p>{patient.acudiente_celular || "—"}</p>
              </div>
              <div className="hc-field hc-field-full">
                <label>Dirección</label>
                <p>{patient.acudiente_direccion || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoriaClinica;
