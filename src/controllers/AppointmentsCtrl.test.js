import { describe, it, expect, vi, beforeEach } from 'vitest'

const cancelAppointmentByGoogleIdDAO = vi.fn()
const createOutboundWhatsappMessageDAO = vi.fn()
const getActiveWhatsappTemplateDAO = vi.fn()
const getPatientContactDAO = vi.fn()
const markAppointmentNoShowByGoogleIdDAO = vi.fn()
const upsertAppointmentByGoogleIdDAO = vi.fn()

vi.mock('../dao/AppointmentsDAO', () => ({
  cancelAppointmentByGoogleIdDAO: (...args) => cancelAppointmentByGoogleIdDAO(...args),
  createOutboundWhatsappMessageDAO: (...args) => createOutboundWhatsappMessageDAO(...args),
  getActiveWhatsappTemplateDAO: (...args) => getActiveWhatsappTemplateDAO(...args),
  getPatientContactDAO: (...args) => getPatientContactDAO(...args),
  markAppointmentNoShowByGoogleIdDAO: (...args) => markAppointmentNoShowByGoogleIdDAO(...args),
  upsertAppointmentByGoogleIdDAO: (...args) => upsertAppointmentByGoogleIdDAO(...args),
}))

const {
  renderMessageTemplateCtrl,
  mirrorAppointmentCtrl,
  cancelAppointmentMirrorCtrl,
  markAppointmentNoShowCtrl,
  queueAppointmentConfirmationCtrl,
} = await import('./AppointmentsCtrl')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('renderMessageTemplateCtrl', () => {
  it('reemplaza las variables {{var}} de la plantilla', () => {
    const body = 'Hola {{nombre}}, tu cita es el {{fecha}} a las {{hora}}.'
    const result = renderMessageTemplateCtrl(body, { nombre: 'Ana', fecha: '20/10/2026', hora: '10:00 a. m.' })
    expect(result).toBe('Hola Ana, tu cita es el 20/10/2026 a las 10:00 a. m..')
  })

  it('reemplaza por vacío las variables sin valor', () => {
    const result = renderMessageTemplateCtrl('Servicio: {{servicio}}', { servicio: undefined })
    expect(result).toBe('Servicio: ')
  })
})

describe('mirrorAppointmentCtrl (espejo local de la cita de Google Calendar)', () => {
  it('guarda la cita como Confirmada con su paciente y servicio', async () => {
    upsertAppointmentByGoogleIdDAO.mockResolvedValue({ id: 1 })
    const start = new Date('2026-10-20T10:00:00.000Z')
    const end = new Date('2026-10-20T10:20:00.000Z')
    await mirrorAppointmentCtrl({ googleEventId: 'g-1', patientId: 'p-1', start, end, serviceType: 'Limpieza' })

    expect(upsertAppointmentByGoogleIdDAO).toHaveBeenCalledWith({
      google_event_id: 'g-1',
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: 'Confirmada',
      source: 'App',
      patient_id: 'p-1',
      service_type: 'Limpieza',
    })
  })

  it('al reprogramar sin paciente/servicio no sobrescribe el vínculo original', async () => {
    upsertAppointmentByGoogleIdDAO.mockResolvedValue({ id: 1 })
    const start = new Date('2026-10-21T10:00:00.000Z')
    const end = new Date('2026-10-21T10:20:00.000Z')
    await mirrorAppointmentCtrl({ googleEventId: 'g-1', start, end })

    const payload = upsertAppointmentByGoogleIdDAO.mock.calls[0][0]
    expect(payload).not.toHaveProperty('patient_id')
    expect(payload).not.toHaveProperty('service_type')
  })
})

describe('cancelAppointmentMirrorCtrl / markAppointmentNoShowCtrl (CU-08)', () => {
  it('cancela la cita por su id de Google Calendar', async () => {
    await cancelAppointmentMirrorCtrl('g-1')
    expect(cancelAppointmentByGoogleIdDAO).toHaveBeenCalledWith('g-1')
  })

  it('marca la cita como no asistida', async () => {
    await markAppointmentNoShowCtrl('g-1')
    expect(markAppointmentNoShowByGoogleIdDAO).toHaveBeenCalledWith('g-1')
  })
})

describe('queueAppointmentConfirmationCtrl (RF-34: confirmación por WhatsApp)', () => {
  const start = new Date('2026-10-20T15:00:00.000Z')

  it('no encola el mensaje si el paciente no tiene celular ni teléfono', async () => {
    getPatientContactDAO.mockResolvedValue({ nombre: 'Ana' })
    const result = await queueAppointmentConfirmationCtrl({
      appointmentId: 1,
      patientId: 'p-1',
      start,
      serviceType: 'Limpieza',
    })
    expect(result).toBeNull()
    expect(createOutboundWhatsappMessageDAO).not.toHaveBeenCalled()
  })

  it('usa la plantilla activa de WhatsApp para construir el mensaje', async () => {
    getPatientContactDAO.mockResolvedValue({ nombre: 'Ana', celular: '3001234567' })
    getActiveWhatsappTemplateDAO.mockResolvedValue({ id: 9, body: 'Hola {{nombre}}, cita confirmada.' })
    createOutboundWhatsappMessageDAO.mockResolvedValue(undefined)

    await queueAppointmentConfirmationCtrl({ appointmentId: 1, patientId: 'p-1', start, serviceType: 'Limpieza' })

    expect(createOutboundWhatsappMessageDAO).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'outbound',
        phone: '3001234567',
        patient_id: 'p-1',
        appointment_id: 1,
        template_id: 9,
        body: 'Hola Ana, cita confirmada.',
        status: 'pending',
      })
    )
  })

  it('pide la plantilla de confirmación de Meta con nombre, fecha y hora como parámetros', async () => {
    getPatientContactDAO.mockResolvedValue({ nombre: 'Ana', celular: '3001234567' })
    getActiveWhatsappTemplateDAO.mockResolvedValue(null)
    createOutboundWhatsappMessageDAO.mockResolvedValue(undefined)

    await queueAppointmentConfirmationCtrl({ appointmentId: 3, patientId: 'p-3', start, serviceType: 'Control' })

    const vars = createOutboundWhatsappMessageDAO.mock.calls[0][0].template_variables
    expect(vars._plantilla).toBe('confirmacion')
    expect(vars['1']).toBe('Ana')
    expect(vars['2']).toBe(start.toLocaleDateString('es-CO'))
    expect(vars['3']).toBe(start.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }))
  })

  it('usa un texto de respaldo cuando no hay plantilla activa', async () => {
    getPatientContactDAO.mockResolvedValue({ nombre: 'Ana', telefono: '3009876543' })
    getActiveWhatsappTemplateDAO.mockResolvedValue(null)
    createOutboundWhatsappMessageDAO.mockResolvedValue(undefined)

    await queueAppointmentConfirmationCtrl({ appointmentId: 2, patientId: 'p-2', start, serviceType: 'Control' })

    const payload = createOutboundWhatsappMessageDAO.mock.calls[0][0]
    expect(payload.template_id).toBeNull()
    expect(payload.body).toMatch(/confirmamos tu cita/)
  })
})
