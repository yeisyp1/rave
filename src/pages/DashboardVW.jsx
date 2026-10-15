import '../styles/DashboardVW.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import {
  FiCalendar, FiCheck, FiCheckCircle, FiCreditCard, FiDollarSign, FiDownload, FiInfo, FiPercent, FiSliders, FiUserX, FiUsers, FiX,
} from 'react-icons/fi'
import { useProfile } from '../context/ProfileContext'
import { isAssistant } from '../utils/roles'

// Dashboard solo de interfaz: todos los datos son de demostración (sin conexión al backend).

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

const RANGES = ['Hoy', 'Ayer', 'Últimos 7 días', 'Mes', 'Año', 'Personalizado']
const RANGE_FACTOR = [0.044, 0.038, 0.235, 1, 11.2, 0.62]
const DENTISTS = ['Todos los odontólogos', 'Dra. Valentina Ospina', 'Dr. Andrés Cardona', 'Dra. Camila Restrepo', 'Dr. Julián Mejía']
const DENTIST_FACTOR = [1, 0.34, 0.28, 0.22, 0.16]
const SERVICES = ['Todos los servicios', 'Ortodoncia', 'Endodoncia', 'Blanqueamiento', 'Resina', 'Limpieza dental', 'Extracción']
const SERVICE_FACTOR = [1, 0.38, 0.16, 0.1, 0.14, 0.12, 0.05]

const ALERTS = [
  { id: 'cit', sev: 'r', badge: '5', text: 'citas canceladas hoy', action: 'Ver y reprogramar' },
  { id: 'rep', sev: 'a', badge: '8', text: 'citas reprogramadas esta semana' },
  { id: 'aus', sev: 'r', badge: '18%', text: 'Tasa de ausentismo', action: 'Reforzar confirmaciones por WhatsApp' },
  { id: 'cxc', sev: 'r', badge: '$3,4M', text: 'en cuentas por cobrar vencidas', action: 'Ver cartera vencida' },
  { id: 'sin', sev: 'a', badge: '12', text: 'pacientes sin cita hace más de 6 meses', action: 'Enviar recordatorio' },
  { id: 'agm', sev: 'a', badge: '45%', text: 'Agenda de mañana con baja ocupación', action: 'Abrir agenda de mañana' },
]

const CHARTS = [
  { id: 'ing', title: 'Ingresos por día', insight: 'Los ingresos cayeron 12% frente al mes anterior', kind: 'area', wide: true, toggle: true },
  { id: 'don', title: 'Citas por estado', insight: '7% de las citas se canceló y 5% no asistió', kind: 'donut' },
  { id: 'men', title: 'Ingresos mensuales vs. año anterior', insight: 'Septiembre superó en 9% al mismo mes de 2025', kind: 'bars' },
  { id: 'can', title: 'Cancelaciones y reprogramaciones', insight: 'Las cancelaciones suben por tercera semana seguida', kind: 'stacked' },
  { id: 'pac', title: 'Pacientes por mes', insight: 'Los pacientes nuevos crecieron 48% desde abril', kind: 'sarea' },
  { id: 'hea', title: 'Mapa de calor de ocupación', insight: 'Los viernes después de las 15:00 tienen la menor ocupación', kind: 'heat', wide: true },
  { id: 'tra', title: 'Ingresos por tratamiento', insight: 'Ortodoncia concentra el 38% de los ingresos', kind: 'hbars' },
  { id: 'odo', title: 'Carga por odontólogo', insight: 'La Dra. Ospina atiende el 34% de las citas', kind: 'odon' },
  { id: 'pla', title: 'Estado de planes de tratamiento', insight: '17 planes abandonados; aceptación de presupuestos en 68%', kind: 'planes', wide: true },
]

