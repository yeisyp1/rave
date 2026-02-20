import { createPortal } from "react-dom";
import "../styles/modalPatients.css";

const calcAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
};

const STEPS = ["Documento", "Datos personales", "Contacto & Salud", "Acudiente"];

export default function ModalPatients({
  showModal,
  closeModal,
  form,
  setForm,
  step,
  setStep,
  handleSubmit,
  canNext,
  isEditing,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "fecha_nacimiento") updated.edad = String(calcAge(value));
    setForm(updated);
  };

  if (!showModal) return null;

  const modal = (
    <div className="pt-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="pt-modal">

        {/* Modal header */}
        <div className="pt-modal-header">
          <div>
            <div className="pt-modal-eyebrow">Clínica RAVE</div>
            <h2 className="pt-modal-title">{isEditing ? "Editar Paciente" : "Nuevo Paciente"}</h2>
          </div>
          <button className="pt-modal-close" onClick={closeModal}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="pt-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`pt-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
              <div className="pt-step-dot">
                {i < step ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className="pt-step-label">{s}</span>
              {i < STEPS.length - 1 && <div className={`pt-step-line ${i < step ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        {/* Gold accent */}
        <div className="pt-modal-accent" />

        <form onSubmit={(e) => e.preventDefault()} className="pt-modal-body">

          {/* ── PASO 0: Documento ── */}
          {step === 0 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Identificación del paciente</div>

              <div className="pt-field pt-field-full">
                <label className="pt-label">Tipo de documento <span className="pt-req">*</span></label>
                <div className="pt-select-wrap">
                  <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="pt-select" required>
                    <option value="">Seleccionar...</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="CE">Cédula Extranjería</option>
                    <option value="PA">Pasaporte</option>
                    <option value="RC">Registro Civil</option>
                  </select>
                  <svg className="pt-select-arrow" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label">Número de documento <span className="pt-req">*</span></label>
                <input name="numero_documento" value={form.numero_documento} onChange={handleChange} placeholder="Ej. 1023456789" className="pt-input" required/>
              </div>
            </div>
          )}

          {/* ── PASO 1: Datos personales ── */}
          {step === 1 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Información personal</div>

              <div className="pt-field">
                <label className="pt-label">Nombre <span className="pt-req">*</span></label>
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. María" className="pt-input" required/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Apellidos <span className="pt-req">*</span></label>
                <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej. Gómez Torres" className="pt-input" required/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Fecha de nacimiento <span className="pt-req">*</span></label>
                <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} className="pt-input" required/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Edad</label>
                <div className="pt-age-display">
                  {form.edad ? (
                    <><span className="pt-age-num">{form.edad}</span><span className="pt-age-unit">años</span></>
                  ) : (
                    <span className="pt-age-placeholder">Se calcula automáticamente</span>
                  )}
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label">Sexo</label>
                <div className="pt-select-wrap">
                  <select name="sexo" value={form.sexo} onChange={handleChange} className="pt-select">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                  <svg className="pt-select-arrow" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label">Ocupación</label>
                <input name="ocupacion" value={form.ocupacion} onChange={handleChange} placeholder="Ej. Docente" className="pt-input"/>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label">Dirección de residencia</label>
                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej. Calle 45 #12-30, Bogotá" className="pt-input"/>
              </div>
            </div>
          )}

          {/* ── PASO 2: Contacto & Salud ── */}
          {step === 2 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Contacto</div>

              <div className="pt-field">
                <label className="pt-label">Teléfono fijo</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 6014567890" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Celular</label>
                <input name="celular" value={form.celular} onChange={handleChange} placeholder="Ej. 3001234567" className="pt-input"/>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label">Correo electrónico</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Ej. paciente@correo.com" className="pt-input"/>
              </div>

              <div className="pt-section-title pt-section-sep">Información de salud</div>

              <div className="pt-field">
                <label className="pt-label">Tipo de sangre</label>
                <div className="pt-select-wrap">
                  <select name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange} className="pt-select">
                    <option value="">Seleccionar...</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <svg className="pt-select-arrow" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label">EPS</label>
                <input name="eps" value={form.eps} onChange={handleChange} placeholder="Ej. Sura, Nueva EPS..." className="pt-input"/>
              </div>
            </div>
          )}

          {/* ── PASO 3: Acudiente ── */}
          {step === 3 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">
                Datos del acudiente
                <span className="pt-optional-badge">Opcional</span>
              </div>

              <div className="pt-field">
                <label className="pt-label">Nombre del acudiente</label>
                <input name="acudiente_nombre" value={form.acudiente_nombre} onChange={handleChange} placeholder="Ej. Carlos Gómez" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Parentesco</label>
                <input name="acudiente_parentesco" value={form.acudiente_parentesco} onChange={handleChange} placeholder="Ej. Padre, Madre, Cónyuge..." className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Celular acudiente</label>
                <input name="acudiente_celular" value={form.acudiente_celular} onChange={handleChange} placeholder="Ej. 3109876543" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label">Dirección acudiente</label>
                <input name="acudiente_direccion" value={form.acudiente_direccion} onChange={handleChange} placeholder="Ej. Cra 10 #22-15" className="pt-input"/>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="pt-modal-nav">
            <button
              type="button"
              className="pt-btn-ghost"
              onClick={() => step > 0 ? setStep(step - 1) : closeModal()}
            >
              {step === 0 ? "Cancelar" : "← Atrás"}
            </button>

            <div className="pt-step-counter">{step + 1} / {STEPS.length}</div>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="pt-btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
              >
                Siguiente →
              </button>
            ) : (
              <button type="button" className="pt-btn-primary" onClick={handleSubmit}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {isEditing ? "Actualizar" : "Guardar"} paciente
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}