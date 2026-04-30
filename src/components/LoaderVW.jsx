import '../styles/LoaderVW.css'

export const DEFAULT_LOADING_MESSAGE = 'Cargando...'

const LoaderVW = ({ text = DEFAULT_LOADING_MESSAGE, className = '' }) => {
  return (
    <div className={`loader-wrap ${className}`.trim()}>
      <div className="loader-cube" aria-hidden="true">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
      {text && <span className="loader-text">{text}</span>}
    </div>
  )
}

export default LoaderVW
