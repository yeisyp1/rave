const parseDate = (value) => {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(text);
};

export class BillingModel {
  // payments: pagos vigentes ({ amount, paid_at }). Sin ellos, lo pagado se atribuye a la fecha de la factura.
  constructor({ id, patient, date, amount, status, paid = 0, payments = [], items = [], raw }) {
    this.id = id;
    this.patient = patient;
    this.date = date;
    this.amount = amount;
    this.status = status;
    this.paid = paid;
    this.payments = payments;
    this.items = items;
    this.raw = raw;
  }

  get paymentEntries() {
    if (this.payments.length) return this.payments;
    return this.paid > 0 ? [{ amount: this.paid, paid_at: this.date }] : [];
  }

  // Pagos recibidos entre from y to (null = sin límite), según la fecha del pago.
  paymentsInRange(from, to) {
    return this.paymentEntries.filter((payment) => {
      const date = parseDate(payment.paid_at);
      return !!date && (!from || date >= from) && (!to || date <= to);
    });
  }

  paidInRange(from, to) {
    return this.isVoid ? 0 : this.paymentsInRange(from, to).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }

  get isPaid() {
    return this.status === "Pagado";
  }

  // Con saldo por cobrar: sin pagos o con pagos parciales.
  get isPending() {
    return this.status === "Pendiente" || this.status === "Parcial";
  }

  get isVoid() {
    return this.status === "Anulado";
  }

  get balance() {
    return this.isVoid ? 0 : Math.max(0, this.amount - this.paid);
  }
}
