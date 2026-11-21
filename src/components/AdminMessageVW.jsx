import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'

const ICONS = { error: FiAlertCircle, ok: FiCheckCircle, info: FiInfo }

const AdminMessageVW = ({ text, tone = 'error' }) => {
  const Icon = ICONS[tone] ?? FiInfo

  return (
    <div aria-live="polite" role="status" className="admin-message-live">
      {text && (
        <p className={`admin-message admin-message-${tone}`}>
          <Icon size={15} aria-hidden="true" />
          <span>{text}</span>
        </p>
      )}
    </div>
  )
}

export default AdminMessageVW
