import { describe, it, expect } from 'vitest'
import { computeDashboardCtrl } from './DashboardCtrl'
import { BillingModel } from '../models/BillingModel'

const ymd = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const buildRaw = () => ({
  billing: {
    invoices: [
      new BillingModel({ id: 1, patient: 'Ana', date: ymd(new Date()), amount: 100000, status: 'Pagado', paid: 100000 }),
      new BillingModel({ id: 2, patient: 'Beto', date: ymd(daysAgo(40)), amount: 50000, status: 'Pendiente', paid: 0 }),
      new BillingModel({ id: 3, patient: 'Caro', date: ymd(new Date()), amount: 9999, status: 'Anulado', paid: 0 }),
    ],
  },
  patients: [
    { id: 'p1', nombre: 'Ana', apellidos: 'G', created_at: new Date().toISOString(), activo: true },
    { id: 'p2', nombre: 'Beto', apellidos: 'R', created_at: daysAgo(200).toISOString(), activo: true },
    { id: 'p3', nombre: 'Caro', apellidos: 'M', created_at: daysAgo(5).toISOString(), activo: false },
  ],
  inventory: [
    { id: 1, stock: 2, min_stock: 5 }, // bajo
    { id: 2, stock: 20, min_stock: 5 },
  ],
  laboratory: { cases: [{ status: 'Pendiente' }, { status: 'Entregado' }] },
  appointments: [
    { id: 1, start_at: new Date().toISOString(), status: 'Confirmada', service_type: 'Ortodoncia', source: 'WhatsApp', patients: { nombre: 'Ana', apellidos: 'G' } },
    { id: 2, start_at: new Date().toISOString(), status: 'Cancelada', service_type: 'Endodoncia', source: 'App', patients: { nombre: 'Beto', apellidos: 'R' } },
    { id: 3, start_at: daysAgo(10).toISOString(), status: 'Confirmada', service_type: 'Endodoncia', source: 'App', patients: { nombre: 'Caro', apellidos: 'M' } },
  ],
  plans: [{ status: 'Abierto' }, { status: 'Cerrado' }, { status: 'Cancelado' }],
  doctors: [
    { id: 1, nombre: 'Valentina', apellidos: 'Ospina' },
    { id: 2, nombre: 'Andrés', apellidos: 'Cardona' },
  ],
})

describe('computeDashboardCtrl', () => {
  it('suma solo los pagos reales de facturas vigentes en el rango (Hoy)', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 0 })
    // Solo la factura pagada de hoy (la anulada se excluye, la pendiente es de hace 40 días).
    expect(d.kpis.ing.value).toBe('$100.000')
  })

  it('calcula cuentas por cobrar y vencidas desde el saldo real', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 0 })
    expect(d.kpis.cxc.value).toBe('$50.000')
    expect(d.kpis.cxc.sub).toContain('$50.000') // vencida (>30 días)
    expect(d.kpis.cxc.st).toBe('r')
  })

  it('cuenta pacientes nuevos y recurrentes activos', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 0 })
    // Nuevos hoy = 1 (Ana); recurrentes = activos(2) - nuevos(1) = 1. Caro está inactivo.
    expect(d.kpis.pac.value).toBe('1 / 1')
  })

  it('cuenta las citas de hoy por estado', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 0 })
    expect(d.kpis.cit.value).toBe('2')
    expect(d.citasHoy).toHaveLength(2)
  })

  it('deriva ausentismo y ocupación en rangos coherentes', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 5 })
    const aus = parseInt(d.kpis.aus.value, 10)
    const ocu = parseInt(d.kpis.ocu.value, 10)
    expect(aus).toBeGreaterThanOrEqual(5)
    expect(aus).toBeLessThanOrEqual(25)
    expect(ocu).toBeGreaterThanOrEqual(0)
    expect(ocu).toBeLessThanOrEqual(99)
  })

  it('cuenta los planes de tratamiento por estado', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 5 })
    expect(d.charts.planes.total).toBe(3)
    expect(d.charts.planes.items.find((i) => i.label === 'Abiertos').value).toBe(1)
  })

  it('arma las opciones de servicio y odontólogo desde datos reales', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 5 })
    expect(d.serviceOptions[0]).toBe('Todos los servicios')
    expect(d.serviceOptions).toContain('Ortodoncia')
    expect(d.serviceOptions).toContain('Endodoncia')
    expect(d.dentistOptions).toEqual(['Todos los odontólogos', 'Valentina Ospina', 'Andrés Cardona'])
  })

  it('usa la asistencia real cuando hay estados "No asistida"/"Atendida"', () => {
    const raw = buildRaw()
    raw.appointments.push(
      { id: 10, start_at: daysAgo(3).toISOString(), status: 'Atendida', service_type: 'Ortodoncia', source: 'App', patients: { nombre: 'X', apellidos: 'Y' } },
      { id: 11, start_at: daysAgo(4).toISOString(), status: 'Atendida', service_type: 'Resina', source: 'App', patients: { nombre: 'X', apellidos: 'Y' } },
      { id: 12, start_at: daysAgo(5).toISOString(), status: 'No asistida', service_type: 'Endodoncia', source: 'App', patients: { nombre: 'X', apellidos: 'Y' } },
    )
    const d = computeDashboardCtrl(raw, { rangeKey: 5 })
    // 1 no asistida de 3 citas con asistencia registrada = 33%, y deja de ser estimación.
    expect(d.kpis.aus.value).toBe('33%')
    expect(d.kpis.aus.derived).toBe(false)
  })

  it('marca ausentismo como estimado cuando no hay asistencia registrada', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 5 })
    expect(d.kpis.aus.derived).toBe(true)
  })

  it('genera alertas reales (vencidas, stock bajo, laboratorio)', () => {
    const d = computeDashboardCtrl(buildRaw(), { rangeKey: 0 })
    const ids = d.alerts.map((a) => a.id)
    expect(ids).toContain('cxc')
    expect(ids).toContain('inv')
    expect(ids).toContain('lab')
  })
})
