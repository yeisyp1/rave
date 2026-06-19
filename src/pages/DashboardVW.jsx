import '../styles/DashboardVW.css';
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUsers, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi'
import { fetchDashboardCtrlData } from '../controllers/DashboardCtrl'

const Dashboard = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    upcomingAppointments: [],
    recentPayments: [],
    monthlyActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchDashboardCtrlData()
        if (mounted) setDashboardData(data)
      } catch (error) {
        console.error('No se pudo cargar el dashboard:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const stats = dashboardData.stats.length
    ? dashboardData.stats.map((item, index) => ({
        ...item,
        icon: [<FiUsers size={28} />, <FiCalendar size={28} />, <FiDollarSign size={28} />, <FiClock size={28} />][index],
      }))
    : []

  return (
    <div className="db-page">

      {/* ── HEADER ── */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
        </div>
        <div className="db-date">
          {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="db-stats">
        {stats.map((s, i) => (
          <div className="db-stat-card" key={i}>
            <div className="db-stat-top">
              <div className="db-stat-icon">{s.icon}</div>
              <span className={`db-trend ${s.trendUp ? "up" : "down"}`}>
                {s.trendUp ? "▲" : "▼"} {s.trend}
              </span>
            </div>
            <div className="db-stat-value">{s.value}</div>
            <div className="db-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CHART PLACEHOLDER ── */}
      <div className="db-card db-chart-card">
        <div className="db-card-header">
          <span className="db-card-title">Actividad Mensual</span>
          <span className="db-card-sub">Últimos 6 meses</span>
        </div>
        <div className="db-chart-area">
          {(dashboardData.monthlyActivity.length ? dashboardData.monthlyActivity : [{ label: 'Sin', height: 20 }]).map((item, i) => (
            <div className="db-bar-wrap" key={i}>
              <div className="db-bar" style={{ height: `${item.height}%` }} />
              <span className="db-bar-label">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM GRID ── */}
      <div className="db-bottom">

        {/* Próximas citas */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="db-card-title">Próximas Citas</span>
            <button className="db-card-action" type="button" onClick={() => navigate('/calendar')}>
              Ver todas →
            </button>
          </div>
          <ul className="db-list">
            {(dashboardData.upcomingAppointments.length ? dashboardData.upcomingAppointments : [{ name: loading ? 'Cargando...' : 'Sin citas', time: '—', type: 'Sin datos' }]).map((a, i) => (
              <li className="db-list-item" key={i}>
                <div className="db-list-avatar">
                  {a.name[0].toUpperCase()}
                </div>
                <div className="db-list-info">
                  <div className="db-list-name">{a.name}</div>
                  <div className="db-list-sub">{a.type}</div>
                </div>
                <div className="db-list-time">{a.time}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pagos recientes */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="db-card-title">Pagos Recientes</span>
            <button className="db-card-action" type="button" onClick={() => navigate('/billing')}>
              Ver todos →
            </button>
          </div>
          <ul className="db-list">
            {dashboardData.recentPayments.map((pay, i) => (
              <li className="db-list-item" key={i}>
                <div className="db-list-avatar">
                  {pay.name[0].toUpperCase()}
                </div>
                <div className="db-list-info">
                  <div className="db-list-name">{pay.name}</div>
                  <div className={`db-pay-status ${pay.status === "Pagado" ? "paid" : "pending"}`}>
                    {pay.status}
                  </div>
                </div>
                <div className="db-list-amount">{pay.amount}</div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;