import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export const useModalBehavior = (onClose, { enabled = true } = {}) => {
  const containerRef = useRef(null)
  const openerRef = useRef(null)

  const focusFirst = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const first = container.querySelector(FOCUSABLE)
    if (first) first.focus()
    else container.focus()
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    openerRef.current = document.activeElement
    const timer = setTimeout(focusFirst, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return
      const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      if (!container.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      const opener = openerRef.current
      if (opener && typeof opener.focus === 'function' && document.body.contains(opener)) {
        opener.focus()
      }
    }
  }, [enabled, focusFirst, onClose])

  return containerRef
}

export default useModalBehavior
