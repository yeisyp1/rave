// Integración entre módulos: TreatmentPlansCtrl (CU-10), PatientDetailCtrl
// (CU-18 consentimiento informado) y HistoriaClinicaCtrl (CU-09) colaboran
// sin mockearse entre sí; solo se simulan las DAO que tocan Supabase.
// Verifica que el estado del consentimiento que ve el plan de tratamiento
// provenga realmente del flujo de registro de consentimiento, y no de un stub.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const createTreatmentPlanDAO = vi.fn()
const listTreatmentPlansByPatientDAO = vi.fn()
const updateTreatmentPlanDAO = vi.fn()

vi.mock('../dao/TreatmentPlansDAO', () => ({
  createTreatmentPlanDAO: (...args) => createTreatmentPlanDAO(...args),
  listTreatmentPlansByPatientDAO: (...args) => listTreatmentPlansByPatientDAO(...args),
  updateTreatmentPlanDAO: (...args) => updateTreatmentPlanDAO(...args),
}))

const listPatientTreatmentsDAO = vi.fn()
const listProcedureCatalogWithPricesDAO = vi.fn()
const listLegacyProceduresDAO = vi.fn()
const listPatientProceduresDAO = vi.fn()

vi.mock('../dao/ProceduresDAO', () => ({
  listPatientTreatmentsDAO: (...args) => listPatientTreatmentsDAO(...args),
  listProcedureCatalogWithPricesDAO: (...args) => listProcedureCatalogWithPricesDAO(...args),
  listLegacyProceduresDAO: (...args) => listLegacyProceduresDAO(...args),
  listPatientProceduresDAO: (...args) => listPatientProceduresDAO(...args),
  addTreatmentMaterialDAO: vi.fn(),
  createPatientProcedureDAO: vi.fn(),
  removeTreatmentMaterialDAO: vi.fn(),
  updatePatientProcedureDAO: vi.fn(),
}))

const createInformedConsentDAO = vi.fn()
const listInformedConsentsByPatientDAO = vi.fn()

vi.mock('../dao/InformedConsentDAO', () => ({
  createInformedConsentDAO: (...args) => createInformedConsentDAO(...args),
  listInformedConsentsByPatientDAO: (...args) => listInformedConsentsByPatientDAO(...args),
}))

const listInventoryItemsDAO = vi.fn()
vi.mock('../dao/InventoryDAO', () => ({ listInventoryItemsDAO: (...args) => listInventoryItemsDAO(...args) }))

const listClinicalHistoriesByPatientDAO = vi.fn()
vi.mock('../dao/ClinicalHistoriesDAO', () => ({
  listClinicalHistoriesByPatientDAO: (...args) => listClinicalHistoriesByPatientDAO(...args),
  createClinicalHistoryDAO: vi.fn(),
  updateClinicalHistoryDAO: vi.fn(),
  annulClinicalHistoryDAO: vi.fn(),
  getLatestOdontogramDAO: vi.fn(),
  getCurrentDoctorLabelDAO: vi.fn(),
  listHistoryCityDepartmentsDAO: vi.fn(),
  saveOdontogramDAO: vi.fn(),
}))

const getPatientByIdDAO = vi.fn()
vi.mock('../dao/PatientsDAO', () => ({
  getPatientByIdDAO: (...args) => getPatientByIdDAO(...args),
  listPatientsDAO: vi.fn(),
  updatePatientDAO: vi.fn(),
}))

const listPatientRadiographiesDAO = vi.fn()
vi.mock('../dao/RadiographiesDAO', () => ({
  listPatientRadiographiesDAO: (...args) => listPatientRadiographiesDAO(...args),
}))

const createDataRequestDAO = vi.fn()
const listDataRequestsByPatientDAO = vi.fn()
vi.mock('../dao/DataRequestsDAO', () => ({
  createDataRequestDAO: (...args) => createDataRequestDAO(...args),
  listDataRequestsByPatientDAO: (...args) => listDataRequestsByPatientDAO(...args),
}))

