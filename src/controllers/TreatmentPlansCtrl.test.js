import { describe, it, expect, vi, beforeEach } from 'vitest'

const createTreatmentPlanDAO = vi.fn()
const listTreatmentPlansByPatientDAO = vi.fn()
const updateTreatmentPlanDAO = vi.fn()
const addTreatmentMaterialDAO = vi.fn()
const createPatientProcedureDAO = vi.fn()
const listPatientTreatmentsDAO = vi.fn()
const listProcedureCatalogWithPricesDAO = vi.fn()
const removeTreatmentMaterialDAO = vi.fn()
const updatePatientProcedureDAO = vi.fn()
const listInformedConsentsByPatientDAO = vi.fn()
const listInventoryItemsDAO = vi.fn()
const loadPatientHistoriesCtrl = vi.fn()
const submitConsentCtrl = vi.fn()

vi.mock('../dao/TreatmentPlansDAO', () => ({
  createTreatmentPlanDAO: (...args) => createTreatmentPlanDAO(...args),
  listTreatmentPlansByPatientDAO: (...args) => listTreatmentPlansByPatientDAO(...args),
  updateTreatmentPlanDAO: (...args) => updateTreatmentPlanDAO(...args),
}))
vi.mock('../dao/ProceduresDAO', () => ({
  addTreatmentMaterialDAO: (...args) => addTreatmentMaterialDAO(...args),
  createPatientProcedureDAO: (...args) => createPatientProcedureDAO(...args),
  listPatientTreatmentsDAO: (...args) => listPatientTreatmentsDAO(...args),
  listProcedureCatalogWithPricesDAO: (...args) => listProcedureCatalogWithPricesDAO(...args),
  removeTreatmentMaterialDAO: (...args) => removeTreatmentMaterialDAO(...args),
  updatePatientProcedureDAO: (...args) => updatePatientProcedureDAO(...args),
}))
vi.mock('../dao/InformedConsentDAO', () => ({
  listInformedConsentsByPatientDAO: (...args) => listInformedConsentsByPatientDAO(...args),
}))
vi.mock('../dao/InventoryDAO', () => ({ listInventoryItemsDAO: (...args) => listInventoryItemsDAO(...args) }))
vi.mock('./HistoriaClinicaCtrl', () => ({ loadPatientHistoriesCtrl: (...args) => loadPatientHistoriesCtrl(...args) }))
vi.mock('./PatientDetailCtrl', () => ({ submitConsentCtrl: (...args) => submitConsentCtrl(...args) }))

const {
  loadTreatmentPlansCtrl,
  createTreatmentPlanCtrl,
  closeTreatmentPlanCtrl,
  cancelTreatmentPlanCtrl,
  addTreatmentCtrl,
  registerPlanConsentCtrl,
} = await import('./TreatmentPlansCtrl')

beforeEach(() => {
  vi.clearAllMocks()
  listTreatmentPlansByPatientDAO.mockResolvedValue([])
  listPatientTreatmentsDAO.mockResolvedValue([])
  listInformedConsentsByPatientDAO.mockResolvedValue([])
  listProcedureCatalogWithPricesDAO.mockResolvedValue([])
  listInventoryItemsDAO.mockResolvedValue([])
  loadPatientHistoriesCtrl.mockResolvedValue([])
})

describe('loadTreatmentPlansCtrl (CU-10: estado del consentimiento por plan)', () => {
  it('marca "Sin consentimiento" cuando el plan no tiene ninguno registrado', async () => {
    listTreatmentPlansByPatientDAO.mockResolvedValue([{ id: 1 }])
    const result = await loadTreatmentPlansCtrl('p-1')
    expect(result.plans[0].consentStatus).toBe('Sin consentimiento')
  })

  it('toma el consentimiento más reciente del plan como vigente', async () => {
    listTreatmentPlansByPatientDAO.mockResolvedValue([{ id: 1 }])
    listInformedConsentsByPatientDAO.mockResolvedValue([
      { id: 10, treatment_plan_id: 1, aceptado: false },
      { id: 11, treatment_plan_id: 2, aceptado: true },
    ])
    const result = await loadTreatmentPlansCtrl('p-1')
    expect(result.plans[0].consentStatus).toBe('Rechazado')
  })

  it('separa los tratamientos sin plan asociado', async () => {
    listPatientTreatmentsDAO.mockResolvedValue([{ id: 1, treatment_plan_id: null }, { id: 2, treatment_plan_id: 5 }])
    const result = await loadTreatmentPlansCtrl('p-1')
    expect(result.unplannedTreatments).toEqual([{ id: 1, treatment_plan_id: null }])
  })
})

describe('createTreatmentPlanCtrl (CU-10: el plan nace de una historia clínica existente)', () => {
  it('exige un título', async () => {
    const result = await createTreatmentPlanCtrl('p-1', { title: '  ', clinical_history_id: '1', diagnosis: '', notes: '' })
    expect(result.ok).toBe(false)
  })

  it('exige asociar la historia clínica de origen', async () => {
    const result = await createTreatmentPlanCtrl('p-1', { title: 'Plan ortodoncia', clinical_history_id: '', diagnosis: '', notes: '' })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/historia clínica/)
  })

  it('crea el plan cuando los datos obligatorios están completos', async () => {
    createTreatmentPlanDAO.mockResolvedValue({ id: 1 })
    const result = await createTreatmentPlanCtrl('p-1', {
      title: 'Plan ortodoncia',
      clinical_history_id: '3',
      diagnosis: 'Maloclusión clase I',
      notes: '',
    })
    expect(result.ok).toBe(true)
    expect(createTreatmentPlanDAO).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: 'p-1', clinical_history_id: 3, title: 'Plan ortodoncia' })
    )
  })
})

