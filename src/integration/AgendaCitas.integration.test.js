// Pruebas de integración entre módulos (sección 3.4 del trabajo de grado):
// CalendarCtrl (agenda) + AppointmentsCtrl (espejo en Supabase y cola de WhatsApp)
// se ejercitan juntos, SIN mockear uno desde el otro -como sí hacen los tests
// unitarios de cada controlador-. Solo se simulan los dos límites externos
// reales: Google Calendar (CalendarDAO) y Supabase (AppointmentsDAO).
// Cubre CU-06 (agendar cita), CU-07 (reprogramar), CU-08 (cancelar) y la
// confirmación automática por WhatsApp (RF-34).
import { describe, it, expect, vi, beforeEach } from 'vitest'

const fetchGoogleEventsDAO = vi.fn()
const createGoogleEventDAO = vi.fn()
const updateGoogleEventDAO = vi.fn()
const deleteGoogleEventDAO = vi.fn()

vi.mock('../dao/CalendarDAO', () => ({
  fetchGoogleEventsDAO: (...args) => fetchGoogleEventsDAO(...args),
  createGoogleEventDAO: (...args) => createGoogleEventDAO(...args),
  updateGoogleEventDAO: (...args) => updateGoogleEventDAO(...args),
  deleteGoogleEventDAO: (...args) => deleteGoogleEventDAO(...args),
  getGoogleTokenDAO: vi.fn(),
  signInGoogleCalendarDAO: vi.fn(),
  listAppointmentPatientsDAO: vi.fn(),
  listAppointmentServiceTypesDAO: vi.fn(),
}))

const checkAppointmentAvailabilityDAO = vi.fn()
const upsertAppointmentByGoogleIdDAO = vi.fn()
const cancelAppointmentByGoogleIdDAO = vi.fn()
const getPatientContactDAO = vi.fn()
const getActiveWhatsappTemplateDAO = vi.fn()
const createOutboundWhatsappMessageDAO = vi.fn()

vi.mock('../dao/AppointmentsDAO', () => ({
  checkAppointmentAvailabilityDAO: (...args) => checkAppointmentAvailabilityDAO(...args),
  upsertAppointmentByGoogleIdDAO: (...args) => upsertAppointmentByGoogleIdDAO(...args),
  cancelAppointmentByGoogleIdDAO: (...args) => cancelAppointmentByGoogleIdDAO(...args),
  markAppointmentNoShowByGoogleIdDAO: vi.fn(),
  getPatientContactDAO: (...args) => getPatientContactDAO(...args),
  getActiveWhatsappTemplateDAO: (...args) => getActiveWhatsappTemplateDAO(...args),
  createOutboundWhatsappMessageDAO: (...args) => createOutboundWhatsappMessageDAO(...args),
}))

// AppointmentsCtrl NO se mockea: es justamente la integración que se quiere probar.
const { createGoogleEventCtrl, updateGoogleEventCtrl, deleteGoogleEventCtrl, ScheduleConflictError } =
  await import('../controllers/CalendarCtrl')

const googleEvent = (id, startISO, endISO, overrides = {}) => ({
  id,
  summary: 'Paciente - Servicio',
  status: 'confirmed',
  start: { dateTime: startISO },
  end: { dateTime: endISO },
  ...overrides,
})

const SLOT = {
  start: new Date('2026-10-20T10:00:00.000Z'),
  end: new Date('2026-10-20T10:20:00.000Z'),
  patientId: 'p-1',
  service: 'Limpieza',
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchGoogleEventsDAO.mockResolvedValue([])
  checkAppointmentAvailabilityDAO.mockResolvedValue([])
  upsertAppointmentByGoogleIdDAO.mockResolvedValue({ id: 'local-1' })
  getPatientContactDAO.mockResolvedValue({ nombre: 'Ana', celular: '3001234567' })
  getActiveWhatsappTemplateDAO.mockResolvedValue({ id: 9, body: 'Hola {{nombre}}, cita confirmada para el {{fecha}}.' })
  createOutboundWhatsappMessageDAO.mockResolvedValue(undefined)
})

