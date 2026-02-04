import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import './NavBar.css'

function Navbar({ user, setUser }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setUser(null)
    navigate('/')
  }

  const handleLogin = () => {
    const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
    const REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI || 'http://localhost:5173/callback'
    const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`
    
    if (!DISCORD_CLIENT_ID) {
      alert('Error: CLIENT_ID no configurado. Revisa tu archivo .env')
      return
    }
    
    window.location.href = DISCORD_OAUTH_URL
  }

  const getAvatarUrl = () => {
    if (!user) return null
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    }
    return `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`
  }

  const handleLogoClick = () => {
    navigate(user ? '/servidores' : '/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Logo */}
        <div className="navbar-logo" onClick={handleLogoClick}>
          <span className="logo-icon">☀</span>
          <span className="logo-text">DSMB</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-center">
          {user ? (
            // Links para usuarios autenticados
            <>
              <Link 
                to="/servidores" 
                className={`nav-link ${location.pathname === '/servidores' ? 'active' : ''}`}
              >
                Servidores
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
              >
                Nosotros
              </Link>
            </>
          ) : (
            // Links para usuarios no autenticados
            <>
              {location.pathname !== '/' && (
                <Link to="/" className="nav-link">
                  Inicio
                </Link>
              )}
              <Link 
                to="/about" 
                className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
              >
                Nosotros
              </Link>
            </>
          )}
        </div>

        {/* User Section */}
        <div className="navbar-right">
          {user ? (
            // Usuario autenticado - Dropdown menu
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <img 
                  src={getAvatarUrl()} 
                  alt={`${user.username} avatar`}
                  className="user-avatar"
                />
                <span className="user-name">{user.username}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <img 
                      src={getAvatarUrl()} 
                      alt={`${user.username} avatar`}
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <span className="dropdown-username">{user.username}</span>
                      <span className="dropdown-id">#{user.discriminator}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <span className="dropdown-icon">🚪</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Usuario no autenticado - Botón de login
            <button onClick={handleLogin} className="login-button">
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar