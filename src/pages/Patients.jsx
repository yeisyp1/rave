const Patients = () => {
  const patients = [
    { id: 1, name: 'Juan Pérez', phone: '123-456-7890', email: 'juan@email.com', lastVisit: '2025-02-10' },
    { id: 2, name: 'María García', phone: '123-456-7891', email: 'maria@email.com', lastVisit: '2025-02-05' },
    { id: 3, name: 'Carlos López', phone: '123-456-7892', email: 'carlos@email.com', lastVisit: '2025-01-28' },
    { id: 4, name: 'Ana Rodríguez', phone: '123-456-7893', email: 'ana@email.com', lastVisit: '2025-02-01' },
  ]

  return (
    <div className="page">
      <h1>Gestión de Pacientes</h1>
      
      <button className="btn-primary">+ Nuevo Paciente</button>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Última Visita</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.phone}</td>
                <td>{patient.email}</td>
                <td>{patient.lastVisit}</td>
                <td>
                  <button className="btn-small">Editar</button>
                  <button className="btn-small btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Patients
