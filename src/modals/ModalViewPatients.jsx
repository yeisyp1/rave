import { createPortal } from "react-dom";
import "../styles/modalViewPatients.css";

export default function ModalViewPatient({
  show,
  onClose,
  patient,
}) {

  if (!show || !patient) return null;

  return createPortal(
    <div
      className="pt-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pt-modal pt-modal-view">

        {/* Header */}
        <div className="pt-modal-header">
          <div>
            <h2 className="pt-modal-title">Información del paciente</h2>
          </div>

          <button className="pt-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="pt-modal-body pt-view-body">

          <div className="pt-view-section">
            <h4>Datos personales</h4>

            <p><b>Nombre:</b> {patient.nombre} {patient.apellidos}</p>
            <p><b>Documento:</b> {patient.tipo_documento} {patient.numero_documento}</p>
            <p><b>Edad:</b> {patient.edad} años</p>
            <p><b>Sexo:</b> {patient.sexo}</p>
            <p><b>Ocupación:</b> {patient.ocupacion || "—"}</p>
          </div>

          <div className="pt-view-section">
            <h4>Contacto</h4>

            <p><b>Celular:</b> {patient.celular}</p>
            <p><b>Email:</b> {patient.email || "—"}</p>
            <p><b>Dirección:</b> {patient.direccion || "—"}</p>
          </div>

          <div className="pt-view-section">
            <h4>Salud</h4>

            <p><b>EPS:</b> {patient.eps || "—"}</p>
            <p><b>Sangre:</b> {patient.tipo_sangre || "—"}</p>
            <p><b>Alergias:</b> {patient.alergias || "—"}</p>
            <p><b>Medicamentos:</b> {patient.medicamentos || "—"}</p>
          </div>

          {patient.acudiente_nombre && (
            <div className="pt-view-section">
              <h4>Acudiente</h4>

              <p><b>Nombre:</b> {patient.acudiente_nombre}</p>
              <p><b>Parentesco:</b> {patient.acudiente_parentesco}</p>
              <p><b>Celular:</b> {patient.acudiente_celular}</p>
            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
}