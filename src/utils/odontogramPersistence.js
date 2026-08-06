const draftKey = (patientId) => `rave:odontograma:draft:${patientId}`;

export const getOdontogramDraftKey = (patientId) => draftKey(patientId);


export const captureOdontogramState = async () => {
  const exportButton = document.getElementById("btnStatusExport");
  if (!exportButton) return null;

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  let exportedBlob = null;

  URL.createObjectURL = (blob) => {
    exportedBlob = blob;
    return "rave-odontogram-capture";
  };
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = () => {};

  try {
    exportButton.onclick?.();
    if (!exportedBlob) return null;
    return JSON.parse(await exportedBlob.text());
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
  }
};

export const restoreOdontogramState = (state) => {
  if (!state) return false;
  const input = document.getElementById("statusImportInput");
  if (!input) return false;

  const file = new File([JSON.stringify(state)], "odontograma.json", {
    type: "application/json",
  });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

export const saveOdontogramDraft = (patientId, state) => {
  if (!patientId || !state) return;
  localStorage.setItem(draftKey(patientId), JSON.stringify(state));
};

export const loadOdontogramDraft = (patientId) => {
  if (!patientId) return null;
  try {
    const value = localStorage.getItem(draftKey(patientId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const clearOdontogramDraft = (patientId) => {
  if (patientId) localStorage.removeItem(draftKey(patientId));
};
