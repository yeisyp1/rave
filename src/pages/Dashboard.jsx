import '../styles/dashboard.css';

const Dashboard = () => {

  const stats = [
    {
      label: "Pacientes",
      value: "245",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Citas Hoy",
      value: "12",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      trend: "+3",
      trendUp: true,
    },
    {
      label: "Ingresos",
      value: "$3,200",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "Pendientes",
      value: "5",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      trend: "-2",
      trendUp: false,
    },
  ];

  const upcomingAppointments = [
    { name: "Juan Pérez",    time: "9:00 AM",  type: "Revisión" },
    { name: "María Gómez",   time: "10:30 AM", type: "Limpieza" },
    { name: "Carlos Ruiz",   time: "2:00 PM",  type: "Ortodoncia" },
    { name: "Laura Díaz",    time: "3:30 PM",  type: "Extracción" },
  ];

  const recentPayments = [
    { name: "Ana Martínez", amount: "$120", status: "Pagado" },
    { name: "Pedro Soto",   amount: "$80",  status: "Pagado" },
    { name: "Laura Díaz",   amount: "$200", status: "Pendiente" },
    { name: "Luis Torres",  amount: "$95",  status: "Pagado" },
  ];

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
          {/* Simulated bar chart */}
          {[65, 80, 55, 90, 70, 85].map((h, i) => (
            <div className="db-bar-wrap" key={i}>
              <div className="db-bar" style={{ height: `${h}%` }} />
              <span className="db-bar-label">
                {["Ago","Sep","Oct","Nov","Dic","Ene"][i]}
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
            <button className="db-card-action">Ver todas →</button>
          </div>
          <ul className="db-list">
            {upcomingAppointments.map((a, i) => (
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
            <button className="db-card-action">Ver todos →</button>
          </div>
          <ul className="db-list">
            {recentPayments.map((pay, i) => (
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