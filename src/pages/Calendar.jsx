import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'
import { supabase } from '../Back/lib/supabase'
import NewEventModal from '../modals/ModalNewEvent'

moment.locale('es')
moment.updateLocale('es', { week: { dow: 1 } })
const localizer = momentLocalizer(moment)

/* GOOGLE CALENDAR API HELPERS */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

// Obtiene el access token de Google desde la sesión activa de Supabase
const getGoogleToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.provider_token ?? null
}

// Convierte un evento de Google Calendar al formato de react-big-calendar
const gEventToRbc = (gEvent) => ({
  id:       gEvent.id,
  title:    gEvent.summary ?? '(Sin título)',
  start:    new Date(gEvent.start?.dateTime ?? gEvent.start?.date),
  end:      new Date(gEvent.end?.dateTime   ?? gEvent.end?.date),
  allDay:   !gEvent.start?.dateTime,
  resource: {
    patient:     gEvent.summary ?? '',
    service:     gEvent.description ?? 'Cita',
    status:      gEvent.status === 'confirmed' ? 'confirmed' : 'pending',
    googleId:    gEvent.id,
    htmlLink:    gEvent.htmlLink,
    description: gEvent.description ?? '',
    location:    gEvent.location ?? '',
  },
  fromGoogle: true,
})

// Trae eventos de Google Calendar (últimos 30 días + próximos 60 días)
const fetchGoogleEvents = async (token) => {
  const past     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const future   = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?` +
    new URLSearchParams({
      timeMin:      past,
      timeMax:      future,
      singleEvents: 'true',
      orderBy:      'startTime',
      maxResults:   '250',
    }),
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) throw new Error(`Google API error: ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(gEventToRbc)
}

// Crea un evento en Google Calendar
const createGoogleEvent = async (token, { title, start, end, description = '', location = '' }) => {
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary:     title,
        description,
        location,
        start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end:   { dateTime: end.toISOString(),   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      }),
    }
  )
  if (!res.ok) throw new Error(`Error creando evento: ${res.status}`)
  return res.json()
}

// Elimina un evento de Google Calendar
const deleteGoogleEvent = async (token, googleId) => {
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${googleId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok && res.status !== 204) throw new Error(`Error eliminando evento: ${res.status}`)
}

