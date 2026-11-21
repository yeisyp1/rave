let requestDialog = null

export const setConfirmDialogRequester = (fn) => {
  requestDialog = fn
}

const open = (options) =>
  new Promise((resolve) => {
    if (typeof requestDialog !== 'function') {
      resolve(options?.requireReason ? null : false)
      return
    }
    requestDialog({ ...options, resolve })
  })

export const confirmAction = ({
  title = '¿Confirmas esta acción?',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
} = {}) => open({ title, message, confirmLabel, cancelLabel, variant, requireReason: false })

export const promptReason = ({
  title = 'Motivo',
  message = '',
  reasonLabel = 'Motivo',
  placeholder = '',
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
} = {}) => open({ title, message, reasonLabel, placeholder, confirmLabel, cancelLabel, variant, requireReason: true })
