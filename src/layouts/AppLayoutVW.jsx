import { Outlet, useLocation } from 'react-router-dom'
import ErrorBoundaryVW from '../components/ErrorBoundaryVW'
import HeaderVW from '../components/HeaderVW'
import SidebarVW from '../components/SidebarVW'
import '../styles/LayoutVW.css'

const AppLayoutVW = ({ user, profile }) => {
  const location = useLocation()

  return (
    <div className="app-layout">
      <SidebarVW profile={profile} />
      <div className="main-area">
        <HeaderVW user={user} profile={profile} />
        <main className="content" id="contenido-principal">
          <ErrorBoundaryVW key={location.pathname}>
            <Outlet />
          </ErrorBoundaryVW>
        </main>
      </div>
    </div>
  )
}

export default AppLayoutVW
