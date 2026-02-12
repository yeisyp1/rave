import { useDispatch } from 'react-redux'
import { toggleSidebar } from '../app/store'
import { cilMenu } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const Header = () => {
  const dispatch = useDispatch()

  return (
    <header className="header">
      <button
        className="menu-btn"
        onClick={() => dispatch(toggleSidebar())}
      >
        <CIcon icon={cilMenu} size="lg" />
      </button>

      <h3>RAVE Dental System</h3>

      <div className="header-user">
        Admin
      </div>
    </header>
  )
}

export default Header
