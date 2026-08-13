import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createPatientHistoryCtrl,
  HISTORIA_EMPTY_FORM,
  loadHistoryCityDepartmentsCtrl,
  loadPatientHistoriesCtrl,
  updatePatientHistoryCtrl,
} from "../controllers/HistoriaClinicaCtrl";
import { supabase } from "../dao/SupabaseDAO";
import "../styles/ModalHistoriaClinicaVW.css";
import logoDark from "../assets/logo.png";
import logoLight from "../assets/logo1.png";
import { FiChevronDown, FiImage, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";
import OdontogramApp from "react-odontogram-editor-modul/src/App";
import "react-odontogram-editor-modul/src/index.css";
import {
  captureOdontogramState,
  clearOdontogramDraft,
  loadOdontogramDraft,
  restoreOdontogramState,
} from "../utils/odontogramPersistence";

const RADIOGRAPHY_BUCKET = "radiographies";

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

const nowForDatetimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const fieldToText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const ModalHistoriaClinicaVW = ({ patient, onClose, startInForm = false, initialHistory = null }) => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(startInForm);
  const [form, setForm] = useState(HISTORIA_EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);
  const [originalPatientData, setOriginalPatientData] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [selectedRadiographies, setSelectedRadiographies] = useState([]);
  const [clinicalNote, setClinicalNote] = useState("");
  const [radiographies, setRadiographies] = useState([]);
  const [savingMedia, setSavingMedia] = useState(false);
  const [mediaStatus, setMediaStatus] = useState("");
  const [editingHistoryId, setEditingHistoryId] = useState(null);

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
    if (!initialHistory) return;
    setShowForm(true);
    setEditingHistoryId(initialHistory.id);
    setForm(mapHistoryToForm(initialHistory));
    setOriginalPatientData(null);
    setSelectedRadiographies([]);
    setClinicalNote("");
    setMediaStatus("");
    setMediaOpen(false);
    if (initialHistory.odontograma) {
      window.setTimeout(() => restoreOdontogramState(initialHistory.odontograma), 0);
    }
    fetchRadiographies(initialHistory.id);
  }, [initialHistory]);

  useEffect(() => {
    if (!patient?.id || initialHistory) return;
    const draft = loadOdontogramDraft(patient.id);
    if (draft) {
      setForm((previous) => ({ ...previous, odontograma: draft }));
    }
  }, [patient?.id, initialHistory]);

  useEffect(() => {
    if (!showForm || !form.odontograma) return undefined;
    const restore = window.setTimeout(() => {
      restoreOdontogramState(form.odontograma);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [showForm, form.odontograma]);

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

  const mapHistoryToForm = (history) => {
    const data = history?.history_data ?? {};
    return {
      ...HISTORIA_EMPTY_FORM,
      ...data,
      medio_remision: history?.medio_remision ?? data.medio_remision ?? "",
      fecha: history?.fecha
        ? new Date(history.fecha).toISOString().slice(0, 16)
        : data.fecha ?? nowForDatetimeLocal(),
      motivo_consulta: history?.motivo_consulta ?? data.motivo_consulta ?? "",
      odontograma: history?.odontograma ?? data.odontograma ?? "",
    };
  };

  const fetchRadiographies = async (historyId = editingHistoryId) => {
    try {
      if (!historyId) {
        setRadiographies([]);
        return;
      }

      const { data, error } = await supabase
        .from("radiographies")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("clinical_history_id", historyId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const rows = await Promise.all((data ?? []).map(async (row) => {
        if (row.image_url) return row;
        if (!row.file_path) return row;

        const { data: signedData, error: signedError } = await supabase.storage
          .from(RADIOGRAPHY_BUCKET)
          .createSignedUrl(row.file_path, 60 * 60 * 24 * 7);

        if (!signedError && signedData?.signedUrl) {
          return { ...row, image_url: signedData.signedUrl };
        }

        const { data: publicData } = supabase.storage
          .from(RADIOGRAPHY_BUCKET)
          .getPublicUrl(row.file_path);

        return { ...row, image_url: publicData?.publicUrl || "" };
      }));

      setRadiographies(rows);
    } catch (error) {
      console.error("Error cargando radiografías:", error);
    }
  };

  const handleDeleteRadiography = async (radiography) => {
    const confirmed = window.confirm(
      `¿Quieres eliminar la radiografía "${radiography.file_name || "seleccionada"}"?`,
    );
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from("radiographies")
        .delete()
        .eq("id", radiography.id);

      if (deleteError) throw deleteError;

      if (radiography.file_path) {
        const { error: storageError } = await supabase.storage
          .from(RADIOGRAPHY_BUCKET)
          .remove([radiography.file_path]);

        if (storageError) {
          console.warn("La radiografía se eliminó de la base de datos, pero no del almacenamiento:", storageError);
        }
      }

      setRadiographies((current) => current.filter((item) => item.id !== radiography.id));
      setMediaStatus("Radiografía eliminada correctamente.");
    } catch (error) {
      console.error("Error eliminando radiografía:", error);
      setMediaStatus(error?.message || "No se pudo eliminar la radiografía.");
    }
  };

  const buildStoragePath = (file) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    return `${patient.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  };

  const handleSaveMedia = async () => {
    const note = clinicalNote.trim();
    if (!selectedRadiographies.length && !note) {
      setMediaStatus("Agrega al menos una radiografía o una nota clínica.");
      return;
    }

    setSavingMedia(true);
    setMediaStatus("");

    try {
      if (selectedRadiographies.length > 0) {
        const uploads = [];

        for (const file of selectedRadiographies) {
          const filePath = buildStoragePath(file);
          const { error: uploadError } = await supabase.storage
            .from(RADIOGRAPHY_BUCKET)
            .upload(filePath, file, {
              cacheControl: "3600",
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });

          if (uploadError) {
            throw new Error(
              uploadError.message || "No se pudo subir la radiografía a Storage",
            );
          }

          uploads.push({
            patient_id: patient.id,
            clinical_history_id: editingHistoryId,
            file_path: filePath,
            file_name: file.name,
            description: note || null,
            metadata: {
              size: file.size,
              type: file.type,
            },
          });
        }

        const { error: insertError } = await supabase
          .from("radiographies")
          .insert(uploads);

        if (insertError) {
          throw new Error(
            insertError.message || "No se pudo guardar el registro de radiografía",
          );
        }
      }

      setSelectedRadiographies([]);
      setClinicalNote("");
      setMediaOpen(false);
      setMediaStatus("Guardado correctamente.");
      await fetchRadiographies();
      await fetchHistories();
    } catch (error) {
      console.error("Error guardando radiografías y nota:", error);
      setMediaStatus(error?.message || "No se pudo guardar la información. Revisa la consola.");
    } finally {
      setSavingMedia(false);
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
    setMediaStatus("");

    try {
      const currentOdontogram = await captureOdontogramState();
      const historyForm = currentOdontogram
        ? { ...form, odontograma: currentOdontogram }
        : form;
      const note = clinicalNote.trim();
      const result = editingHistoryId
        ? await updatePatientHistoryCtrl(patient.id, editingHistoryId, historyForm)
        : await createPatientHistoryCtrl(patient.id, historyForm, originalPatientData);

      if (!result.ok) {
        if (result.error) console.error("Error guardando historia:", result.error);
        alert(result.message);
        return;
      }

      if (selectedRadiographies.length > 0) {
        const uploads = [];

        for (const file of selectedRadiographies) {
          const filePath = buildStoragePath(file);
          const { error: uploadError } = await supabase.storage
            .from(RADIOGRAPHY_BUCKET)
            .upload(filePath, file, {
              cacheControl: "3600",
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });

          if (uploadError) {
            throw new Error(
              uploadError.message || "No se pudo subir la radiografía a Storage",
            );
          }

          uploads.push({
            patient_id: patient.id,
            clinical_history_id: result.historyId,
            file_path: filePath,
            file_name: file.name,
            description: note || null,
            metadata: {
              size: file.size,
              type: file.type,
            },
          });
        }

        const { error: insertError } = await supabase
          .from("radiographies")
          .insert(uploads);

        if (insertError) {
          throw new Error(
            insertError.message || "No se pudo guardar el registro de radiografía",
          );
        }
      }

      alert(result.message);
      clearOdontogramDraft(patient.id);
      setForm(HISTORIA_EMPTY_FORM);
      setShowForm(false);
      setOriginalPatientData(null);
      setEditingHistoryId(null);
      setSelectedRadiographies([]);
      setClinicalNote("");
      setMediaOpen(false);
      setMediaStatus("Guardado correctamente.");
      await fetchHistories();
      await fetchRadiographies(result.historyId);
    } catch (error) {
      console.error("Error guardando historia y radiografías:", error);
      setMediaStatus(error?.message || "No se pudo guardar la información. Revisa la consola.");
    }
    setSaving(false);
  };

  const handleNewHistory = () => {
    setForm(HISTORIA_EMPTY_FORM);
    setShowForm(true);
    setEditingHistoryId(null);
    setOriginalPatientData(null);
  };

  const handleEditHistory = (history) => {
    setForm(mapHistoryToForm(history));
    setShowForm(true);
    setEditingHistoryId(history.id);
    setOriginalPatientData(null);
  };

  const handleDeleteHistory = async (history) => {
    const confirmed = window.confirm("¿Estás seguro de que quieres eliminar esta historia clínica?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("clinical_histories")
        .delete()
        .eq("id", history.id);

      if (error) {
        throw new Error(error.message || "No se pudo eliminar la historia clínica");
      }

      alert("Historia clínica eliminada correctamente");
      await fetchHistories();
    } catch (error) {
      console.error("Error eliminando historia clínica:", error);
      setMediaStatus(error?.message || "No se pudo eliminar la historia clínica. Revisa la consola.");
    }
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
            <div
              className="mhc-logo-wrap"
              role="button"
              tabIndex={0}
              title="Ver odontograma del paciente"
              onClick={() => setShowForm(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowForm(true); } }}
            >
              <img src={logoLight} alt="Rave" className="mhc-logo-light mhc-logo" />
              <img src={logoDark} alt="Rave" className="mhc-logo-dark mhc-logo" />
            </div>
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
                <h3 className="mhc-form-title-inline">
                  {editingHistoryId ? "Editar Historia" : "Nueva Historia"}
                </h3>
                <button
                  className="mhc-btn-new"
                  type="button"
                  onClick={() => {
                    setForm(HISTORIA_EMPTY_FORM);
                    setShowForm(false);
                    setEditingHistoryId(null);
                  }}
                >
                  <FiX size={18} /> Cerrar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mhc-form">
                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span></span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-grid-2 mhc-grid-compact">
                    {renderField({ label: "Medio de remisión", name: "medio_remision", placeholder: "Ej. Referido por consulta externa" })}
                    {renderField({ label: "Fecha", name: "fecha", type: "datetime-local" })}
                  </div>
                </details>

                <details className="mhc-accordion" open>
                  <summary className="mhc-accordion-summary">
                    <span>I. Datos de identificación</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-grid-id">
                    {renderField({ label: "Nombre", name: "nombre", placeholder: "Nombre" })}
                    {renderField({ label: "Apellidos", name: "apellidos", placeholder: "Apellidos" })}
                    {renderField({
                      label: "Tipo de identificación", name: "tipo_identificacion", as: "select", options: [
                        { value: "", label: "Seleccionar..." },
                        { value: "CC", label: "CC" },
                        { value: "TI", label: "TI" },
                        { value: "CE", label: "CE" },
                        { value: "PA", label: "PA" },
                        { value: "RC", label: "RC" },
                      ]
                    })}
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
                    {renderField({
                      label: "Sexo", name: "sexo", as: "select", options: [
                        { value: "", label: "Seleccionar..." },
                        { value: "M", label: "Masculino" },
                        { value: "F", label: "Femenino" },
                        { value: "O", label: "Otro" },
                      ]
                    })}
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

                <details className="mhc-accordion mhc-odontogram-accordion">
                  <summary className="mhc-accordion-summary">
                    <span>V. Odontograma</span>
                    <FiChevronDown className="mhc-accordion-icon" size={16} />
                  </summary>
                  <div className="mhc-accordion-body mhc-odontogram-body">
                    <p className="mhc-odontogram-help">
                      Registra el estado dental del paciente. Se guardará junto con esta historia clínica.
                    </p>
                    <div
                      className="mhc-odontogram-editor"
                      onClick={(event) => {
                        if (event.target.closest("button")) event.preventDefault();
                      }}
                    >
                      <OdontogramApp
                        title={`Odontograma - ${patient.nombre} ${patient.apellidos}`}
                        patientName={String(patient.numero_documento ?? '').trim()}
                        numberingSystem="FDI"
                      />
                    </div>
                  </div>
                </details>

                <datalist id="history-city-list">
                  {cityOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>

                <details className="pd-accordion pd-accordion-media" open={mediaOpen} onToggle={(event) => setMediaOpen(event.currentTarget.open)}>
                  <summary className="pd-accordion-summary">
                    <span>Radiografías y notas clínicas</span>
                    <span className="pd-accordion-chevron"><FiChevronDown size={14} /></span>
                  </summary>
                  <div className="pd-accordion-body">
                    <div className="pd-media-grid">
                      <div className="pd-media-panel">
                        <h3 className="pd-section-title">Subir radiografías</h3>
                        <label className="pd-upload-box">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="pd-upload-input"
                            onChange={(event) => setSelectedRadiographies(Array.from(event.target.files ?? []))}
                          />
                          <span>Haz clic o arrastra aquí tus archivos</span>
                          <small>JPG, PNG o WEBP</small>
                        </label>

                        {selectedRadiographies.length > 0 && (
                          <div className="pd-upload-list">
                            {selectedRadiographies.map((file) => (
                              <div key={`${file.name}-${file.lastModified}`} className="pd-upload-item">
                                <FiImage size={14} />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pd-media-panel">
                        <h3 className="pd-section-title">Notas clínicas</h3>
                        <textarea
                          className="pd-notes-textarea"
                          placeholder="Escribe aquí las notas clínicas del paciente..."
                          value={clinicalNote}
                          onChange={(event) => setClinicalNote(event.target.value)}
                        />
                        {mediaStatus ? <small className="pd-info-message">{mediaStatus}</small> : null}
                      </div>
                    </div>

                    {radiographies.length > 0 && (
                      <div className="pd-section pd-section-radiographies">
                        <h3 className="pd-section-title">Radiografías registradas</h3>
                        <div className="pd-radiographies">
                          {radiographies.map((radio) => (
                            <div key={radio.id} className="pd-radiography-item">
                              {radio.image_url ? (
                                <img
                                  src={radio.image_url}
                                  alt={radio.type || 'Radiografía'}
                                  className="pd-radiography-image"
                                />
                              ) : (
                                <div className="pd-radiography-placeholder">
                                  <FiImage size={24} />
                                </div>
                              )}
                              <p className="pd-radiography-type">{radio.type || 'Radiografía'}</p>
                              <p className="pd-radiography-date">
                                {radio.created_at?.split('T')[0] || '—'}
                              </p>
                              <button
                                type="button"
                                className="pd-radiography-delete"
                                onClick={() => handleDeleteRadiography(radio)}
                                title="Eliminar radiografía"
                              >
                                <FiTrash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>

                <div className="mhc-form-actions">
                  <button
                    type="button"
                    className="mhc-btn-ghost"
                    onClick={() => {
                      setShowForm(false);
                      setForm(HISTORIA_EMPTY_FORM);
                      setEditingHistoryId(null);
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
                  onClick={handleNewHistory}
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
                        <div className="mhc-history-actions">
                          <button
                            type="button"
                            className="mhc-btn-ghost"
                            onClick={() => handleEditHistory(history)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="mhc-btn-danger"
                            onClick={() => handleDeleteHistory(history)}
                          >
                            Eliminar
                          </button>
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
