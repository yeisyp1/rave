// src/components/Layout.jsx
import { useSelector, useDispatch } from 'react-redux'
import { toggleSidebar } from '../app/store'
import Sidebar from './Sidebar'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'
import '../styles/layout.css'

const Layout = ({ children }) => {
  const dispatch = useDispatch()
  const sidebarCollapsed = useSelector((state) => state.ui.sidebarCollapsed)
  const isMobile = window.innerWidth < 992
  
  return (
    <div className="layout">
      <Sidebar />
      
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {isMobile && (
          <button 
            className="mobile-menu-toggle"
            onClick={() => dispatch(toggleSidebar())}
          >
            <CIcon icon={cilMenu} />
          </button>
        )}
        
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout