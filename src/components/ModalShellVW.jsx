import { createPortal } from 'react-dom'
import { useModalBehavior } from '../hooks/useModalBehavior'

const ModalShellVW = ({
  overlayClassName,
  onClose,
  closeOnBackdrop = true,
  labelledBy,
  label,
  role = 'dialog',
  children,
}) => {
  const containerRef = useModalBehavior(onClose)

  const content = (
    <div
      className={overlayClassName}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={containerRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ModalShellVW
