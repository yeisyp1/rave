import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import LegalTextVW from "../components/LegalTextVW";
import { useModalBehavior } from "../hooks/useModalBehavior";
import { confirmAction } from "../utils/confirmDialog";
import { getLatestLegalDocumentDAO } from "../dao/LegalDocumentsDAO";
import "../styles/ModalPatientsVW.css";
import { FiX, FiCheck, FiChevronDown } from 'react-icons/fi'
import { parseLocalDate } from "../utils/dates";

const calcAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = parseLocalDate(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
};

const STEPS = ["Documento", "Datos personales", "Contacto & Salud", "Acudiente", "Autorización de datos"];

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
  const [authDoc, setAuthDoc] = useState(null);
  const [authDocState, setAuthDocState] = useState("loading");
  const [dirty, setDirty] = useState(false);
  const [previousShowModal, setPreviousShowModal] = useState(showModal);

  if (previousShowModal !== showModal) {
    setPreviousShowModal(showModal);
    setDirty(false);
    if (showModal) setAuthDocState("loading");
  }

  useEffect(() => {
    if (!showModal) return undefined;
    let active = true;
    getLatestLegalDocumentDAO("autorizacion_datos")
      .then((doc) => {
        if (!active) return;
        setAuthDoc(doc);
        setAuthDocState(doc ? "ready" : "error");
      })
      .catch(() => {
        if (!active) return;
        setAuthDoc(null);
        setAuthDocState("error");
      });
    return () => { active = false; };
  }, [showModal]);

  const requestClose = useCallback(async () => {
    if (!dirty) {
      closeModal();
      return;
    }
    const discard = await confirmAction({
      title: "Descartar los cambios",
      message: "Si cierras ahora se perderá lo que escribiste en este formulario.",
      confirmLabel: "Descartar",
      cancelLabel: "Seguir editando",
      variant: "danger",
    });
    if (discard) closeModal();
  }, [closeModal, dirty]);

  const containerRef = useModalBehavior(requestClose, { enabled: showModal });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "fecha_nacimiento") updated.edad = String(calcAge(value));
    setDirty(true);
    setForm(updated);
  };

  const handleAuthorizationChange = (e) => {
    const checked = e.target.checked;
    setDirty(true);
    setForm({
      ...form,
      autorizacion_datos: checked,
      autorizacion_datos_fecha: checked ? new Date().toISOString() : null,
    });
  };

  if (!showModal) return null;

  const modal = (
    <div className="modal-overlay pt-overlay" onClick={(e) => e.target === e.currentTarget && requestClose()}>
      <div className="pt-modal" ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="pt-modal-title">

        {/* Modal header */}
        <div className="pt-modal-header">
          <div>
            <div className="pt-modal-eyebrow">Clínica RAVE</div>
            <h2 className="pt-modal-title" id="pt-modal-title">{isEditing ? "Editar paciente" : "Nuevo paciente"}</h2>
          </div>
          <button className="pt-modal-close" onClick={requestClose} aria-label="Cerrar">
            <FiX size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="pt-steps">
          {STEPS.map((s, i) => {
            const reachable = isEditing || i <= step;
            return (
              <div key={i} className={`pt-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                <button
                  type="button"
                  className="pt-step-jump"
                  disabled={!reachable}
                  aria-current={i === step}
                  aria-label={`Paso ${i + 1} de ${STEPS.length}: ${s}`}
                  title={s}
                  onClick={() => reachable && setStep(i)}
                >
                  <span className="pt-step-dot">
                    {i < step ? (<FiCheck size={12} />) : i + 1}
                  </span>
                  <span className="pt-step-label">{s}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`pt-step-line ${i < step ? "done" : ""}`} />}
              </div>
            );
          })}
        </div>

        {/* Gold accent */}
        <div className="pt-modal-accent" />

        <form onSubmit={(e) => e.preventDefault()} className="pt-modal-form">
          <div className="pt-modal-body">

          {/* ── PASO 0: Documento ── */}
          {step === 0 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Identificación del paciente</div>

              <div className="pt-field pt-field-full">
                <label className="pt-label" htmlFor="pt-tipo_documento">Tipo de documento <span className="pt-req">*</span></label>
                <div className="pt-select-wrap">
                  <select id="pt-tipo_documento" name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="pt-select" required>
                    <option value="">Seleccionar...</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="CE">Cédula Extranjería</option>
                    <option value="PA">Pasaporte</option>
                    <option value="RC">Registro Civil</option>
                  </select>
                </div>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label" htmlFor="pt-numero_documento">Número de documento <span className="pt-req">*</span></label>
                <input id="pt-numero_documento" name="numero_documento" value={form.numero_documento} onChange={handleChange} placeholder="Ej. 1023456789" className="pt-input" required/>
              </div>
            </div>
          )}

          {/* ── PASO 1: Datos personales ── */}
          {step === 1 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Información personal</div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-nombre">Nombre <span className="pt-req">*</span></label>
                <input id="pt-nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. María" className="pt-input" required/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-apellidos">Apellidos <span className="pt-req">*</span></label>
                <input id="pt-apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej. Gómez Torres" className="pt-input" required/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-fecha_nacimiento">Fecha de nacimiento <span className="pt-req">*</span></label>
                <input id="pt-fecha_nacimiento" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} className="pt-input" required/>
              </div>

              <div className="pt-field">
                <span className="pt-label">Edad</span>
                <div className="pt-age-display">
                  {form.edad ? (
                    <><span className="pt-age-num">{form.edad}</span><span className="pt-age-unit">años</span></>
                  ) : (
                    <span className="pt-age-placeholder">Se calcula automáticamente</span>
                  )}
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-sexo">Sexo</label>
                <div className="pt-select-wrap">
                  <select id="pt-sexo" name="sexo" value={form.sexo} onChange={handleChange} className="pt-select">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-ocupacion">Ocupación</label>
                <input id="pt-ocupacion" name="ocupacion" value={form.ocupacion} onChange={handleChange} placeholder="Ej. Docente" className="pt-input"/>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label" htmlFor="pt-direccion">Dirección de residencia</label>
                <input id="pt-direccion" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej. Calle 45 #12-30, Bogotá" className="pt-input"/>
              </div>
            </div>
          )}

          {/* ── PASO 2: Contacto & Salud ── */}
          {step === 2 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Contacto</div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-telefono">Teléfono fijo</label>
                <input id="pt-telefono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 6014567890" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-celular">Celular</label>
                <input id="pt-celular" name="celular" value={form.celular} onChange={handleChange} placeholder="Ej. 3001234567" className="pt-input"/>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label" htmlFor="pt-email">Correo electrónico</label>
                <input id="pt-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Ej. paciente@correo.com" className="pt-input"/>
              </div>

              <div className="pt-section-title pt-section-sep">Información de salud</div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-tipo_sangre">Tipo de sangre</label>
                <div className="pt-select-wrap">
                  <select id="pt-tipo_sangre" name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange} className="pt-select">
                    <option value="">Seleccionar...</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-eps">EPS</label>
                <input id="pt-eps" name="eps" value={form.eps} onChange={handleChange} placeholder="Ej. Sura, Nueva EPS..." className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-alergias">Alergias</label>
                <input id="pt-alergias" name="alergias" value={form.alergias} onChange={handleChange} placeholder="Ej. Penicilina, Latex..." className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-medicamentos">Medicamentos</label>
                <input id="pt-medicamentos" name="medicamentos" value={form.medicamentos} onChange={handleChange} placeholder="Ej. Paracetamol, Ibuprofeno..." className="pt-input"/>
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
                <label className="pt-label" htmlFor="pt-acudiente_nombre">Nombre del acudiente</label>
                <input id="pt-acudiente_nombre" name="acudiente_nombre" value={form.acudiente_nombre} onChange={handleChange} placeholder="Ej. Carlos Gómez" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-acudiente_parentesco">Parentesco</label>
                <input id="pt-acudiente_parentesco" name="acudiente_parentesco" value={form.acudiente_parentesco} onChange={handleChange} placeholder="Ej. Padre, Madre, Cónyuge..." className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-acudiente_celular">Celular acudiente</label>
                <input id="pt-acudiente_celular" name="acudiente_celular" value={form.acudiente_celular} onChange={handleChange} placeholder="Ej. 3109876543" className="pt-input"/>
              </div>

              <div className="pt-field">
                <label className="pt-label" htmlFor="pt-acudiente_direccion">Dirección acudiente</label>
                <input id="pt-acudiente_direccion" name="acudiente_direccion" value={form.acudiente_direccion} onChange={handleChange} placeholder="Ej. Cra 10 #22-15" className="pt-input"/>
              </div>
            </div>
          )}

          {/* ── PASO 4: Autorización de datos ── */}
          {step === 4 && (
            <div className="pt-form-grid" style={{ animationName: "stepIn" }}>
              <div className="pt-section-title">Autorización de tratamiento de datos personales</div>

              <div className="pt-field pt-field-full">
                <div className="pt-legal-text">
                  {authDocState === "loading" ? (
                    <p>Cargando el texto de la autorización...</p>
                  ) : authDocState === "ready" ? (
                    <LegalTextVW content={authDoc.content} />
                  ) : (
                    <p>No se pudo cargar el texto de la autorización. Revisa tu conexión antes de continuar.</p>
                  )}
                </div>
                <span className="pt-age-placeholder">
                  {authDoc && `Versión ${authDoc.version} · `}
                  <Link to="/politica-privacidad" target="_blank" rel="noreferrer">Ver política de tratamiento de datos</Link>
                </span>
              </div>

              <div className="pt-field pt-field-full">
                <label className="pt-label" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.autorizacion_datos)}
                    onChange={handleAuthorizationChange}
                    disabled={!authDoc}
                  />
                  Autorizo el tratamiento de mis datos personales <span className="pt-req">*</span>
                </label>
                {form.autorizacion_datos_fecha && (
                  <span className="pt-age-placeholder">
                    Autorizado el {new Date(form.autorizacion_datos_fecha).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          )}

          </div>

          <div className="pt-modal-nav">
            <button
              type="button"
              className="pt-btn-ghost"
              onClick={() => (step > 0 ? setStep(step - 1) : requestClose())}
            >
              {step === 0 ? "Cancelar" : "← Atrás"}
            </button>

            <div className="pt-step-counter">{step + 1} / {STEPS.length}</div>

            {isEditing && (
              <button
                type="button"
                className="pt-btn-ghost"
                onClick={handleSubmit}
                disabled={!form.autorizacion_datos}
              >
                <FiCheck size={15} />
                Guardar cambios
              </button>
            )}

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
              <button
                type="button"
                className="pt-btn-primary"
                onClick={handleSubmit}
                disabled={!form.autorizacion_datos}
              >
                <FiCheck size={15} />
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