import {
  annulBillingInvoiceDAO,
  annulPaymentDAO,
  createInvoiceWithItemsDAO,
  createPaymentDAO,
  getBillingInvoicesDAO,
  listPaymentsByInvoiceDAO,
  updateBillingInvoiceDAO,
} from "../dao/BillingDAO";
import { listRealizedProceduresWithInvoicesDAO } from "../dao/ProceduresDAO";
import { BillingModel } from "../models/BillingModel";
import { runCtrlAction } from "../utils/ctrlResult";

export const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia", "Otro"];

const sumActivePayments = (payments) =>
  (payments ?? []).filter((payment) => !payment.anulado).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

export const getBillingCtrlData = async () => {
  const raw = await getBillingInvoicesDAO();
  const invoices = (raw ?? []).map((invoice) => new BillingModel({
    id: invoice.id,
    patient: invoice.patient || invoice.patient_name || (invoice.patient_id ? String(invoice.patient_id) : '—'),
    date: invoice.date ?? invoice.created_at,
    amount: Number(invoice.amount) || 0,
    status: invoice.status || 'Pendiente',
    // Datos de respaldo sin tabla de pagos: una factura 'Pagado' cuenta como pagada completa.
    paid: invoice.payments ? sumActivePayments(invoice.payments) : invoice.status === 'Pagado' ? Number(invoice.amount) || 0 : 0,
    items: invoice.invoice_items ?? [],
    raw: invoice,
  }));

  const activeInvoices = invoices.filter((invoice) => !invoice.isVoid);
  const totalIncome = activeInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const totalPending = activeInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const totalAll = activeInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return {
    invoices,
    totalIncome,
    totalPending,
    totalAll,
  };
};

// CU-14: tratamientos realizados del paciente que aun no estan en una factura vigente.
export const loadBillableProceduresCtrl = async (patientId) => {
  if (!patientId) return [];
  const procedures = await listRealizedProceduresWithInvoicesDAO(patientId);
  return procedures
    .filter((procedure) => !(procedure.invoice_items ?? []).some((item) => item.billing_invoices?.status !== 'Anulado'))
    .map((procedure) => ({
      id: procedure.id,
      description: [procedure.procedure_catalog?.name ?? 'Tratamiento', procedure.tooth_number ? `pieza ${procedure.tooth_number}` : null]
        .filter(Boolean)
        .join(' - '),
      date: procedure.procedure_date,
      quantity: Number(procedure.quantity) || 1,
      unitPrice: Number(procedure.unit_price) || 0,
      total: Number(procedure.total_price) || 0,
    }));
};

export const createBillingInvoiceCtrl = ({ form, patients, procedures, extraItems }) => {
  const patient = patients.find((p) => String(p.numero_documento) === String(form.patientDocument));

  const items = [
    ...procedures.map((procedure) => ({
      patient_procedure_id: procedure.id,
      description: procedure.description,
      quantity: procedure.quantity,
      unit_price: procedure.unitPrice,
    })),
    ...extraItems
      .filter((item) => item.description.trim() && Number(item.amount) > 0)
      .map((item) => ({ description: item.description.trim(), quantity: 1, unit_price: Number(item.amount) })),
  ];

  if (items.length === 0) {
    return Promise.resolve({ ok: false, message: "Selecciona al menos un tratamiento realizado o agrega un concepto con valor." });
  }

  return runCtrlAction(() =>
    createInvoiceWithItemsDAO(
      {
        patient_id: patient ? patient.id : null,
        patient_document: patient ? String(patient.numero_documento ?? "") : form.patientDocument,
        patient_name: patient ? `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim() : form.patientName,
        date: form.date,
        metadata: { notes: form.notes },
      },
      items
    )
  );
};

// El estado (Pendiente/Parcial/Pagado) lo calcula la base de datos a partir de los pagos;
// aqui solo se editan datos descriptivos. El monto solo se edita en facturas sin items.
export const updateBillingInvoiceCtrl = (invoice, form) =>
  runCtrlAction(() =>
    updateBillingInvoiceDAO(invoice.id, {
      patient_name: form.patient,
      date: form.date,
      ...(invoice.items.length === 0 ? { amount: Number(form.amount) || 0 } : {}),
      metadata: { ...(invoice.raw?.metadata ?? {}), notes: form.notes, concept: form.concept },
    })
  );

export const annulBillingInvoiceCtrl = (invoiceId, motivo) => {
  if (!motivo?.trim()) return Promise.resolve({ ok: false, message: "Indica el motivo de anulación de la factura." });
  return runCtrlAction(() => annulBillingInvoiceDAO(invoiceId, motivo.trim()));
};

export const loadInvoicePaymentsCtrl = (invoiceId) => listPaymentsByInvoiceDAO(invoiceId);

export const registerPaymentCtrl = (invoice, form) => {
  const amount = Number(form.amount);
  if (!(amount > 0)) return Promise.resolve({ ok: false, message: "Indica un valor de pago mayor a cero." });
  if (amount > invoice.balance) {
    return Promise.resolve({ ok: false, message: `El pago supera el saldo pendiente ($${invoice.balance.toLocaleString('es-CO')}).` });
  }

  return runCtrlAction(() =>
    createPaymentDAO({
      invoice_id: invoice.id,
      amount,
      paid_at: form.paidAt,
      method: form.method,
      reference: form.reference.trim() || null,
      notes: form.notes.trim() || null,
    })
  );
};

export const annulPaymentCtrl = (paymentId, motivo) => {
  if (!motivo?.trim()) return Promise.resolve({ ok: false, message: "Indica el motivo de anulación del pago." });
  return runCtrlAction(() => annulPaymentDAO(paymentId, motivo.trim()));
};
