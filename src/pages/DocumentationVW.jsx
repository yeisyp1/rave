const Documentation = () => {
  return (
    <div className="page">
      <h1>Documentación</h1>

      <div className="card">
        <h2>Guía de uso · RAVE Odontología</h2>

        <h3>Dashboard</h3>
        <p>
          El dashboard proporciona una vista general de las métricas principales del consultorio dental.
          Incluye estadísticas de pacientes, citas, ingresos y tareas pendientes.
        </p>

        <h3>Pacientes</h3>
        <p>
          Gestiona la información completa de tus pacientes. Puedes crear nuevos registros,
          editar información existente y acceder al historial de visitas y tratamientos.
        </p>

        <h3>Calendario</h3>
        <p>
          Administra las citas de tu consultorio. Visualiza el calendario mensual, programa nuevas citas
          y realiza cambios en citas existentes.
        </p>

        <h3>Cartera</h3>
        <p>
          Gestiona las facturas y pagos de los pacientes. Genera reportes de ingresos,
          visualiza facturas pendientes y descarga comprobantes.
        </p>

        <h3>Preguntas frecuentes</h3>
        <ul>
          <li><strong>¿Cómo crear una nueva cita?</strong> — Ve a Calendario y haz clic en "Nueva cita".</li>
          <li><strong>¿Cómo registrar un nuevo paciente?</strong> — En Pacientes, selecciona "Nuevo paciente".</li>
          <li><strong>¿Cómo generar reportes?</strong> — Desde el Dashboard, con el botón "Generar reporte".</li>
        </ul>
      </div>
    </div>
  )
}

export default Documentation
