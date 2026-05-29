import { getBillingInvoicesDAO } from "../dao/BillingDAO";
import { BillingModel } from "../models/BillingModel";

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
