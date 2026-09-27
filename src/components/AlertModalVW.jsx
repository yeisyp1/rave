import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'
import { closeAlertModal } from '../app/store'
import '../styles/AlertModalVW.css'

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
}

const AlertModalVW = () => {
  const dispatch = useDispatch()
  const { open, title, message, variant } = useSelector((state) => state.alertModal)

  if (!open) return null

  const Icon = ICONS[variant] || FiInfo
  const close = () => dispatch(closeAlertModal())

  const modal = (
    <div className="am-overlay" onClick={(event) => event.target === event.currentTarget && close()}>
      <div className="am-modal" role="alertdialog" aria-modal="true">
        <button className="am-close" onClick={close} aria-label="Cerrar">
          <FiX size={16} />
        </button>
        <div className={`am-icon am-icon-${variant}`}>
          <Icon size={22} />
        </div>
        {title && <h3 className="am-title">{title}</h3>}
        <p className="am-message">{message}</p>
        <button className="am-btn" onClick={close} autoFocus>
          Aceptar
        </button>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default AlertModalVW
