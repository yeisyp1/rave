import { useEffect, useMemo, useRef } from 'react'
import OdontogramApp from 'react-odontogram-editor-modul/src/App'
import odontogramCss from 'react-odontogram-editor-modul/src/index.css?inline'
import { scopeCss } from '../utils/scopedCss'
import { popOdontogramRoot, pushOdontogramRoot } from '../utils/odontogramPersistence'

const SCOPE = '.odontogram-scope'
const STYLE_ID = 'odontogram-scoped-styles'

let mountedHosts = 0

const ensureStyles = (css) => {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}

const removeStyles = () => {
  document.getElementById(STYLE_ID)?.remove()
}

const OdontogramHostVW = (props) => {
  const rootRef = useRef(null)
  const css = useMemo(() => scopeCss(odontogramCss, SCOPE), [])

  useEffect(() => {
    ensureStyles(css)
    mountedHosts += 1
    const node = rootRef.current
    if (node) pushOdontogramRoot(node)

    return () => {
      if (node) popOdontogramRoot(node)
      mountedHosts -= 1
      if (mountedHosts === 0) removeStyles()
    }
  }, [css])

  return (
    <div className="odontogram-scope" ref={rootRef}>
      <OdontogramApp {...props} />
    </div>
  )
}

export default OdontogramHostVW
