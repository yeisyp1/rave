import { useCallback, useEffect, useRef, useState } from 'react'

export const useAsyncLoad = (loadFn, deps = []) => {
  const [loading, setLoading] = useState(true)
  const loadFnRef = useRef(loadFn)
  const mountedRef = useRef(true)
  const tokenRef = useRef(0)
  loadFnRef.current = loadFn

  useEffect(() => () => { mountedRef.current = false }, [])

  const reload = useCallback(async (...args) => {
    const token = ++tokenRef.current
    const isCurrent = () => mountedRef.current && tokenRef.current === token
    if (isCurrent()) setLoading(true)
    try {
      return await loadFnRef.current(isCurrent, ...args)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { loading, setLoading, reload }
}
