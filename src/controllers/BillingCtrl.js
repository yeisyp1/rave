import { getBillingInvoicesDAO } from "../dao/BillingDAO";
import { BillingModel } from "../models/BillingModel";

export const getBillingCtrlData = () => {
  const invoices = getBillingInvoicesDAO().map(
    (invoice) => new BillingModel(invoice),
  );

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
