import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiAlertTriangle, FiHelpCircle, FiTrash2 } from 'react-icons/fi'
import { useModalBehavior } from '../hooks/useModalBehavior'
import { setConfirmDialogRequester } from '../utils/confirmDialog'
import '../styles/AlertModalVW.css'

const ICONS = { warning: FiAlertTriangle, danger: FiTrash2, info: FiHelpCircle }

const ConfirmDialogVW = () => {
  const [dialog, setDialog] = useState(null)
  const [reason, setReason] = useState('')
  const titleId = useId()
  const reasonId = useId()

  useEffect(() => {
    setConfirmDialogRequester((options) => {
      setReason('')
      setDialog(options)
    })
    return () => setConfirmDialogRequester(null)
  }, [])

  const resolveWith = useCallback((value) => {
    setDialog((current) => {
      current?.resolve(value)
      return null
    })
  }, [])

  const cancel = useCallback(
    () => resolveWith(dialog?.requireReason ? null : false),
    [dialog?.requireReason, resolveWith],
  )

  const containerRef = useModalBehavior(cancel, { enabled: Boolean(dialog) })

  if (!dialog) return null

  const Icon = ICONS[dialog.variant] ?? FiHelpCircle
  const reasonMissing = dialog.requireReason && reason.trim().length === 0

  const content = (
    <div
      className="modal-overlay am-overlay"
      onClick={(event) => event.target === event.currentTarget && cancel()}
    >
      <div
        ref={containerRef}
        className="am-modal am-modal-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={`am-icon am-icon-${dialog.variant === 'info' ? 'info' : 'error'}`}>
          <Icon size={22} />
        </div>
        <h3 className="am-title" id={titleId}>{dialog.title}</h3>
        {dialog.message && <p className="am-message">{dialog.message}</p>}

        {dialog.requireReason && (
          <div className="am-field">
            <label htmlFor={reasonId}>{dialog.reasonLabel}</label>
            <textarea
              id={reasonId}
              rows={3}
              value={reason}
              placeholder={dialog.placeholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        )}

        <div className="am-actions">
          <button type="button" className="am-btn ghost" onClick={cancel}>
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            className={`am-btn ${dialog.variant === 'danger' ? 'danger' : ''}`}
            disabled={reasonMissing}
            onClick={() => resolveWith(dialog.requireReason ? reason.trim() : true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ConfirmDialogVW
