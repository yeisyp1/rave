export class PatientModel {
  constructor(payload = {}) {
    Object.assign(this, payload);
  }

  get fullName() {
    return `${this.nombre ?? ""} ${this.apellidos ?? ""}`.trim();
  }
}
