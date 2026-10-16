import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks de las capas de acceso a datos y de citas: aislamos la lógica de
// detección de solapamientos (punto 3 de la tesis) de Google Calendar y Supabase.
const checkAppointmentAvailabilityDAO = vi.fn()
const fetchGoogleEventsDAO = vi.fn()
const createGoogleEventDAO = vi.fn()
const updateGoogleEventDAO = vi.fn()

vi.mock('../dao/AppointmentsDAO', () => ({
  checkAppointmentAvailabilityDAO: (...args) => checkAppointmentAvailabilityDAO(...args),
}))

vi.mock('../dao/CalendarDAO', () => ({
  fetchGoogleEventsDAO: (...args) => fetchGoogleEventsDAO(...args),
  createGoogleEventDAO: (...args) => createGoogleEventDAO(...args),
  updateGoogleEventDAO: (...args) => updateGoogleEventDAO(...args),
  deleteGoogleEventDAO: vi.fn(),
  getGoogleTokenDAO: vi.fn(),
  signInGoogleCalendarDAO: vi.fn(),
  listAppointmentPatientsDAO: vi.fn(),
  listAppointmentServiceTypesDAO: vi.fn(),
}))

vi.mock('./AppointmentsCtrl', () => ({
  mirrorAppointmentCtrl: vi.fn().mockResolvedValue({ id: 'mirror-1' }),
  queueAppointmentConfirmationCtrl: vi.fn().mockResolvedValue(undefined),
  cancelAppointmentMirrorCtrl: vi.fn().mockResolvedValue(undefined),
  markAppointmentNoShowCtrl: vi.fn(),
}))

const {
  verificarDisponibilidad,
  createGoogleEventCtrl,
  updateGoogleEventCtrl,
  ScheduleConflictError,
} = await import('./CalendarCtrl')

const googleEvent = (id, startISO, endISO) => ({
  id,
  summary: 'Paciente - Servicio',
  status: 'confirmed',
  start: { dateTime: startISO },
  end: { dateTime: endISO },
})

const SLOT = { start: '2026-10-20T10:00:00.000Z', end: '2026-10-20T11:00:00.000Z' }

beforeEach(() => {
  vi.clearAllMocks()
  checkAppointmentAvailabilityDAO.mockResolvedValue([])
  fetchGoogleEventsDAO.mockResolvedValue([])
  createGoogleEventDAO.mockResolvedValue(googleEvent('new-1', SLOT.start, SLOT.end))
  updateGoogleEventDAO.mockResolvedValue(googleEvent('g-1', SLOT.start, SLOT.end))
})

describe('verificarDisponibilidad', () => {
  it('reporta disponible cuando no hay citas confirmadas en conflicto', async () => {
    checkAppointmentAvailabilityDAO.mockResolvedValue([])
    const result = await verificarDisponibilidad(SLOT.start, SLOT.end)
    expect(result).toEqual({ available: true, conflicts: [] })
  })

  it('reporta no disponible y devuelve los conflictos de la BD', async () => {
    const conflicts = [{ id: 'a1' }]
    checkAppointmentAvailabilityDAO.mockResolvedValue(conflicts)
    const result = await verificarDisponibilidad(SLOT.start, SLOT.end)
    expect(result).toEqual({ available: false, conflicts })
  })
})

describe('createGoogleEventCtrl (detección de solapamiento)', () => {
  it('lanza ScheduleConflictError cuando un evento de Google se cruza', async () => {
    fetchGoogleEventsDAO.mockResolvedValue([
      googleEvent('g-overlap', '2026-10-20T10:30:00.000Z', '2026-10-20T11:30:00.000Z'),
    ])
    await expect(createGoogleEventCtrl('token', SLOT)).rejects.toBeInstanceOf(ScheduleConflictError)
    expect(createGoogleEventDAO).not.toHaveBeenCalled()
  })

  it('lanza ScheduleConflictError cuando hay una cita confirmada en la BD', async () => {
    checkAppointmentAvailabilityDAO.mockResolvedValue([{ id: 'db-1' }])
    await expect(createGoogleEventCtrl('token', SLOT)).rejects.toBeInstanceOf(ScheduleConflictError)
  })

  it('crea la cita cuando un evento adyacente no se solapa', async () => {
    fetchGoogleEventsDAO.mockResolvedValue([
      googleEvent('g-adjacent', '2026-10-20T11:00:00.000Z', '2026-10-20T12:00:00.000Z'),
    ])
    const event = await createGoogleEventCtrl('token', SLOT)
    expect(createGoogleEventDAO).toHaveBeenCalledOnce()
    expect(event.id).toBe('new-1')
  })
})

describe('updateGoogleEventCtrl (reprogramación)', () => {
  it('no cuenta como conflicto el propio evento que se reprograma', async () => {
    fetchGoogleEventsDAO.mockResolvedValue([
      googleEvent('g-1', '2026-10-20T10:00:00.000Z', '2026-10-20T11:00:00.000Z'),
    ])
    const event = await updateGoogleEventCtrl('token', 'g-1', SLOT)
    expect(updateGoogleEventDAO).toHaveBeenCalledOnce()
    expect(event.id).toBe('g-1')
  })
})
