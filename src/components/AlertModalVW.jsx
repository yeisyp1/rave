import { useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'
import { closeAlertModal } from '../app/store'
import { useModalBehavior } from '../hooks/useModalBehavior'
import '../styles/AlertModalVW.css'

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
}

const AlertModalVW = () => {
  const dispatch = useDispatch()
  const { open, title, message, variant } = useSelector((state) => state.alertModal)
  const titleId = useId()

  const close = useCallback(() => dispatch(closeAlertModal()), [dispatch])
  const containerRef = useModalBehavior(close, { enabled: open })

  if (!open) return null

  const Icon = ICONS[variant] || FiInfo

  const modal = (
    <div className="modal-overlay am-overlay" onClick={(event) => event.target === event.currentTarget && close()}>
      <div
        ref={containerRef}
        className="am-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <button className="am-close" onClick={close} aria-label="Cerrar">
          <FiX size={16} />
        </button>
        <div className={`am-icon am-icon-${variant}`}>
          <Icon size={22} />
        </div>
        {title && <h3 className="am-title" id={titleId}>{title}</h3>}
        <p className="am-message">{message}</p>
        <button className="am-btn" onClick={close}>
          Aceptar
        </button>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default AlertModalVW