const CITAS = [
  ['Laura Gómez Rincón', 'Limpieza dental', 1, 5, '08:00', 'Confirmada', true],
  ['Carlos Andrés Pérez', 'Ortodoncia', 2, 1, '08:45', 'Confirmada', true],
  ['Mariana Torres', 'Endodoncia', 3, 2, '09:30', 'Pendiente', false],
  ['Juan Sebastián Rojas', 'Blanqueamiento', 1, 3, '10:15', 'Confirmada', true],
  ['Daniela Vargas', 'Resina', 2, 4, '11:00', 'Reprogramada', false],
  ['Felipe Castaño', 'Extracción', 3, 6, '11:45', 'Pendiente', false],
]
const PAGOS = [
  ['Sofía Herrera', 'Ortodoncia', 1, '$450.000', 'Pagado', 'Hoy'],
  ['Camilo Ruiz', 'Endodoncia', 2, '$1.250.000', 'Pendiente', 'Hoy'],
  ['Laura Gómez Rincón', 'Limpieza dental', 5, '$120.000', 'Pagado', 'Ayer'],
  ['Mariana Torres', 'Resina', 4, '$380.000', 'Vencido', '28 sep'],
  ['Andrea Londoño', 'Blanqueamiento', 3, '$720.000', 'Pagado', '27 sep'],
  ['Felipe Castaño', 'Ortodoncia', 1, '$900.000', 'Vencido', '24 sep'],
]
const CHIP = { Confirmada: 'g', Pendiente: 'a', Reprogramada: 'a', Pagado: 'g', Vencido: 'r' }
const initials = (name) => name.split(' ').slice(0, 2).map((w) => w[0]).join('')
const REPORT_FORMATS = ['PDF · reporte completo', 'Excel · datos (.xlsx)', 'PNG · imagen del tablero']
const KPI_ICONS = { ing: FiDollarSign, cit: FiCalendar, ocu: FiPercent, aus: FiUserX, pac: FiUsers, cxc: FiCreditCard }
const MONTHS6 = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep']

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
    <div className="rv-bar-track"><div className="rv-bar-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, opacity }} /></div>
    <span className="rv-bar-val">{right}</span>
  </div>
)