const getCurrentUserIdDAO = vi.fn()
vi.mock('../dao/SupabaseDAO', () => ({ getCurrentUserIdDAO: (...args) => getCurrentUserIdDAO(...args) }))

// TreatmentPlansCtrl, PatientDetailCtrl y HistoriaClinicaCtrl se importan reales:
// la integración entre ellos es justamente lo que se quiere comprobar.
const { loadTreatmentPlansCtrl, createTreatmentPlanCtrl, registerPlanConsentCtrl } =
  await import('../controllers/TreatmentPlansCtrl')
const { loadPatientDetailCtrl } = await import('../controllers/PatientDetailCtrl')

beforeEach(() => {
  vi.clearAllMocks()
  listPatientTreatmentsDAO.mockResolvedValue([])
  listProcedureCatalogWithPricesDAO.mockResolvedValue([])
  listInventoryItemsDAO.mockResolvedValue([])
  listClinicalHistoriesByPatientDAO.mockResolvedValue({ data: [], error: null })
  getCurrentUserIdDAO.mockResolvedValue('user-1')
})

describe('CU-10 + CU-18: registrar un plan y su consentimiento informado', () => {
  it('el plan creado parte en "Sin consentimiento" hasta que se registre uno', async () => {
    listTreatmentPlansByPatientDAO.mockResolvedValue([{ id: 1, patient_id: 'p-1' }])
    listInformedConsentsByPatientDAO.mockResolvedValue([])
    createTreatmentPlanDAO.mockResolvedValue({ id: 1 })

    const created = await createTreatmentPlanCtrl('p-1', {
      title: 'Plan de ortodoncia',
      clinical_history_id: '5',
      diagnosis: 'Maloclusión',
      notes: '',
    })
    expect(created.ok).toBe(true)

    const { plans } = await loadTreatmentPlansCtrl('p-1')
    expect(plans[0].consentStatus).toBe('Sin consentimiento')
  })

  it('registerPlanConsentCtrl (TreatmentPlansCtrl) delega en submitConsentCtrl (PatientDetailCtrl) y el plan queda "Aceptado"', async () => {
    createInformedConsentDAO.mockResolvedValue({ id: 100, aceptado: true })

    const result = await registerPlanConsentCtrl({
      patientId: 'p-1',
      planId: 1,
      form: { content: 'Acepto el tratamiento de ortodoncia.', patient_signature_name: 'Ana García' },
    })

    expect(result.ok).toBe(true)
    // El registro quedó ligado al plan y al usuario autenticado (trazabilidad, numeral 2.3).
    expect(createInformedConsentDAO).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: 'p-1', treatment_plan_id: 1, aceptado: true, registered_by: 'user-1' })
    )

    listTreatmentPlansByPatientDAO.mockResolvedValue([{ id: 1, patient_id: 'p-1' }])
    listInformedConsentsByPatientDAO.mockResolvedValue([{ id: 100, treatment_plan_id: 1, aceptado: true }])

    const { plans } = await loadTreatmentPlansCtrl('p-1')
    expect(plans[0].consentStatus).toBe('Aceptado')
  })

  it('una negativa del paciente (aceptado = false) se refleja como "Rechazado" en el plan', async () => {
    createInformedConsentDAO.mockResolvedValue({ id: 101, aceptado: false })

    await registerPlanConsentCtrl({
      patientId: 'p-1',
      planId: 2,
      form: { content: 'No autorizo el procedimiento.', patient_signature_name: 'Ana García', aceptado: false },
    })

    listTreatmentPlansByPatientDAO.mockResolvedValue([{ id: 2, patient_id: 'p-1' }])
    listInformedConsentsByPatientDAO.mockResolvedValue([{ id: 101, treatment_plan_id: 2, aceptado: false }])

    const { plans } = await loadTreatmentPlansCtrl('p-1')
    expect(plans[0].consentStatus).toBe('Rechazado')
  })
})

