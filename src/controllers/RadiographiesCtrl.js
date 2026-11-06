import {
  createRadiographiesDAO,
  getRadiographySignedUrlDAO,
  listHistoryRadiographiesDAO,
  uploadRadiographyFileDAO,
  removeRadiographyFilesDAO,
  annulRadiographyDAO,
} from "../dao/RadiographiesDAO";
import { getCurrentUserIdDAO } from "../dao/SupabaseDAO";

const buildStoragePath = (patientId, file) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${patientId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
};

const resolveRadiographyUrl = async (row) => {
  if (row.image_url) return row;
  if (!row.file_path) return row;

  const signedUrl = await getRadiographySignedUrlDAO(row.file_path);
  if (signedUrl) return { ...row, image_url: signedUrl };

  // El bucket es privado: no hay fallback a URL pública (sería una imagen rota).
  return { ...row, image_url: null, image_error: "No se pudo generar el enlace seguro de la radiografía" };
};

export const loadHistoryRadiographiesCtrl = async (patientId, historyId) => {
  if (!historyId) return [];

  const rows = await listHistoryRadiographiesDAO(patientId, historyId);
  return Promise.all(rows.map(resolveRadiographyUrl));
};

export const annulRadiographyCtrl = async (radiographyId, motivo) => {
  if (!motivo?.trim()) throw new Error("El motivo de anulación es obligatorio");
  const userId = await getCurrentUserIdDAO();
  return annulRadiographyDAO(radiographyId, motivo.trim(), userId);
};

// Uploads each file to Storage and inserts one radiographies row per file,
// linking them to the given clinical history. Shared by both the "add media
// to an existing history" flow and the "save history + attach media" flow.
export const uploadRadiographiesCtrl = async ({ patientId, historyId, files, note }) => {
  const uploads = [];

  try {
    for (const file of files) {
      const filePath = buildStoragePath(patientId, file);
      await uploadRadiographyFileDAO(filePath, file);

      uploads.push({
        patient_id: patientId,
        clinical_history_id: historyId,
        file_path: filePath,
        file_name: file.name,
        description: note || null,
        metadata: {
          size: file.size,
          type: file.type,
        },
      });
    }

    if (uploads.length > 0) {
      await createRadiographiesDAO(uploads);
    }
  } catch (error) {
    // Todo o nada: si falla una subida o el registro, se borran los archivos ya subidos.
    try {
      await removeRadiographyFilesDAO(uploads.map((row) => row.file_path));
    } catch {
      // la limpieza es de mejor esfuerzo; se reporta el error original
    }
    throw error;
  }
};
