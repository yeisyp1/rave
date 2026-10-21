import { describe, it, expect, vi, beforeEach } from 'vitest'

const getPatientByIdDAO = vi.fn()
const listLegacyProceduresDAO = vi.fn()
const listPatientProceduresDAO = vi.fn()
const listPatientRadiographiesDAO = vi.fn()
const loadPatientHistoriesCtrl = vi.fn()
const createInformedConsentDAO = vi.fn()
const listInformedConsentsByPatientDAO = vi.fn()
const createDataRequestDAO = vi.fn()
const listDataRequestsByPatientDAO = vi.fn()
const getCurrentUserIdDAO = vi.fn()

vi.mock('../dao/PatientsDAO', () => ({ getPatientByIdDAO: (...args) => getPatientByIdDAO(...args) }))
vi.mock('../dao/ProceduresDAO', () => ({
  listLegacyProceduresDAO: (...args) => listLegacyProceduresDAO(...args),
  listPatientProceduresDAO: (...args) => listPatientProceduresDAO(...args),
}))
vi.mock('../dao/RadiographiesDAO', () => ({
  listPatientRadiographiesDAO: (...args) => listPatientRadiographiesDAO(...args),
}))
vi.mock('./HistoriaClinicaCtrl', () => ({
  loadPatientHistoriesCtrl: (...args) => loadPatientHistoriesCtrl(...args),
}))
vi.mock('../dao/InformedConsentDAO', () => ({
  createInformedConsentDAO: (...args) => createInformedConsentDAO(...args),
  listInformedConsentsByPatientDAO: (...args) => listInformedConsentsByPatientDAO(...args),
}))
vi.mock('../dao/DataRequestsDAO', () => ({
  createDataRequestDAO: (...args) => createDataRequestDAO(...args),
  listDataRequestsByPatientDAO: (...args) => listDataRequestsByPatientDAO(...args),
}))
vi.mock('../dao/SupabaseDAO', () => ({ getCurrentUserIdDAO: (...args) => getCurrentUserIdDAO(...args) }))

const { submitConsentCtrl, submitDataRequestCtrl } = await import('./PatientDetailCtrl')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitConsentCtrl (CU-18: consentimiento informado, Ley 527 de 1999)', () => {
  it('exige el contenido del consentimiento y el nombre de quien firma', async () => {
    await expect(
      submitConsentCtrl({ patientId: 'p-1', form: { content: '', patient_signature_name: '' } })
    ).resolves.toEqual({ ok: false, message: 'Completa el contenido del consentimiento y el nombre de quien firma.' })
    expect(createInformedConsentDAO).not.toHaveBeenCalled()
  })

  it('registra el consentimiento aceptado con el usuario y la fecha de firma', async () => {
    getCurrentUserIdDAO.mockResolvedValue('user-1')
    createInformedConsentDAO.mockResolvedValue({ id: 1, aceptado: true })

    const result = await submitConsentCtrl({
      patientId: 'p-1',
      form: {
        treatment_plan_id: '7',
        content: 'Acepto el procedimiento de endodoncia.',
        patient_signature_name: 'Ana García',
      },
    })

    expect(result.ok).toBe(true)
    expect(createInformedConsentDAO).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: 'p-1',
        treatment_plan_id: 7,
        aceptado: true,
        content: 'Acepto el procedimiento de endodoncia.',
        patient_signature_name: 'Ana García',
        registered_by: 'user-1',
      })
    )
  })

  it('permite registrar la negativa del paciente (aceptado = false)', async () => {
    getCurrentUserIdDAO.mockResolvedValue('user-1')
    createInformedConsentDAO.mockResolvedValue({ id: 2, aceptado: false })

    const result = await submitConsentCtrl({
      patientId: 'p-1',
      form: { content: 'No autorizo el tratamiento.', patient_signature_name: 'Ana García', aceptado: false },
    })

    expect(result.ok).toBe(true)
    expect(createInformedConsentDAO).toHaveBeenCalledWith(expect.objectContaining({ aceptado: false }))
  })
})

describe('submitDataRequestCtrl (CU-19: solicitudes de datos personales, Ley 1581 de 2012)', () => {
  it('exige una descripción de la solicitud', async () => {
    const result = await submitDataRequestCtrl({ patientId: 'p-1', form: { description: '  ', request_type: 'Consulta' } })
    expect(result.ok).toBe(false)
    expect(createDataRequestDAO).not.toHaveBeenCalled()
  })

  it('registra la solicitud del paciente', async () => {
    createDataRequestDAO.mockResolvedValue({ id: 3 })
    const result = await submitDataRequestCtrl({
      patientId: 'p-1',
      form: { description: 'Solicita copia de su historia clínica', request_type: 'Consulta' },
    })
    expect(result.ok).toBe(true)
    expect(createDataRequestDAO).toHaveBeenCalledWith({
      patient_id: 'p-1',
      request_type: 'Consulta',
      description: 'Solicita copia de su historia clínica',
    })
  })
})
