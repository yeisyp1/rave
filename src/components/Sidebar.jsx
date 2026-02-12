import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar, toggleSidebar } from '../app/store'
import {useState} from 'react'
import '../styles/sidebar.css'
import {
  cilSpeedometer,
  cilUser,
  cilCalendar,
  cilCreditCard,
  cilBook,
  cilMenu,
  cilAccountLogout,

} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {FaGithub} from 'react-icons/fa'

const Sidebar = () => {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const isMobile = window.innerWidth < 992

  const handleClick = () => {
    if (isMobile) dispatch(closeSidebar())
  }

  const handleToggle = () => {
  dispatch(toggleSidebar())
  }

  const handleThemeToggle = () => {
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
  }

  return (
     <>
      {/* Toggle Button (Desktop only) */}

      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Header */}
          <div className="sidebar-logo">
            <div className="logo-icon">
              <span>R</span>
            </div>
            <span className="logo-text">RAVE</span>

            {!isMobile && (
              <button 
                className="sidebar-toggle-btn"
                onClick={handleToggle}
                aria-label="Toggle sidebar"
              >
                <CIcon icon={cilMenu} />
              </button>
            )}

        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* General Section */}
          <div className="nav-section">
            <h6 className="nav-section-title">General</h6>
            
            <NavLink to="/dashboard" onClick={handleClick} className="nav-item">
              <CIcon icon={cilSpeedometer} className="nav-icon" />
              <span className="nav-text">Dashboard</span>
              <span className="badge badge-danger">3</span>
            </NavLink>

             <NavLink to="/patients" onClick={handleClick} className="nav-item">
              <CIcon icon={cilUser} className="nav-icon" />
              <span className="nav-text">Pacientes</span>
            </NavLink>

            <NavLink to="/calendar" onClick={handleClick} className="nav-item">
              <CIcon icon={cilCalendar} className="nav-icon" />
              <span className="nav-text">Calendario</span>
            </NavLink>

            <NavLink to="/billing" onClick={handleClick} className="nav-item">
              <CIcon icon={cilCreditCard} className="nav-icon" />
              <span className="nav-text">Pagos</span>
            </NavLink>
          </div>

          {/* Extra Section */}
          <div className="nav-section">
            <h6 className="nav-section-title">Extra</h6>

            <NavLink to="/documentation" onClick={handleClick} className="nav-item">
              <CIcon icon={cilBook} className="nav-icon" />
              <span className="nav-text">Documentación</span>
            </NavLink>

            <NavLink to="/login" onClick={handleClick} className="nav-item">
              <CIcon icon={cilAccountLogout} className="nav-icon" />
              <span className="nav-text">Cerrar Sesión</span>
            </NavLink>

          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-card">
            <div className="card-icon">
              <FaGithub />
            </div>
            <div className="card-content">
              <h6 className="card-title">RAVE</h6>
              <p className="card-version">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && open && (
        <div 
          className="sidebar-overlay"
          onClick={() => dispatch(closeSidebar())}
        />
      )}
    </>
  )
}

export default Sidebar