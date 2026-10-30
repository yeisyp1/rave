import { getBillingCtrlData } from './BillingCtrl'
import { loadPatientsCtrl } from './PatientsCtrl'
import { isInventoryItemLow, loadInventoryItemsCtrl } from './InventoryCtrl'
import { loadLaboratoryDataCtrl } from './LaboratoryCtrl'
import { listAllAppointmentsDAO } from '../dao/AppointmentsDAO'
import { listAllTreatmentPlansDAO } from '../dao/TreatmentPlansDAO'
import { listActiveDoctorsDAO } from '../dao/DoctorsDAO'

// El dashboard combina datos reales de Supabase (ingresos, cartera, pacientes,
// citas, inventario, laboratorio, planes) con unas pocas métricas que el esquema
// todavía no registra —ausentismo, ocupación de agenda y carga por odontólogo—.
// Esas se DERIVAN de forma determinista a partir de los datos reales para que
// resulten coherentes y correlacionadas, nunca con valores aleatorios.

export const RANGE_LABELS = ['Hoy', 'Ayer', 'Últimos 7 días', 'Mes', 'Año', 'Histórico']

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(text)
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
const inRange = (date, from, to) => !!date && (!from || date >= from) && (!to || date <= to)

// Rango [from, to] y el periodo inmediatamente anterior de igual longitud (para los deltas).
// `rangeSel` admite un índice de preset (compatibilidad) o { mode: 'custom', from, to }
// para el rango elegido libremente en el desplegable de calendario.
export const resolveRange = (rangeSel) => {
  const now = new Date()
  const today = startOfDay(now)
  const day = 24 * 60 * 60 * 1000
  let from = null
  let to = endOfDay(now)

  if (rangeSel && typeof rangeSel === 'object' && rangeSel.mode === 'custom' && rangeSel.from) {
    from = startOfDay(toDate(rangeSel.from))
    to = rangeSel.to ? endOfDay(toDate(rangeSel.to)) : endOfDay(now)
  } else {
    const rangeKey = typeof rangeSel === 'object' ? rangeSel?.preset : rangeSel
    if (rangeKey === 0) from = today
    else if (rangeKey === 1) { from = new Date(today.getTime() - day); to = endOfDay(new Date(today.getTime() - day)) }
    else if (rangeKey === 2) from = new Date(today.getTime() - 6 * day)
    else if (rangeKey === 3) from = new Date(now.getFullYear(), now.getMonth(), 1)
    else if (rangeKey === 4) from = new Date(now.getFullYear(), 0, 1)
    else { from = null; to = endOfDay(now) } // Histórico
  }

  let prevFrom = null
  let prevTo = null
  if (from) {
    const length = to.getTime() - from.getTime()
    prevTo = new Date(from.getTime() - 1)
    prevFrom = new Date(from.getTime() - 1 - length)
  }
  return { from, to, prevFrom, prevTo }
}

// Texto a mostrar en el desplegable de rango ("Mes · 1 oct – 20 oct 2026" o, para un
// rango personalizado, solo las fechas).
export const describeRangeCtrl = (rangeSel) => {
  const { from, to } = resolveRange(rangeSel)
  const fmt = (date, withYear) =>
    date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined }).replace('.', '')
  const toLabel = to ? fmt(to, true) : ''
  const sameYear = from && to && from.getFullYear() === to.getFullYear()
  const fromLabel = from ? fmt(from, !sameYear) : 'Inicio'
  const span = `${fromLabel} – ${toLabel}`

  const isCustom = rangeSel && typeof rangeSel === 'object' && rangeSel.mode === 'custom'
  if (isCustom) return span
  const presetIndex = typeof rangeSel === 'object' ? rangeSel?.preset : rangeSel
  return `${RANGE_LABELS[presetIndex] ?? RANGE_LABELS[3]} · ${span}`
}