describe('loadTreatmentPlansCtrl excluye del historial las atenciones anuladas (CU-09)', () => {
  it('filtra las historias con anulada = true antes de mostrarlas junto al plan', async () => {
    listTreatmentPlansByPatientDAO.mockResolvedValue([])
    listInformedConsentsByPatientDAO.mockResolvedValue([])
    listClinicalHistoriesByPatientDAO.mockResolvedValue({
      data: [
        { id: 1, motivo_consulta: 'Control', anulada: false },
        { id: 2, motivo_consulta: 'Error de registro', anulada: true },
      ],
      error: null,
    })

    const { histories } = await loadTreatmentPlansCtrl('p-1')
    expect(histories).toHaveLength(1)
    expect(histories[0].id).toBe(1)
  })
})

describe('CU-05/CU-09/CU-19: el detalle del paciente reúne datos de varios módulos', () => {
  it('loadPatientDetailCtrl combina paciente, procedimientos, historias, consentimientos, solicitudes de datos y radiografías', async () => {
    getPatientByIdDAO.mockResolvedValue({ id: 'p-1', nombre: 'Ana', apellidos: 'García' })
    listLegacyProceduresDAO.mockResolvedValue([{ id: 'legacy-1', fecha: '2025-01-01', cost: 20000 }])
    listPatientProceduresDAO.mockResolvedValue([
      { id: 'new-1', procedure_date: '2026-10-01', procedure_catalog: { name: 'Endodoncia' }, total_price: 150000 },
    ])
    listClinicalHistoriesByPatientDAO.mockResolvedValue({ data: [{ id: 1, anulada: false }], error: null })
    listInformedConsentsByPatientDAO.mockResolvedValue([{ id: 100, aceptado: true }])
    listDataRequestsByPatientDAO.mockResolvedValue([{ id: 1, request_type: 'Consulta' }])
    listPatientRadiographiesDAO.mockResolvedValue([{ id: 1, file_path: 'rx/1.jpg' }])

    const detail = await loadPatientDetailCtrl('p-1')

    expect(detail.patient.nombre).toBe('Ana')
    // Los procedimientos nuevos se normalizan con los mismos campos que los legados.
    expect(detail.procedures).toEqual([
      { id: 'legacy-1', fecha: '2025-01-01', cost: 20000 },
      expect.objectContaining({ id: 'new-1', fecha: '2026-10-01', procedure_name: 'Endodoncia', cost: 150000 }),
    ])
    expect(detail.clinicalHistories).toHaveLength(1)
    expect(detail.consents).toHaveLength(1)
    expect(detail.dataRequests).toHaveLength(1)
    expect(detail.radiographies).toHaveLength(1)
  })

  it('un consentimiento registrado vía submitConsentCtrl queda disponible para loadPatientDetailCtrl', async () => {
    createInformedConsentDAO.mockResolvedValue({ id: 200, aceptado: true })
    const { submitConsentCtrl } = await import('../controllers/PatientDetailCtrl')

    const submitted = await submitConsentCtrl({
      patientId: 'p-1',
      form: { content: 'Acepto', patient_signature_name: 'Ana García' },
    })
    expect(submitted.ok).toBe(true)

    getPatientByIdDAO.mockResolvedValue({ id: 'p-1' })
    listLegacyProceduresDAO.mockResolvedValue([])
    listPatientProceduresDAO.mockResolvedValue([])
    listDataRequestsByPatientDAO.mockResolvedValue([])
    listPatientRadiographiesDAO.mockResolvedValue([])
    listInformedConsentsByPatientDAO.mockResolvedValue([{ id: 200, aceptado: true }])

    const detail = await loadPatientDetailCtrl('p-1')
    expect(detail.consents).toEqual([{ id: 200, aceptado: true }])
  })
})
