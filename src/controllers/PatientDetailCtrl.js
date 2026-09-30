import { getPatientByIdDAO } from "../dao/PatientsDAO";
import { listLegacyProceduresDAO, listPatientProceduresDAO } from "../dao/ProceduresDAO";
import { listPatientRadiographiesDAO } from "../dao/RadiographiesDAO";
import { loadPatientHistoriesCtrl } from "./HistoriaClinicaCtrl";
import { createInformedConsentDAO, listInformedConsentsByPatientDAO } from "../dao/InformedConsentDAO";
import { createDataRequestDAO, listDataRequestsByPatientDAO } from "../dao/DataRequestsDAO";
import { getCurrentUserIdDAO } from "../dao/SupabaseDAO";

const normalizeProcedures = (legacyProcedures, patientProcedures) => [
  ...legacyProcedures,
  ...patientProcedures.map((procedure) => ({
    ...procedure,
    fecha: procedure.procedure_date,
    procedure_name: procedure.procedure_catalog?.name,
    cost: procedure.total_price ?? procedure.unit_price ?? 0,
  })),
];

export const loadPatientDetailCtrl = async (patientId) => {
  const patient = await getPatientByIdDAO(patientId);

  const [legacyProcedures, patientProcedures, clinicalHistories, consents, dataRequests, radiographies] =
    await Promise.all([
      listLegacyProceduresDAO(patientId),
      listPatientProceduresDAO(patientId),
      loadPatientHistoriesCtrl(patientId),
      listInformedConsentsByPatientDAO(patientId),
      listDataRequestsByPatientDAO(patientId),
      listPatientRadiographiesDAO(patientId),
    ]);

  return {
    patient,
    procedures: normalizeProcedures(legacyProcedures, patientProcedures),
    clinicalHistories,
    consents,
    dataRequests,
    radiographies,
  };
};

export const submitConsentCtrl = async ({ patientId, form }) => {
  if (!form.content.trim() || !form.patient_signature_name.trim()) {
    return { ok: false, message: "Completa el contenido del consentimiento y el nombre de quien firma." };
  }

  // CU-18: el consentimiento puede ligarse a un plan de tratamiento; aceptado = false
  // deja registrada la negativa del paciente.
  const created = await createInformedConsentDAO({
    patient_id: patientId,
    treatment_plan_id: form.treatment_plan_id ? Number(form.treatment_plan_id) : null,
    aceptado: form.aceptado !== false,
    content: form.content.trim(),
    patient_signature_name: form.patient_signature_name.trim(),
    registered_by: await getCurrentUserIdDAO(),
  });

  return { ok: true, consent: created };
};

export const submitDataRequestCtrl = async ({ patientId, form }) => {
  if (!form.description.trim()) {
    return { ok: false, message: "Describe la solicitud del paciente." };
  }

  const created = await createDataRequestDAO({
    patient_id: patientId,
    request_type: form.request_type,
    description: form.description.trim(),
  });

  return { ok: true, request: created };
};