const money = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Delta porcentual entre el periodo actual y el anterior.
const delta = (current, previous) => {
  if (!previous) return { delta: current > 0 ? '▲ nuevo' : '— sin cambio', good: current >= 0, up: current > 0 }
  const pct = ((current - previous) / previous) * 100
  const rounded = Math.round(pct * 10) / 10
  const arrow = rounded > 0 ? '▲' : rounded < 0 ? '▼' : '—'
  return { delta: `${arrow} ${Math.abs(rounded).toLocaleString('es-CO')}%`, good: rounded >= 0, up: rounded >= 0 }
}

export const fetchDashboardRawCtrl = async () => {
  const [billing, patients, inventory, laboratory, appointments, plans, doctors] = await Promise.all([
    getBillingCtrlData(),
    loadPatientsCtrl('todos'),
    loadInventoryItemsCtrl(),
    loadLaboratoryDataCtrl(),
    listAllAppointmentsDAO(),
    listAllTreatmentPlansDAO(),
    listActiveDoctorsDAO(),
  ])
  return { billing, patients, inventory, laboratory, appointments, plans, doctors }
}

const buildServiceOptions = (appointments) => {
  const counts = new Map()
  appointments.forEach((appt) => {
    const name = (appt.service_type || '').trim()
    if (name) counts.set(name, (counts.get(name) || 0) + 1)
  })
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a))
  return ['Todos los servicios', ...sorted]
}

// dentistOptions es la lista para el <select> (solo nombres, para no romper su
// contrato); dentistIds es el id real de doctors en el mismo orden ('' para
// "Todos los odontólogos"), usado para filtrar appointments.doctor_id de verdad.
const buildDentistOptions = (doctors) => {
  const named = doctors.filter((doc) => `${doc.nombre ?? ''} ${doc.apellidos ?? ''}`.trim())
  const dentistOptions = ['Todos los odontólogos', ...named.map((doc) => `${doc.nombre ?? ''} ${doc.apellidos ?? ''}`.trim())]
  const dentistIds = ['', ...named.map((doc) => doc.id)]
  return { dentistOptions, dentistIds }
}