const ChartBody = ({ kind, factor, gran, c }) => {
  const f = factor || 1
  if (kind === 'area') {
    const n = gran === 'm' ? 12 : gran === 'a' ? 5 : 30
    const mo = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    const data = [...Array(n)].map((_, i) => ({
      x: gran === 'd' ? i + 1 : gran === 'm' ? mo[i] : String(2022 + i),
      v: gran === 'd' ? f * (1.6e6 + 5.5e5 * Math.sin(i / 3.1) + 2.4e5 * Math.sin(i * 1.9) - i * 9000)
        : gran === 'm' ? f * (38e6 + 9e6 * Math.sin(i / 2) + i * 6e5) : f * (310e6 + i * 42e6),
    }))
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
    const cur = [41.2, 44.8, 39.5, 46.1, 43.7, 48.75], prev = [38.4, 40.1, 41.2, 42.0, 41.5, 44.7]
    const data = MONTHS6.map((m, i) => ({ m, y26: cur[i] * 1e6 * f, y25: prev[i] * 1e6 * f }))
    return (
      <>
        <Legend items={[[c.pr, '2026'], [c.faint, '2025']]} />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="m" {...axis(c)} />
            <YAxis {...axis(c)} tickFormatter={short} width={44} />
            <RTooltip {...tip(c)} cursor={{ fill: 'rgba(127,127,127,.08)' }} formatter={(v, k) => [money(v), k === 'y26' ? '2026' : '2025']} />
            <Bar dataKey="y25" fill={c.faint} radius={[3, 3, 0, 0]} />
            <Bar dataKey="y26" fill={c.pr} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'donut') {
    const seg = [['Atendidas', 412, c.pr], ['Confirmadas', 96, c.bl], ['Canceladas', 48, c.r], ['Reprogramadas', 37, c.a], ['No asistió', 31, c.faint]].map((s) => ({ name: s[0], value: Math.round(s[1] * f), color: s[2] }))
    const total = seg.reduce((a, s) => a + s.value, 0)
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
          {seg.map((s) => <div key={s.name}><i style={{ background: s.color }} /><span>{s.name}</span><b>{s.value} · {Math.round((s.value / total) * 100)}%</b></div>)}
        </div>
      </div>
    )
  }
  if (kind === 'stacked') {
    const ca = [9, 11, 8, 13, 12, 15, 14, 17], re = [6, 7, 9, 8, 10, 9, 11, 12]
    const data = ca.map((v, i) => ({ s: 'S' + (i + 1), c: Math.round(v * f), r: Math.round(re[i] * f) }))
    return (
      <>
        <Legend items={[[c.r, 'Canceladas'], [c.a, 'Reprogramadas']]} />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="s" {...axis(c)} />
            <YAxis {...axis(c)} width={28} />
            <RTooltip {...tip(c)} cursor={{ fill: 'rgba(127,127,127,.08)' }} formatter={(v, k) => [v, k === 'c' ? 'Canceladas' : 'Reprogramadas']} />
            <Bar dataKey="c" stackId="a" fill={c.r} />
            <Bar dataKey="r" stackId="a" fill={c.a} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'sarea') {
    const rec = [150, 158, 162, 170, 176, 182], nue = [31, 35, 38, 40, 43, 46]
    const data = MONTHS6.map((m, i) => ({ m, rec: Math.round(rec[i] * f), nue: Math.round(nue[i] * f) }))
    return (
      <>
        <Legend items={[[c.pr, 'Nuevos'], [c.bl, 'Recurrentes']]} />
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={c.line} />
            <XAxis dataKey="m" {...axis(c)} />
            <YAxis {...axis(c)} width={32} />
            <RTooltip {...tip(c)} formatter={(v, k) => [v, k === 'nue' ? 'Nuevos' : 'Recurrentes']} />
            <Area type="monotone" dataKey="rec" stackId="p" stroke={c.bl} fill={c.bl} fillOpacity={0.35} strokeWidth={1.8} />
            <Area type="monotone" dataKey="nue" stackId="p" stroke={c.pr} fill={c.pr} fillOpacity={0.5} strokeWidth={1.8} />
          </AreaChart>
        </ResponsiveContainer>
      </>
    )
  }
  if (kind === 'hbars') {
    const it = [['Ortodoncia', 18.5], ['Endodoncia', 9.8], ['Blanqueamiento', 7.2], ['Resina', 6.4], ['Limpieza dental', 4.5], ['Extracción', 2.35]].map((s) => [s[0], s[1] * 1e6 * f])
    return <div>{it.map((s, i) => <BarRow key={s[0]} label={s[0]} value={s[1]} max={it[0][1]} color={c.pr} opacity={1 - i * 0.12} right={short(s[1])} />)}</div>
  }
  if (kind === 'odon') {
    const it = [['Dra. Valentina Ospina', 142, 16.6], ['Dr. Andrés Cardona', 117, 13.7], ['Dra. Camila Restrepo', 92, 10.7], ['Dr. Julián Mejía', 66, 7.8]]
    return (
      <div className="rv-odon">
        <Legend items={[[c.pr, 'Citas'], [c.bl, 'Ingresos']]} />
        {it.map((s) => (
          <div key={s[0]} title={`${s[0]} · ${Math.round(s[1] * f)} citas · ${money(s[2] * 1e6 * f)}`}>
            <div className="rv-odon-name">{s[0]}</div>
            <BarRow label="Citas" value={s[1]} max={142} color={c.pr} right={String(Math.round(s[1] * f))} />
            <BarRow label="Ingresos" value={s[2]} max={16.6} color={c.bl} right={short(s[2] * 1e6 * f)} />
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'heat') {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], dm = [1, 0.96, 1, 0.93, 0.8, 0.52]
    const pr = [0.58, 0.82, 0.92, 0.86, 0.46, 0.36, 0.72, 0.9, 0.82, 0.5]
    return (
      <div className="rv-heat">
        <span />
        {pr.map((_, i) => <span key={i} className="rv-heat-h">{i % 2 === 0 ? `${8 + i}h` : ''}</span>)}
        {days.map((dn, r) => [
          <span key={dn} className="rv-heat-d">{dn}</span>,
          ...pr.map((p, i) => {
            let o = p * dm[r] + ((r * 7 + i * 13) % 5) / 60
            if (r === 4 && i >= 7) o *= 0.55
            o = Math.min(1, Math.max(0.05, o))
            return <span key={dn + i} className="rv-heat-cell" style={{ opacity: 0.1 + 0.9 * o }} title={`${dn} ${8 + i}:00 · ${Math.round(o * 100)}% ocupación`} />
          }),
        ])}
      </div>
    )
  }
  if (kind === 'planes') {
    const it = [['En curso', 64, c.bl], ['Completados', 118, c.g], ['Abandonados', 17, c.r]]
    return (
      <div>
        {it.map((s) => <BarRow key={s[0]} label={s[0]} value={s[1]} max={118} color={s[2]} right={`${Math.round(s[1] * f)} · ${Math.round((s[1] / 199) * 100)}%`} />)}
        <div className="rv-plan-accept"><span>Aceptación de presupuestos</span><b>68%</b></div>
        <div className="rv-bar-track" style={{ height: 10, marginTop: 6 }}><div className="rv-bar-fill" style={{ width: '68%', background: c.pr }} /></div>
        <div className="rv-plan-note">34 de 50 presupuestos emitidos este mes</div>
      </div>
    )
  }
  return null
}

/* ───────────── Página ───────────── */

const Dashboard = () => {
  const profile = useProfile()
  const limited = isAssistant(profile)
  const dark = useDarkTheme()
  const c = CHART_COLORS[dark ? 'dark' : 'light']
  const stColor = { g: c.g, a: c.a, r: c.r }

  const [range, setRange] = useState(3)
  const [dentist, setDentist] = useState(0)
  const [service, setService] = useState(0)
  const [dismissed, setDismissed] = useState({})
  const [drawer, setDrawer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secs, setSecs] = useState(5)
  const [flash, setFlash] = useState(-1)
  const [live, setLive] = useState(0)
  const [hidden, setHidden] = useState({})
  const [thrA, setThrA] = useState(15)
  const [thrO, setThrO] = useState(70)
  const [gran, setGran] = useState('d')
  const [menu, setMenu] = useState(null)
  const [tipId, setTipId] = useState(null)
  const [repOpen, setRepOpen] = useState(false)
  const loadTimer = useRef(null)

  useEffect(() => {
    const iv = setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= 9) {
          setFlash(Math.floor(Math.random() * 6))
          setLive((l) => l + 15000 + Math.round(Math.random() * 40000))
          setTimeout(() => setFlash(-1), 1400)
          return 0
        }
        return s + 1
      })
    }, 1000)
    return () => { clearInterval(iv); clearTimeout(loadTimer.current) }
  }, [])

  const refresh = (apply) => {
    apply()
    setLoading(true)
    clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => setLoading(false), 700)
  }

  const factor = DENTIST_FACTOR[dentist] * SERVICE_FACTOR[service]
  const rev = Math.round(48750000 * RANGE_FACTOR[range] * factor + live)
  const ocu = 62
  const aus = 18
  const ocuSt = ocu >= thrO ? 'g' : ocu >= thrO - 15 ? 'a' : 'r'
  const ausSt = aus > thrA ? 'r' : aus > thrA * 0.8 ? 'a' : 'g'

  const kpis = [
    { id: 'ing', label: 'Ingresos del período', value: money(rev), delta: '▲ 8,4%', good: true, sub: 'Hoy $2.150.000 · Semana $11.480.000 · Mes $48.750.000', st: 'g', seed: 1, up: true, def: 'Suma de los pagos recibidos en el período seleccionado, por día, semana y mes.' },
    { id: 'cit', label: 'Citas del día', value: '40', delta: '▼ 2,0%', good: false, sub: '28 confirmadas · 7 pendientes · 5 canceladas', st: 'a', seed: 2, up: false, def: 'Total de citas agendadas para hoy, desglosadas por estado de confirmación.' },
    { id: 'ocu', label: 'Ocupación de la agenda', value: ocu + '%', delta: '▼ 3,1 pp', good: false, sub: 'Meta verde ≥ ' + thrO + '%', st: ocuSt, seed: 3, up: false, def: 'Ocupación = horas agendadas / horas disponibles de los profesionales en el período.' },
    { id: 'aus', label: 'Ausentismo (no-show)', value: aus + '%', delta: '▲ 2,3 pp', good: false, sub: 'Límite configurado: ' + thrA + '%', st: ausSt, seed: 4, up: true, def: 'Ausentismo = citas con "No asistió" / citas confirmadas que debían atenderse.' },
    { id: 'pac', label: 'Pacientes nuevos / recurrentes', value: '46 / 182', delta: '▲ 12%', good: true, sub: '20% de los pacientes del mes son nuevos', st: 'g', seed: 5, up: true, def: 'Nuevos = primera cita registrada en el período. Recurrentes = pacientes con citas previas.' },
    { id: 'cxc', label: 'Cuentas por cobrar', value: money(8920000 * factor), delta: '▲ 5,2%', good: false, sub: 'Vencidas: ' + money(3400000 * factor), st: 'r', seed: 6, up: true, def: 'Saldo pendiente de pago de tratamientos facturados; vencidas = más de 30 días.' },
  ]
  const STATUS_LABEL = { g: 'En meta', a: 'Atención', r: 'Crítico' }

  const alerts = ALERTS.filter((a) => !dismissed[a.id])
  const dismiss = (id) => setDismissed((d) => ({ ...d, [id]: 1 }))
  const visibleCharts = CHARTS.filter((ch) => !hidden['c_' + ch.id])
  const citas = CITAS.filter((r) => (!dentist || r[2] === dentist) && (!service || r[3] === service))
  const pagos = PAGOS.filter((p) => !service || p[2] === service)
  const widgets = [...kpis.map((k) => ({ key: k.id, label: 'KPI · ' + k.label })), ...CHARTS.map((ch) => ({ key: 'c_' + ch.id, label: 'Gráfico · ' + ch.title }))]

  if (limited) {
    return (
      <div className="rv-dash">
        <div className="rv-head">
          <div>
            <h1 className="rv-title">Dashboard</h1>
            <div className="rv-sub">lunes, 5 de octubre de 2026 · Clínica Sonrisa Norte, Bogotá</div>
          </div>
        </div>

        <div className="rv-lists rv-li">
          <div className="rv-card">
            <div className="rv-list-head"><h2>Citas de hoy</h2></div>
            {citas.length === 0 && <div className="rv-list-empty"><strong>Sin citas programadas</strong><span>No hay citas para hoy.</span></div>}
            {citas.map((r) => (
              <div key={r[0]} className="rv-row">
                <div className="rv-avatar brand">{initials(r[0])}</div>
                <div className="rv-row-info"><div className="rv-row-name">{r[0]}</div><div className="rv-row-sub">{r[1]} · {DENTISTS[r[2]].split(' ').slice(0, 2).join(' ')}</div></div>
                {r[6] && <span className="rv-wa" title="Confirmada por WhatsApp"><FiCheckCircle size={17} /></span>}
                <div className="rv-time">{r[4]}</div>
                <span className={`rv-pill ${CHIP[r[5]]}`}>{r[5]}</span>
              </div>
            ))}
          </div>
          <div className="rv-card">
            <div className="rv-list-head"><h2>Pagos recientes</h2></div>
            {pagos.length === 0 && <div className="rv-list-empty"><strong>Sin pagos recientes</strong><span>No hay pagos recientes.</span></div>}
            {pagos.map((p) => (
              <div key={p[0] + p[5]} className="rv-row">
                <div className="rv-avatar">{initials(p[0])}</div>
                <div className="rv-row-info"><div className="rv-row-name">{p[0]}</div><div className="rv-row-sub">{p[1]} · {p[5]}</div></div>
                <div className="rv-amount">{p[3]}</div>
                <span className={`rv-pill ${CHIP[p[4]]}`}>{p[4]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rv-dash" onClick={() => { setMenu(null); setRepOpen(false) }}>
      <div className="rv-head">
        <div>
          <h1 className="rv-title">Dashboard</h1>
          <div className="rv-sub">lunes, 5 de octubre de 2026 · Clínica Sonrisa Norte, Bogotá</div>
        </div>
        <div className="rv-head-actions" onClick={(e) => e.stopPropagation()}>
          <div className="rv-live"><span className="rv-live-dot" />En vivo · Actualizado hace {secs} s</div>
          <button type="button" className="rv-btn" onClick={() => setDrawer(true)}><FiSliders size={16} />Configurar indicadores</button>
          <button type="button" className="rv-btn primary" onClick={() => setRepOpen((o) => !o)}><FiDownload size={16} />Descargar reporte</button>
          {repOpen && (
            <div className="rv-pop rv-report-menu">
              {REPORT_FORMATS.map((f) => <div key={f} className="rv-pop-item" onClick={() => setRepOpen(false)}>{f}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="rv-filters">
        <div className="rv-chips">
          {RANGES.map((label, i) => (
            <button key={label} type="button" className={`rv-chip ${range === i ? 'active' : ''}`} onClick={() => refresh(() => setRange(i))}>{label}</button>
          ))}
        </div>
        <select className="rv-select" value={dentist} onChange={(e) => refresh(() => setDentist(+e.target.value))}>
          {DENTISTS.map((t, i) => <option key={t} value={i}>{t}</option>)}
        </select>
        <select className="rv-select" value={service} onChange={(e) => refresh(() => setService(+e.target.value))}>
          {SERVICES.map((t, i) => <option key={t} value={i}>{t}</option>)}
        </select>
      </div>

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
                    <span className="rv-alert-text">{a.id === 'aus' ? `Tasa de ausentismo (límite ${thrA}%)` : a.text}</span>
                  </div>
                  {a.action && <a className="rv-alert-action">{a.action} →</a>}
                </div>
              ))}
            </div>
          </section>

          <section className="rv-defs">
            <div className="rv-defs-title">Indicadores sugeridos · cómo se calcula</div>
            <div className="rv-defs-grid">
              {kpis.map((k) => (
                <div key={k.id}>
                  <div className="rv-def-head"><span>{k.label}</span><span className="rv-def-val">{k.value}</span></div>
                  <div className="rv-def-text">{k.def}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rv-kp">
          <div className="rv-section-head">
            <h2>Indicadores clave</h2>
            <div className="rv-spacer" />
            <div className="rv-legend"><span><i className="g" />En meta</span><span><i className="a" />Atención</span><span><i className="r" />Crítico</span></div>
          </div>
          <div className="rv-kpis">
            {kpis.map((k, idx) => {
              if (hidden[k.id]) return null
              const Icon = KPI_ICONS[k.id]
              return (
                <div key={k.id} className={`rv-card rv-kpi ${flash === idx ? 'flash' : ''}`}>
                  <div className="rv-kpi-top">
                    <div className="rv-kpi-icon"><Icon size={16} /></div>
                    <span className="rv-kpi-label">{k.label}</span>
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
              <div key={ch.id} className={`rv-card rv-chart-card ${ch.wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
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
                  <button type="button" className="rv-dl" title="Descargar" onClick={() => setMenu(menu === ch.id ? null : ch.id)}><FiDownload size={14} /></button>
                  {menu === ch.id && (
                    <div className="rv-pop rv-chart-menu">
                      <div className="rv-pop-item" onClick={() => setMenu(null)}>Imagen PNG</div>
                      <div className="rv-pop-item" onClick={() => setMenu(null)}>Datos CSV</div>
                    </div>
                  )}
                </div>
                {loading ? <div className="rv-shimmer" style={{ height: 150, borderRadius: 10 }} /> : <ChartBody kind={ch.kind} factor={factor} gran={gran} c={c} />}
              </div>
            ))}
          </div>
          {visibleCharts.length === 0 && <div className="rv-empty">Todos los gráficos están ocultos. Actívalos en "Configurar indicadores".</div>}
        </section>

        <div className="rv-lists rv-li">
          <div className="rv-card">
            <div className="rv-list-head"><h2>Próximas citas</h2><a className="rv-link">Ver todas →</a></div>
            {citas.length === 0 && <div className="rv-list-empty"><strong>Sin citas programadas</strong><span>No hay citas para este profesional o servicio hoy.</span></div>}
            {citas.map((r) => (
              <div key={r[0]} className="rv-row">
                <div className="rv-avatar brand">{initials(r[0])}</div>
                <div className="rv-row-info"><div className="rv-row-name">{r[0]}</div><div className="rv-row-sub">{r[1]} · {DENTISTS[r[2]].split(' ').slice(0, 2).join(' ')}</div></div>
                {r[6] && <span className="rv-wa" title="Confirmada por WhatsApp"><FiCheckCircle size={17} /></span>}
                <div className="rv-time">{r[4]}</div>
                <span className={`rv-pill ${CHIP[r[5]]}`}>{r[5]}</span>
              </div>
            ))}
          </div>
          <div className="rv-card">
            <div className="rv-list-head"><h2>Pagos recientes</h2><a className="rv-link">Ver todas →</a></div>
            {pagos.length === 0 && <div className="rv-list-empty"><strong>Sin pagos recientes</strong><span>No hay pagos para el servicio seleccionado.</span></div>}
            {pagos.map((p) => (
              <div key={p[0] + p[5]} className="rv-row">
                <div className="rv-avatar">{initials(p[0])}</div>
                <div className="rv-row-info"><div className="rv-row-name">{p[0]}</div><div className="rv-row-sub">{p[1]} · {p[5]}</div></div>
                <div className="rv-amount">{p[3]}</div>
                <span className={`rv-pill ${CHIP[p[4]]}`}>{p[4]}</span>
              </div>
            ))}
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
    </div>
  )
}

export default Dashboard