/* ─────────────────────────────
   CALENDAR PAGE
───────────────────────────── */
const CalendarPage = () => {
  const [events,       setEvents]       = useState([])
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [googleToken,  setGoogleToken]  = useState(null)
  const [syncing,      setSyncing]      = useState(false)
  const [syncError,    setSyncError]    = useState(null)
  const [lastSync,     setLastSync]     = useState(null)
  const [newSlot,      setNewSlot]      = useState(null)   // slot seleccionado para nueva cita
  const [saving,       setSaving]       = useState(false)

  /* ── Al montar: obtener token y cargar eventos ── */
  useEffect(() => {
    const init = async () => {
      const token = await getGoogleToken()
      setGoogleToken(token)
      if (token) await syncEvents(token)
    }
    init()
  }, [])

  /* ── Sincronizar con Google Calendar ── */
  const syncEvents = useCallback(async (token = googleToken) => {
    if (!token) { setSyncError('No hay sesión de Google activa. Inicia sesión con Google.'); return }
    setSyncing(true)
    setSyncError(null)
    try {
      const gEvents = await fetchGoogleEvents(token)
      setEvents(gEvents)
      setLastSync(new Date())
    } catch (err) {
      console.error(err)
      setSyncError('Error al sincronizar con Google Calendar. Verifica los permisos.')
    } finally {
      setSyncing(false)
    }
  }, [googleToken])

  /* ── Seleccionar slot → abrir modal ── */
  const handleSelectSlot = ({ start, end }) => {
    setNewSlot({ start, end })
  }

  /* ── Guardar nueva cita en Google Calendar ── */
  const handleSaveEvent = async ({ title, description, location, start, end }) => {
    setSaving(true)
    try {
      const gEvent = await createGoogleEvent(googleToken, { title, start, end, description, location })
      const newEv  = gEventToRbc(gEvent)
      setEvents((prev) => [...prev, newEv])
      setNewSlot(null)
    } catch (err) {
      console.error(err)
      alert('Error al crear la cita en Google Calendar')
    } finally {
      setSaving(false)
    }
  }

  /* ── Eliminar evento ── */
  const handleSelectEvent = async (event) => {
    if (!event.fromGoogle) return
    const confirm = window.confirm(
      `¿Eliminar la cita "${event.title}"?`
    )
    if (!confirm) return
    try {
      await deleteGoogleEvent(googleToken, event.resource.googleId)
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
    } catch (err) {
      alert('Error al eliminar la cita')
    }
  }

  /* ── Conectar con Google (si no hay token, redirige a OAuth) ── */
  const handleConnectGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        redirectTo: `${window.location.origin}/calendar`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  /* ── Estilos de eventos ── */
  const eventStyleGetter = (event) => {
    let bg = '#c9934a'
    if (event.resource?.status === 'pending')   bg = '#d4943a'
    if (event.resource?.status === 'confirmed') bg = '#4caf82'
    return {
      style: {
        backgroundColor: bg,
        borderRadius: '6px',
        border: 'none',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '600',
        padding: '2px 6px',
      }
    }
  }

  const messages = {
    today: 'Hoy', previous: 'Anterior', next: 'Siguiente',
    month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Agenda',
    date: 'Fecha', time: 'Hora', event: 'Evento',
    noEventsInRange: 'No hay citas en este período',
  }

  const formats = {
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd D [de] MMMM',
    weekdayFormat: 'ddd',
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }, culture, local) =>
      `${local.format(start, 'HH:mm')} - ${local.format(end, 'HH:mm')}`,
  }

  return (
    <div className="cl-page">

      {/* ── HEADER ── */}
      <div className="cl-header">
        <div>
          <h1 className="cl-title">Calendario de Citas</h1>
        </div>

        <div className="cl-header-actions">
          {/* Estado de sincronización */}
          {lastSync && !syncing && (
            <span className="cl-sync-info">
              Sincronizado {moment(lastSync).fromNow()}
            </span>
          )}

          {/* Botón sincronizar / conectar */}
          {googleToken ? (
            <button className="cl-btn-ghost" onClick={() => syncEvents()} disabled={syncing}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"
                style={{ animation: syncing ? 'cl-spin 1s linear infinite' : 'none' }}>
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
              </svg>
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          ) : (
            <button className="cl-btn-ghost cl-btn-connect" onClick={handleConnectGoogle}>
              {/* Google "G" icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar Google Calendar
            </button>
          )}

          <button className="cl-btn-primary" onClick={() => setNewSlot({ start: new Date(), end: new Date(Date.now() + 30*60000) })}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Nueva Cita
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {syncError && (
        <div className="cl-error-banner">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {syncError}
          {!googleToken && (
            <button className="cl-error-btn" onClick={handleConnectGoogle}>
              Conectar con Google
            </button>
          )}
        </div>
      )}

      {/* ── LEYENDA ── */}
      <div className="cl-legend">
        <div className="cl-legend-item">
          <span className="cl-legend-dot confirmed" />
          Confirmada
        </div>
        <div className="cl-legend-item">
          <span className="cl-legend-dot pending" />
          Pendiente
        </div>
        {syncing && (
          <div className="cl-legend-item syncing">
            <span className="cl-spinner-sm" />
            Sincronizando con Google Calendar...
          </div>
        )}
      </div>

      {/* ── CALENDARIO ── */}
      <div className="cl-calendar-wrap">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 260px)', minHeight: 500 }}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={!!googleToken}
          popup
          eventPropGetter={eventStyleGetter}
          messages={messages}
          formats={formats}
          culture="es"
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
        />
      </div>

      {/* ── MODAL NUEVA CITA ── */}
      {newSlot && (
        <NewEventModal
          slot={newSlot}
          onSave={handleSaveEvent}
          onClose={() => setNewSlot(null)}
          saving={saving}
        />
      )}
    </div>
  )
}

export default CalendarPage