import { useDispatch } from 'react-redux'
import { toggleSidebar } from '../app/store'
import '../styles/HeaderVW.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMenu,
  FiMoon,
  FiSearch,
  FiSettings,
  FiSun,
} from 'react-icons/fi'
import { isAdmin } from '../utils/roles'

const ROLE_LABELS = {
  admin: 'Administrador',
  dentist: 'Odontólogo/a',
  assistant: 'Asistente',
}

const readTheme = () => {
  const current = document.documentElement.getAttribute('data-theme')
  if (current === 'dark' || current === 'light') return current
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const Header = ({ user, profile }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [isDark, setIsDark] = useState(() => readTheme() === 'dark')

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      console.warn('No se pudo guardar la preferencia de tema en este navegador.')
    }
  }, [isDark])

  const handleThemeToggle = () => setIsDark((previous) => !previous)

  const handleSearch = (event) => {
    event.preventDefault()
    const term = searchValue.trim()
    if (!term) return
    navigate(`/pacientes?buscar=${encodeURIComponent(term)}`)
  }

  const fullName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.display_name ??
    user?.email ??
    'Mi cuenta'

  const roleLabel = ROLE_LABELS[profile?.role] ?? ''

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

        <form className="header-search" role="search" onSubmit={handleSearch}>
          <FiSearch className="header-search-icon" aria-hidden="true" />
          <input
            id="header-search"
            type="search"
            className="header-search-input"
            placeholder="Buscar pacientes por nombre, documento o correo..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            aria-label="Buscar pacientes"
          />
          <button type="submit" className="sr-only">Buscar</button>
        </form>
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

        {isAdmin(profile) && (
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => navigate('/settings')}
            aria-label="Configuración"
            title="Configuración"
          >
            <FiSettings />
          </button>
        )}

        <span className="header-divider" aria-hidden="true" />

        <div className="header-profile">
          <div className="header-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="header-profile-copy">
            <span className="header-profile-name">{fullName}</span>
            {roleLabel && <span className="header-profile-role">{roleLabel}</span>}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
