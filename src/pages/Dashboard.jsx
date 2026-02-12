

import '../styles/dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard">

      {/* CARDS */}
      <div className="dashboard-cards">

        <div className="card">
          <h4>Pacientes</h4>
          <p>245</p>
        </div>

        <div className="card">
          <h4>Citas Hoy</h4>
          <p>12</p>
        </div>

        <div className="card">
          <h4>Ingresos</h4>
          <p>$3,200</p>
        </div>

        <div className="card">
          <h4>Pendientes</h4>
          <p>5</p>
        </div>

      </div>

      {/* CHART */}
      <div className="dashboard-chart card">
        <h4>Actividad Mensual</h4>

        <div className="chart-placeholder">
        </div>
      </div>

      {/* BOTTOM */}
      <div className="dashboard-bottom">

        <div className="card">
          <h4>Próximas Citas</h4>

          <ul>
            <li>Juan Pérez - 9:00 AM</li>
            <li>María Gómez - 10:30 AM</li>
            <li>Carlos Ruiz - 2:00 PM</li>
          </ul>
        </div>

        <div className="card">
          <h4>Pagos Recientes</h4>

          <ul>
            <li>$120 - Ana</li>
            <li>$80 - Pedro</li>
            <li>$200 - Laura</li>
          </ul>
        </div>

      </div>

    </div>
  )
}

export default Dashboard
