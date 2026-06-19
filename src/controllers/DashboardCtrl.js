import { getBillingCtrlData } from './BillingCtrl'
import { getGoogleTokenCtrl, syncGoogleEventsCtrl } from './CalendarCtrl'
import { loadPatientsCtrl } from './PatientsCtrl'

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

const sameLocalDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const startOfLocalMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)

const formatMoney = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CO')}`

const formatDelta = (current, previous, usePercent = false) => {
  const delta = current - previous
  if (usePercent) {
    if (!previous) return current ? '+100%' : '0%'
    const percent = Math.round((delta / previous) * 100)
    return `${percent >= 0 ? '+' : ''}${percent}%`
  }
  return `${delta >= 0 ? '+' : ''}${delta}`
}

const buildMonthlyActivity = (items, extractor) => {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(now, index - 5)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: MONTH_NAMES[date.getMonth()],
      count: 0,
    }
  })

  for (const item of items) {
    const date = extractor(item)
    if (!date) continue
    const month = months.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`)
    if (month) month.count += 1
  }

  const maxCount = Math.max(...months.map((entry) => entry.count), 1)
  return months.map((entry) => ({
    label: entry.label,
    count: entry.count,
    height: Math.max(20, Math.round((entry.count / maxCount) * 100)),
  }))
}

export const fetchDashboardCtrlData = async () => {
  const [patients, billing] = await Promise.all([
    loadPatientsCtrl(),
    getBillingCtrlData(),
  ])

  let googleToken = null
  try {
    googleToken = await getGoogleTokenCtrl()
  } catch (error) {
    console.error('No se pudo obtener el token de Google:', error)
  }

  let events = []
  if (googleToken) {
    try {
      events = await syncGoogleEventsCtrl(googleToken)
    } catch (error) {
      console.error('No se pudieron sincronizar los eventos de Google:', error)
    }
  }

  const now = new Date()
  const todayStart = startOfLocalDay(now)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)
  const tomorrowEnd = new Date(tomorrowStart)

  const currentMonthStart = startOfLocalMonth(now)
  const previousMonthStart = addMonths(now, -1)
  const previousMonthEnd = currentMonthStart
  const twoMonthsAgoStart = addMonths(now, -2)

  const patientCurrentMonth = patients.filter((patient) => {
    const createdAt = toDate(patient.created_at)
    return createdAt && createdAt >= currentMonthStart
  }).length

  const patientPreviousMonth = patients.filter((patient) => {
    const createdAt = toDate(patient.created_at)
    return createdAt && createdAt >= previousMonthStart && createdAt < previousMonthEnd
  }).length

  const appointmentsToday = events.filter((event) => {
    const start = toDate(event.start)
    return start && start >= todayStart && start < tomorrowEnd
  }).length

  const appointmentsYesterday = events.filter((event) => {
    const start = toDate(event.start)
    return start && start >= yesterdayStart && start < todayStart
  }).length

  const currentMonthIncome = billing.invoices
    .filter((invoice) => invoice.isPaid)
    .filter((invoice) => {
      const date = toDate(invoice.date)
      return date && date >= currentMonthStart
    })
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)

  const previousMonthIncome = billing.invoices
    .filter((invoice) => invoice.isPaid)
    .filter((invoice) => {
      const date = toDate(invoice.date)
      return date && date >= previousMonthStart && date < previousMonthEnd
    })
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)

  const currentMonthPending = billing.invoices.filter((invoice) => {
    if (!invoice.isPending) return false
    const date = toDate(invoice.date)
    return date && date >= currentMonthStart
  }).length

  const previousMonthPending = billing.invoices.filter((invoice) => {
    if (!invoice.isPending) return false
    const date = toDate(invoice.date)
    return date && date >= previousMonthStart && date < previousMonthEnd
  }).length

  const upcomingAppointments = events
    .filter((event) => {
      const start = toDate(event.start)
      return start && start >= todayStart
    })
    .sort((a, b) => toDate(a.start) - toDate(b.start))
    .slice(0, 4)
    .map((event) => {
      const start = toDate(event.start)
      return {
        name: event.resource?.patient || event.title || 'Cita',
        time: start ? start.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '—',
        type: event.resource?.service || 'Google Calendar',
      }
    })

  const fallbackAppointments = billing.invoices
    .filter((invoice) => toDate(invoice.date) && toDate(invoice.date) >= todayStart)
    .sort((a, b) => toDate(a.date) - toDate(b.date))
    .slice(0, 4)
    .map((invoice) => ({
      name: invoice.patient,
      time: toDate(invoice.date)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) || '—',
      type: `Factura #${String(invoice.id).padStart(3, '0')}`,
    }))

  const recentPayments = [...billing.invoices]
    .filter((invoice) => invoice.isPaid)
    .sort((a, b) => toDate(b.date) - toDate(a.date))
    .slice(0, 4)
    .map((invoice) => ({
      name: invoice.patient,
      amount: formatMoney(invoice.amount),
      status: invoice.status,
    }))

  const monthlySource = events.length
    ? events
    : billing.invoices

  const monthlyActivity = buildMonthlyActivity(monthlySource, (item) => {
    if (item.start) return toDate(item.start)
    return toDate(item.date)
  })

  return {
    stats: [
      {
        label: 'Pacientes',
        value: String(patients.length),
        trend: formatDelta(patientCurrentMonth, patientPreviousMonth),
        trendUp: patientCurrentMonth >= patientPreviousMonth,
      },
      {
        label: 'Citas Hoy',
        value: String(appointmentsToday),
        trend: formatDelta(appointmentsToday, appointmentsYesterday),
        trendUp: appointmentsToday >= appointmentsYesterday,
      },
      {
        label: 'Ingresos',
        value: formatMoney(billing.totalIncome),
        trend: formatDelta(currentMonthIncome, previousMonthIncome, true),
        trendUp: currentMonthIncome >= previousMonthIncome,
      },
      {
        label: 'Pendientes',
        value: String(billing.invoices.filter((invoice) => invoice.isPending).length),
        trend: formatDelta(currentMonthPending, previousMonthPending),
        trendUp: currentMonthPending >= previousMonthPending,
      },
    ],
    upcomingAppointments: upcomingAppointments.length ? upcomingAppointments : fallbackAppointments,
    recentPayments: recentPayments.length
      ? recentPayments
      : [{ name: 'Sin pagos registrados', amount: '$0', status: 'Pendiente' }],
    monthlyActivity,
  }
}