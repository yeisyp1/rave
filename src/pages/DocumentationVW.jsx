import '../styles/AdminViewsVW.css'

const SECTIONS = [
  {
    title: 'Dashboard',
    text: 'Vista general de las métricas del consultorio: pacientes, citas, ingresos y alertas pendientes. Desde aquí también se generan los reportes del periodo.',
  },
  {
    title: 'Pacientes',
    text: 'Gestiona la información completa de tus pacientes. Puedes crear registros nuevos, editarlos y abrir su ficha con el historial de visitas y tratamientos.',
  },
  {
    title: 'Calendario',
    text: 'Administra las citas del consultorio. Requiere conectar Google Calendar: desde ahí se crean, editan y marcan como atendidas o no asistidas.',
  },
  {
    title: 'Cartera',
    text: 'Facturas y pagos de los pacientes. Permite registrar abonos, anular facturas con motivo y descargar comprobantes en PDF.',
  },
]

const FAQ = [
  ['¿Cómo crear una nueva cita?', 'Ve a Calendario y pulsa "Nueva cita", o usa "Agendar cita" desde la ficha del paciente.'],
  ['¿Cómo registrar un nuevo paciente?', 'En Pacientes, pulsa "Nuevo paciente" y completa los cinco pasos del formulario.'],
  ['¿Cómo generar reportes?', 'En el Dashboard, con el botón "Generar reporte"; se puede exportar la facturación a CSV.'],
]

const DocumentationVW = () => {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Documentación</h1>
          <p className="admin-subtitle">Guía de uso de RAVE Odontología.</p>
        </div>
      </div>

      <div className="admin-grid">
        {SECTIONS.map((section) => (
          <div className="admin-card" key={section.title}>
            <h2 className="admin-card-title">{section.title}</h2>
            <p className="admin-row-sub">{section.text}</p>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Preguntas frecuentes</h2>
        <div className="admin-list">
          {FAQ.map(([question, answer]) => (
            <div className="admin-list-row" key={question}>
              <div>
                <div className="admin-row-title">{question}</div>
                <div className="admin-row-sub">{answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DocumentationVW
