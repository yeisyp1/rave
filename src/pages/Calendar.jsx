import { useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'

moment.locale('es')
const localizer = momentLocalizer(moment)

const CalendarPage = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Juan Pérez - Limpieza',
      start: new Date(2026, 1, 16, 9, 0),
      end: new Date(2026, 1, 16, 9, 30),
      resource: { patient: 'Juan Pérez', service: 'Limpieza', status: 'confirmed' }
    },
    {
      id: 2,
      title: 'María García - Consulta',
      start: new Date(2026, 1, 16, 10, 30),
      end: new Date(2026, 1, 16, 11, 0),
      resource: { patient: 'María García', service: 'Consulta', status: 'pending' }
    },
    {
      id: 3,
      title: 'Carlos López - Tratamiento',
      start: new Date(2026, 1, 16, 14, 0),
      end: new Date(2026, 1, 16, 15, 0),
      resource: { patient: 'Carlos López', service: 'Tratamiento', status: 'confirmed' }
    },
    {
      id: 4,
      title: 'Ana Rodríguez - Ortodoncia',
      start: new Date(2026, 1, 16, 15, 30),
      end: new Date(2026, 1, 16, 16, 30),
      resource: { patient: 'Ana Rodríguez', service: 'Ortodoncia', status: 'confirmed' }
    },
  ])

  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt('Nueva cita:')
    if (title) {
      setEvents([
        ...events,
        {
          id: events.length + 1,
          title,
          start,
          end,
          resource: { patient: title, service: 'Cita', status: 'pending' }
        }
      ])
    }
  }

  const handleSelectEvent = (event) => {
    alert(`Cita: ${event.title}\nHora: ${event.start.toLocaleTimeString()}`)
  }

  const eventStyleGetter = (event) => {
    let backgroundColor = '#667eea'
    
    if (event.resource?.status === 'pending') {
      backgroundColor = '#f59e0b'
    } else if (event.resource?.status === 'confirmed') {
      backgroundColor = '#10b981'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  const messages = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este rango'
  }


  return (
    <div className="page">
      <div className="calendar-header-custom">
        <h1>Calendario de Citas</h1>
        <button className="btn-primary">+ Nueva Cita</button>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 200px)' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          popup
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
          defaultDate={new Date()}
        />
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>Próximas Citas</h3>
        <div className="appointments-list">
          {events
            .sort((a, b) => a.start - b.start)
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className="appointment-item">
                <div className="appointment-time">
                  {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="appointment-details">
                  <p className="appointment-patient">{event.resource.patient}</p>
                  <p className="appointment-service">{event.resource.service}</p>
                </div>
                <div className={`appointment-status ${event.resource.status}`}>
                  {event.resource.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
