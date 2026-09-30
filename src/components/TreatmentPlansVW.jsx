import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiPlus, FiX } from 'react-icons/fi';
import { showAlertModal } from '../app/store';
import {
  TREATMENT_STATUSES,
  addTreatmentCtrl,
  addTreatmentMaterialCtrl,
  cancelTreatmentPlanCtrl,
  closeTreatmentPlanCtrl,
  createTreatmentPlanCtrl,
  loadTreatmentPlansCtrl,
  registerPlanConsentCtrl,
  removeTreatmentMaterialCtrl,
  reopenTreatmentPlanCtrl,
  updateTreatmentPlanCtrl,
  updateTreatmentStatusCtrl,
} from '../controllers/TreatmentPlansCtrl';
import LoaderVW from './LoaderVW';

const today = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
};

const EMPTY_PLAN_FORM = { title: '', clinical_history_id: '', diagnosis: '', notes: '' };
const emptyTreatmentForm = () => ({ procedure_catalog_id: '', tooth_number: '', procedure_date: today(), quantity: '1', unit_price: '', notes: '' });
const EMPTY_CONSENT_FORM = { content: '', patient_signature_name: '', aceptado: true };
const EMPTY_MATERIAL_FORM = { inventory_item_id: '', quantity: '1' };

const PLAN_PILL = { Abierto: 'good', Cerrado: 'muted', Cancelado: 'bad' };
const CONSENT_PILL = { Aceptado: 'good', Rechazado: 'bad', 'Sin consentimiento': 'warn' };

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('es-CO') : '—');

