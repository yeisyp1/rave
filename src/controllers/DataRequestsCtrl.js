import { applyDataRequestDAO, listDataRequestsDAO, updateDataRequestStatusDAO } from "../dao/DataRequestsDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const DATA_REQUEST_STATUS_OPTIONS = ["Pendiente", "En proceso", "Resuelta", "Rechazada"];

export const loadDataRequestsCtrl = () => listDataRequestsDAO();

export const updateDataRequestStatusCtrl = (id, status) =>
  runCtrlAction(() => updateDataRequestStatusDAO(id, { status }));

export const computeDataRequestStatsCtrl = (requests) => ({
  pending: requests.filter((item) => item.status === "Pendiente" || item.status === "En proceso").length,
  resolved: requests.filter((item) => item.status === "Resuelta").length,
});

export const getDataRequestPatientLabel = (item) => {
  const patient = item.patients;
  if (!patient) return item.patient_id;
  return `${patient.nombre ?? ""} ${patient.apellidos ?? ""}`.trim() || patient.numero_documento;
};

export const APPLICABLE_REQUEST_TYPES = ["Supresión", "Revocatoria de autorización"];

export const canApplyDataRequest = (item) =>
  APPLICABLE_REQUEST_TYPES.includes(item.request_type) && !["Resuelta", "Rechazada"].includes(item.status);

export const applyDataRequestCtrl = (id) => runCtrlAction(() => applyDataRequestDAO(id));

export const isDataRequestOverdue = (item) =>
  Boolean(item.due_at) && !["Resuelta", "Rechazada"].includes(item.status) && new Date(item.due_at) < new Date();
