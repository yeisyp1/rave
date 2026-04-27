export class BillingModel {
  constructor({ id, patient, date, amount, status }) {
    this.id = id;
    this.patient = patient;
    this.date = date;
    this.amount = amount;
    this.status = status;
  }

  get isPaid() {
    return this.status === "Pagado";
  }

  get isPending() {
    return this.status === "Pendiente";
  }
}
