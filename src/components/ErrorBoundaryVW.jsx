import { Component } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

class ErrorBoundaryVW extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de renderizado capturado:', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="eb-fallback" role="alert">
        <span className="eb-icon" aria-hidden="true"><FiAlertTriangle size={26} /></span>
        <h2 className="eb-title">{this.props.title ?? 'Algo salió mal en esta pantalla'}</h2>
        <p className="eb-text">
          No pudimos mostrar el contenido. Puedes reintentar; si el problema continúa, recarga la página.
        </p>
        <div className="eb-actions">
          <button type="button" className="eb-btn" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
          <button type="button" className="eb-btn ghost" onClick={() => window.location.reload()}>
            Recargar la página
          </button>
        </div>
        {import.meta.env.DEV && <pre className="eb-detail">{String(error?.stack ?? error)}</pre>}
      </div>
    )
  }
}

export default ErrorBoundaryVW
