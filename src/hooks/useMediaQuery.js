import { useCallback, useSyncExternalStore } from 'react'

export const useMediaQuery = (query) => {
  const subscribe = useCallback(
    (onChange) => {
      if (typeof window === 'undefined') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    [query],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export const useIsMobile = () => useMediaQuery('(max-width: 991px)')
