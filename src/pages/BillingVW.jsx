import '../styles/BillingVW.css'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { showAlertModal } from '../app/store'
import { getBillingCtrlData, updateBillingInvoiceStatusCtrl } from '../controllers/BillingCtrl'
import { FiPlus, FiCheck, FiClock, FiDollarSign, FiEye, FiDownload } from 'react-icons/fi'
import ModalNewInvoiceVW from '../modals/ModalNewBillingVW'
import ModalViewInvoiceVW from '../modals/ModalViewInvoiceVW'
import { generateInvoicePdf, parseLocalInvoiceDate } from '../utils/invoicePdf'

const BillingVW = () => {
  const dispatch = useDispatch()
  const [invoices, setInvoices] = useState([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [totalAll, setTotalAll] = useState(0)

  const load = async () => {
    const { invoices, totalIncome, totalPending, totalAll } = await getBillingCtrlData()
    setInvoices(invoices)
    setTotalIncome(totalIncome)
    setTotalPending(totalPending)
    setTotalAll(totalAll)
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mounted) return
      await load()
    }
    run()
    return () => { mounted = false }
  }, [])

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const handleDownloadInvoice = (inv) => generateInvoicePdf(inv)

  const handleStatusChange = async (invoiceId, newStatus) => {
    setUpdatingStatusId(invoiceId)
    const result = await updateBillingInvoiceStatusCtrl(invoiceId, newStatus)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar el estado de la factura: ${result.message}`, variant: 'error' }))
    } else {
      await load()
    }
    setUpdatingStatusId(null)
  }

  return (
    <div className="bl-page">
      <div className="bl-header">
        <div>
          <h1 className="bl-title">Cartera</h1>
        </div>
        <button className="bl-btn-primary" onClick={() => setShowNewInvoiceModal(true)}>
          <FiPlus size={15} />
          Nueva Factura
        </button>
        {showNewInvoiceModal && (
          <ModalNewInvoiceVW
            onClose={() => setShowNewInvoiceModal(false)}
            onSaved={async () => {
              setShowNewInvoiceModal(false)
              await load()
            }}
          />
        )}
      </div>

      <div className="bl-stats">
        <div className="bl-stat-card">
          <div className="bl-stat-icon green">
            <FiCheck size={20} />
          </div>
          <div className="bl-stat-value">${totalIncome}</div>
          <div className="bl-stat-label">Ingresos cobrados</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon red">
            <FiClock size={20} />
          </div>
          <div className="bl-stat-value danger">${totalPending}</div>
          <div className="bl-stat-label">Pendiente de cobro</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon gold">
            <FiDollarSign size={20} />
          </div>
          <div className="bl-stat-value">${totalAll}</div>
          <div className="bl-stat-label">Total facturado</div>
        </div>
      </div>

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
                  <td className="bl-id">#{String(inv.id).padStart(3, '0')}</td>
                  <td>
                    <div className="bl-patient">
                      <div className="bl-avatar">{inv.patient[0].toUpperCase()}</div>
                      <span className="bl-patient-name">{inv.patient}</span>
                    </div>
                  </td>
                  <td className="bl-date">
                    {parseLocalInvoiceDate(inv.date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="bl-amount">${inv.amount}</td>
                  <td>
                    <select
                      className={`bl-status-select ${inv.status === 'Pagado' ? 'paid' : inv.status === 'Anulado' ? 'void' : 'pending'}`}
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                      disabled={updatingStatusId === inv.id}
                      aria-label={`Cambiar estado de factura ${inv.id}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Anulado">Anulado</option>
                    </select>
                  </td>
                  <td>
                    <div className="bl-actions">
                      <button className="bl-btn-ghost" onClick={() => { setSelectedInvoice(inv); setShowViewInvoiceModal(true) }} title="Ver / editar factura">
                        <FiEye size={14} />
                      </button>
                      <button className="bl-btn-ghost" onClick={() => handleDownloadInvoice(inv)} title="Descargar factura en PDF">
                        <FiDownload size={14} />
                      </button>
                      {inv.isPending && (
                        <button className="bl-btn-pay">
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
      {showViewInvoiceModal && selectedInvoice && (
        <ModalViewInvoiceVW
          invoice={selectedInvoice}
          onClose={() => { setShowViewInvoiceModal(false); setSelectedInvoice(null) }}
          onSaved={async () => { setShowViewInvoiceModal(false); setSelectedInvoice(null); await load() }}
        />
      )}
    </div>
  )
}

export default BillingVW