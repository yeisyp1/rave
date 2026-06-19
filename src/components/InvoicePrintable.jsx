import React from 'react'
import logoLight from '../assets/logo1.png'

const InvoicePrintable = ({ invoice = {}, editable = false, form = {}, onChange = () => {} }) => {
  const display = (key, fallback = '') => invoice[key] ?? fallback

  return (
    <div className="inv-printable">
      <div className="inv-header">
        <img src={logoLight} alt="logo" className="inv-logo" />
        <div className="inv-title">Factura de venta</div>
        <div className="inv-meta">
          <div className="inv-meta-line"># {String(invoice.id ?? '').padStart(6, '0')}</div>
          <div className="inv-meta-line">ID: {invoice.id ?? ''}</div>
        </div>
      </div>

      <div className="inv-from-to">
        <div className="inv-from">
          <div className="inv-clinic">Clínica RAVE</div>
          <div className="inv-sub">Cartera y facturación del paciente</div>
        </div>

        <div className="inv-to">
          <div className="inv-label">Paciente</div>
          {editable ? (
            <input className="inv-input" name="patient" value={form.patient} onChange={onChange} />
          ) : (
            <div className="inv-patient">{display('patient')}</div>
          )}
          {editable ? (
            <input type="date" className="inv-input" name="date" value={form.date} onChange={onChange} />
          ) : (
            <div className="inv-meta-small">Fecha de emisión: {display('date')}</div>
          )}
          {editable ? (
            <select className="inv-input" name="status" value={form.status} onChange={onChange}>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Anulado">Anulado</option>
            </select>
          ) : (
            <div className="inv-meta-small">Estado: {display('status')}</div>
          )}
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Concepto</th>
            <th>Cant.</th>
            <th>Unidad</th>
            <th>Valor</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              {editable ? (
                <input className="inv-input" name="concept" value={form.concept} onChange={onChange} />
              ) : (
                invoice.raw?.metadata?.concept || 'Servicio facturado'
              )}
            </td>
            <td>1.0</td>
            <td>Unidad</td>
            <td>
              {editable ? (
                <input className="inv-input" name="amount" value={form.amount} onChange={onChange} />
              ) : (
                `$${Number(display('amount', 0)).toLocaleString('es-CO')}`
              )}
            </td>
            <td>{`$${Number(display('amount', 0)).toLocaleString('es-CO')}`}</td>
          </tr>
        </tbody>
      </table>

      <div className="inv-totals">
        <div className="inv-totals-labels">
          <div>Valor:</div>
          <div>Descuento:</div>
          <div>Impuestos:</div>
          <div className="inv-total-bold">Total a pagar:</div>
        </div>
        <div className="inv-totals-values">
          <div>{`$${Number(display('amount', 0)).toLocaleString('es-CO')}`}</div>
          <div>$0</div>
          <div>$0</div>
          <div className="inv-total-bold">{`$${Number(display('amount', 0)).toLocaleString('es-CO')}`}</div>
        </div>
      </div>

      <div className="inv-notes">
        <div className="inv-notes-title">Observaciones</div>
        {editable ? (
          <textarea className="inv-input" name="notes" value={form.notes} onChange={onChange} />
        ) : (
          <div className="inv-notes-body">{invoice.raw?.metadata?.notes ?? 'Factura generada automáticamente desde el sistema de cartera.'}</div>
        )}
      </div>

      <div className="inv-footer">Generado automáticamente desde el sistema RAVE.</div>
    </div>
  )
}

export default InvoicePrintable
