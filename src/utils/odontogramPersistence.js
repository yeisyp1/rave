const draftKey = (patientId) => `rave:odontograma:draft:${patientId}`;

export const getOdontogramDraftKey = (patientId) => draftKey(patientId);

const roots = [];

export const pushOdontogramRoot = (element) => {
  if (element && !roots.includes(element)) roots.push(element);
};

export const popOdontogramRoot = (element) => {
  const index = roots.indexOf(element);
  if (index >= 0) roots.splice(index, 1);
};

const activeRoot = () => {
  for (let i = roots.length - 1; i >= 0; i -= 1) {
    const root = roots[i];
    if (root.isConnected && root.offsetParent !== null) return root;
  }
  return roots.length > 0 && roots[roots.length - 1].isConnected ? roots[roots.length - 1] : null;
};

const findInActiveRoot = (id) => {
  const root = activeRoot();
  if (root) return root.querySelector(`#${id}`);
  return document.getElementById(id);
};

export const waitForOdontogramReady = (timeout = 6000) =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (findInActiveRoot("statusImportInput") && findInActiveRoot("btnStatusExport")) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
  });

export const captureOdontogramState = async () => {
  const exportButton = findInActiveRoot("btnStatusExport");
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
  const input = findInActiveRoot("statusImportInput");
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
  localStorage.setItem(draftKey(patientId), JSON.stringify({ savedAt: Date.now(), state }));
};

export const loadOdontogramDraft = (patientId) => {
  if (!patientId) return null;
  try {
    const value = localStorage.getItem(draftKey(patientId));
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && "state" in parsed) return parsed;
    return { savedAt: 0, state: parsed };
  } catch {
    return null;
  }
};

export const clearOdontogramDraft = (patientId) => {
  if (patientId) localStorage.removeItem(draftKey(patientId));
};

export const pickOdontogramState = (patientId, saved) => {
  const draft = loadOdontogramDraft(patientId);
  if (!draft) return saved?.state ?? saved ?? null;

  const savedAt = saved?.savedAt ? new Date(saved.savedAt).getTime() : 0;
  if (savedAt && savedAt > draft.savedAt) {
    clearOdontogramDraft(patientId);
    return saved.state ?? null;
  }

  return draft.state;
};