export const computeDashboardCtrl = (raw, { range = { mode: 'preset', preset: 3 }, dentist = 0, service = 0 } = {}) => {
  const { billing, patients, inventory, laboratory, appointments, plans, doctors } = raw
  const { from, to, prevFrom, prevTo } = resolveRange(range)

  const serviceOptions = buildServiceOptions(appointments)
  const { dentistOptions, dentistIds } = buildDentistOptions(doctors)
  const selectedService = service > 0 ? serviceOptions[service] : null
  // doctor_id real de appointments (migración appointments_doctor_id): ya no se reparte
  // el total con un peso inventado, se filtran las citas del odontólogo elegido.
  const selectedDoctorId = dentist > 0 ? dentistIds[dentist] : null

  // ── Facturación (real, no se filtra por odontólogo: las facturas son por
  // paciente y no registran quién atendió, a diferencia de las citas) ──
  const activeInvoices = billing.invoices.filter((inv) => !inv.isVoid)
  const invoicesInRange = activeInvoices.filter((inv) => inRange(toDate(inv.date), from, to))
  // Ingresos = pagos recibidos (por fecha de pago, no por fecha de factura) de facturas vigentes.
  const sumPaidBetween = (f, t) => activeInvoices.reduce((s, inv) => s + inv.paidInRange(f, t), 0)
  const income = sumPaidBetween(from, to)
  const incomePrev = from ? sumPaidBetween(prevFrom, prevTo) : 0
  const paymentsInRangeCount = activeInvoices.reduce((s, inv) => s + inv.paymentsInRange(from, to).length, 0)
  const pending = activeInvoices.filter((inv) => inv.isPending).reduce((s, inv) => s + inv.balance, 0)
  const now = new Date()
  const overdue = activeInvoices
    .filter((inv) => inv.isPending && toDate(inv.date) && (now - toDate(inv.date)) > 30 * 24 * 60 * 60 * 1000)
    .reduce((s, inv) => s + inv.balance, 0)

  // ── Pacientes (real) ──
  const activePatients = patients.filter((p) => p.activo !== false)
  const newPatients = activePatients.filter((p) => inRange(toDate(p.created_at), from, to))
  const newPatientsPrev = activePatients.filter((p) => inRange(toDate(p.created_at), prevFrom, prevTo))
  const recurrentes = Math.max(0, activePatients.length - newPatients.length)

  // ── Citas (real, filtradas por servicio y/o odontólogo si aplica) ──
  const apptService = (appt) =>
    (!selectedService || appt.service_type === selectedService) &&
    (!selectedDoctorId || String(appt.doctor_id) === String(selectedDoctorId))
  const scopedAppts = appointments.filter(apptService)
  const apptsInRange = scopedAppts.filter((a) => inRange(toDate(a.start_at), from, to))
  const todayAppts = scopedAppts.filter((a) => {
    const d = toDate(a.start_at)
    return d && d >= startOfDay(now) && d <= endOfDay(now)
  })
  const countBy = (list, status) => list.filter((a) => a.status === status).length
  const confirmadasHoy = countBy(todayAppts, 'Confirmada')
  const solicitadasHoy = countBy(todayAppts, 'Solicitada') + countBy(todayAppts, 'Cancelación solicitada')
  const canceladasHoy = countBy(todayAppts, 'Cancelada')

  // ── Derivadas coherentes (ausentismo y ocupación) ──
  const confirmadasRango = countBy(apptsInRange, 'Confirmada')
  const canceladasRango = countBy(apptsInRange, 'Cancelada')
  const totalCitasRango = apptsInRange.length
  // Asistencia real (estados 'No asistida'/'Atendida') si el consultorio ya la registra.
  const noShowReal = countBy(apptsInRange, 'No asistida')
  const atendidasReal = countBy(apptsInRange, 'Atendida')
  const attendanceTracked = noShowReal + atendidasReal > 0
  // Ausentismo: real cuando hay asistencia registrada; si no, se deriva de las cancelaciones (5–25%).
  const noShowRate = attendanceTracked
    ? noShowReal / Math.max(1, noShowReal + atendidasReal)
    : Math.min(0.25, Math.max(0.05, (canceladasRango / Math.max(1, confirmadasRango + canceladasRango)) * 0.6 + 0.06))
  const aus = Math.round(noShowRate * 100)
  // Ocupación: citas reales del rango contra una capacidad estimada de la agenda.
  const businessDays = (() => {
    if (!from) return 24
    let days = 0
    for (let t = from.getTime(); t <= to.getTime(); t += 24 * 60 * 60 * 1000) {
      const wd = new Date(t).getDay()
      if (wd !== 0) days += 1 // domingo cerrado
    }
    return Math.max(1, days)
  })()
  const capacityDoctors = selectedDoctorId ? 1 : Math.max(1, doctors.length || 3)
  const capacity = businessDays * 16 * capacityDoctors // ~16 franjas/día por odontólogo
  const ocu = Math.min(99, Math.round((totalCitasRango / capacity) * 100)) || 0

  // ── Tendencia de cada KPI (sparkline) ──
  // 14 cortes consecutivos del rango seleccionado (mínimo los últimos 14 días, para que
  // "Hoy" o "Ayer" también muestren una tendencia), calculados con los mismos datos reales.
  const DAY_MS = 24 * 60 * 60 * 1000
  const TREND_POINTS = 14
  const trendBuckets = (() => {
    const end = to ?? endOfDay(now)
    let start = from
    if (!start) {
      const times = [
        ...activeInvoices.map((inv) => toDate(inv.date)),
        ...scopedAppts.map((a) => toDate(a.start_at)),
        ...activePatients.map((p) => toDate(p.created_at)),
      ].filter(Boolean).map((date) => date.getTime())
      start = times.length ? startOfDay(new Date(times.reduce((min, t) => Math.min(min, t), Infinity))) : null
    }
    const minStart = startOfDay(new Date(end.getTime() - (TREND_POINTS - 1) * DAY_MS))
    if (!start || start > minStart) start = minStart
    const step = (end.getTime() - start.getTime() + 1) / TREND_POINTS
    return Array.from({ length: TREND_POINTS }, (_, i) => ({
      start: new Date(start.getTime() + i * step),
      end: new Date(start.getTime() + (i + 1) * step - 1),
      days: step / DAY_MS,
    }))
  })()
  const bucketize = (items, getDate, getValue = () => 1) =>
    trendBuckets.map((b) => items.reduce((sum, item) => (inRange(toDate(getDate(item)), b.start, b.end) ? sum + getValue(item) : sum), 0))
  const apptsByStatus = (statuses) => bucketize(scopedAppts.filter((a) => statuses.includes(a.status)), (a) => a.start_at)
  const apptsPerBucket = bucketize(scopedAppts, (a) => a.start_at)
  const noShowPerBucket = apptsByStatus(['No asistida'])
  const attendedPerBucket = apptsByStatus(['Atendida'])
  const cancelledPerBucket = apptsByStatus(['Cancelada'])
  const ratio = (num, den) => (den > 0 ? (num / den) * 100 : 0)
  const trends = {
    ing: trendBuckets.map((b) => sumPaidBetween(b.start, b.end)),
    cit: apptsPerBucket,
    // Misma fórmula del KPI (citas / capacidad), pero por corte. Los domingos no cuentan.
    ocu: apptsPerBucket.map((count, i) => ratio(count, Math.max(1, trendBuckets[i].days * (6 / 7)) * 16 * capacityDoctors)),
    aus: apptsPerBucket.map((count, i) => (attendanceTracked
      ? ratio(noShowPerBucket[i], noShowPerBucket[i] + attendedPerBucket[i])
      : ratio(cancelledPerBucket[i], count))),
    pac: bucketize(activePatients, (p) => p.created_at),
    cxc: bucketize(activeInvoices.filter((inv) => inv.isPending), (inv) => inv.date, (inv) => inv.balance),
  }

  // ── KPIs ──
  const kpis = {
    ing: {
      value: money(income),
      sub: `En el período · ${paymentsInRangeCount} pago(s) recibido(s)${selectedDoctorId ? ' · todos los odontólogos' : ''}`,
      st: 'g',
      ...delta(income, incomePrev),
    },
    cit: {
      value: String(todayAppts.length),
      sub: `${confirmadasHoy} confirmadas · ${solicitadasHoy} solicitadas · ${canceladasHoy} canceladas`,
      st: canceladasHoy > confirmadasHoy ? 'r' : canceladasHoy > 0 ? 'a' : 'g',
      delta: '—', good: true, up: true,
    },
    ocu: {
      value: ocu + '%',
      sub: 'Estimada: citas / capacidad de agenda',
      derived: true,
    },
    aus: {
      value: aus + '%',
      sub: attendanceTracked ? 'Citas no asistidas / asistidas' : 'Estimado a partir de cancelaciones',
      derived: !attendanceTracked,
    },
    pac: {
      value: `${newPatients.length} / ${recurrentes}`,
      sub: `${activePatients.length ? Math.round((newPatients.length / activePatients.length) * 100) : 0}% de los pacientes activos son nuevos`,
      st: 'g',
      ...delta(newPatients.length, newPatientsPrev.length),
    },
    cxc: {
      value: money(pending),
      sub: `Vencidas (>30 días): ${money(overdue)}${selectedDoctorId ? ' · todos los odontólogos' : ''}`,
      st: overdue > 0 ? 'r' : 'g',
      delta: '—', good: overdue === 0, up: overdue > 0,
    },
  }
  Object.keys(kpis).forEach((id) => { kpis[id].trend = trends[id] })

  // ── Series de gráficos ──
  // Ingresos por día (30), mes (12) y año (5), desde pagos reales.
  const ingresos = { d: [], m: [], a: [] }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfDay(now).getTime() - i * 24 * 60 * 60 * 1000)
    ingresos.d.push({ x: d.getDate(), v: sumPaidBetween(startOfDay(d), endOfDay(d)) })
  }
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    ingresos.m.push({ x: MONTH_NAMES[d.getMonth()], v: sumPaidBetween(d, end) })
  }
  for (let i = 4; i >= 0; i--) {
    const year = now.getFullYear() - i
    ingresos.a.push({ x: String(year), v: sumPaidBetween(new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59, 999)) })
  }

  // Ingresos mensuales (últimos 6) vs. mismo mes del año anterior (real; 0 si no hubo pagos).
  const mensual = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const cur = sumPaidBetween(d, end)
    const prevYear = sumPaidBetween(new Date(d.getFullYear() - 1, d.getMonth(), 1), new Date(d.getFullYear() - 1, d.getMonth() + 1, 0, 23, 59, 59, 999))
    mensual.push({ m: MONTH_NAMES[d.getMonth()], y26: cur, y25: prevYear })
  }

  // Donut de citas por estado (real + "atendidas"/"no asistió" derivadas de las confirmadas pasadas).
  const confirmadasTotal = countBy(scopedAppts, 'Confirmada')
  const canceladasTotal = countBy(scopedAppts, 'Cancelada')
  const solicitadasTotal = countBy(scopedAppts, 'Solicitada') + countBy(scopedAppts, 'Cancelación solicitada')
  const pastConfirmed = scopedAppts.filter((a) => a.status === 'Confirmada' && toDate(a.start_at) && toDate(a.start_at) < now).length
  // Asistencia real por estado si existe; si no, se estima sobre las confirmadas pasadas.
  const noShow = attendanceTracked ? countBy(scopedAppts, 'No asistida') : Math.round(pastConfirmed * noShowRate)
  const atendidas = attendanceTracked ? countBy(scopedAppts, 'Atendida') : Math.max(0, pastConfirmed - noShow)
  const citasEstado = [
    { name: 'Atendidas', value: atendidas, key: 'pr', derived: !attendanceTracked },
    { name: 'Confirmadas', value: attendanceTracked ? confirmadasTotal : Math.max(0, confirmadasTotal - pastConfirmed), key: 'bl' },
    { name: 'Solicitadas', value: solicitadasTotal, key: 'a' },
    { name: 'Canceladas', value: canceladasTotal, key: 'r' },
    { name: 'No asistió', value: noShow, key: 'faint', derived: !attendanceTracked },
  ].filter((s) => s.value > 0)

  // Cancelaciones por semana (reales) + reprogramaciones (derivadas).
  const cancelaciones = []
  for (let i = 7; i >= 0; i--) {
    const end = new Date(startOfDay(now).getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
    const canc = scopedAppts.filter((a) => a.status === 'Cancelada' && inRange(toDate(a.start_at), start, endOfDay(end))).length
    cancelaciones.push({ s: 'S' + (8 - i), c: canc, r: Math.round(canc * 0.6) })
  }

  // Pacientes por mes: nuevos (real) y recurrentes (acumulado real aproximado).
  const pacientesMes = []
  let acumulado = activePatients.filter((p) => {
    const d = toDate(p.created_at)
    return d && d < new Date(now.getFullYear(), now.getMonth() - 5, 1)
  }).length
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const nue = activePatients.filter((p) => inRange(toDate(p.created_at), d, end)).length
    acumulado += nue
    pacientesMes.push({ m: MONTH_NAMES[d.getMonth()], nue, rec: Math.max(0, acumulado - nue) })
  }

  // Ingresos por tratamiento (real, desde los ítems de factura).
  const tratamientoTotals = new Map()
  invoicesInRange.forEach((inv) => {
    (inv.items ?? []).forEach((item) => {
      const name = (item.description || 'Otro').split('·')[0].trim()
      tratamientoTotals.set(name, (tratamientoTotals.get(name) || 0) + (Number(item.total) || 0))
    })
  })
  const tratamientos = [...tratamientoTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Carga por odontólogo: conteo real de citas del período por doctor_id
  // (migración appointments_doctor_id). Las citas sin odontólogo asignado
  // (agendadas antes de la migración, o por WhatsApp) se agrupan aparte.
  const doctorNameById = new Map(doctors.map((doc) => [String(doc.id), `${doc.nombre ?? ''} ${doc.apellidos ?? ''}`.trim()]))
  const citasPorOdontologo = new Map()
  apptsInRange.forEach((appt) => {
    const key = appt.doctor_id != null ? String(appt.doctor_id) : '__sin_asignar__'
    citasPorOdontologo.set(key, (citasPorOdontologo.get(key) || 0) + 1)
  })
  const odontologos = [...citasPorOdontologo.entries()]
    .map(([key, citas]) => ({
      name: key === '__sin_asignar__' ? 'Sin asignar' : (doctorNameById.get(key) || 'Odontólogo'),
      citas,
    }))
    .sort((a, b) => b.citas - a.citas)

  // Mapa de calor de ocupación: distribución REAL de citas por día de semana y hora.
  const WD = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18]
  const heatCounts = WD.map(() => HOURS.map(() => 0))
  scopedAppts.forEach((a) => {
    const d = toDate(a.start_at)
    if (!d) return
    const wd = d.getDay() // 1=Lun..6=Sáb
    const row = wd === 0 ? -1 : wd - 1
    const col = HOURS.indexOf(d.getHours())
    if (row >= 0 && row < WD.length && col >= 0) heatCounts[row][col] += 1
  })
  const heatMax = Math.max(1, ...heatCounts.flat())
  const heat = { days: WD, hours: HOURS, cells: heatCounts.map((r) => r.map((v) => v / heatMax)) }

  // Planes de tratamiento (real).
  const planAbierto = plans.filter((p) => p.status === 'Abierto').length
  const planCerrado = plans.filter((p) => p.status === 'Cerrado').length
  const planCancelado = plans.filter((p) => p.status === 'Cancelado').length
  const planesChart = {
    items: [
      { label: 'Abiertos', value: planAbierto, key: 'bl' },
      { label: 'Cerrados', value: planCerrado, key: 'g' },
      { label: 'Cancelados', value: planCancelado, key: 'r' },
    ],
    total: plans.length,
  }

  // Inventario y laboratorio (real).
  const lowStock = inventory.filter(isInventoryItemLow)
  const pendingLab = laboratory.cases.filter((c) => c.status === 'Pendiente' || c.status === 'En proceso')

  // ── Alertas derivadas de los datos reales ──
  const alerts = []
  if (canceladasHoy > 0) alerts.push({ id: 'cit', sev: 'r', badge: String(canceladasHoy), text: 'citas canceladas hoy', action: 'Ver y reprogramar' })
  if (overdue > 0) alerts.push({ id: 'cxc', sev: 'r', badge: money(overdue), text: 'en cuentas por cobrar vencidas', action: 'Ver cartera vencida' })
  if (lowStock.length > 0) alerts.push({ id: 'inv', sev: 'a', badge: String(lowStock.length), text: 'insumos con stock bajo', action: 'Revisar inventario' })
  if (pendingLab.length > 0) alerts.push({ id: 'lab', sev: 'a', badge: String(pendingLab.length), text: 'casos de laboratorio pendientes', action: 'Abrir laboratorio' })
  if (solicitadasHoy > 0) alerts.push({ id: 'sol', sev: 'a', badge: String(solicitadasHoy), text: 'solicitudes de cita por confirmar', action: 'Revisar solicitudes' })

  // ── Listas ──
  const fullName = (appt) => `${appt.patients?.nombre ?? ''} ${appt.patients?.apellidos ?? ''}`.trim() || 'Paciente'
  const citasHoy = todayAppts
    .slice()
    .sort((a, b) => (toDate(a.start_at)?.getTime() || 0) - (toDate(b.start_at)?.getTime() || 0))
    .slice(0, 8)
    .map((a) => ({
      name: fullName(a),
      service: a.service_type || 'Consulta',
      time: toDate(a.start_at) ? toDate(a.start_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
      status: a.status,
      confirmedWa: a.source === 'WhatsApp' && a.status === 'Confirmada',
    }))

  const pagosRecientes = invoicesInRange
    .slice()
    .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0))
    .slice(0, 8)
    .map((inv) => ({
      name: inv.patient,
      amount: money(inv.amount),
      status: inv.isVoid ? 'Anulado' : inv.isPaid ? 'Pagado' : 'Pendiente',
      date: toDate(inv.date) ? toDate(inv.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—',
    }))

  return {
    serviceOptions,
    dentistOptions,
    kpis,
    charts: { ingresos, mensual, citasEstado, cancelaciones, pacientesMes, tratamientos, odontologos, heat, planes: planesChart },
    alerts,
    citasHoy,
    pagosRecientes,
  }
}