// CU-10 (planes y tratamientos), CU-18 (consentimiento ligado al plan) y CU-11
// (materiales de inventario que consume cada tratamiento).
const TreatmentPlansVW = ({ patientId, onConsentRegistered = () => {} }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ plans: [], unplannedTreatments: [], catalog: [], inventoryItems: [], histories: [] });
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanForm, setEditPlanForm] = useState(EMPTY_PLAN_FORM);
  const [treatmentForms, setTreatmentForms] = useState({});
  const [consentPlanId, setConsentPlanId] = useState(null);
  const [consentForm, setConsentForm] = useState(EMPTY_CONSENT_FORM);
  const [materialTreatmentId, setMaterialTreatmentId] = useState(null);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL_FORM);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const result = await loadTreatmentPlansCtrl(patientId);
      setData(result);
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudieron cargar los planes de tratamiento: ${error.message}`, variant: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Ejecuta una accion del controlador, muestra el error si falla y recarga si funciona.
  const run = async (action) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      dispatch(showAlertModal({ message: result.message, variant: 'error' }));
      return false;
    }
    await load();
    return true;
  };

  const openNewPlan = () => {
    setPlanForm({ ...EMPTY_PLAN_FORM, clinical_history_id: data.histories[0]?.id ?? '' });
    setShowNewPlan(true);
  };

  const submitNewPlan = async (event) => {
    event.preventDefault();
    if (await run(() => createTreatmentPlanCtrl(patientId, planForm))) setShowNewPlan(false);
  };

  const startEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setEditPlanForm({ title: plan.title, clinical_history_id: plan.clinical_history_id ?? '', diagnosis: plan.diagnosis ?? '', notes: plan.notes ?? '' });
  };

  const submitEditPlan = async (event) => {
    event.preventDefault();
    if (await run(() => updateTreatmentPlanCtrl(editingPlanId, editPlanForm))) setEditingPlanId(null);
  };

  const closePlan = (plan) => {
    const notes = window.prompt('Notas de cierre del plan (opcional):', '');
    if (notes === null) return;
    run(() => closeTreatmentPlanCtrl(plan, notes));
  };

  const cancelPlan = (plan) => {
    const motivo = window.prompt('Motivo de cancelación del plan. Los tratamientos pendientes también se cancelarán:');
    if (motivo === null) return;
    run(() => cancelTreatmentPlanCtrl(plan, motivo));
  };

  const getTreatmentForm = (planId) => treatmentForms[planId] ?? emptyTreatmentForm();
  const setTreatmentForm = (planId, patch) =>
    setTreatmentForms((current) => ({ ...current, [planId]: { ...getTreatmentForm(planId), ...patch } }));

  const submitTreatment = async (event, plan) => {
    event.preventDefault();
    const ok = await run(() => addTreatmentCtrl({ patientId, plan, form: getTreatmentForm(plan.id), catalog: data.catalog }));
    if (ok) setTreatmentForms((current) => ({ ...current, [plan.id]: emptyTreatmentForm() }));
  };

  const submitConsent = async (event, plan) => {
    event.preventDefault();
    const ok = await run(async () => {
      const result = await registerPlanConsentCtrl({ patientId, planId: plan.id, form: consentForm });
      if (result.ok) onConsentRegistered({ ...result.consent, treatment_plans: { title: plan.title } });
      return result;
    });
    if (ok) {
      setConsentPlanId(null);
      setConsentForm(EMPTY_CONSENT_FORM);
    }
  };

  const submitMaterial = async (event, treatment) => {
    event.preventDefault();
    const ok = await run(() => addTreatmentMaterialCtrl(treatment.id, materialForm));
    if (ok) {
      setMaterialTreatmentId(null);
      setMaterialForm(EMPTY_MATERIAL_FORM);
    }
  };

  const renderTreatmentsTable = (treatments, editable) => (
    <div className="pd-procedures-table">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Diente</th>
            <th>Tratamiento</th>
            <th>Valor</th>
            <th>Materiales</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {treatments.length === 0 ? (
            <tr><td colSpan="6">Aún no hay tratamientos en este plan.</td></tr>
          ) : treatments.map((treatment) => (
            <tr key={treatment.id}>
              <td>{treatment.procedure_date}</td>
              <td>{treatment.tooth_number || '—'}</td>
              <td>{treatment.procedure_catalog?.name || '—'}</td>
              <td>{money(treatment.total_price)}</td>
              <td>
                <div className="pd-materials">
                  {(treatment.treatment_inventory_items ?? []).map((material) => (
                    <span key={material.id} className="pd-material-chip" title={material.deducted_at ? 'Descontado del inventario' : 'Se descuenta al realizar el tratamiento'}>
                      {material.inventory_items?.name} × {Number(material.quantity)} {material.inventory_items?.unit}
                      {material.deducted_at ? ' ✓' : editable && (
                        <button type="button" onClick={() => run(() => removeTreatmentMaterialCtrl(material.id))} disabled={busy} aria-label="Quitar material">
                          <FiX size={11} />
                        </button>
                      )}
                    </span>
                  ))}
                  {editable && treatment.status !== 'Cancelado' && (
                    materialTreatmentId === treatment.id ? (
                      <form className="pd-inline-form" onSubmit={(event) => submitMaterial(event, treatment)}>
                        <select value={materialForm.inventory_item_id} onChange={(event) => setMaterialForm({ ...materialForm, inventory_item_id: event.target.value })}>
                          <option value="">Material...</option>
                          {data.inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>{item.name} ({Number(item.stock)} {item.unit})</option>
                          ))}
                        </select>
                        <input type="number" min="0.01" step="0.01" value={materialForm.quantity} onChange={(event) => setMaterialForm({ ...materialForm, quantity: event.target.value })} style={{ width: 70 }} />
                        <button type="submit" className="pd-history-action pd-history-action-edit" disabled={busy}>Agregar</button>
                        <button type="button" className="pd-history-action" onClick={() => setMaterialTreatmentId(null)}>Cancelar</button>
                      </form>
                    ) : (
                      <button type="button" className="pd-link-button" onClick={() => { setMaterialTreatmentId(treatment.id); setMaterialForm(EMPTY_MATERIAL_FORM); }}>
                        + material
                      </button>
                    )
                  )}
                </div>
              </td>
              <td>
                <select
                  value={treatment.status}
                  disabled={!editable || busy}
                  onChange={(event) => run(() => updateTreatmentStatusCtrl(treatment.id, event.target.value))}
                  aria-label="Estado del tratamiento"
                >
                  {TREATMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <LoaderVW text="Cargando planes de tratamiento..." className="loader-inline" />;

  return (
    <div className="pd-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h3 className="pd-section-title" style={{ margin: 0 }}>Planes de tratamiento</h3>
        <button className="pd-btn-action-primary" type="button" onClick={openNewPlan} disabled={showNewPlan}>
          <FiPlus size={14} />
          Nuevo plan
        </button>
      </div>

      {showNewPlan && (
        data.histories.length === 0 ? (
          <p className="pd-info-value">
            El paciente no tiene historias clínicas vigentes. Registra una en la pestaña "Historial médico" antes de crear el plan.
          </p>
        ) : (
          <form className="pd-info-card pd-plan-form" onSubmit={submitNewPlan}>
            <label className="pd-info-label" htmlFor="plan-title">Título</label>
            <input id="plan-title" value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })} placeholder="Ej. Rehabilitación sector posterior" />
            <label className="pd-info-label" htmlFor="plan-history">Historia clínica</label>
            <select id="plan-history" value={planForm.clinical_history_id} onChange={(event) => setPlanForm({ ...planForm, clinical_history_id: event.target.value })}>
              {data.histories.map((history) => (
                <option key={history.id} value={history.id}>
                  {formatDate(history.fecha ?? history.created_at)} · {history.motivo_consulta || 'Sin motivo registrado'}
                </option>
              ))}
            </select>
            <label className="pd-info-label" htmlFor="plan-diagnosis">Diagnóstico</label>
            <textarea id="plan-diagnosis" rows={2} value={planForm.diagnosis} onChange={(event) => setPlanForm({ ...planForm, diagnosis: event.target.value })} />
            <label className="pd-info-label" htmlFor="plan-notes">Notas</label>
            <textarea id="plan-notes" rows={2} value={planForm.notes} onChange={(event) => setPlanForm({ ...planForm, notes: event.target.value })} />
            <div className="pd-history-actions">
              <button type="submit" className="pd-btn-action-primary" disabled={busy}>Crear plan</button>
              <button type="button" className="pd-btn-secondary" onClick={() => setShowNewPlan(false)}>Cancelar</button>
            </div>
          </form>
        )
      )}

      {data.plans.length === 0 && !showNewPlan && (
        <p className="pd-info-value">No hay planes de tratamiento registrados.</p>
      )}

      {data.plans.map((plan) => {
        const isOpen = plan.status === 'Abierto';
        const treatmentForm = getTreatmentForm(plan.id);
        const history = data.histories.find((item) => item.id === plan.clinical_history_id);

        return (
          <div key={plan.id} className="pd-plan-card">
            <div className="pd-plan-header">
              <div>
                <h4>{plan.title}</h4>
                <div className="pd-plan-meta">
                  Inicio {formatDate(`${plan.start_date}T00:00:00`)}
                  {history ? ` · Historia del ${formatDate(history.fecha ?? history.created_at)}` : ''}
                  {plan.closed_at ? ` · ${plan.status} el ${formatDate(plan.closed_at)}` : ''}
                </div>
              </div>
              <span className={`pd-pill ${PLAN_PILL[plan.status]}`}>{plan.status}</span>
            </div>

            {editingPlanId === plan.id ? (
              <form className="pd-plan-form" onSubmit={submitEditPlan}>
                <label className="pd-info-label">Título</label>
                <input value={editPlanForm.title} onChange={(event) => setEditPlanForm({ ...editPlanForm, title: event.target.value })} />
                <label className="pd-info-label">Diagnóstico</label>
                <textarea rows={2} value={editPlanForm.diagnosis} onChange={(event) => setEditPlanForm({ ...editPlanForm, diagnosis: event.target.value })} />
                <label className="pd-info-label">Notas</label>
                <textarea rows={2} value={editPlanForm.notes} onChange={(event) => setEditPlanForm({ ...editPlanForm, notes: event.target.value })} />
                <div className="pd-history-actions">
                  <button type="submit" className="pd-btn-action-primary" disabled={busy}>Guardar</button>
                  <button type="button" className="pd-btn-secondary" onClick={() => setEditingPlanId(null)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="mhc-history-summary">
                {plan.diagnosis && <span><b>Diagnóstico:</b> {plan.diagnosis}</span>}
                {plan.notes && <span><b>Notas:</b> {plan.notes}</span>}
                {!isOpen && plan.closing_notes && <span><b>{plan.status === 'Cancelado' ? 'Motivo de cancelación' : 'Notas de cierre'}:</b> {plan.closing_notes}</span>}
              </div>
            )}

            <div className="pd-plan-consent">
              <span>Consentimiento informado:</span>
              <span className={`pd-pill ${CONSENT_PILL[plan.consentStatus]}`}>{plan.consentStatus}</span>
              {plan.consents[0] && (
                <span className="pd-plan-meta">
                  {plan.consents[0].patient_signature_name} · {new Date(plan.consents[0].signed_at).toLocaleString('es-CO')}
                </span>
              )}
              {isOpen && consentPlanId !== plan.id && (
                <button type="button" className="pd-link-button" onClick={() => { setConsentPlanId(plan.id); setConsentForm(EMPTY_CONSENT_FORM); }}>
                  Registrar consentimiento
                </button>
              )}
            </div>

            {consentPlanId === plan.id && (
              <form className="pd-plan-form" onSubmit={(event) => submitConsent(event, plan)}>
                <label className="pd-info-label">Información presentada al paciente</label>
                <textarea rows={3} value={consentForm.content} onChange={(event) => setConsentForm({ ...consentForm, content: event.target.value })} placeholder="Procedimientos del plan, riesgos, alternativas y costos explicados." />
                <label className="pd-info-label">Firma (nombre de quien autoriza)</label>
                <input value={consentForm.patient_signature_name} onChange={(event) => setConsentForm({ ...consentForm, patient_signature_name: event.target.value })} placeholder="Nombre del paciente o acudiente" />
                <label className="pd-info-label">Decisión del paciente</label>
                <select value={consentForm.aceptado ? 'si' : 'no'} onChange={(event) => setConsentForm({ ...consentForm, aceptado: event.target.value === 'si' })}>
                  <option value="si">Acepta el tratamiento</option>
                  <option value="no">No acepta (queda registrada la negativa)</option>
                </select>
                <div className="pd-history-actions">
                  <button type="submit" className="pd-btn-action-primary" disabled={busy}>Registrar</button>
                  <button type="button" className="pd-btn-secondary" onClick={() => setConsentPlanId(null)}>Cancelar</button>
                </div>
              </form>
            )}

            {renderTreatmentsTable(plan.treatments, isOpen)}

            {isOpen && (
              <form className="pd-inline-form pd-treatment-form" onSubmit={(event) => submitTreatment(event, plan)}>
                <select
                  value={treatmentForm.procedure_catalog_id}
                  onChange={(event) => {
                    const item = data.catalog.find((entry) => String(entry.id) === event.target.value);
                    setTreatmentForm(plan.id, { procedure_catalog_id: event.target.value, unit_price: item ? String(item.price) : '' });
                  }}
                  aria-label="Procedimiento"
                >
                  <option value="">Procedimiento...</option>
                  {data.catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input value={treatmentForm.tooth_number} onChange={(event) => setTreatmentForm(plan.id, { tooth_number: event.target.value })} placeholder="Diente" aria-label="Diente" style={{ width: 70 }} />
                <input type="date" value={treatmentForm.procedure_date} onChange={(event) => setTreatmentForm(plan.id, { procedure_date: event.target.value })} aria-label="Fecha" />
                <input type="number" min="1" step="1" value={treatmentForm.quantity} onChange={(event) => setTreatmentForm(plan.id, { quantity: event.target.value })} aria-label="Cantidad" style={{ width: 60 }} />
                <input type="number" min="0" step="0.01" value={treatmentForm.unit_price} onChange={(event) => setTreatmentForm(plan.id, { unit_price: event.target.value })} placeholder="Valor" aria-label="Valor unitario" style={{ width: 110 }} />
                <button type="submit" className="pd-btn-action-primary" disabled={busy}>
                  <FiPlus size={14} />
                  Agregar tratamiento
                </button>
              </form>
            )}

            <div className="pd-history-actions">
              {isOpen ? (
                <>
                  <button type="button" className="pd-history-action pd-history-action-edit" onClick={() => startEditPlan(plan)}>Editar</button>
                  <button type="button" className="pd-history-action pd-history-action-edit" onClick={() => closePlan(plan)} disabled={busy}>Cerrar plan</button>
                  <button type="button" className="pd-history-action pd-history-action-delete" onClick={() => cancelPlan(plan)} disabled={busy}>Cancelar plan</button>
                </>
              ) : (
                <button type="button" className="pd-history-action pd-history-action-edit" onClick={() => run(() => reopenTreatmentPlanCtrl(plan.id))} disabled={busy}>
                  Reabrir plan
                </button>
              )}
            </div>
          </div>
        );
      })}

      {data.unplannedTreatments.length > 0 && (
        <div className="pd-plan-card">
          <div className="pd-plan-header">
            <h4>Tratamientos sin plan</h4>
          </div>
          {renderTreatmentsTable(data.unplannedTreatments, true)}
        </div>
      )}
    </div>
  );
};

export default TreatmentPlansVW;
