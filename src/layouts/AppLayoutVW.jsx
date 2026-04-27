import { Outlet } from 'react-router-dom'
import HeaderVW from '../components/HeaderVW'
import SidebarVW from '../components/SidebarVW'
import '../styles/LayoutVW.css'

const AppLayoutVW = () => {
  return (
    <div className="app-layout">
      <SidebarVW />
      <div className="main-area">
        <HeaderVW />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayoutVW