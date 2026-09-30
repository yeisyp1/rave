import { getBillingCtrlData } from './BillingCtrl'
import { loadPatientsCtrl } from './PatientsCtrl'
import { isInventoryItemLow, loadInventoryItemsCtrl } from './InventoryCtrl'
import { loadLaboratoryDataCtrl } from './LaboratoryCtrl'

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(text)
}

const inRange = (date, from, to) => {
  if (!date) return false
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

export const fetchReportCtrlData = async ({ from, to } = {}) => {
  const fromDate = from ? toDate(from) : null
  const toDateValue = to ? toDate(to) : null
  const toDateEnd = toDateValue ? new Date(toDateValue.getFullYear(), toDateValue.getMonth(), toDateValue.getDate(), 23, 59, 59, 999) : null

  const [patients, billing, inventory, laboratory] = await Promise.all([
    loadPatientsCtrl('todos'),
    getBillingCtrlData(),
    loadInventoryItemsCtrl(),
    loadLaboratoryDataCtrl(),
  ])

  const invoicesInRange = billing.invoices.filter((invoice) => inRange(toDate(invoice.date), fromDate, toDateEnd))
  const pendingInvoices = invoicesInRange.filter((invoice) => invoice.isPending)

  const newPatients = patients.filter((patient) => inRange(toDate(patient.created_at), fromDate, toDateEnd))

  const lowStockItems = inventory.filter(isInventoryItemLow)

  const pendingLabCases = laboratory.cases.filter((item) => item.status === 'Pendiente' || item.status === 'En proceso')

  const totalIncome = invoicesInRange.reduce((sum, invoice) => sum + (invoice.isVoid ? 0 : invoice.paid), 0)
  const totalPending = pendingInvoices.reduce((sum, invoice) => sum + invoice.balance, 0)

  return {
    range: { from: fromDate, to: toDateValue },
    summary: {
      totalIncome,
      totalPending,
      invoiceCount: invoicesInRange.length,
      newPatientCount: newPatients.length,
      lowStockCount: lowStockItems.length,
      pendingLabCount: pendingLabCases.length,
    },
    invoices: invoicesInRange,
    newPatients,
    lowStockItems,
    pendingLabCases,
  }
}
