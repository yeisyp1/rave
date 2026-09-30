import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { FiX } from 'react-icons/fi'
import InvoicePrintable from '../components/InvoicePrintable'
import '../styles/ModalPatientsVW.css'
import { updateBillingInvoiceCtrl } from '../controllers/BillingCtrl'
import { showAlertModal } from '../app/store'

const ModalViewInvoiceVW = ({ invoice = null, onClose = () => {}, onSaved = () => {} }) => {
  const dispatch = useDispatch()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!invoice) return
    setForm({
      patient: invoice.patient || '',
      date: (invoice.date || '').slice(0, 10),
      amount: invoice.amount ?? '',
      concept: invoice.raw?.metadata?.concept || 'Servicio facturado',
      notes: invoice.raw?.metadata?.notes || '',
    })
  }, [invoice])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleSave = async () => {
    if (!invoice) return
    setSaving(true)
    const result = await updateBillingInvoiceCtrl(invoice, form)
    if (!result.ok) {
      dispatch(showAlertModal({ message: 'No se pudo guardar la factura: ' + result.message, variant: 'error' }))
    } else {
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  if (!invoice) return null

  const modal = (
    <div className="pt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pt-modal pt-modal-wide">
        <div className="pt-modal-header">
          <div>
            <div className="pt-modal-eyebrow">Clínica RAVE</div>
            <h2 className="pt-modal-title">Ver / Editar factura #{String(invoice.id).padStart(3, '0')}</h2>
          </div>
          <button className="pt-modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        <div className="pt-modal-body">
          <InvoicePrintable invoice={invoice} editable={true} form={form} onChange={handleChange} />
        </div>

        <div className="pt-modal-nav">
          <button type="button" className="pt-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <div />
          <button type="button" className="pt-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default ModalViewInvoiceVW
