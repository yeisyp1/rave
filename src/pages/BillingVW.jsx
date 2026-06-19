import '../styles/BillingVW.css'
import { useEffect, useState } from 'react'
import { getBillingCtrlData } from '../controllers/BillingCtrl'
import { FiPlus, FiCheck, FiClock, FiDollarSign, FiEye, FiDownload } from 'react-icons/fi'
import ModalNewInvoiceVW from '../modals/ModalNewBillingVW'
<<<<<<< Updated upstream
=======
import ModalViewInvoiceVW from '../modals/ModalViewInvoiceVW'
import { jsPDF } from 'jspdf'
import logoLight from '../assets/logo1.png'
import { updateBillingInvoiceDAO } from '../dao/BillingDAO'
>>>>>>> Stashed changes

const BillingVW = () => {
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

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr));
    if (isoDateMatch) {
      const [y, m, d] = String(dateStr).split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date(dateStr)
  }

  const formatInvoiceDate = (dateStr) => {
    return parseLocalDate(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  const handleDownloadInvoice = async (inv) => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const invoiceNumber = String(inv.id).padStart(6, '0')
    const invoiceDate = formatInvoiceDate(inv.date)
    const statusText = inv.isPaid ? 'Pagado' : 'Pendiente'
    const amountText = Number(inv.amount).toLocaleString('es-CO')
    const notes = inv.raw?.metadata?.notes?.trim() || 'Factura generada automáticamente desde el sistema de cartera.'

    doc.setFillColor(242, 246, 252)
    doc.rect(0, 0, pageWidth, 28, 'F')

    try {
      const logo = await loadImage(logoLight)
      doc.addImage(logo, 'PNG', 14, 8, 28, 14)
    } catch (error) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(18, 54, 121)
      doc.text('Clínica RAVE', 14, 16)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(28, 39, 54)
    doc.text('Factura de venta', pageWidth - 14, 15, { align: 'right' })

    doc.setFontSize(10)
    doc.setTextColor(90, 102, 123)
    doc.text(`# ${invoiceNumber}`, pageWidth - 14, 21, { align: 'right' })
    doc.text(`ID: ${inv.id}`, pageWidth - 14, 26, { align: 'right' })

    doc.setDrawColor(220, 226, 236)
    doc.roundedRect(14, 34, pageWidth - 28, 34, 2, 2)

    doc.setFontSize(9)
    doc.setTextColor(90, 102, 123)
    doc.text('Desde Clínica RAVE', 18, 44)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(18, 54, 121)
    doc.text('Clínica RAVE', 18, 49)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text('Cartera y facturación del paciente', 18, 54)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(90, 102, 123)
    doc.text('Paciente', pageWidth - 18, 44, { align: 'right' })
    doc.setTextColor(18, 54, 121)
    doc.text(inv.patient, pageWidth - 18, 50, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text(`Fecha de emisión: ${invoiceDate}`, pageWidth - 18, 55, { align: 'right' })
    doc.text(`Estado: ${statusText}`, pageWidth - 18, 60, { align: 'right' })

    const tableTop = 76
    const colX = [14, 24, 90, 118, 146, 182]
    const colWidths = [10, 66, 28, 28, 36, 14]
    const rowHeight = 12

    doc.setFillColor(245, 247, 250)
    doc.setDrawColor(218, 224, 232)
    doc.rect(14, tableTop, pageWidth - 28, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text('Item', colX[0] + 1, tableTop + 8)
    doc.text('Concepto', colX[1], tableTop + 8)
    doc.text('Cant.', colX[2], tableTop + 8)
    doc.text('Unidad', colX[3], tableTop + 8)
    doc.text('Valor', colX[4], tableTop + 8)
    doc.text('Total', colX[5], tableTop + 8)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(28, 39, 54)
    doc.rect(14, tableTop + rowHeight, pageWidth - 28, rowHeight, 'S')
    doc.line(colX[1] - 2, tableTop, colX[1] - 2, tableTop + rowHeight * 2)
    doc.line(colX[2] - 2, tableTop, colX[2] - 2, tableTop + rowHeight * 2)
    doc.line(colX[3] - 2, tableTop, colX[3] - 2, tableTop + rowHeight * 2)
    doc.line(colX[4] - 2, tableTop, colX[4] - 2, tableTop + rowHeight * 2)
    doc.line(colX[5] - 2, tableTop, colX[5] - 2, tableTop + rowHeight * 2)
    doc.text('1', colX[0] + 2, tableTop + 20)
    doc.text('Servicio facturado', colX[1], tableTop + 20)
    doc.text('1.0', colX[2], tableTop + 20)
    doc.text('Unidad', colX[3], tableTop + 20)
    doc.text(amountText, colX[4], tableTop + 20)
    doc.text(amountText, colX[5], tableTop + 20)

    const totalsX = pageWidth - 72
    const totalsY = tableTop + 34
    doc.setDrawColor(218, 224, 232)
    doc.roundedRect(totalsX, totalsY, 58, 34, 2, 2)
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.text('Valor:', totalsX + 4, totalsY + 8)
    doc.text(`$${amountText}`, totalsX + 54, totalsY + 8, { align: 'right' })
    doc.text('Descuento:', totalsX + 4, totalsY + 14)
    doc.text('$0', totalsX + 54, totalsY + 14, { align: 'right' })
    doc.text('Impuestos:', totalsX + 4, totalsY + 20)
    doc.text('$0', totalsX + 54, totalsY + 20, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(18, 54, 121)
    doc.text('Total a pagar:', totalsX + 4, totalsY + 28)
    doc.text(`$${amountText}`, totalsX + 54, totalsY + 28, { align: 'right' })

    doc.setDrawColor(220, 226, 236)
    doc.roundedRect(14, totalsY + 44, pageWidth - 28, 46, 2, 2)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(18, 54, 121)
    doc.text('Observaciones', 18, totalsY + 54)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 36)
    doc.text(splitNotes, 18, totalsY + 62)

    doc.setFontSize(8)
    doc.setTextColor(120, 130, 145)
    doc.text('Generado automáticamente desde el sistema RAVE.', 14, pageHeight - 8)

    const fileName = `factura-${String(inv.id).padStart(3, '0')}.pdf`
    doc.save(fileName)
  }

  const handleStatusChange = async (invoiceId, newStatus) => {
    setUpdatingStatusId(invoiceId)
    try {
      await updateBillingInvoiceDAO(invoiceId, { status: newStatus })
      await load()
    } catch (error) {
      console.error('Error actualizando estado de factura:', error)
      alert('No se pudo actualizar el estado de la factura.')
    } finally {
      setUpdatingStatusId(null)
    }
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
                    {parseLocalDate(inv.date).toLocaleDateString('es-CO', {
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