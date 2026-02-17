import { useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'

moment.locale('es')
// Ensure week starts on Monday for Spanish locale
moment.updateLocale('es', { week: { dow: 1 } })
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

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState(null)

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
    // Range highlight events (non-interactive)
    if (event.isRange) {
      return {
        style: {
          backgroundColor: 'rgba(102,126,234,0.12)',
          borderRadius: '0px',
          opacity: 1,
          color: 'transparent',
          border: '0px',
          pointerEvents: 'none'
        }
      }
    }

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
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  const handleMiniSelectSlot = (slotInfo) => {
    // slotInfo: { start, end, slots }
    const { start, end } = slotInfo
    // normalize times to start of day and end of day for month selection
    const s = new Date(start)
    s.setHours(0, 0, 0, 0)
    const e = new Date(end)
    e.setHours(23, 59, 59, 999)
    setSelectedRange({ start: s, end: e })
    setCurrentDate(s)
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

  const formats = {
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd D MMMM',
    weekdayFormat: 'dddd',
    agendaDateFormat: 'DD/MM/YYYY',
    agendaTimeFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }, culture, local) =>
      `${local.format(start, 'HH:mm')} - ${local.format(end, 'HH:mm')}`,
    timeGutterFormat: 'HH:mm'
  }

  // include a non-interactive range event to highlight selectedRange on the main calendar
  const eventsWithRange = selectedRange
    ? [
        ...events,
        {
          id: '__range',
          title: '',
          start: selectedRange.start,
          end: selectedRange.end,
          allDay: true,
          isRange: true
        }
      ]
    : events


  return (
    <div className="page">
      <div className="calendar-header-custom">
        <h1>Calendario de Citas</h1>
        <button className="btn-primary">+ Nueva Cita</button>
      </div>

      <div className="calendar-content">
        <div className="calendar-main">
          <div className="calendar-wrapper">
            <Calendar
              localizer={localizer}
              events={eventsWithRange}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 220px)' }}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              popup
              eventPropGetter={eventStyleGetter}
              messages={messages}
              formats={formats}
              culture="es"
              views={['month', 'week', 'day', 'agenda']}
              defaultView="week"
              defaultDate={new Date()}
            />
          </div>
        </div>

        <aside className="calendar-side">
          <div className="card sidebar-appointments">
            <div className="mini-calendar">
              <Calendar
                localizer={localizer}
                events={[]}
                view="month"
                toolbar={false}
                style={{ height: 300 }}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                onSelectSlot={handleMiniSelectSlot}
                selectable
                culture="es"
              />
            </div>
            <h3>Próximas Citas</h3>
            <div className="appointments-list">
              {events
                .slice()
                .sort((a, b) => b.start - a.start)
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
        </aside>
      </div>
    </div>
  )
}

export default CalendarPage
