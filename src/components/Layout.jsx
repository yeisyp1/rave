import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import '../styles/layout.css'

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout