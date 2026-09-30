import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { FiX } from 'react-icons/fi'
import '../styles/ModalPatientsVW.css'
import { PAYMENT_METHODS, annulPaymentCtrl, loadInvoicePaymentsCtrl, registerPaymentCtrl } from '../controllers/BillingCtrl'
import { showAlertModal } from '../app/store'

const getLocalDate = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 10)
}

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`

const emptyForm = () => ({ amount: '', paidAt: getLocalDate(), method: 'Efectivo', reference: '', notes: '' })

// CU-13: estado de cuenta de una factura. Registra pagos totales o parciales y los anula
// con motivo; el saldo y el estado de la factura los recalcula la base de datos.
const ModalPaymentsVW = ({ invoice, onClose = () => {}, onChanged = () => {} }) => {
  const dispatch = useDispatch()
  const [payments, setPayments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadPayments = async () => {
    try {
      setPayments(await loadInvoicePaymentsCtrl(invoice.id))
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudieron cargar los pagos: ${error.message}`, variant: 'error' }))
    }
  }

  useEffect(() => {
    let mounted = true
    loadInvoicePaymentsCtrl(invoice.id)
      .then((data) => { if (mounted) setPayments(data) })
      .catch((error) => dispatch(showAlertModal({ message: `No se pudieron cargar los pagos: ${error.message}`, variant: 'error' })))
    return () => { mounted = false }
  }, [invoice.id, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const result = await registerPaymentCtrl(invoice, form)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo registrar el pago: ${result.message}`, variant: 'error' }))
    } else {
      setForm(emptyForm())
      await loadPayments()
      await onChanged()
    }
    setSaving(false)
  }

  const handleAnnul = async (payment) => {
    const motivo = window.prompt(`Motivo de anulación del pago de ${money(payment.amount)}:`)
    if (motivo === null) return

    const result = await annulPaymentCtrl(payment.id, motivo)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo anular el pago: ${result.message}`, variant: 'error' }))
      return
    }
    await loadPayments()
    await onChanged()
  }

  const modal = (
    <div className="pt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pt-modal pt-modal-wide">
        <div className="pt-modal-header">
          <div>
            <div className="pt-modal-eyebrow">Factura #{String(invoice.id).padStart(3, '0')} · {invoice.patient}</div>
            <h2 className="pt-modal-title">Pagos</h2>
          </div>
          <button className="pt-modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        <div className="pt-modal-body">
          <div className="pt-form-grid">
            <div className="pt-field">
              <span className="pt-label">Total factura</span>
              <strong>{money(invoice.amount)}</strong>
            </div>
            <div className="pt-field">
              <span className="pt-label">Pagado</span>
              <strong>{money(invoice.paid)}</strong>
            </div>
            <div className="pt-field">
              <span className="pt-label">Saldo pendiente</span>
              <strong>{money(invoice.balance)}</strong>
            </div>
            <div className="pt-field">
              <span className="pt-label">Estado</span>
              <strong>{invoice.status}</strong>
            </div>
          </div>

          <div className="bl-table-wrap" style={{ marginTop: 16 }}>
            <table className="bl-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Valor</th>
                  <th>Medio</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="6">No hay pagos registrados.</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id} className="bl-row">
                    <td>{payment.paid_at}</td>
                    <td className="bl-amount">{money(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || payment.notes || '—'}</td>
                    <td>
                      {payment.anulado ? (
                        <span className="bl-badge void" title={payment.motivo_anulacion || undefined}>Anulado</span>
                      ) : (
                        <span className="bl-badge paid">Vigente</span>
                      )}
                    </td>
                    <td>
                      {!payment.anulado && (
                        <button type="button" className="bl-btn-void" onClick={() => handleAnnul(payment)}>Anular</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.balance > 0 && (
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="pt-form-grid">
                <div className="pt-field">
                  <label className="pt-label">Valor del pago</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={invoice.balance}
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder={String(invoice.balance)}
                    required
                    className="pt-input"
                  />
                </div>
                <div className="pt-field">
                  <label className="pt-label">Fecha</label>
                  <input type="date" name="paidAt" value={form.paidAt} onChange={handleChange} required className="pt-input" />
                </div>
                <div className="pt-field">
                  <label className="pt-label">Medio de pago</label>
                  <div className="pt-select-wrap">
                    <select name="method" value={form.method} onChange={handleChange} className="pt-select">
                      {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                    <div className="pt-select-arrow" />
                  </div>
                </div>
                <div className="pt-field">
                  <label className="pt-label">Referencia</label>
                  <input name="reference" value={form.reference} onChange={handleChange} placeholder="No. de transacción o recibo" className="pt-input" />
                </div>
                <div className="pt-field pt-field-full">
                  <label className="pt-label">Notas</label>
                  <input name="notes" value={form.notes} onChange={handleChange} className="pt-input" />
                </div>
              </div>
              <div className="pt-modal-nav">
                <button type="button" className="pt-btn-ghost" onClick={onClose} disabled={saving}>Cerrar</button>
                <div />
                <button type="submit" className="pt-btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default ModalPaymentsVW
