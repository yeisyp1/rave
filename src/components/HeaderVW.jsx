import { useDispatch } from 'react-redux'
import { toggleSidebar } from '../app/store'
import '../styles/HeaderVW.css'
import { useState, useEffect } from 'react'
import {
  FiBell,
  FiChevronDown,
  FiMenu,
  FiMoon,
  FiSearch,
  FiSettings,
  FiSun,
} from 'react-icons/fi'
import { DiAptana } from "react-icons/di";


const Header = ({ user, profile }) => {

  const dispatch = useDispatch()
  const [searchValue, setSearchValue] = useState('')
  const [isDark, setIsDark] = useState(() => {
      return localStorage.getItem('theme') === 'dark'
    })


    useEffect(() => {
      const theme = isDark ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }, [isDark])
  
    const handleThemeToggle = () => {
        setIsDark(!isDark)
    }

  const fullName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.display_name ??
    'Dr. Alex Rivera'

  const roleLabels = {
    admin: 'Administrador',
    dentist: 'Odontóloga',
    assistant: 'Asistente',
  }
  const roleLabel = roleLabels[profile?.role] ?? 'Asistente'

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()


  return (
    <header className="header header-modern">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Abrir menú lateral"
        >
          <FiMenu />
        </button>

        <div className="header-search">
          <FiSearch className="header-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="header-search-input"
            placeholder="Buscar pacientes, personal o historiales médicos..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            aria-label="Buscar en el sistema"
          />
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-icon-btn"
          onClick={handleThemeToggle}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>

        <button type="button" className="header-icon-btn" aria-label="Notificaciones">
          <FiBell />
        </button>

        <button type="button" className="header-icon-btn" aria-label="Configuración">
          <DiAptana />
        </button>

        <span className="header-divider" aria-hidden="true" />

        <div type="button" className="header-profile" aria-label={`Perfil de ${fullName}`}>
          <div className="header-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="header-profile-copy">
            <span className="header-profile-name">{fullName}</span>
            <span className="header-profile-role">{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
