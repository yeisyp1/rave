import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  createPatientHistoryCtrl,
  HISTORIA_EMPTY_FORM,
  loadHistoryCityDepartmentsCtrl,
  loadPatientHistoriesCtrl,
} from "../controllers/HistoriaClinicaCtrl";
import "../styles/ModalHistoriaClinicaVW.css";
import { FiChevronDown, FiPlus, FiX } from "react-icons/fi";

const YES_NO_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

const BOOL_OPTIONS = YES_NO_OPTIONS;
const B_R_M_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "B", label: "B" },
  { value: "R", label: "R" },
  { value: "M", label: "M" },
];
const CIVIL_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "sol", label: "Soltero" },
  { value: "cas", label: "Casado" },
  { value: "otro", label: "Otro" },
];
const NORMAL_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "normal", label: "Normal" },
  { value: "anormal", label: "Anormal" },
];

const calcAge = (dob) => {
  if (!dob) return "";
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
};

const fieldToText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const ModalHistoriaClinicaVW = ({ patient, onClose, startInForm = false }) => {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(startInForm);
  const [form, setForm] = useState(HISTORIA_EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [originalPatientData, setOriginalPatientData] = useState(null);

  // Pre-populate form with patient data when showing form
  useEffect(() => {
    if (!patient) return;
    if (showForm && !originalPatientData) {
      // Store original patient data to detect changes later
      const patientDataSnapshot = {
        nombre: patient.nombre || "",
        apellidos: patient.apellidos || "",
        tipo_documento: patient.tipo_documento || "",
        numero_documento: patient.numero_documento || "",
        direccion: patient.direccion || "",
        telefono: patient.telefono || "",
        celular: patient.celular || "",
        email: patient.email || "",
        ciudad_departamento: patient.ciudad_departamento || "",
        sexo: patient.sexo || "",
        rh: patient.rh || "",
        eps: patient.eps || "",
        fecha_nacimiento: patient.fecha_nacimiento || "",
      };
      setOriginalPatientData(patientDataSnapshot);
      
      // Pre-fill form with patient data
      setForm((prev) => ({
        ...prev,
        nombre: patientDataSnapshot.nombre,
        apellidos: patientDataSnapshot.apellidos,
        tipo_identificacion: patientDataSnapshot.tipo_documento,
        numero_identificacion: patientDataSnapshot.numero_documento,
        direccion: patientDataSnapshot.direccion,
        telefono: patientDataSnapshot.telefono,
        celular: patientDataSnapshot.celular,
        correo_electronico: patientDataSnapshot.email,
        ciudad_departamento: patientDataSnapshot.ciudad_departamento,
        sexo: patientDataSnapshot.sexo,
        rh: patientDataSnapshot.rh,
        eps: patientDataSnapshot.eps,
        fecha_nacimiento: patientDataSnapshot.fecha_nacimiento,
      }));
    } else if (!showForm) {
      setOriginalPatientData(null);
    }
  }, [showForm, patient, originalPatientData]);

  useEffect(() => {
    if (!patient?.id) return;
    fetchHistories();
    fetchCityDepartments();
  }, [patient?.id]);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const data = await loadPatientHistoriesCtrl(patient.id);
      setHistories(data);
    } catch (error) {
      console.error("Error cargando historias:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityDepartments = async () => {
    try {
      const data = await loadHistoryCityDepartmentsCtrl();
      setCityOptions(data);
    } catch (error) {
      console.error("Error cargando ciudades/departamentos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "fecha_nacimiento" ? { edad: calcAge(value) } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    const result = await createPatientHistoryCtrl(patient.id, form, originalPatientData);

    if (!result.ok) {
      if (result.error) console.error("Error guardando historia:", result.error);
      alert(result.message);
    } else {
      alert(result.message);
      setForm(HISTORIA_EMPTY_FORM);
      setShowForm(false);
      setOriginalPatientData(null);
      fetchHistories();
    }
    setSaving(false);
  };

  const renderField = ({ label, name, type = "text", as = "input", placeholder = "", options = [], rows = 3, listId = "" }) => (
    <label className="mhc-field">
      <span className="mhc-label">{label}</span>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="mhc-textarea"
          rows={rows}
        />
      ) : as === "select" ? (
        <div className="mhc-select-wrap">
          <select name={name} value={form[name]} onChange={handleChange} className="mhc-input mhc-select">
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="mhc-select-icon" size={16} />
        </div>
      ) : listId ? (
        <>
          <input
            name={name}
            value={form[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className="mhc-input"
            list={listId}
            type={type}
          />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </>
      ) : (
        <input
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="mhc-input"
          type={type}
        />
      )}
    </label>
  );

  const renderStatusGrid = (items, statusOptions, extraClass = "") => (
      <div className={`mhc-status-grid ${extraClass}`.trim()}>
      {items.map((item) => (
        <div key={item.name} className="mhc-status-row">
          <span className="mhc-status-label">{item.label}</span>
          <div className="mhc-select-wrap">
            <select name={item.name} value={form[item.name]} onChange={handleChange} className="mhc-input mhc-select mhc-status-select">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );

  if (!patient) return null;

  const anamnesisLeft = [
    { name: "tratamiento_medico", label: "1. Tratamiento médico" },
    { name: "ingestion_medicamentos", label: "2. Ingestión medicamentos" },
    { name: "reacciones_medicamentos_anestesia", label: "3. Reacciones medicamentos - Anestesia" },
    { name: "reacciones_medicamentos_antibioticos", label: "3. Reacciones medicamentos - Antibióticos" },
    { name: "hemorragias", label: "4. Hemorragias" },
    { name: "irradiaciones", label: "5. Irradiaciones" },
    { name: "sinusitis", label: "6. Sinusitis" },
    { name: "enfermedad_respiratoria", label: "7. Enfermedad respiratoria" },
    { name: "cardiopatias", label: "8. Cardiopatías" },
  ];

  const anamnesisRight = [
    { name: "diabetes", label: "9. Diabetes" },
    { name: "fiebre_reumatica", label: "10. Fiebre reumática" },
    { name: "hepatitis", label: "11. Hepatitis" },
    { name: "hipertension", label: "12. Hipertensión" },
    { name: "embarazo", label: "13. Embarazo" },
    { name: "enfermedades_renales", label: "14. Enfermedades renales" },
    { name: "enfermedades_gastrointestinales", label: "15. Enfermedades gastrointestinales" },
    { name: "organos_de_los_sentidos", label: "16. Órganos de los sentidos" },
  ];

  const oralClinicalItems = [
    { name: "atm", label: "1. A.T.M" },
    { name: "labios", label: "2. Labios" },
    { name: "lengua", label: "3. Lengua" },
    { name: "paladar", label: "4. Paladar" },
    { name: "piso_de_boca", label: "5. Piso de boca" },
    { name: "carrillos", label: "6. Carrillos" },
    { name: "glandulas_salivales", label: "7. Glándulas salivales" },
    { name: "maxilares", label: "8. Maxilares" },
    { name: "senos_maxilares", label: "9. Senos maxilares" },
    { name: "musculos_masticatorios", label: "10. Músculos masticatorios" },
    { name: "ganglios", label: "11. Ganglios" },
    { name: "oclusion", label: "12. Oclusión" },
    { name: "frenillos", label: "13. Frenillos" },
    { name: "mucosas", label: "14. Mucosas" },
    { name: "encias", label: "15. Encías" },
    { name: "amigdalas", label: "16. Amígdalas" },
    { name: "trauma", label: "17. Trauma" },
    { name: "habitos", label: "18. Hábitos" },
  ];

  const dentalItems = [
    { name: "super_numerarios", label: "1. Super numerarios" },
    { name: "abrasion", label: "2. Abrasión" },
    { name: "manchas_cambio_color", label: "3. Manchas / Cambio de color" },
    { name: "patologia_pulpar_abcesos", label: "4. Patología pulpar / abscesos" },
    { name: "maloclusiones", label: "5. Maloclusiones" },
    { name: "incluidos", label: "6. Incluidos" },
  ];

  const periodontalItems = [
    { name: "bolsas", label: "1. Bolsas" },
    { name: "movilidad", label: "2. Movilidad" },
    { name: "placa_blanda", label: "3. Placa blanda" },
    { name: "calculos", label: "4. Cálculos" },
  ];

  return createPortal(
    <div
      className="mhc-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mhc-modal">
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
            <button className="mhc-modal-close" onClick={onClose} type="button">
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="mhc-modal-accent" />

        <div className="mhc-modal-body">
          {showForm ? (
            <div className="mhc-form-container">
              <div className="mhc-histories-header mhc-form-toolbar">
                <h3 className="mhc-form-title-inline">Nueva Historia Clínica Odontológica</h3>
                <button
                  className="mhc-btn-new"
                  type="button"
                  onClick={() => {
                    setForm(HISTORIA_EMPTY_FORM);
                    setShowForm(false);
                  }}
                >
                  <FiX size={14} />
                  Cerrar formulario
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mhc-form">
                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>Primer recuadro</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-grid-2">
                    {renderField({ label: "Medio de remisión", name: "medio_remision", placeholder: "Ej. Referido por consulta externa" })}
                    {renderField({ label: "Fecha", name: "fecha", type: "datetime-local" })}
                  </div>
                </details>

                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>I. Datos de identificación</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-grid-2">
                    {renderField({ label: "Nombre", name: "nombre", placeholder: "Nombre" })}
                    {renderField({ label: "Apellidos", name: "apellidos", placeholder: "Apellidos" })}
                    {renderField({ label: "Tipo de identificación", name: "tipo_identificacion", as: "select", options: [
                      { value: "", label: "Seleccionar..." },
                      { value: "CC", label: "CC" },
                      { value: "TI", label: "TI" },
                      { value: "CE", label: "CE" },
                      { value: "PA", label: "PA" },
                      { value: "RC", label: "RC" },
                    ] })}
                    {renderField({ label: "No. Identificación", name: "numero_identificacion", placeholder: "Número" })}
                    {renderField({ label: "De", name: "procedencia_identificacion", placeholder: "Procedencia de la identificación" })}
                    {renderField({ label: "Dirección", name: "direccion", placeholder: "Dirección de residencia" })}
                    {renderField({ label: "Teléfono", name: "telefono", placeholder: "Teléfono fijo" })}
                    {renderField({ label: "Celular", name: "celular", placeholder: "Celular" })}
                    {renderField({
                      label: "Ciudad / departamento",
                      name: "ciudad_departamento",
                      placeholder: "Buscar ciudad o departamento",
                      listId: "history-city-list",
                      options: cityOptions,
                    })}
                    {renderField({ label: "Correo electrónico", name: "correo_electronico", type: "email", placeholder: "correo@dominio.com" })}
                    {renderField({ label: "RH", name: "rh", placeholder: "A+, O-, etc." })}
                    {renderField({ label: "Eps", name: "eps", placeholder: "EPS" })}
                    {renderField({ label: "Fecha de nacimiento", name: "fecha_nacimiento", type: "date" })}
                    {renderField({ label: "Edad", name: "edad", type: "number", placeholder: "Edad" })}
                    {renderField({ label: "Sexo", name: "sexo", as: "select", options: [
                      { value: "", label: "Seleccionar..." },
                      { value: "M", label: "Masculino" },
                      { value: "F", label: "Femenino" },
                      { value: "O", label: "Otro" },
                    ]})}
                    {renderField({ label: "Estado civil", name: "estado_civil", as: "select", options: CIVIL_OPTIONS })}
                    {renderField({ label: "Ocupación", name: "ocupacion", placeholder: "Ocupación" })}
                  </div>
                </details>

                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>II. Anamnesis</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-stack-gap">
                    {renderField({ label: "Motivo de consulta", name: "motivo_consulta", as: "textarea", rows: 4, placeholder: "Cuadro de texto libre" })}

                    <div className="mhc-two-panels">
                      <div className="mhc-mini-panel">
                        <h4 className="mhc-mini-title">Datos Básicos</h4>
                        {renderStatusGrid(anamnesisLeft, BOOL_OPTIONS)}
                        <div className="mhc-mini-inline-fields">
                          {renderField({ label: "Observaciones", name: "observaciones", as: "textarea", rows: 2, placeholder: "Observaciones" })}
                          {renderField({ label: "Última visita al odontólogo", name: "ultima_visita_odontologo", type: "date" })}
                        </div>
                      </div>

                      <div className="mhc-mini-panel">
                        <h4 className="mhc-mini-title">Datos Básicos</h4>
                        {renderStatusGrid(anamnesisRight, BOOL_OPTIONS)}
                        <div className="mhc-mini-inline-fields">
                          {renderField({ label: "Otros", name: "otros", as: "textarea", rows: 2, placeholder: "Otros" })}
                          {renderField({ label: "Motivo", name: "motivo", as: "textarea", rows: 2, placeholder: "Motivo" })}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>

                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>III. Examen físico estomatológico</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-grid-2">
                    {renderField({ label: "Temperatura", name: "temperatura", placeholder: "Temperatura" })}
                    {renderField({ label: "Pulso", name: "pulso", placeholder: "Pulso" })}
                    {renderField({ label: "Tensión", name: "tension", placeholder: "Tensión" })}
                    {renderField({ label: "Respiración", name: "respiracion", placeholder: "Respiración" })}
                    {renderField({ label: "Higiene oral", name: "higiene_oral", as: "select", options: B_R_M_OPTIONS })}
                    {renderField({ label: "Cepillo dental", name: "cepillo_dental", as: "select", options: BOOL_OPTIONS })}
                    {renderField({ label: "Seda dental", name: "seda_dental", as: "select", options: BOOL_OPTIONS })}
                    {renderField({ label: "Enjuague bucal", name: "enjuague_bucal", as: "select", options: BOOL_OPTIONS })}
                    {renderField({ label: "Cuántas veces al día", name: "cuantas_veces_al_dia", type: "number", placeholder: "Número" })}
                  </div>
                </details>

                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>IV. Examen clínico odontológico</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-four-columns">
                    <div className="mhc-mini-panel">
                      <h4 className="mhc-mini-title">Examen clínico oral / normal / anormal</h4>
                      {renderStatusGrid(oralClinicalItems, NORMAL_OPTIONS)}
                    </div>

                    <div className="mhc-mini-panel">
                      <h4 className="mhc-mini-title">Examen dental</h4>
                      {renderStatusGrid(dentalItems, BOOL_OPTIONS)}
                    </div>

                    <div className="mhc-mini-panel mhc-mini-panel-full">
                      <h4 className="mhc-mini-title">Examen periodontal</h4>
                      {renderStatusGrid(periodontalItems, BOOL_OPTIONS)}
                      {renderField({ label: "Observaciones", name: "observaciones_examen", as: "textarea", rows: 3, placeholder: "Observaciones del examen" })}
                    </div>
                  </div>
                </details>

                <datalist id="history-city-list">
                  {cityOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>

                <div className="mhc-form-actions">
                  <button
                    type="button"
                    className="mhc-btn-ghost"
                    onClick={() => {
                      setShowForm(false);
                      setForm(HISTORIA_EMPTY_FORM);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="mhc-btn-primary" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Historia"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mhc-histories-container">
              <div className="mhc-histories-header">
                <h3>Historias Registradas</h3>
                <button
                  className="mhc-btn-new"
                  onClick={() => {
                    setForm(HISTORIA_EMPTY_FORM);
                    setShowForm(true);
                  }}
                  type="button"
                >
                  <FiPlus size={14} />
                  Nueva Historia
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
                    type="button"
                  >
                    Crear primera historia
                  </button>
                </div>
              ) : (
                <div className="mhc-histories-list">
                  {histories.map((history) => {
                    const historyData = history.history_data ?? {};
                    return (
                      <div key={history.id} className="mhc-history-card">
                        <div className="mhc-history-date">
                          {new Date(history.fecha ?? history.created_at ?? Date.now()).toLocaleString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="mhc-history-summary">
                          <span><b>Doctor:</b> {fieldToText(history.doctor || historyData.doctor)}</span>
                          <span><b>Medio de remisión:</b> {fieldToText(history.medio_remision || historyData.medio_remision)}</span>
                          <span><b>Motivo:</b> {fieldToText(history.motivo_consulta || historyData.motivo_consulta)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalHistoriaClinicaVW;
