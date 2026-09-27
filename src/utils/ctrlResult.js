// Shared convention for Controller "write" actions (create/update/delete/status-change
// triggered by a user action): always resolve to { ok, data } or { ok: false, message },
// never throw. Views call `if (!result.ok) dispatch(showAlertModal(...))`, keeping the
// error-handling shape identical across every Controller instead of leaving each
// author to choose between throwing and returning.
//
// "Load" Controllers (fetching data for a page) are exempt from this convention on
// purpose: they still throw, and the page's own try/catch decides how to present a
// load failure (usually a page-level banner rather than a modal).
export const runCtrlAction = async (action) => {
  try {
    const data = await action();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};
