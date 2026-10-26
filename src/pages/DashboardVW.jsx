import '../styles/DashboardVW.css'
import '../styles/AdminViewsVW.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import {
  FiAlertTriangle, FiCalendar, FiCheck, FiCheckCircle, FiCreditCard, FiDollarSign, FiDownload,
  FiFileText, FiInfo, FiPercent, FiSliders, FiThermometer, FiUserPlus, FiUserX, FiUsers, FiX,
} from 'react-icons/fi'
import { useProfile } from '../context/ProfileContext'
import { isAdmin, isAssistant } from '../utils/roles'
import { useDispatch } from 'react-redux'
import { showAlertModal } from '../app/store'
import { RANGE_LABELS, computeDashboardCtrl, describeRangeCtrl, fetchDashboardRawCtrl } from '../controllers/DashboardCtrl'
import { fetchReportCtrlData } from '../controllers/ReportsCtrl'

// El dashboard consume datos reales de Supabase a través de DashboardCtrl. Las pocas
// métricas que el esquema aún no registra (ausentismo, ocupación, carga por odontólogo)
// vienen derivadas de forma coherente desde ese mismo controlador.

const money = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const short = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1).replace('.', ',') + 'M' : '$' + Math.round(v / 1e3) + 'K')

// Colores para Recharts (los atributos SVG no resuelven variables CSS de forma fiable).
const CHART_COLORS = {
  light: { pr: '#0E8F8A', bl: '#3F86C8', g: '#22B06B', a: '#F0A81C', r: '#E5484D', faint: '#B9C2CB', mut: '#66737F', line: '#E3E8ED', ink: '#1B2733', surface: '#FFFFFF' },
  dark: { pr: '#3CC4B9', bl: '#6FA8E3', g: '#34C77B', a: '#F0B429', r: '#F26B6B', faint: '#55636F', mut: '#94A1AD', line: '#26323D', ink: '#E8EEF3', surface: '#161E26' },
}

