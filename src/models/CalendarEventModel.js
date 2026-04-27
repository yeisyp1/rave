export class CalendarEventModel {
  constructor(payload = {}) {
    Object.assign(this, payload);
  }

  static fromGoogleEvent(event) {
    return new CalendarEventModel({
      id: event.id,
      title: event.summary ?? "(Sin titulo)",
      start: new Date(event.start?.dateTime ?? event.start?.date),
      end: new Date(event.end?.dateTime ?? event.end?.date),
      allDay: !event.start?.dateTime,
      resource: {
        patient: event.summary ?? "",
        service: event.description ?? "Cita",
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