describe('closeTreatmentPlanCtrl (ROC-18)', () => {
  it('no permite cerrar un plan con tratamientos pendientes o en proceso', async () => {
    const plan = { id: 1, treatments: [{ status: 'Pendiente' }] }
    const result = await closeTreatmentPlanCtrl(plan, 'listo')
    expect(result.ok).toBe(false)
    expect(updateTreatmentPlanDAO).not.toHaveBeenCalled()
  })

  it('cierra el plan cuando todos los tratamientos están realizados o cancelados', async () => {
    updateTreatmentPlanDAO.mockResolvedValue({ id: 1, status: 'Cerrado' })
    const plan = { id: 1, treatments: [{ status: 'Realizado' }, { status: 'Cancelado' }] }
    const result = await closeTreatmentPlanCtrl(plan, 'Tratamiento finalizado')
    expect(result.ok).toBe(true)
    expect(updateTreatmentPlanDAO).toHaveBeenCalledWith(1, { status: 'Cerrado', closing_notes: 'Tratamiento finalizado' })
  })
})

describe('cancelTreatmentPlanCtrl', () => {
  it('exige un motivo de cancelación', async () => {
    const result = await cancelTreatmentPlanCtrl({ id: 1, treatments: [] }, '')
    expect(result.ok).toBe(false)
    expect(updateTreatmentPlanDAO).not.toHaveBeenCalled()
  })

  it('cancela también los tratamientos pendientes o en proceso del plan', async () => {
    updatePatientProcedureDAO.mockResolvedValue({})
    updateTreatmentPlanDAO.mockResolvedValue({ id: 1, status: 'Cancelado' })
    const plan = {
      id: 1,
      treatments: [{ id: 'a', status: 'Pendiente' }, { id: 'b', status: 'Realizado' }, { id: 'c', status: 'En proceso' }],
    }

    const result = await cancelTreatmentPlanCtrl(plan, 'El paciente desistió del tratamiento')

    expect(result.ok).toBe(true)
    expect(updatePatientProcedureDAO).toHaveBeenCalledTimes(2)
    expect(updatePatientProcedureDAO).toHaveBeenCalledWith('a', { status: 'Cancelado' })
    expect(updatePatientProcedureDAO).toHaveBeenCalledWith('c', { status: 'Cancelado' })
    expect(updateTreatmentPlanDAO).toHaveBeenCalledWith(1, {
      status: 'Cancelado',
      closing_notes: 'El paciente desistió del tratamiento',
    })
  })
})

describe('addTreatmentCtrl', () => {
  const catalog = [{ id: 1, price: 80000 }]

  it('exige un procedimiento válido del catálogo', async () => {
    const result = await addTreatmentCtrl({
      patientId: 'p-1',
      plan: { id: 1 },
      form: { procedure_catalog_id: '999', quantity: '1', unit_price: '', tooth_number: '', procedure_date: '2026-10-20', notes: '' },
      catalog,
    })
    expect(result.ok).toBe(false)
  })

  it('usa el precio del catálogo cuando no se indica uno manual', async () => {
    createPatientProcedureDAO.mockResolvedValue({ id: 5 })
    const result = await addTreatmentCtrl({
      patientId: 'p-1',
      plan: { id: 1 },
      form: { procedure_catalog_id: '1', quantity: '2', unit_price: '', tooth_number: '21', procedure_date: '2026-10-20', notes: '' },
      catalog,
    })
    expect(result.ok).toBe(true)
    expect(createPatientProcedureDAO).toHaveBeenCalledWith(
      expect.objectContaining({ unit_price: 80000, quantity: 2, tooth_number: '21' })
    )
  })
})

describe('registerPlanConsentCtrl (delega en submitConsentCtrl del CU-18)', () => {
  it('asocia el consentimiento al plan de tratamiento', async () => {
    submitConsentCtrl.mockResolvedValue({ ok: true, consent: { id: 1 } })
    const result = await registerPlanConsentCtrl({ patientId: 'p-1', planId: 7, form: { content: 'Acepto', patient_signature_name: 'Ana' } })
    expect(result.ok).toBe(true)
    expect(submitConsentCtrl).toHaveBeenCalledWith({
      patientId: 'p-1',
      form: { content: 'Acepto', patient_signature_name: 'Ana', treatment_plan_id: 7 },
    })
  })

  it('convierte un error inesperado en un resultado { ok: false }', async () => {
    submitConsentCtrl.mockRejectedValue(new Error('Fallo de red'))
    const result = await registerPlanConsentCtrl({ patientId: 'p-1', planId: 7, form: {} })
    expect(result).toEqual({ ok: false, message: 'Fallo de red' })
  })
})
