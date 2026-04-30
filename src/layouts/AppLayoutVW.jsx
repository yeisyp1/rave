import { Outlet } from 'react-router-dom'
import HeaderVW from '../components/HeaderVW'
import SidebarVW from '../components/SidebarVW'
import '../styles/LayoutVW.css'

const AppLayoutVW = ({ user, profile }) => {
  return (
    <div className="app-layout">
      <SidebarVW profile={profile} />
      <div className="main-area">
        <HeaderVW user={user} profile={profile} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayoutVW
