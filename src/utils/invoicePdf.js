import { jsPDF } from 'jspdf'
import logoLight from '../assets/logo1.png'

export const parseLocalInvoiceDate = (dateStr) => {
  if (!dateStr) return new Date()
  if (dateStr instanceof Date) return dateStr
  const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))
  if (isoDateMatch) {
    const [y, m, d] = String(dateStr).split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateStr)
}

export const formatInvoiceDate = (dateStr) =>
  parseLocalInvoiceDate(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = src
})

export const generateInvoicePdf = async (inv) => {
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
  } catch {
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
