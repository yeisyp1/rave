import {
  createBillingInvoiceDAO,
  getBillingInvoicesDAO,
  updateBillingInvoiceDAO,
} from "../dao/BillingDAO";
import { BillingModel } from "../models/BillingModel";
import { runCtrlAction } from "../utils/ctrlResult";

export const getBillingCtrlData = async () => {
  const raw = await getBillingInvoicesDAO();
  const normalized = (raw ?? []).map((invoice) => ({
    id: invoice.id,
    patient: invoice.patient || invoice.patient_name || (invoice.patient_id ? String(invoice.patient_id) : '—'),
    date: invoice.date ?? invoice.created_at,
    amount: Number(invoice.amount) || 0,
    status: invoice.status || 'Pendiente',
    raw: invoice,
  }));

  const invoices = normalized.map((inv) => new BillingModel(inv));

  const totalIncome = invoices
    .filter((invoice) => invoice.isPaid)
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalPending = invoices
    .filter((invoice) => invoice.isPending)
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalAll = totalIncome + totalPending;

  return {
    invoices,
    totalIncome,
    totalPending,
    totalAll,
  };
};

export const createBillingInvoiceCtrl = ({ form, patients }) => {
  const patient = patients.find((p) => String(p.numero_documento) === String(form.patientDocument));

  return runCtrlAction(() =>
    createBillingInvoiceDAO({
      patient_id: patient ? patient.id : null,
      patient_document: patient ? String(patient.numero_documento ?? "") : form.patientDocument,
      patient_name: patient ? `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim() : form.patientName,
      date: form.date,
      amount: Number(form.amount) || 0,
      status: form.status,
      metadata: { notes: form.notes },
    })
  );
};

export const updateBillingInvoiceStatusCtrl = (invoiceId, status) =>
  runCtrlAction(() => updateBillingInvoiceDAO(invoiceId, { status }));

export const updateBillingInvoiceCtrl = (invoiceId, form) =>
  runCtrlAction(() =>
    updateBillingInvoiceDAO(invoiceId, {
      patient_name: form.patient,
      date: form.date,
      amount: Number(form.amount) || 0,
      status: form.status,
      metadata: { notes: form.notes, concept: form.concept },
    })
  );
