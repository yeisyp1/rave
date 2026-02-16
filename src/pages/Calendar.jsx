import { useState } from 'react'

const Calendar = () => {
  const [appointments] = useState([
    { id: 1, time: '09:00', patient: 'Juan Pérez', service: 'Limpieza' },
    { id: 2, time: '10:30', patient: 'María García', service: 'Consulta' },
    { id: 3, time: '14:00', patient: 'Carlos López', service: 'Tratamiento' },
    { id: 4, time: '15:30', patient: 'Ana Rodríguez', service: 'Ortodoncia' },
  ])

  return (
    <div className="page">
      <h1>Calendario de Citas</h1>

      <button className="btn-primary">+ Nueva Cita</button>

      <div className="calendar-container">
        <div className="calendar-header">
          <h2>Febrero 2025</h2>
          <div className="calendar-nav">
            <button>&lt;</button>
            <button>&gt;</button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {[...Array(35)].map((_, idx) => (
            <div key={idx} className="calendar-cell">
              {idx >= 5 && idx < 28 ? idx - 4 : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>Citas de Hoy</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Servicio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(apt => (
              <tr key={apt.id}>
                <td>{apt.time}</td>
                <td>{apt.patient}</td>
                <td>{apt.service}</td>
                <td>
                  <button className="btn-small">Confirmar</button>
                  <button className="btn-small btn-danger">Cancelar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Calendar
