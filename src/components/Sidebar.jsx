import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '../app/store'
import '../styles/sidebar.css'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../Back/lib/supabase'
import {
  cilSpeedometer,
  cilUser,
  cilCalendar,
  cilCreditCard,
  cilBook,
  cilAccountLogout,
  cilX,
  cilAddressBook,
  cilBeaker,
  cilFolderOpen,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const Sidebar = () => {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)
  const navigate = useNavigate()

   const handleLogout = async () => {
    await supabase.auth.signOut()
    if (isMobile) dispatch(closeSidebar())
    navigate("/login")
  }

  const isMobile = window.innerWidth < 992
  const handleClick = () => {
    if (isMobile) dispatch(closeSidebar())
  }

  const navItems = [
    {
      section: 'General',
      items: [
        { to: '/dashboard', icon: cilSpeedometer, label: 'Dashboard'},
        { to: '/pacientes', icon: cilUser, label: 'Pacientes' },
        { to: '/calendar', icon: cilCalendar, label: 'Calendario' },
        { to: '/billing', icon: cilCreditCard, label: 'Pagos' },
        { to: '/agendarcita', icon: cilAddressBook, label: 'Agendar Cita' },
        { to: '/doctores', icon: cilUser, label: 'Doctores' },
        { to: '/laboratorio', icon: cilBeaker, label: 'Laboratorio' },
        { to: '/historial', icon: cilBook, label: 'Historial' },
        
      ],
    },
    {
      section: 'Extra',
      items: [
        { to: '/documentation', icon: cilFolderOpen, label: 'Documentación' },
        { icon: cilAccountLogout, label: 'Cerrar Sesión', action: 'logout' },
      ],
    },
  ]

  return (
    <>
      <aside className={`sidebar sidebar-narrow-unfoldable ${open ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-n">RA</div>
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
              {section.items.map((item, itemIdx) => {

                if (item.action === 'logout') {
                  return (
                    <li key={itemIdx} className="nav-item">
                      <button
                        onClick={handleLogout}
                        className="nav-link logout-btn"
                      >
                        <CIcon icon={item.icon} className="nav-icon" />
                        <span className="nav-text">{item.label}</span>
                      </button>
                    </li>
                  )
                }

                return (
                  <li key={itemIdx} className="nav-item">
                    <NavLink
                      to={item.to}
                      onClick={handleClick}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <CIcon icon={item.icon} className="nav-icon" />
                      <span className="nav-text">{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
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