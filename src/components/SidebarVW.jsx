import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '../app/store'
import { supabase } from '../dao/SupabaseDAO'
import '../styles/SidebarVW.css'
import logoLight from '../assets/logo1.png'
import logoDark from '../assets/logo.png'
import {
  FiActivity,
  FiUsers,
  FiCalendar,
  FiBookOpen,
  FiCreditCard,
  FiUser,
  FiThermometer,
  FiInbox,
  FiFolder,
  FiLogOut,
  FiX,
} from 'react-icons/fi'

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
        { to: '/dashboard', icon: FiActivity, label: 'Dashboard' },
        { to: '/pacientes', icon: FiUsers, label: 'Pacientes' },
        { to: '/calendar', icon: FiCalendar, label: 'Calendario' },
        { to: '/agendarcita', icon: FiBookOpen, label: 'Agendar Cita' },
      ],
    },
    {
      section: 'Admin',
      adminOnly: true,
      items: [
        { to: '/billing', icon: FiCreditCard, label: 'Pagos' },
        { to: '/doctors', icon: FiUser, label: 'Doctores' },
        { to: '/laboratory', icon: FiThermometer, label: 'Laboratorio' },
        { to: '/inventory', icon: FiInbox, label: 'Inventario' },
        { to: '/documentation', icon: FiFolder, label: 'Documentacion' },
      ],
    },
    {
      section: 'Extra',
      items: [
        { icon: FiLogOut, label: 'Cerrar Sesion', action: 'logout' },
      ],
    },
  ].filter((section) => !section.adminOnly || isAdmin)

  return (
    <>
      <aside className={`sidebar sidebar-narrow-unfoldable ${open ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-n sidebar-brand-logo" aria-label="RAVE">
            <img className="sidebar-brand-img sidebar-brand-img-light" src={logoLight} alt="RAVE" />
            <img className="sidebar-brand-img sidebar-brand-img-dark" src={logoDark} alt="RAVE" />
          </div>
          {isMobile && open && (
            <button
              className="sidebar-close-btn"
              onClick={() => dispatch(closeSidebar())}
              aria-label="Cerrar sidebar"
            >
              <FiX size={20} />
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
                        <item.icon className="nav-icon" size={18} />
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
                      <item.icon className="nav-icon" size={18} />
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
