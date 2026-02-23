import '../styles/billing.css';

const Billing = () => {
  const invoices = [
    { id: 1, patient: "Juan Pérez",      date: "2025-02-10", amount: 150, status: "Pagado" },
    { id: 2, patient: "María García",    date: "2025-02-05", amount: 200, status: "Pagado" },
    { id: 3, patient: "Carlos López",    date: "2025-01-28", amount: 300, status: "Pendiente" },
    { id: 4, patient: "Ana Rodríguez",   date: "2025-02-01", amount: 120, status: "Pendiente" },
  ];

  const totalIncome  = invoices.filter(i => i.status === "Pagado").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "Pendiente").reduce((s, i) => s + i.amount, 0);
  const totalAll     = totalIncome + totalPending;

  return (
    <div className="bl-page">

      {/* ── HEADER ── */}
      <div className="bl-header">
        <div>
          <div className="bl-eyebrow">Clínica RAVE</div>
          <h1 className="bl-title">Pagos</h1>
        </div>
        <button className="bl-btn-primary">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Nueva Factura
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="bl-stats">
        <div className="bl-stat-card">
          <div className="bl-stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="bl-stat-value">${totalIncome}</div>
          <div className="bl-stat-label">Ingresos cobrados</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="bl-stat-value danger">${totalPending}</div>
          <div className="bl-stat-label">Pendiente de cobro</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="bl-stat-value">${totalAll}</div>
          <div className="bl-stat-label">Total facturado</div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bl-card">
        <div className="bl-card-header">
          <span className="bl-card-title">Historial de Facturas</span>
          <span className="bl-card-count">{invoices.length} registros</span>
        </div>

        <div className="bl-table-wrap">
          <table className="bl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="bl-row">
                  <td className="bl-id">#{String(inv.id).padStart(3, "0")}</td>
                  <td>
                    <div className="bl-patient">
                      <div className="bl-avatar">{inv.patient[0].toUpperCase()}</div>
                      <span className="bl-patient-name">{inv.patient}</span>
                    </div>
                  </td>
                  <td className="bl-date">
                    {new Date(inv.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="bl-amount">${inv.amount}</td>
                  <td>
                    <span className={`bl-badge ${inv.status === "Pagado" ? "paid" : "pending"}`}>
                      {inv.status === "Pagado" ? (
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                      )}
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="bl-actions">
                      <button className="bl-btn-ghost" title="Ver factura">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                        </svg>
                      </button>
                      <button className="bl-btn-ghost" title="Descargar PDF">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </button>
                      {inv.status === "Pendiente" && (
                        <button className="bl-btn-pay" title="Marcar como pagado">
                          Cobrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Billing;