import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../dao/SupabaseDAO';
import { deletePatientHistoryCtrl, loadPatientHistoriesCtrl } from '../controllers/HistoriaClinicaCtrl';
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiPhone,
  FiMail,
  FiEdit,
  FiPlus,
  FiChevronDown,
  FiImage,
  FiSave,
} from 'react-icons/fi'
import OdontogramApp from 'react-odontogram-editor-modul/src/App';
import 'react-odontogram-editor-modul/src/index.css';
import ModalPatientsVW from '../modals/ModalPatientsVW';
import ModalHistoriaClinicaVW from '../modals/ModalHistoriaClinicaVW';
import { usePatientModal } from '../hooks/usePatientModal';
import LoaderVW from '../components/LoaderVW';
import '../styles/PatientDetailVW.css';

const PatientDetailVW = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [procedures, setProcedures] = useState([]);
  const [clinicalHistories, setClinicalHistories] = useState([]);
  const [radiographies, setRadiographies] = useState([]);
  const [numberingSystem, setNumberingSystem] = useState('FDI');
  const [odontogramOpen, setOdontogramOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [selectedRadiographies, setSelectedRadiographies] = useState([]);
  const [clinicalNote, setClinicalNote] = useState('');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyToEdit, setHistoryToEdit] = useState(null);

  // Usar el custom hook para la lógica del modal
  const patientModal = usePatientModal(() => fetchPatientData());

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch procedures if exists
      const { data: procedureData } = await supabase
        .from('procedures')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (procedureData) setProcedures(procedureData);

      const clinicalHistoriesData = await loadPatientHistoriesCtrl(patientId);
      setClinicalHistories(clinicalHistoriesData);

      // Fetch radiographies if exists
      const { data: radiographyData } = await supabase
        .from('radiographies')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (radiographyData) setRadiographies(radiographyData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewHistoryModal = () => {
    setHistoryToEdit(null);
    setHistoryModalOpen(true);
  };

  const openEditHistoryModal = (history) => {
    setHistoryToEdit(history);
    setHistoryModalOpen(true);
  };

  const handleDeleteHistory = async (history) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar esta historia clínica?');
    if (!confirmed) return;

    const result = await deletePatientHistoryCtrl(history.id);
    if (!result.ok) {
      alert(result.message);
      return;
    }

    alert(result.message);
    await fetchPatientData();
  };

  const patientName = patient
    ? String(patient.numero_documento ?? '').trim()
    : '';

  const odontogramTitle = patient
    ? `Módulo de Odontograma - ${patient.nombre} ${patient.apellidos}`
    : 'Módulo de Odontograma';

  if (loading) {
    return (
      <div className="pd-page">
        <LoaderVW text="Cargando informacion del paciente..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="pd-page">
        <div className="pd-error">
          <p>Paciente no encontrado</p>
          <button className="pd-btn-secondary" onClick={() => navigate('/pacientes')}>
            Volver a pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      {/* ── HEADER ── */}
      <div className="pd-header">
        <button className="pd-btn-back" onClick={() => navigate('/pacientes')} title="Volver">
          <FiArrowLeft size={20} />
        </button>

        <div className="pd-header-info">
          <div className="pd-avatar-large">
            {(patient.nombre?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="pd-patient-header">
            <div className="pd-name-badge">
              <h1>{patient.nombre} {patient.apellidos}</h1>
              <span className="pd-status-badge">
                <FiAlertTriangle size={14} />
                {patient.alergias}</span>
            </div>
            <div className="pd-header-details">
              <div className="pd-detail-item">
                <span className="pd-label">{patient.edad ? `${patient.edad} años` : '—'}</span>
                <span className="pd-label">•</span>
                <span className="pd-label">{patient.sexo === 'M' ? 'Masculino' : patient.sexo === 'F' ? 'Femenino' : '—'}</span>
                <span className="pd-label">•</span>
                <span className="pd-label">No. Documento: {patient.numero_documento}</span>
              </div>
              <div className="pd-contact-info">
                <span className="pd-phone">
                  <FiPhone size={14} />
                  {patient.celular || '—'}
                </span>
                <span className="pd-email">
                  <FiMail size={14} />
                  {patient.email || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pd-header-actions">

          <button className="pd-btn-action-primary" 
          onClick={() => patientModal.openEditModal(patient)}>
            <FiEdit size={14} />
            Editar
          </button>

          <button className="pd-btn-action-secondary">
            <FiPlus size={14} />
            Nueva cita
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="pd-tabs">
        <button
          className={`pd-tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Datos personales
        </button>
        <button
          className={`pd-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial médico
        </button>
        <button
          className={`pd-tab ${activeTab === 'treatments' ? 'active' : ''}`}
          onClick={() => setActiveTab('treatments')}
        >
          Tratamientos y odontograma
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className="pd-content">
        {/* ── TAB: PERSONAL DATA ── */}
        {activeTab === 'personal' && (
          <div className="pd-tab-content">
            <div className="pd-info-grid">
              <div className="pd-info-card">
                <h3>Información Personal</h3>
                <div className="pd-info-row">
                  <span className="pd-info-label">Nombre completo:</span>
                  <span className="pd-info-value">{patient.nombre} {patient.apellidos}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Fecha de nacimiento:</span>
                  <span className="pd-info-value">{patient.fecha_nacimiento || '—'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Sexo:</span>
                  <span className="pd-info-value">
                    {patient.sexo === 'M' ? 'Masculino' : patient.sexo === 'F' ? 'Femenino' : '—'}
                  </span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Tipo de documento:</span>
                  <span className="pd-info-value">{patient.tipo_documento} {patient.numero_documento}</span>
                </div>
              </div>

              <div className="pd-info-card">
                <h3>Información de Contacto</h3>
                <div className="pd-info-row">
                  <span className="pd-info-label">Teléfono:</span>
                  <span className="pd-info-value">{patient.telefono || '—'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Celular:</span>
                  <span className="pd-info-value">{patient.celular || '—'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Email:</span>
                  <span className="pd-info-value">{patient.email || '—'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Dirección:</span>
                  <span className="pd-info-value">{patient.direccion || '—'}</span>
                </div>
              </div>

              <div className="pd-info-card">
                <h3>Información Médica</h3>
                <div className="pd-info-row">
                  <span className="pd-info-label">EPS:</span>
                  <span className="pd-info-value">{patient.eps || '—'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Alergias:</span>
                  <span className="pd-info-value">{patient.alergias || 'No registradas'}</span>
                </div>
                <div className="pd-info-row">
                  <span className="pd-info-label">Observaciones:</span>
                  <span className="pd-info-value">{patient.observaciones || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MEDICAL HISTORY ── */}
        {activeTab === 'history' && (
          <div className="pd-tab-content">
            <div className="pd-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h3 className="pd-section-title" style={{ margin: 0 }}>Historias clínicas registradas</h3>
                <button className="pd-btn-action-primary" type="button" onClick={openNewHistoryModal}>
                  <FiPlus size={14} />
                  Nueva historia clínica
                </button>
              </div>
              {clinicalHistories.length > 0 ? (
                <div className="mhc-histories-list" style={{ marginTop: 0 }}>
                  {clinicalHistories.map((history) => {
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
                          <span><b>Doctor:</b> {history.doctor || historyData.doctor || '—'}</span>
                          <span><b>Medio de remisión:</b> {history.medio_remision || historyData.medio_remision || '—'}</span>
                          <span><b>Motivo:</b> {history.motivo_consulta || historyData.motivo_consulta || '—'}</span>
                        </div>
                        <div className="pd-history-actions">
                          <button
                            type="button"
                            className="pd-history-action pd-history-action-edit"
                            onClick={() => openEditHistoryModal(history)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="pd-history-action pd-history-action-delete"
                            onClick={() => handleDeleteHistory(history)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {procedures.length > 0 ? (
                <div className="pd-procedures-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Diente</th>
                        <th>Procedimiento</th>
                        <th>Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procedures.map((proc) => (
                        <tr key={proc.id}>
                          <td>{proc.fecha || proc.created_at?.split('T')[0] || '—'}</td>
                          <td>{proc.tooth_number || '—'}</td>
                          <td>{proc.procedure_name || '—'}</td>
                          <td>${proc.cost || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="pd-empty-message">No hay procedimientos registrados</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: TREATMENTS & ODONTOGRAM ── */}
        {activeTab === 'treatments' && (
          <div className="pd-tab-content">
            <details className="pd-accordion pd-accordion-odontogram" open={odontogramOpen} onToggle={(event) => setOdontogramOpen(event.currentTarget.open)}>
              <summary className="pd-accordion-summary">
                <span>Odontograma</span>
                <span className="pd-accordion-chevron"><FiChevronDown size={14} /></span>
              </summary>
              <div className="pd-accordion-body pd-section-odontogram">
                <div className="pd-odontogram-container">
                  <OdontogramApp
                    title={odontogramTitle}
                    patientName={patientName}
                    numberingSystem={numberingSystem}
                    onNumberingChange={setNumberingSystem}
                  />
                </div>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      <ModalPatientsVW
        showModal={patientModal.showModal}
        closeModal={patientModal.closeModal}
        form={patientModal.form}
        setForm={patientModal.setForm}
        step={patientModal.step}
        setStep={patientModal.setStep}
        handleSubmit={patientModal.handleSubmit}
        canNext={patientModal.canNext}
        isEditing={!!patientModal.editingId}
      />

      {historyModalOpen && (
        <ModalHistoriaClinicaVW
          patient={patient}
          onClose={() => {
            setHistoryModalOpen(false);
            setHistoryToEdit(null);
          }}
          startInForm={true}
          initialHistory={historyToEdit}
        />
      )}
    </div>
  );
};

export default PatientDetailVW;
