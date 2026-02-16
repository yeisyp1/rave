import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '../app/store'
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

  const navItems = [
    {
      section: 'General',
      items: [
        { to: '/dashboard', icon: cilSpeedometer, label: 'Dashboard'},
        { to: '/patients', icon: cilUser, label: 'Pacientes' },
        { to: '/calendar', icon: cilCalendar, label: 'Calendario' },
        { to: '/billing', icon: cilCreditCard, label: 'Pagos' },
      ],
    },
    {
      section: 'Extra',
      items: [
        { to: '/documentation', icon: cilBook, label: 'Documentación' },
        { to: '/login', icon: cilAccountLogout, label: 'Cerrar Sesión' },
      ],
    },
  ]

  return (
    <>
      <aside className={`sidebar sidebar-narrow-unfoldable ${open ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">RAVE</div>
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
        <ul className="sidebar-nav">
          {navItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <li className="nav-title">{section.section}</li>
              {section.items.map((item, itemIdx) => (
                <li key={itemIdx} className="nav-item">
                  <NavLink 
                    to={item.to} 
                    onClick={handleClick}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <CIcon icon={item.icon} className="nav-icon" />
                    <span className="nav-text">{item.label}</span>
                    {item.badge && <span className="badge bg-danger ms-auto">{item.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </div>
          ))}
        </ul>
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