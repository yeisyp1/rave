import { jsPDF } from 'jspdf'
import logoLight from '../assets/logo1.png'

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = src
})

const formatSignedAt = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const patientFullName = (patient) => {
  if (!patient) return '—'
  return [patient.nombre, patient.apellidos].filter(Boolean).join(' ').trim() || '—'
}

// CU-18 / Ley 527 de 1999: documento imprimible del consentimiento informado
// registrado para un plan de tratamiento. Recibe el consentimiento, el paciente
// y el titulo del plan; descarga un PDF A4.
export const generateConsentPdf = async (consent, patient, planTitle) => {
  if (!consent) return

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const accepted = consent.aceptado !== false

  // Encabezado
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
  doc.setFontSize(18)
  doc.setTextColor(28, 39, 54)
  doc.text('Consentimiento informado', pageWidth - 14, 15, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 102, 123)
  doc.text('RAVE Odontología Integral y Estética', pageWidth - 14, 21, { align: 'right' })
  doc.text('Ley 527 de 1999', pageWidth - 14, 26, { align: 'right' })

  // Datos del paciente y del plan
  doc.setDrawColor(220, 226, 236)
  doc.roundedRect(14, 34, pageWidth - 28, 30, 2, 2)
  doc.setFontSize(9)
  doc.setTextColor(90, 102, 123)
  doc.text('Paciente', 18, 42)
  doc.text('Documento', 18, 52)
  doc.text('Plan de tratamiento', pageWidth / 2 + 4, 42)
  doc.text('Fecha de firma', pageWidth / 2 + 4, 52)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(28, 39, 54)
  doc.text(patientFullName(patient), 18, 47)
  doc.text(String(patient?.numero_documento ?? '—'), 18, 57)
  doc.text(doc.splitTextToSize(planTitle || consent.treatment_plans?.title || '—', pageWidth / 2 - 24)[0], pageWidth / 2 + 4, 47)
  doc.text(formatSignedAt(consent.signed_at), pageWidth / 2 + 4, 57)

  // Contenido presentado al paciente
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(18, 54, 121)
  doc.text('Información presentada al paciente', 14, 76)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const content = doc.splitTextToSize(consent.content || '—', pageWidth - 28)
  doc.text(content, 14, 83)

  const contentBottom = 83 + content.length * 5 + 8

  // Decisión del paciente
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(18, 54, 121)
  doc.text('Decisión del paciente', 14, contentBottom)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(accepted ? 21 : 185, accepted ? 128 : 41, accepted ? 61 : 41)
  doc.text(
    accepted
      ? 'ACEPTA el tratamiento propuesto, habiendo comprendido los procedimientos, riesgos, alternativas y costos explicados.'
      : 'NO ACEPTA el tratamiento propuesto. Queda registrada su negativa.',
    14,
    contentBottom + 7,
    { maxWidth: pageWidth - 28 }
  )

  // Firma
  const signY = Math.min(contentBottom + 40, pageHeight - 40)
  doc.setDrawColor(120, 130, 145)
  doc.line(14, signY, 94, signY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)
  doc.text(consent.patient_signature_name || '—', 14, signY + 6)
  doc.setTextColor(120, 130, 145)
  doc.text('Firma (nombre de quien autoriza)', 14, signY + 11)

  // Pie legal
  doc.setFontSize(8)
  doc.setTextColor(120, 130, 145)
  const legal = doc.splitTextToSize(
    'Este documento deja constancia del consentimiento informado conforme a la Ley 527 de 1999. Generado desde el sistema RAVE.',
    pageWidth - 28
  )
  doc.text(legal, 14, pageHeight - 12)

  const safeName = patientFullName(patient).replace(/\s+/g, '-').toLowerCase()
  doc.save(`consentimiento-${safeName}-${consent.id ?? 'plan'}.pdf`)
}
