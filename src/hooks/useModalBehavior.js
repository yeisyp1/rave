import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const openModals = []
let openSequence = 0

const topmostModal = () => {
  const mounted = openModals.filter((entry) => entry.ref.current)
  if (mounted.length === 0) return null
  return mounted.reduce((best, entry) => {
    if (!best) return entry
    const position = best.ref.current.compareDocumentPosition(entry.ref.current)
    if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) return entry
    if (position & Node.DOCUMENT_POSITION_CONTAINS) return best
    return entry.seq > best.seq ? entry : best
  }, null)
}

export const useModalBehavior = (onClose, { enabled = true } = {}) => {
  const containerRef = useRef(null)
  const openerRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const focusFirst = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (container.contains(document.activeElement)) return
    const first = container.querySelector(FOCUSABLE)
    if (first) first.focus()
    else container.focus()
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    openSequence += 1
    const entry = { ref: containerRef, seq: openSequence }
    openModals.push(entry)
    const isTopmost = () => topmostModal() === entry

    openerRef.current = document.activeElement
    const timer = setTimeout(focusFirst, 0)

    const handleKeyDown = (event) => {
      if (!isTopmost()) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
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
      const index = openModals.indexOf(entry)
      if (index >= 0) openModals.splice(index, 1)
      if (openModals.length === 0) document.body.style.overflow = previousOverflow
      const opener = openerRef.current
      if (opener && typeof opener.focus === 'function' && document.body.contains(opener)) {
        opener.focus()
      }
    }
  }, [enabled, focusFirst])

  return containerRef
}

export default useModalBehavior
