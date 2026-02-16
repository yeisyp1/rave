import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar, toggleSidebar } from '../app/store'
import '../styles/sidebar.css'
import {
  cilSpeedometer,
  cilUser,
  cilCalendar,
  cilCreditCard,
  cilBook,
  cilAccountLogout,
  cilX,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const Sidebar = () => {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)

  const isMobile = window.innerWidth < 992
  const handleClick = () => {
    if (isMobile) dispatch(closeSidebar())
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <span>R</span>
            </div>
            <span className="logo-text">RAVE</span>
          </div>

          {isMobile && open && (
            <button 
              className="sidebar-close-btn"
              onClick={() => dispatch(closeSidebar())}
              aria-label="Cerrar sidebar"
            >
              <CIcon icon={cilX} size="lg" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* General Section */}
          <div className="nav-section">
            <h6 className="nav-section-title">General</h6>
            
            <NavLink to="/dashboard" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilSpeedometer} className="nav-icon" />
              <span className="nav-text">Dashboard</span>
              <span className="badge badge-danger">3</span>
            </NavLink>

            <NavLink to="/patients" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilUser} className="nav-icon" />
              <span className="nav-text">Pacientes</span>
            </NavLink>

            <NavLink to="/calendar" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilCalendar} className="nav-icon" />
              <span className="nav-text">Calendario</span>
            </NavLink>

            <NavLink to="/billing" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilCreditCard} className="nav-icon" />
              <span className="nav-text">Pagos</span>
            </NavLink>
          </div>

          {/* Extra Section */}
          <div className="nav-section">
            <h6 className="nav-section-title">Extra</h6>

            <NavLink to="/documentation" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilBook} className="nav-icon" />
              <span className="nav-text">Documentación</span>
            </NavLink>

            <NavLink to="/login" onClick={handleClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CIcon icon={cilAccountLogout} className="nav-icon" />
              <span className="nav-text">Cerrar Sesión</span>
            </NavLink>
          </div>
        </nav>
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