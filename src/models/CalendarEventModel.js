export class CalendarEventModel {
  constructor(payload = {}) {
    Object.assign(this, payload);
  }

  static fromGoogleEvent(event) {
    const summary = event.summary ?? "";
    const stored = event.extendedProperties?.private ?? {};
    // Eventos antiguos: "Paciente - Servicio" en el título.
    const sep = summary.lastIndexOf(" - ");
    const patient = stored.patientName ?? (sep > -1 ? summary.slice(0, sep) : summary);
    const service =
      stored.service ?? (sep > -1 ? summary.slice(sep + 3) : event.description || "Cita");

    return new CalendarEventModel({
      id: event.id,
      title: event.summary ?? "(Sin titulo)",
      start: new Date(event.start?.dateTime ?? event.start?.date),
      end: new Date(event.end?.dateTime ?? event.end?.date),
      allDay: !event.start?.dateTime,
      resource: {
        patient,
        service,
        status: event.status === "confirmed" ? "confirmed" : "pending",
        googleId: event.id,
        htmlLink: event.htmlLink,
        description: event.description ?? "",
        location: event.location ?? "",
      },
      fromGoogle: true,
    });
  }
}