describe('CU-06 Agendar cita: Calendar + Appointments + WhatsApp end-to-end', () => {
  it('crea el evento en Google, lo espeja en Supabase y encola la confirmación por WhatsApp', async () => {
    createGoogleEventDAO.mockResolvedValue(googleEvent('g-new', SLOT.start.toISOString(), SLOT.end.toISOString()))

    const event = await createGoogleEventCtrl('token', SLOT)

    expect(event.id).toBe('g-new')
    expect(createGoogleEventDAO).toHaveBeenCalledOnce()

    expect(upsertAppointmentByGoogleIdDAO).toHaveBeenCalledWith(
      expect.objectContaining({
        google_event_id: 'g-new',
        status: 'Confirmada',
        patient_id: 'p-1',
        service_type: 'Limpieza',
      })
    )

    expect(createOutboundWhatsappMessageDAO).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: 'local-1',
        patient_id: 'p-1',
        phone: '3001234567',
        template_id: 9,
        body: expect.stringContaining('Hola Ana'),
        status: 'pending',
      })
    )
  })

  it('un cruce de horario en Google Calendar (ROC-02) impide crear la cita y no toca Supabase ni WhatsApp', async () => {
    fetchGoogleEventsDAO.mockResolvedValue([googleEvent('g-overlap', '2026-10-20T10:10:00.000Z', '2026-10-20T10:30:00.000Z')])

    await expect(createGoogleEventCtrl('token', SLOT)).rejects.toBeInstanceOf(ScheduleConflictError)

    expect(createGoogleEventDAO).not.toHaveBeenCalled()
    expect(upsertAppointmentByGoogleIdDAO).not.toHaveBeenCalled()
    expect(createOutboundWhatsappMessageDAO).not.toHaveBeenCalled()
  })

  it('una cita ya confirmada en la base de datos también bloquea el agendamiento aunque Google esté libre', async () => {
    checkAppointmentAvailabilityDAO.mockResolvedValue([{ id: 'db-1' }])

    await expect(createGoogleEventCtrl('token', SLOT)).rejects.toBeInstanceOf(ScheduleConflictError)
    expect(createGoogleEventDAO).not.toHaveBeenCalled()
  })

  it('si el espejo en Supabase falla, se registra el fallo pero no se encola la confirmación (no hay id local)', async () => {
    createGoogleEventDAO.mockResolvedValue(googleEvent('g-new', SLOT.start.toISOString(), SLOT.end.toISOString()))
    upsertAppointmentByGoogleIdDAO.mockRejectedValue(new Error('timeout de red'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const event = await createGoogleEventCtrl('token', SLOT)

    expect(event.id).toBe('g-new') // la cita en Google sí quedó creada
    expect(createOutboundWhatsappMessageDAO).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('sin plantilla activa de WhatsApp, usa el texto de respaldo pero igual confirma la cita', async () => {
    createGoogleEventDAO.mockResolvedValue(googleEvent('g-new', SLOT.start.toISOString(), SLOT.end.toISOString()))
    getActiveWhatsappTemplateDAO.mockResolvedValue(null)

    await createGoogleEventCtrl('token', SLOT)

    const payload = createOutboundWhatsappMessageDAO.mock.calls[0][0]
    expect(payload.template_id).toBeNull()
    expect(payload.body).toMatch(/confirmamos tu cita en Clínica RAVE/)
  })
})

describe('CU-07 Reprogramar cita: el propio evento no cuenta como conflicto y se re-espeja', () => {
  it('actualiza el evento en Google y refresca la copia local con el nuevo horario', async () => {
    fetchGoogleEventsDAO.mockResolvedValue([googleEvent('g-1', SLOT.start.toISOString(), SLOT.end.toISOString())])
    const newSlot = {
      ...SLOT,
      start: new Date('2026-10-20T11:00:00.000Z'),
      end: new Date('2026-10-20T11:20:00.000Z'),
    }
    updateGoogleEventDAO.mockResolvedValue(googleEvent('g-1', newSlot.start.toISOString(), newSlot.end.toISOString()))

    const event = await updateGoogleEventCtrl('token', 'g-1', newSlot)

    expect(event.id).toBe('g-1')
    expect(upsertAppointmentByGoogleIdDAO).toHaveBeenCalledWith(
      expect.objectContaining({ google_event_id: 'g-1', status: 'Confirmada' })
    )
  })
})

describe('CU-08 Cancelar cita: se elimina de Google y se marca Cancelada en Supabase', () => {
  it('propaga la cancelación al espejo local usando el id de Google', async () => {
    deleteGoogleEventDAO.mockResolvedValue(undefined)

    await deleteGoogleEventCtrl('token', 'g-1')

    expect(deleteGoogleEventDAO).toHaveBeenCalledWith('token', 'g-1')
    expect(cancelAppointmentByGoogleIdDAO).toHaveBeenCalledWith('g-1')
  })

  it('si falla el espejo local, la cancelación en Google Calendar ya ocurrió y no se relanza el error', async () => {
    deleteGoogleEventDAO.mockResolvedValue(undefined)
    cancelAppointmentByGoogleIdDAO.mockRejectedValue(new Error('fallo de BD'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(deleteGoogleEventCtrl('token', 'g-1')).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
