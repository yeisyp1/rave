import { describe, it, expect, vi, beforeEach } from 'vitest'

const annulBillingInvoiceDAO = vi.fn()
const annulPaymentDAO = vi.fn()
const createInvoiceWithItemsDAO = vi.fn()
const createPaymentDAO = vi.fn()
const getBillingInvoicesDAO = vi.fn()
const listPaymentsByInvoiceDAO = vi.fn()
const updateBillingInvoiceDAO = vi.fn()
const listRealizedProceduresWithInvoicesDAO = vi.fn()

vi.mock('../dao/BillingDAO', () => ({
  annulBillingInvoiceDAO: (...args) => annulBillingInvoiceDAO(...args),
  annulPaymentDAO: (...args) => annulPaymentDAO(...args),
  createInvoiceWithItemsDAO: (...args) => createInvoiceWithItemsDAO(...args),
  createPaymentDAO: (...args) => createPaymentDAO(...args),
  getBillingInvoicesDAO: (...args) => getBillingInvoicesDAO(...args),
  listPaymentsByInvoiceDAO: (...args) => listPaymentsByInvoiceDAO(...args),
  updateBillingInvoiceDAO: (...args) => updateBillingInvoiceDAO(...args),
}))

vi.mock('../dao/ProceduresDAO', () => ({
  listRealizedProceduresWithInvoicesDAO: (...args) => listRealizedProceduresWithInvoicesDAO(...args),
}))

const {
  getBillingCtrlData,
  loadBillableProceduresCtrl,
  createBillingInvoiceCtrl,
  annulBillingInvoiceCtrl,
  registerPaymentCtrl,
  annulPaymentCtrl,
} = await import('./BillingCtrl')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getBillingCtrlData (RF-27/RF-28: estado y saldo de facturas)', () => {
  it('calcula el saldo pendiente a partir de los pagos activos y excluye las anuladas de los totales', async () => {
    getBillingInvoicesDAO.mockResolvedValue([
      {
        id: 1,
        patient_name: 'Ana García',
        amount: 100000,
        status: 'Parcial',
        payments: [{ amount: 40000, anulado: false }, { amount: 10000, anulado: true }],
      },
      {
        id: 2,
        patient_name: 'Juan Pérez',
        amount: 50000,
        status: 'Anulado',
        payments: [],
      },
    ])

    const result = await getBillingCtrlData()

    expect(result.invoices).toHaveLength(2)
    expect(result.invoices[0].balance).toBe(60000)
    expect(result.totalIncome).toBe(40000)
    expect(result.totalPending).toBe(60000)
    expect(result.totalAll).toBe(100000)
  })
})

describe('loadBillableProceduresCtrl (CU-14: solo tratamientos realizados sin factura vigente)', () => {
  it('excluye procedimientos ya facturados en una factura no anulada', async () => {
    listRealizedProceduresWithInvoicesDAO.mockResolvedValue([
      { id: 1, procedure_catalog: { name: 'Limpieza' }, procedure_date: '2026-10-01', quantity: 1, unit_price: 50000, total_price: 50000, invoice_items: [] },
      {
        id: 2,
        procedure_catalog: { name: 'Blanqueamiento' },
        invoice_items: [{ billing_invoices: { status: 'Pagado' } }],
      },
    ])

    const result = await loadBillableProceduresCtrl('p-1')
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Limpieza')
  })

  it('un procedimiento cuya factura fue anulada vuelve a quedar facturable', async () => {
    listRealizedProceduresWithInvoicesDAO.mockResolvedValue([
      {
        id: 3,
        procedure_catalog: { name: 'Endodoncia' },
        invoice_items: [{ billing_invoices: { status: 'Anulado' } }],
      },
    ])

    const result = await loadBillableProceduresCtrl('p-1')
    expect(result).toHaveLength(1)
  })

  it('devuelve vacío sin paciente', async () => {
    expect(await loadBillableProceduresCtrl(null)).toEqual([])
  })
})

describe('createBillingInvoiceCtrl', () => {
  const patients = [{ id: 'p-1', numero_documento: '123', nombre: 'Ana', apellidos: 'García' }]

  it('rechaza una factura sin tratamientos ni conceptos extra', async () => {
    const result = await createBillingInvoiceCtrl({
      form: { patientDocument: '123', date: '2026-10-20', notes: '' },
      patients,
      procedures: [],
      extraItems: [],
    })
    expect(result.ok).toBe(false)
  })

  it('crea la factura con los tratamientos seleccionados y conceptos extra válidos', async () => {
    createInvoiceWithItemsDAO.mockResolvedValue({ id: 10 })
    const result = await createBillingInvoiceCtrl({
      form: { patientDocument: '123', date: '2026-10-20', notes: 'Pago inicial' },
      patients,
      procedures: [{ id: 1, description: 'Limpieza', quantity: 1, unitPrice: 50000 }],
      extraItems: [{ description: 'Descuento convenio', amount: '10000' }, { description: '', amount: '0' }],
    })

    expect(result.ok).toBe(true)
    expect(createInvoiceWithItemsDAO).toHaveBeenCalledWith(
      expect.objectContaining({ patient_id: 'p-1', patient_document: '123', patient_name: 'Ana García' }),
      [
        { patient_procedure_id: 1, description: 'Limpieza', quantity: 1, unit_price: 50000 },
        { description: 'Descuento convenio', quantity: 1, unit_price: 10000 },
      ]
    )
  })
})

describe('annulBillingInvoiceCtrl (RNF-17: no se elimina, se anula con motivo)', () => {
  it('exige un motivo de anulación', async () => {
    const result = await annulBillingInvoiceCtrl(1, '   ')
    expect(result.ok).toBe(false)
    expect(annulBillingInvoiceDAO).not.toHaveBeenCalled()
  })

  it('anula la factura con el motivo indicado', async () => {
    annulBillingInvoiceDAO.mockResolvedValue({ id: 1, status: 'Anulado' })
    const result = await annulBillingInvoiceCtrl(1, '  Error de digitación  ')
    expect(result.ok).toBe(true)
    expect(annulBillingInvoiceDAO).toHaveBeenCalledWith(1, 'Error de digitación')
  })
})

describe('registerPaymentCtrl', () => {
  const invoice = { id: 1, balance: 30000 }

  it('rechaza un valor de pago menor o igual a cero', async () => {
    const result = await registerPaymentCtrl(invoice, { amount: '0', paidAt: '2026-10-20', method: 'Efectivo', reference: '', notes: '' })
    expect(result.ok).toBe(false)
  })

  it('rechaza un pago que supera el saldo pendiente', async () => {
    const result = await registerPaymentCtrl(invoice, { amount: '50000', paidAt: '2026-10-20', method: 'Efectivo', reference: '', notes: '' })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/supera el saldo pendiente/)
  })

  it('registra el pago cuando el valor está dentro del saldo', async () => {
    createPaymentDAO.mockResolvedValue({ id: 5 })
    const result = await registerPaymentCtrl(invoice, { amount: '30000', paidAt: '2026-10-20', method: 'Efectivo', reference: '', notes: '' })
    expect(result.ok).toBe(true)
    expect(createPaymentDAO).toHaveBeenCalledWith(
      expect.objectContaining({ invoice_id: 1, amount: 30000, method: 'Efectivo' })
    )
  })
})

describe('annulPaymentCtrl', () => {
  it('exige motivo de anulación del pago', async () => {
    const result = await annulPaymentCtrl(5, '')
    expect(result.ok).toBe(false)
    expect(annulPaymentDAO).not.toHaveBeenCalled()
  })
})
