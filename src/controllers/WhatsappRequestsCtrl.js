import { listWhatsappAppointmentRequestsDAO, updateAppointmentStatusDAO } from "../dao/AppointmentsDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const loadWhatsappRequestsCtrl = () => listWhatsappAppointmentRequestsDAO();

export const updateWhatsappRequestStatusCtrl = (id, status) =>
  runCtrlAction(() => updateAppointmentStatusDAO(id, status));

export const computeWhatsappRequestStatsCtrl = (requests) => ({
  newAppointments: requests.filter((item) => item.status === "Solicitada").length,
  cancellations: requests.filter((item) => item.status === "Cancelación solicitada").length,
});

export const getWhatsappRequestPatientLabel = (item) => {
  const patient = item.patients;
  if (patient) return `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim() || patient.numero_documento;
  return item.requester_phone || "Paciente sin identificar";
};
