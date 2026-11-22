import '../styles/BillingVW.css'
import { promptReason } from '../utils/confirmDialog'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { showAlertModal } from '../app/store'
import { annulBillingInvoiceCtrl, computeBillingTotalsCtrl, getBillingCtrlData } from '../controllers/BillingCtrl'
import { FiPlus, FiCheck, FiClock, FiDollarSign, FiEye, FiDownload } from 'react-icons/fi'
import ModalNewInvoiceVW from '../modals/ModalNewBillingVW'
import ModalViewInvoiceVW from '../modals/ModalViewInvoiceVW'
import ModalPaymentsVW from '../modals/ModalPaymentsVW'
import { generateInvoicePdf, parseLocalInvoiceDate } from '../utils/invoicePdf'
import LoaderVW from '../components/LoaderVW'
import { formatMoney } from '../utils/format'

const BillingVW = () => {
  const dispatch = useDispatch()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const { totalIncome, totalPending, totalAll } = useMemo(() => computeBillingTotalsCtrl(invoices), [invoices])

  const load = async () => {
    const { invoices } = await getBillingCtrlData()
    setInvoices(invoices)
    setLoadError('')
    return invoices
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mounted) return
      try {
        await load()
      } catch (error) {
        if (mounted) setLoadError(error.message || 'No se pudieron cargar las facturas.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [dispatch])

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false)
  const [annullingId, setAnnullingId] = useState(null)
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentsInvoice, setPaymentsInvoice] = useState(null)

  const statValue = (value) => (loading || loadError ? '—' : formatMoney(value))

  const handleDownloadInvoice = (inv) => generateInvoicePdf(inv)

  const handleAnnul = async (inv) => {
    const motivo = await promptReason({
      title: `Anular la factura #${String(inv.id).padStart(3, '0')}`,
      message: 'La factura queda marcada como anulada y el motivo se guarda en la auditoría. No se borra ningún dato.',
      reasonLabel: 'Motivo de anulación',
      confirmLabel: 'Anular factura',
    })
    if (!motivo) return

    setAnnullingId(inv.id)
    const result = await annulBillingInvoiceCtrl(inv.id, motivo)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo anular la factura: ${result.message}`, variant: 'error' }))
    } else {
      await load()
    }
    setAnnullingId(null)
  }

  return (
    <div className="bl-page">
      <div className="bl-header">
        <div>
          <h1 className="bl-title">Cartera</h1>
        </div>
        <button className="bl-btn-primary" onClick={() => setShowNewInvoiceModal(true)}>
          <FiPlus size={15} />
          Nueva factura
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
          <div className="bl-stat-value">{statValue(totalIncome)}</div>
          <div className="bl-stat-label">Ingresos cobrados</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon red">
            <FiClock size={20} />
          </div>
          <div className="bl-stat-value danger">{statValue(totalPending)}</div>
          <div className="bl-stat-label">Pendiente de cobro</div>
        </div>

        <div className="bl-stat-card">
          <div className="bl-stat-icon gold">
            <FiDollarSign size={20} />
          </div>
          <div className="bl-stat-value">{statValue(totalAll)}</div>
          <div className="bl-stat-label">Total facturado</div>
        </div>
      </div>

      <div className="bl-card">
        <div className="bl-card-header">
          <span className="bl-card-title">Historial de Facturas</span>
          <span className="bl-card-count">
            {loading ? 'Cargando...' : `${invoices.length} ${invoices.length === 1 ? 'registro' : 'registros'}`}
          </span>
        </div>

        <div className="bl-table-wrap">
          <table className="bl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7"><LoaderVW text="Cargando facturas..." className="loader-inline" /></td></tr>
              )}
              {!loading && loadError && (
                <tr>
                  <td colSpan="7" className="bl-empty" role="alert">
                    <p>No se pudieron cargar las facturas.</p>
                    <p className="bl-empty-detail">{loadError}</p>
                    <button type="button" className="bl-btn-primary" onClick={() => { setLoading(true); load().catch((error) => setLoadError(error.message)).finally(() => setLoading(false)) }}>
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!loading && !loadError && invoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="bl-empty">
                    <p>Todavía no hay facturas registradas.</p>
                    <button type="button" className="bl-btn-primary" onClick={() => setShowNewInvoiceModal(true)}>
                      <FiPlus size={15} /> Crear la primera factura
                    </button>
                  </td>
                </tr>
              )}
              {!loading && invoices.map((inv) => (
                <tr key={inv.id} className="bl-row">
                  <td className="bl-id">#{String(inv.id).padStart(3, '0')}</td>
                  <td>
                    <div className="bl-patient">
                      <div className="bl-avatar">{(inv.patient?.[0] ?? '?').toUpperCase()}</div>
                      <span className="bl-patient-name">{inv.patient || 'Sin paciente'}</span>
                    </div>
                  </td>
                  <td className="bl-date">
                    {parseLocalInvoiceDate(inv.date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="bl-amount">{formatMoney(inv.amount)}</td>
                  <td className="bl-amount">
                    {inv.isVoid ? '—' : formatMoney(inv.balance)}
                    {inv.paid > 0 && !inv.isVoid && (
                      <span className="bl-balance-note">Pagado {formatMoney(inv.paid)}</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`bl-badge ${inv.isPaid ? 'paid' : inv.isVoid ? 'void' : inv.status === 'Parcial' ? 'partial' : 'pending'}`}
                      title={inv.isVoid ? inv.raw?.motivo_anulacion || undefined : undefined}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="bl-actions">
                      <button className="bl-btn-ghost" onClick={() => { setSelectedInvoice(inv); setShowViewInvoiceModal(true) }} title="Ver / editar factura" aria-label={`Ver o editar la factura #${String(inv.id).padStart(3, '0')}`}>
                        <FiEye size={14} />
                      </button>
                      <button className="bl-btn-ghost" onClick={() => handleDownloadInvoice(inv)} title="Descargar factura en PDF" aria-label={`Descargar en PDF la factura #${String(inv.id).padStart(3, '0')}`}>
                        <FiDownload size={14} />
                      </button>
                      {!inv.isVoid && (
                        <button className="bl-btn-pay" onClick={() => setPaymentsInvoice(inv)}>
                          {inv.isPending ? 'Registrar pago' : 'Pagos'}
                        </button>
                      )}
                      {!inv.isVoid && (
                        <button className="bl-btn-void" onClick={() => handleAnnul(inv)} disabled={annullingId === inv.id}>
                          Anular
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
      {paymentsInvoice && (
        <ModalPaymentsVW
          invoice={paymentsInvoice}
          onClose={() => setPaymentsInvoice(null)}
          onChanged={async () => {
            const refreshed = await load()
            setPaymentsInvoice(refreshed.find((inv) => inv.id === paymentsInvoice.id) ?? null)
          }}
        />
      )}
    </div>
  )
}

export default BillingVW