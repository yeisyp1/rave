import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/CalendarVW.css'
import { FiRefreshCw, FiPlus, FiAlertCircle, FiX } from 'react-icons/fi'
import {
  connectGoogleCalendarCtrl,
  createGoogleEventCtrl,
  deleteGoogleEventCtrl,
  getGoogleTokenCtrl,
  listAppointmentPatientsCtrl,
  listAppointmentServiceTypesCtrl,
  syncGoogleEventsCtrl,
  updateGoogleEventCtrl,
} from '../controllers/CalendarCtrl'
import { getPatientByDocument } from '../dao/SupabaseDAO'
import ModalNewEventVW from '../modals/ModalNewEventVW'
import ModalViewEventVW from '../modals/ModalViewEventVW'

moment.locale('es')
moment.updateLocale('es', { week: { dow: 1 } })
const localizer = momentLocalizer(moment)

/* ─────────────────────────────
   CALENDAR PAGE
───────────────────────────── */
const CalendarVW = () => {
  const [events,       setEvents]       = useState([])
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [googleToken,  setGoogleToken]  = useState(null)
  const [syncing,      setSyncing]      = useState(false)
  const [syncError,    setSyncError]    = useState(null)
  const [lastSync,     setLastSync]     = useState(null)
  const [newSlot,      setNewSlot]      = useState(null)  
  const [saving,       setSaving]       = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [patientOptions, setPatientOptions] = useState([])
  const [serviceOptions, setServiceOptions] = useState([])
  const [patientValidationError, setPatientValidationError] = useState(null)

  /* ── Al montar: obtener token y cargar eventos ── */
  useEffect(() => {
    const init = async () => {
      try {
        const [token, patients, services] = await Promise.all([
          getGoogleTokenCtrl(),
          listAppointmentPatientsCtrl(),
          listAppointmentServiceTypesCtrl(),
        ])

        setGoogleToken(token)
        setPatientOptions(patients)
        setServiceOptions(services)

        if (token) await syncEvents(token)
      } catch (err) {
        console.error(err)
    }
      }
      init()
    }, [])

  /* ── Sincronizar con Google Calendar ── */
  const syncEvents = useCallback(async (token = googleToken) => {
    if (!token) { setSyncError('No hay sesión de Google activa. Inicia sesión con Google.'); return }
    setSyncing(true)
    setSyncError(null)
    try {
      const gEvents = await syncGoogleEventsCtrl(token)
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
  const handleSaveEvent = async ({
    title,
    description,
    location,
    start,
    end
  }) => {

    setSaving(true)

    try {

      const titleText = title || ''
      const documentMatch = titleText.match(/-\s*(\S+)$/)
      const document = documentMatch ? documentMatch[1] : ''

      if (document) {

        const patientExists = await getPatientByDocument(document)

        if (!patientExists) {

          setPatientValidationError(
            `El paciente con documento ${document} no está registrado en la base de datos. No se puede guardar la cita.`
          )

          setSaving(false)
          return
        }
      }

      const newEv = await createGoogleEventCtrl(
        googleToken,
        {
          title,
          start,
          end,
          description,
          location
        }
      )

      setEvents(prev => [...prev, newEv])
      setNewSlot(null)

    } catch (err) {

      console.error(err)
      alert('Error al crear la cita en Google Calendar')

    } finally {

      setSaving(false)

    }
  }

  /* ── Ver detalles de evento ── */
  const handleSelectEvent = (event) => {
    if (!event.fromGoogle) return
    setSelectedEvent(event)
  }

  /* ── Editar evento ── */
  const handleEditEvent = async (payload) => {
    if (!selectedEvent) return
    try {
      const updatedEvent = await updateGoogleEventCtrl(googleToken, selectedEvent.resource.googleId, payload)
      setEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      )
      setSelectedEvent(null)
    } catch (err) {
      console.error(err)
      alert('Error al actualizar la cita')
    }
  }

  /* ── Eliminar evento ── */
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    setDeleting(true)
    try {
      await deleteGoogleEventCtrl(googleToken, selectedEvent.resource.googleId)
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
      setSelectedEvent(null)
    } catch (err) {
      console.error(err)
      alert('Error al eliminar la cita')
    } finally {
      setDeleting(false)
    }
  }

  /* ── Conectar con Google (si no hay token, redirige a OAuth) ── */
  const handleConnectGoogle = async () => {
    await connectGoogleCalendarCtrl()
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
              <FiRefreshCw size={14} style={{ animation: syncing ? 'cl-spin 1s linear infinite' : 'none' }} />
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
            <FiPlus size={14} />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {syncError && (
        <div className="cl-error-banner">
          <FiAlertCircle size={14} />
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
        <ModalNewEventVW
          slot={newSlot}
          onSave={handleSaveEvent}
          onClose={() => setNewSlot(null)}
          saving={saving}
          patientOptions={patientOptions}
          serviceOptions={serviceOptions}
        />
      )}

      {/* ── MODAL VER/EDITAR CITA ── */}
{selectedEvent && (
         <ModalViewEventVW
           event={selectedEvent}
           onEdit={handleEditEvent}
           onDelete={handleDeleteEvent}
           onClose={() => setSelectedEvent(null)}
           deleting={deleting}
         />
       )}

       {/* MODAL VALIDACIÓN DE PACIENTE NO ENCONTRADO */}
       {patientValidationError && (
         <div className="cl-overlay" onClick={() => setPatientValidationError(null)}>
           <div className="cl-modal">
             <div className="cl-modal-header">
               <div>
                 <h2 className="cl-modal-title">Error de validación</h2>
               </div>
               <button className="cl-modal-close" onClick={() => setPatientValidationError(null)}>
                 <FiX size={16} />
               </button>
             </div>

             <div className="cl-modal-accent" />

             <div className="cl-modal-body">
               <div className="cl-field">
                 <p className="cl-view-value">{patientValidationError}</p>
               </div>
             </div>

             <div className="cl-modal-nav">
               <button className="cl-btn-primary" onClick={() => setPatientValidationError(null)}>
                 Entendido
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}

export default CalendarVW
