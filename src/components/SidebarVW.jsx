import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '../app/store'
import { supabase } from '../dao/SupabaseDAO'
import '../styles/SidebarVW.css'
import {
  cilAccountLogout,
  cilAddressBook,
  cilBeaker,
  cilCalendar,
  cilCreditCard,
  cilFolderOpen,
  cilGroup,
  cilInbox,
  cilSpeedometer,
  cilUser,
  cilX,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const Sidebar = ({ profile }) => {
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)
  const navigate = useNavigate()
  const isMobile = window.innerWidth < 992
  const isAdmin = profile?.role === 'admin'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (isMobile) dispatch(closeSidebar())
    navigate('/login')
  }

  const handleClick = () => {
    if (isMobile) dispatch(closeSidebar())
  }

  const navItems = [
    {
      section: 'Pacientes',
      items: [
        { to: '/dashboard', icon: cilSpeedometer, label: 'Dashboard' },
        { to: '/pacientes', icon: cilGroup, label: 'Pacientes' },
        { to: '/calendar', icon: cilCalendar, label: 'Calendario' },
        { to: '/agendarcita', icon: cilAddressBook, label: 'Agendar Cita' },
      ],
    },
    {
      section: 'Admin',
      adminOnly: true,
      items: [
        { to: '/billing', icon: cilCreditCard, label: 'Pagos' },
        { to: '/doctors', icon: cilUser, label: 'Doctores' },
        { to: '/laboratory', icon: cilBeaker, label: 'Laboratorio' },
        { to: '/inventory', icon: cilInbox, label: 'Inventario' },
        { to: '/documentation', icon: cilFolderOpen, label: 'Documentacion' },
      ],
    },
    {
      section: 'Extra',
      items: [
        { icon: cilAccountLogout, label: 'Cerrar Sesion', action: 'logout' },
      ],
    },
  ].filter((section) => !section.adminOnly || isAdmin)

  return (
    <>
      <aside className={`sidebar sidebar-narrow-unfoldable ${open ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
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

        <ul className="sidebar-nav">
          {navItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <li className="nav-title">{section.section}</li>
              {section.items.map((item, itemIdx) => {
                if (item.action === 'logout') {
                  return (
                    <li key={itemIdx} className="nav-item">
                      <button onClick={handleLogout} className="nav-link logout-btn">
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
