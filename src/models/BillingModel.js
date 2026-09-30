export class BillingModel {
  constructor({ id, patient, date, amount, status, paid = 0, items = [], raw }) {
    this.id = id;
    this.patient = patient;
    this.date = date;
    this.amount = amount;
    this.status = status;
    this.paid = paid;
    this.items = items;
    this.raw = raw;
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
