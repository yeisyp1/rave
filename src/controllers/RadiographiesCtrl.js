import {
  createRadiographiesDAO,
  deleteRadiographyRowDAO,
  getRadiographyPublicUrlDAO,
  getRadiographySignedUrlDAO,
  listHistoryRadiographiesDAO,
  removeRadiographyFileDAO,
  uploadRadiographyFileDAO,
} from "../dao/RadiographiesDAO";

const buildStoragePath = (patientId, file) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${patientId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
};

const resolveRadiographyUrl = async (row) => {
  if (row.image_url) return row;
  if (!row.file_path) return row;

  const signedUrl = await getRadiographySignedUrlDAO(row.file_path);
  if (signedUrl) return { ...row, image_url: signedUrl };

  return { ...row, image_url: getRadiographyPublicUrlDAO(row.file_path) };
};

export const loadHistoryRadiographiesCtrl = async (patientId, historyId) => {
  if (!historyId) return [];

  const rows = await listHistoryRadiographiesDAO(patientId, historyId);
  return Promise.all(rows.map(resolveRadiographyUrl));
};

export const deleteRadiographyCtrl = async (radiography) => {
  await deleteRadiographyRowDAO(radiography.id);

  if (radiography.file_path) {
    try {
      await removeRadiographyFileDAO(radiography.file_path);
    } catch (error) {
      console.warn("La radiografía se eliminó de la base de datos, pero no del almacenamiento:", error);
    }
  }
};

// Uploads each file to Storage and inserts one radiographies row per file,
// linking them to the given clinical history. Shared by both the "add media
// to an existing history" flow and the "save history + attach media" flow.
export const uploadRadiographiesCtrl = async ({ patientId, historyId, files, note }) => {
  const uploads = [];

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
};