const useDarkTheme = () => {
  const read = () => document.documentElement.getAttribute('data-theme') === 'dark'
  const [dark, setDark] = useState(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

const CHARTS = [
  { id: 'ing', title: 'Ingresos', insight: 'Pagos recibidos según el período seleccionado', kind: 'area', wide: true, toggle: true },
  { id: 'don', title: 'Citas por estado', insight: 'Atendidas y no-show estimadas sobre citas confirmadas', kind: 'donut' },
  { id: 'men', title: 'Ingresos mensuales vs. año anterior', insight: 'Comparativo de los últimos 6 meses', kind: 'bars' },
  { id: 'can', title: 'Cancelaciones y reprogramaciones', insight: 'Cancelaciones reales por semana', kind: 'stacked' },
  { id: 'pac', title: 'Pacientes por mes', insight: 'Nuevos registrados y base recurrente', kind: 'sarea' },
  { id: 'hea', title: 'Mapa de calor de ocupación', insight: 'Distribución real de citas por día y hora', kind: 'heat', wide: true },
  { id: 'tra', title: 'Ingresos por tratamiento', insight: 'Según los ítems facturados del período', kind: 'hbars' },
  { id: 'odo', title: 'Carga por odontólogo', insight: 'Citas reales del período por odontólogo asignado', kind: 'odon' },
  { id: 'pla', title: 'Estado de planes de tratamiento', insight: 'Planes abiertos, cerrados y cancelados', kind: 'planes', wide: true },
]

const CHIP = { Confirmada: 'g', Atendida: 'g', Solicitada: 'a', 'Cancelación solicitada': 'a', Pendiente: 'a', Cancelada: 'r', 'No asistida': 'r', Pagado: 'g', Anulado: 'r', Vencido: 'r' }
const initials = (name) => name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')
const KPI_ICONS = { ing: FiDollarSign, cit: FiCalendar, ocu: FiPercent, aus: FiUserX, pac: FiUsers, cxc: FiCreditCard }

// Etiquetas y definiciones fijas de cada KPI; el valor/estado llega del controlador.
const KPI_META = [
  { id: 'ing', label: 'Ingresos del período', seed: 1, def: 'Suma de los pagos recibidos en el período seleccionado.' },
  { id: 'cit', label: 'Citas del día', seed: 2, def: 'Citas agendadas para hoy, desglosadas por estado.' },
  { id: 'ocu', label: 'Ocupación de la agenda', seed: 3, def: 'Estimación: citas del período / capacidad de la agenda (franjas disponibles).' },
  { id: 'aus', label: 'Ausentismo (no-show)', seed: 4, def: 'Estimación derivada de la proporción de citas canceladas.' },
  { id: 'pac', label: 'Pacientes nuevos / recurrentes', seed: 5, def: 'Nuevos = registrados en el período. Recurrentes = resto de pacientes activos.' },
  { id: 'cxc', label: 'Cuentas por cobrar', seed: 6, def: 'Saldo pendiente de facturas vigentes; vencidas = emitidas hace más de 30 días.' },
]

const STATUS_LABEL = { g: 'En meta', a: 'Atención', r: 'Crítico' }

/* ───────────── Gráficos ───────────── */

const axis = (c) => ({ tick: { fontSize: 10, fill: c.mut }, axisLine: false, tickLine: false })
const tip = (c) => ({ contentStyle: { background: c.ink, color: c.surface, border: 0, borderRadius: 6, fontSize: 11, padding: '5px 8px' }, itemStyle: { color: c.surface }, labelStyle: { color: c.surface } })

const Spark = ({ color, seed, up }) => {
  const data = useMemo(() => [...Array(14)].map((_, i) => ({ i, v: 10 + (up ? i * 0.5 : -i * 0.5) + 2.2 * Math.sin(i * 1.3 + seed) + 1.2 * Math.sin(i * 2.7 + seed * 2) })), [seed, up])
  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart data={data} margin={{ top: 3, right: 4, bottom: 3, left: 4 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const Legend = ({ items }) => (
  <div className="rv-legend-inline">{items.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
)

const BarRow = ({ label, value, max, color, right, opacity = 1 }) => (
  <div className="rv-bar-row">
    <span className="rv-bar-label">{label}</span>
    <div className="rv-bar-track"><div className="rv-bar-fill" style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color, opacity }} /></div>
    <span className="rv-bar-val">{right}</span>
  </div>
)

const NoData = () => <div className="rv-empty" style={{ padding: '1.5rem 0' }}>Sin datos en el período.</div>

const ChartBody = ({ kind, gran, c, charts }) => {
  if (kind === 'area') {
    const data = charts.ingresos[gran] ?? []
    if (data.every((d) => d.v === 0)) return <NoData />
    return (
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={c.line} />
          <XAxis dataKey="x" {...axis(c)} interval={gran === 'd' ? 4 : 0} />
          <YAxis {...axis(c)} tickFormatter={short} width={44} />
          <RTooltip {...tip(c)} formatter={(v) => [money(v), 'Ingresos']} />
          <Area type="monotone" dataKey="v" stroke={c.pr} strokeWidth={2} fill={c.pr} fillOpacity={0.14} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }
  if (kind === 'bars') {
    const data = charts.mensual ?? []
    return (
      <>
        <Legend items={[[c.pr, String(new Date().getFullYear())], [c.faint, String(new Date().getFullYear() - 1)]]} />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="m" {...axis(c)} />
            <YAxis {...axis(c)} tickFormatter={short} width={44} />
            <RTooltip {...tip(c)} cursor={{ fill: 'rgba(127,127,127,.08)' }} formatter={(v, k) => [money(v), k === 'y26' ? 'Este año' : 'Año anterior']} />
            <Bar dataKey="y25" fill={c.faint} radius={[3, 3, 0, 0]} />
            <Bar dataKey="y26" fill={c.pr} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'donut') {
    const seg = (charts.citasEstado ?? []).map((s) => ({ ...s, color: c[s.key] }))
    const total = seg.reduce((a, s) => a + s.value, 0)
    if (total === 0) return <NoData />
    return (
      <div className="rv-donut">
        <div className="rv-donut-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={seg} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={2} stroke="none">
                {seg.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <RTooltip {...tip(c)} formatter={(v, n) => [v + ' citas', n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="rv-donut-center"><b>{total}</b><span>citas</span></div>
        </div>
        <div className="rv-donut-legend">
          {seg.map((s) => <div key={s.name}><i style={{ background: s.color }} /><span>{s.name}{s.derived ? ' *' : ''}</span><b>{s.value} · {Math.round((s.value / total) * 100)}%</b></div>)}
        </div>
      </div>
    )
  }
  if (kind === 'stacked') {
    const data = charts.cancelaciones ?? []
    return (
      <>
        <Legend items={[[c.r, 'Canceladas'], [c.a, 'Reprogramadas *']]} />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="s" {...axis(c)} />
            <YAxis {...axis(c)} width={28} allowDecimals={false} />
            <RTooltip {...tip(c)} cursor={{ fill: 'rgba(127,127,127,.08)' }} formatter={(v, k) => [v, k === 'c' ? 'Canceladas' : 'Reprogramadas']} />
            <Bar dataKey="c" stackId="a" fill={c.r} />
            <Bar dataKey="r" stackId="a" fill={c.a} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'sarea') {
    const data = charts.pacientesMes ?? []
    return (
      <>
        <Legend items={[[c.pr, 'Nuevos'], [c.bl, 'Recurrentes']]} />
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="m" {...axis(c)} />
            <YAxis {...axis(c)} width={32} allowDecimals={false} />
            <RTooltip {...tip(c)} formatter={(v, k) => [v, k === 'nue' ? 'Nuevos' : 'Recurrentes']} />
            <Area type="monotone" dataKey="rec" stackId="p" stroke={c.bl} fill={c.bl} fillOpacity={0.35} strokeWidth={1.8} />
            <Area type="monotone" dataKey="nue" stackId="p" stroke={c.pr} fill={c.pr} fillOpacity={0.5} strokeWidth={1.8} />
          </AreaChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'hbars') {
    const it = charts.tratamientos ?? []
    if (it.length === 0) return <NoData />
    const max = it[0].value
    return <div>{it.map((s, i) => <BarRow key={s.label} label={s.label} value={s.value} max={max} color={c.pr} opacity={1 - i * 0.12} right={short(s.value)} />)}</div>
  }
  if (kind === 'odon') {
    const it = charts.odontologos ?? []
    if (it.length === 0) return <NoData />
    const maxCitas = Math.max(1, ...it.map((s) => s.citas))
    return (
      <div className="rv-odon">
        {it.map((s) => (
          <div key={s.name} title={`${s.name} · ${s.citas} citas`}>
            <div className="rv-odon-name">{s.name}</div>
            <BarRow label="Citas" value={s.citas} max={maxCitas} color={c.pr} right={String(s.citas)} />
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'heat') {
    const { days, hours, cells } = charts.heat
    if (cells.every((row) => row.every((v) => v === 0))) return <NoData />
    return (
      <div className="rv-heat">
        <span />
        {hours.map((h, i) => <span key={h} className="rv-heat-h">{i % 2 === 0 ? `${h}h` : ''}</span>)}
        {days.map((dn, r) => [
          <span key={dn} className="rv-heat-d">{dn}</span>,
          ...hours.map((h, i) => {
            const o = Math.min(1, Math.max(0, cells[r][i]))
            return <span key={dn + i} className="rv-heat-cell" style={{ opacity: 0.1 + 0.9 * o }} title={`${dn} ${h}:00 · ${Math.round(o * 100)}% de la hora pico`} />
          }),
        ])}
      </div>
    )
  }
  if (kind === 'planes') {
    const { items, total } = charts.planes
    if (total === 0) return <NoData />
    const max = Math.max(1, ...items.map((s) => s.value))
    return (
      <div>
        {items.map((s) => <BarRow key={s.label} label={s.label} value={s.value} max={max} color={c[s.key]} right={`${s.value} · ${Math.round((s.value / total) * 100)}%`} />)}
        <div className="rv-plan-note">{total} plan(es) de tratamiento registrados en total.</div>
      </div>
    )
  }
  return null
}

/* ───────────── Página ───────────── */

const CLINIC_LINE = 'RAVE Odontología Integral y Estética · Cali'
const todayLabel = () => new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// Reporte generado bajo demanda (antes una página aparte /reports): el admin elige
// el periodo y una, varias o todas las secciones del documento desde este panel.
const REPORT_SECTIONS = [
  { key: 'kpis', label: 'Indicadores del periodo' },
  { key: 'facturacion', label: 'Facturación del periodo' },
  { key: 'pacientes', label: 'Pacientes nuevos del periodo' },
  { key: 'inventario', label: 'Alertas de inventario' },
  { key: 'laboratorio', label: 'Trabajos de laboratorio activos' },
]

const defaultReportRange = () => {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const toISO = (date) => date.toISOString().slice(0, 10)
  return { from: toISO(firstOfMonth), to: toISO(today) }
}

const formatMoney = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CO')}`

const downloadCsv = (filename, rows) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const Dashboard = () => {
  const profile = useProfile()
  const limited = isAssistant(profile)
  const dark = useDarkTheme()
  const dispatch = useDispatch()
  const canSeeReports = isAdmin(profile)
  const c = CHART_COLORS[dark ? 'dark' : 'light']
  const stColor = { g: c.g, a: c.a, r: c.r }

  const [raw, setRaw] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [range, setRange] = useState({ mode: 'preset', preset: 3 })
  const [rangeMenu, setRangeMenu] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [dentist, setDentist] = useState(0)
  const [service, setService] = useState(0)
  const [dismissed, setDismissed] = useState({})
  const [drawer, setDrawer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secs, setSecs] = useState(0)
  const [hidden, setHidden] = useState({})
  const [thrA, setThrA] = useState(15)
  const [thrO, setThrO] = useState(70)
  const [gran, setGran] = useState('d')
  const [tipId, setTipId] = useState(null)
  const loadTimer = useRef(null)

  const [reportDrawer, setReportDrawer] = useState(false)
  const [reportRange, setReportRange] = useState(defaultReportRange())
  const [reportSections, setReportSections] = useState(REPORT_SECTIONS.map((s) => s.key))
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const showsReportSection = (key) => reportSections.includes(key)
  const toggleReportSection = (key) =>
    setReportSections((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  const toggleAllReportSections = () =>
    setReportSections((prev) => (prev.length === REPORT_SECTIONS.length ? [] : REPORT_SECTIONS.map((s) => s.key)))

  const generateReport = async () => {
    setReportLoading(true)
    try {
      const result = await fetchReportCtrlData(reportRange)
      setReportData(result)
      setReportDrawer(false)
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudo generar el reporte: ${error.message}`, variant: 'error' }))
    } finally {
      setReportLoading(false)
    }
  }

  const reportInvoiceRows = useMemo(
    () => (reportData?.invoices ?? []).map((invoice) => ({
      Fecha: invoice.date,
      Paciente: invoice.patient,
      Monto: invoice.amount,
      Estado: invoice.status,
    })),
    [reportData]
  )

  useEffect(() => {
    let active = true
    fetchDashboardRawCtrl()
      .then((data) => { if (active) { setRaw(data); setFetching(false) } })
      .catch((error) => {
        if (!active) return
        setFetching(false)
        dispatch(showAlertModal({ message: `No se pudo cargar el dashboard: ${error.message}`, variant: 'error' }))
      })
    return () => { active = false }
  }, [dispatch])

  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => (s + 1) % 60), 1000)
    return () => { clearInterval(iv); clearTimeout(loadTimer.current) }
  }, [])

  // Cálculo síncrono a partir de los datos crudos; el "loading" es solo el shimmer al cambiar filtros.
  const d = useMemo(
    () => (raw ? computeDashboardCtrl(raw, { range, dentist, service }) : null),
    [raw, range, dentist, service],
  )

  const refresh = (apply) => {
    apply()
    setLoading(true)
    setSecs(0)
    clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => setLoading(false), 500)
  }

  if (fetching || !d) {
    return (
      <div className="rv-dash">
        <div className="rv-head">
          <div>
            <h1 className="rv-title">Dashboard</h1>
            <div className="rv-sub">{todayLabel()} · {CLINIC_LINE}</div>
          </div>
        </div>
        <div className="rv-kpis">
          {KPI_META.map((k) => <div key={k.id} className="rv-card rv-kpi"><div className="rv-shimmer" style={{ height: 22, width: '70%' }} /><div className="rv-shimmer" style={{ height: 12, width: '45%', marginTop: 8 }} /></div>)}
        </div>
      </div>
    )
  }

  const ocuNum = parseInt(d.kpis.ocu.value, 10) || 0
  const ausNum = parseInt(d.kpis.aus.value, 10) || 0
  const ocuSt = ocuNum >= thrO ? 'g' : ocuNum >= thrO - 15 ? 'a' : 'r'
  const ausSt = ausNum > thrA ? 'r' : ausNum > thrA * 0.8 ? 'a' : 'g'

  const kpis = KPI_META.map((meta) => {
    const data = d.kpis[meta.id]
    let st = data.st
    let sub = data.sub
    if (meta.id === 'ocu') { st = ocuSt; sub = `${data.sub} · meta ≥ ${thrO}%` }
    if (meta.id === 'aus') { st = ausSt; sub = `${data.sub} · límite ${thrA}%` }
    return {
      id: meta.id,
      label: meta.label,
      def: meta.def,
      seed: meta.seed,
      value: data.value,
      sub,
      st,
      delta: data.delta ?? '—',
      good: data.good ?? (st !== 'r'),
      up: data.up ?? (st === 'g'),
      derived: data.derived,
    }
  })

  const alerts = d.alerts.filter((a) => !dismissed[a.id])
  const dismiss = (id) => setDismissed((prev) => ({ ...prev, [id]: 1 }))
  const visibleCharts = CHARTS.filter((ch) => !hidden['c_' + ch.id])
  const dentistOptions = d.dentistOptions
  const serviceOptions = d.serviceOptions
  const widgets = [...kpis.map((k) => ({ key: k.id, label: 'KPI · ' + k.label })), ...CHARTS.map((ch) => ({ key: 'c_' + ch.id, label: 'Gráfico · ' + ch.title }))]
  const citas = d.citasHoy
  const pagos = d.pagosRecientes

  const renderCitas = () => (
    <>
      {citas.length === 0 && <div className="rv-list-empty"><strong>Sin citas programadas</strong><span>No hay citas para hoy con este filtro.</span></div>}
      {citas.map((r, i) => (
        <div key={r.name + i} className="rv-row">
          <div className="rv-avatar brand">{initials(r.name)}</div>
          <div className="rv-row-info"><div className="rv-row-name">{r.name}</div><div className="rv-row-sub">{r.service}</div></div>
          {r.confirmedWa && <span className="rv-wa" title="Confirmada por WhatsApp"><FiCheckCircle size={17} /></span>}
          <div className="rv-time">{r.time}</div>
          <span className={`rv-pill ${CHIP[r.status] ?? 'a'}`}>{r.status}</span>
        </div>
      ))}
    </>
  )

  const renderPagos = () => (
    <>
      {pagos.length === 0 && <div className="rv-list-empty"><strong>Sin pagos recientes</strong><span>No hay facturas en el período seleccionado.</span></div>}
      {pagos.map((p, i) => (
        <div key={p.name + p.date + i} className="rv-row">
          <div className="rv-avatar">{initials(p.name)}</div>
          <div className="rv-row-info"><div className="rv-row-name">{p.name}</div><div className="rv-row-sub">{p.date}</div></div>
          <div className="rv-amount">{p.amount}</div>
          <span className={`rv-pill ${CHIP[p.status] ?? 'a'}`}>{p.status}</span>
        </div>
      ))}
    </>
  )

  if (limited) {
    return (
      <div className="rv-dash">
        <div className="rv-head">
          <div>
            <h1 className="rv-title">Dashboard</h1>
            <div className="rv-sub">{todayLabel()} · {CLINIC_LINE}</div>
          </div>
        </div>
        <div className="rv-lists rv-li">
          <div className="rv-card">
            <div className="rv-list-head"><h2>Citas de hoy</h2></div>
            {renderCitas()}
          </div>
          <div className="rv-card">
            <div className="rv-list-head"><h2>Pagos recientes</h2></div>
            {renderPagos()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rv-dash">
      <div className="rv-head">
        <div>
          <h1 className="rv-title">Dashboard</h1>
          <div className="rv-sub">{todayLabel()} · {CLINIC_LINE}</div>
        </div>
        <div className="rv-head-actions">
          <div className="rv-live"><span className="rv-live-dot" />Actualizado hace {secs} s</div>
          <button type="button" className="rv-btn" onClick={() => setDrawer(true)}><FiSliders size={16} />Configurar indicadores</button>
          {canSeeReports && (
            <button type="button" className="rv-btn primary" onClick={() => setReportDrawer(true)}><FiFileText size={16} />Generar reporte</button>
          )}
        </div>
      </div>

      <div className="rv-filters">
        <div className="rv-range-wrap">
          <button type="button" className="rv-chip rv-range-trigger" onClick={() => setRangeMenu((v) => !v)}>
            <FiCalendar size={13} />
            {describeRangeCtrl(range)}
          </button>
          {rangeMenu && (
            <>
              <div className="rv-range-scrim" onClick={() => setRangeMenu(false)} />
              <div className="rv-pop rv-range-menu">
                {RANGE_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className={`rv-pop-item ${range.mode === 'preset' && range.preset === i ? 'active' : ''}`}
                    onClick={() => { refresh(() => setRange({ mode: 'preset', preset: i })); setRangeMenu(false) }}
                  >
                    {label}
                  </div>
                ))}
                <div className="rv-range-sep" />
                <div className="rv-range-custom">
                  <div className="rv-eyebrow" style={{ marginBottom: 6 }}>Rango personalizado</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" className="rv-select" style={{ width: '100%' }} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                    <input type="date" className="rv-select" style={{ width: '100%' }} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </div>
                  <button
                    type="button"
                    className="rv-btn primary wide"
                    style={{ marginTop: 8 }}
                    disabled={!customFrom}
                    onClick={() => {
                      refresh(() => setRange({ mode: 'custom', from: customFrom, to: customTo || customFrom }))
                      setRangeMenu(false)
                    }}
                  >
                    Aplicar rango
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <select className="rv-select" value={dentist} onChange={(e) => refresh(() => setDentist(+e.target.value))}>
          {dentistOptions.map((t, i) => <option key={t + i} value={i}>{t}</option>)}
        </select>
        <select className="rv-select" value={service} onChange={(e) => refresh(() => setService(+e.target.value))}>
          {serviceOptions.map((t, i) => <option key={t + i} value={i}>{t}</option>)}
        </select>
      </div>

      {reportData && (
        <section className="admin-card" style={{ marginBottom: 18 }}>
          <div className="rv-section-head">
            <h2>Reporte generado</h2>
            <span className="rv-sub">{reportRange.from} a {reportRange.to}</span>
            <div className="rv-spacer" />
            <button
              className="rv-btn"
              type="button"
              disabled={!showsReportSection('facturacion') || !reportInvoiceRows.length}
              onClick={() => downloadCsv(`facturacion_${reportRange.from}_a_${reportRange.to}.csv`, reportInvoiceRows)}
            >
              <FiDownload size={15} /> Exportar CSV
            </button>
            <button type="button" className="rv-close" title="Cerrar reporte" onClick={() => setReportData(null)}><FiX size={16} /></button>
          </div>

          {!reportSections.length ? (
            <p className="admin-message">Selecciona al menos una sección en "Generar reporte" para ver resultados.</p>
          ) : (
            <>
              {showsReportSection('kpis') && (
                <div className="admin-grid" style={{ marginBottom: 18 }}>
                  <div className="admin-card admin-stat">
                    <div><div className="admin-stat-value">{formatMoney(reportData.summary.totalIncome)}</div><div className="admin-stat-label">ingresos (pagado)</div></div>
                    <span className="admin-icon"><FiDollarSign /></span>
                  </div>
                  <div className="admin-card admin-stat">
                    <div><div className="admin-stat-value">{formatMoney(reportData.summary.totalPending)}</div><div className="admin-stat-label">por cobrar</div></div>
                    <span className="admin-icon"><FiDollarSign /></span>
                  </div>
                  <div className="admin-card admin-stat">
                    <div><div className="admin-stat-value">{reportData.summary.newPatientCount}</div><div className="admin-stat-label">pacientes nuevos</div></div>
                    <span className="admin-icon"><FiUserPlus /></span>
                  </div>
                  <div className="admin-card admin-stat">
                    <div><div className="admin-stat-value">{reportData.summary.lowStockCount}</div><div className="admin-stat-label">insumos por reponer</div></div>
                    <span className="admin-icon"><FiAlertTriangle /></span>
                  </div>
                  <div className="admin-card admin-stat">
                    <div><div className="admin-stat-value">{reportData.summary.pendingLabCount}</div><div className="admin-stat-label">trabajos de laboratorio activos</div></div>
                    <span className="admin-icon"><FiThermometer /></span>
                  </div>
                </div>
              )}

              {showsReportSection('facturacion') && (
                <div style={{ marginBottom: 18 }}>
                  <h3 className="admin-card-title">Facturación del periodo</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Fecha</th><th>Paciente</th><th>Monto</th><th>Estado</th></tr></thead>
                      <tbody>
                        {reportData.invoices.length === 0 ? (
                          <tr><td colSpan="4" className="admin-empty">No hay facturas en el periodo seleccionado.</td></tr>
                        ) : (
                          reportData.invoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td>{invoice.date}</td>
                              <td>{invoice.patient}</td>
                              <td>{formatMoney(invoice.amount)}</td>
                              <td><span className={`admin-pill ${invoice.isPaid ? 'good' : invoice.isPending ? 'warn' : 'bad'}`}>{invoice.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showsReportSection('pacientes') && (
                <div style={{ marginBottom: 18 }}>
                  <h3 className="admin-card-title">Pacientes nuevos del periodo</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Nombre</th><th>Documento</th><th>Registro</th></tr></thead>
                      <tbody>
                        {reportData.newPatients.length === 0 ? (
                          <tr><td colSpan="3" className="admin-empty">No hay pacientes nuevos en el periodo.</td></tr>
                        ) : (
                          reportData.newPatients.map((patient) => (
                            <tr key={patient.id}>
                              <td>{patient.fullName}</td>
                              <td>{patient.numero_documento}</td>
                              <td>{String(patient.created_at).slice(0, 10)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showsReportSection('inventario') && (
                <div style={{ marginBottom: 18 }}>
                  <h3 className="admin-card-title">Alertas de inventario</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Insumo</th><th>Stock</th><th>Minimo</th></tr></thead>
                      <tbody>
                        {reportData.lowStockItems.length === 0 ? (
                          <tr><td colSpan="3" className="admin-empty">No hay insumos por reponer.</td></tr>
                        ) : (
                          reportData.lowStockItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.stock} {item.unit}</td>
                              <td>{item.min_stock} {item.unit}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showsReportSection('laboratorio') && (
                <div>
                  <h3 className="admin-card-title">Trabajos de laboratorio activos</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Trabajo</th><th>Laboratorio</th><th>Entrega</th><th>Estado</th></tr></thead>
                      <tbody>
                        {reportData.pendingLabCases.length === 0 ? (
                          <tr><td colSpan="4" className="admin-empty">No hay trabajos activos.</td></tr>
                        ) : (
                          reportData.pendingLabCases.map((item) => (
                            <tr key={item.id}>
                              <td>{item.work_name}</td>
                              <td>{item.lab_name || '-'}</td>
                              <td>{item.due_date || '-'}</td>
                              <td><span className="admin-pill warn">{item.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <div className="rv-body">
        <div className="rv-rc">
          <section>
            <div className="rv-section-head">
              <h2>Alertas</h2>
              <span className="rv-count">{alerts.length}</span>
              <div className="rv-spacer" />
              {Object.keys(dismissed).length > 0 && <a className="rv-link" onClick={() => setDismissed({})}>Restablecer</a>}
            </div>
            {alerts.length === 0 && (
              <div className="rv-empty-alerts">
                <div className="rv-ok"><FiCheck size={22} /></div>
                <strong>Sin alertas pendientes</strong>
                <span>Todos los indicadores están dentro de los límites configurados.</span>
              </div>
            )}
            <div className="rv-alerts">
              {alerts.map((a) => (
                <div key={a.id} className={`rv-alert ${a.sev}`}>
                  <div className="rv-alert-top">
                    <span className="rv-alert-dot" />
                    <span className="rv-alert-sev">{a.sev === 'r' ? 'Crítica' : 'Atención'}</span>
                    <div className="rv-spacer" />
                    <button type="button" className="rv-icon-btn" title="Marcar como resuelta" onClick={() => dismiss(a.id)}><FiCheck size={15} /></button>
                    <button type="button" className="rv-icon-btn muted" title="Descartar" onClick={() => dismiss(a.id)}><FiX size={14} /></button>
                  </div>
                  <div className="rv-alert-body">
                    <span className="rv-alert-badge">{a.badge}</span>
                    <span className="rv-alert-text">{a.text}</span>
                  </div>
                  {a.action && <a className="rv-alert-action">{a.action} →</a>}
                </div>
              ))}
            </div>
          </section>

          <section className="rv-defs">
            <div className="rv-defs-title">Indicadores · cómo se calcula</div>
            <div className="rv-defs-grid">
              {kpis.map((k) => (
                <div key={k.id}>
                  <div className="rv-def-head"><span>{k.label}</span><span className="rv-def-val">{k.value}</span></div>
                  <div className="rv-def-text">{k.def}</div>
                </div>
              ))}
            </div>
            <div className="rv-def-text" style={{ marginTop: 8, opacity: 0.8 }}>* Métricas estimadas de forma coherente a partir de los datos reales (el esquema aún no registra asistencia ni capacidad de agenda).</div>
          </section>
        </div>

        <section className="rv-kp">
          <div className="rv-section-head">
            <h2>Indicadores clave</h2>
            <div className="rv-spacer" />
            <div className="rv-legend"><span><i className="g" />En meta</span><span><i className="a" />Atención</span><span><i className="r" />Crítico</span></div>
          </div>
          <div className="rv-kpis">
            {kpis.map((k) => {
              if (hidden[k.id]) return null
              const Icon = KPI_ICONS[k.id]
              return (
                <div key={k.id} className="rv-card rv-kpi">
                  <div className="rv-kpi-top">
                    <div className="rv-kpi-icon"><Icon size={16} /></div>
                    <span className="rv-kpi-label">{k.label}{k.derived ? ' *' : ''}</span>
                    <span className="rv-info" onMouseEnter={() => setTipId(k.id)} onMouseLeave={() => setTipId(null)}><FiInfo size={15} /></span>
                    <span className={`rv-status ${k.st}`} title={STATUS_LABEL[k.st]} />
                  </div>
                  {loading ? (
                    <>
                      <div className="rv-shimmer" style={{ height: 22, width: '70%' }} />
                      <div className="rv-shimmer" style={{ height: 12, width: '45%' }} />
                    </>
                  ) : (
                    <>
                      <div className="rv-kpi-value">{k.value}</div>
                      <div className={`rv-kpi-delta ${k.good ? 'good' : 'bad'}`}>{k.delta} <span>vs período anterior</span></div>
                    </>
                  )}
                  <Spark color={stColor[k.st]} seed={k.seed} up={k.up} />
                  <div className="rv-kpi-sub">{k.sub}</div>
                  {tipId === k.id && <div className="rv-tooltip">{k.def}</div>}
                </div>
              )
            })}
          </div>
        </section>

        <section className="rv-ch">
          <h2 className="rv-h2">Análisis</h2>
          <div className="rv-charts">
            {visibleCharts.map((ch) => (
              <div key={ch.id} className={`rv-card rv-chart-card ${ch.wide ? 'wide' : ''}`}>
                <div className="rv-chart-head">
                  <div className="rv-chart-titles">
                    <div className="rv-chart-title">{ch.title}</div>
                    <div className="rv-chart-insight">{ch.insight}</div>
                  </div>
                  {ch.toggle && (
                    <div className="rv-seg">
                      {[['d', 'Día'], ['m', 'Mes'], ['a', 'Año']].map(([v, l]) => (
                        <button key={v} type="button" className={gran === v ? 'active' : ''} onClick={() => setGran(v)}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>
                {loading ? <div className="rv-shimmer" style={{ height: 150, borderRadius: 10 }} /> : <ChartBody kind={ch.kind} gran={gran} c={c} charts={d.charts} />}
              </div>
            ))}
          </div>
          {visibleCharts.length === 0 && <div className="rv-empty">Todos los gráficos están ocultos. Actívalos en "Configurar indicadores".</div>}
        </section>

        <div className="rv-lists rv-li">
          <div className="rv-card">
            <div className="rv-list-head"><h2>Próximas citas</h2></div>
            {renderCitas()}
          </div>
          <div className="rv-card">
            <div className="rv-list-head"><h2>Pagos recientes</h2></div>
            {renderPagos()}
          </div>
        </div>
      </div>

      {drawer && (
        <div className="rv-drawer-wrap">
          <div className="rv-scrim" onClick={() => setDrawer(false)} />
          <aside className="rv-drawer">
            <div className="rv-drawer-head">
              <div><div className="rv-drawer-title">Configurar indicadores</div><div className="rv-sub">Elige qué ver y cuándo alertar.</div></div>
              <button type="button" className="rv-close" onClick={() => setDrawer(false)}><FiX size={16} /></button>
            </div>
            <div>
              <div className="rv-eyebrow">Umbrales de alerta</div>
              <div className="rv-thr">
                <div className="rv-thr-row"><span>Ausentismo</span><span className="r">&gt; {thrA}% = rojo</span></div>
                <input type="range" min="5" max="30" value={thrA} onChange={(e) => setThrA(+e.target.value)} />
              </div>
              <div className="rv-thr">
                <div className="rv-thr-row"><span>Ocupación de agenda</span><span className="g">≥ {thrO}% = verde</span></div>
                <input type="range" min="40" max="90" value={thrO} onChange={(e) => setThrO(+e.target.value)} />
                <div className="rv-sub">Ámbar hasta {thrO - 15}%; por debajo, rojo.</div>
              </div>
            </div>
            <div>
              <div className="rv-eyebrow">Widgets visibles</div>
              {widgets.map((w) => (
                <div key={w.key} className="rv-widget" onClick={() => setHidden((h) => ({ ...h, [w.key]: !h[w.key] }))}>
                  <span className="rv-spacer">{w.label}</span>
                  <span className={`rv-switch ${hidden[w.key] ? '' : 'on'}`}><span /></span>
                </div>
              ))}
            </div>
            <button type="button" className="rv-btn primary wide" onClick={() => setDrawer(false)}>Guardar y cerrar</button>
          </aside>
        </div>
      )}

      {reportDrawer && (
        <div className="rv-drawer-wrap">
          <div className="rv-scrim" onClick={() => setReportDrawer(false)} />
          <aside className="rv-drawer">
            <div className="rv-drawer-head">
              <div><div className="rv-drawer-title">Generar reporte</div><div className="rv-sub">Elige el periodo y qué secciones incluir.</div></div>
              <button type="button" className="rv-close" onClick={() => setReportDrawer(false)}><FiX size={16} /></button>
            </div>
            <div>
              <div className="rv-eyebrow">Periodo del reporte</div>
              <div className="rv-thr" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="rv-sub" style={{ display: 'block', marginBottom: 4 }}>Desde</label>
                  <input
                    type="date"
                    className="rv-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={reportRange.from}
                    onChange={(e) => setReportRange({ ...reportRange, from: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="rv-sub" style={{ display: 'block', marginBottom: 4 }}>Hasta</label>
                  <input
                    type="date"
                    className="rv-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={reportRange.to}
                    onChange={(e) => setReportRange({ ...reportRange, to: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div className="rv-eyebrow" style={{ marginBottom: 0 }}>Secciones del documento</div>
                <div className="rv-spacer" />
                <a className="rv-link" onClick={toggleAllReportSections}>
                  {reportSections.length === REPORT_SECTIONS.length ? 'Desmarcar todas' : 'Marcar todas'}
                </a>
              </div>
              {REPORT_SECTIONS.map((s) => (
                <div key={s.key} className="rv-widget" onClick={() => toggleReportSection(s.key)}>
                  <span className="rv-spacer">{s.label}</span>
                  <span className={`rv-switch ${showsReportSection(s.key) ? 'on' : ''}`}><span /></span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="rv-btn primary wide"
              disabled={!reportSections.length || reportLoading}
              onClick={generateReport}
            >
              {reportLoading ? 'Generando...' : 'Generar reporte'}
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

export default Dashboard
