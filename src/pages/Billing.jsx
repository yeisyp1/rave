const Billing = () => {
  const invoices = [
    { id: 1, patient: 'Juan Pérez', date: '2025-02-10', amount: 150, status: 'Pagado' },
    { id: 2, patient: 'María García', date: '2025-02-05', amount: 200, status: 'Pagado' },
    { id: 3, patient: 'Carlos López', date: '2025-01-28', amount: 300, status: 'Pendiente' },
    { id: 4, patient: 'Ana Rodríguez', date: '2025-02-01', amount: 120, status: 'Pendiente' },
  ]

  const totalIncome = invoices.filter(inv => inv.status === 'Pagado').reduce((sum, inv) => sum + inv.amount, 0)
  const totalPending = invoices.filter(inv => inv.status === 'Pendiente').reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="page">
      <h1>Gestión de Pagos</h1>

      <div className="dashboard-cards">
        <div className="card">
          <h4>Ingresos Totales</h4>
          <p className="amount">${totalIncome}</p>
        </div>
        <div className="card">
          <h4>Pendiente de Cobro</h4>
          <p className="amount danger">${totalPending}</p>
        </div>
        <div className="card">
          <h4>Total Facturas</h4>
          <p className="amount">${totalIncome + totalPending}</p>
        </div>
      </div>

      <button className="btn-primary">+ Nueva Factura</button>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.patient}</td>
                <td>{invoice.date}</td>
                <td>${invoice.amount}</td>
                <td>
                  <span className={`badge ${invoice.status === 'Pagado' ? 'badge-success' : 'badge-warning'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <button className="btn-small">Ver</button>
                  <button className="btn-small">Descargar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Billing
