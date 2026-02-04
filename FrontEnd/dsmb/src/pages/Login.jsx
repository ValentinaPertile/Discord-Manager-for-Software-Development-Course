import { useEffect, useState } from 'react'
import { handleDiscordCallback } from '../utils/auth'
import './Login.css'

// Configuración Discord OAuth2
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI || 'http://localhost:5173/callback'
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`

function Login({ setUser }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    // Evitar procesamiento múltiple
    if (isProcessing) return

    // Manejar callback de Discord
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (error) {
      console.error('Error de OAuth:', error)
      alert('Error en la autenticación: ' + error)
      // Limpiar URL
      window.history.replaceState({}, document.title, "/")
      return
    }
    
    if (code) {
      setIsProcessing(true)
      console.log('Código OAuth recibido:', code.substring(0, 10) + '...')
      
      // Limpiar URL inmediatamente para evitar re-ejecución
      window.history.replaceState({}, document.title, "/")
      
      handleDiscordCallback(code, setUser).finally(() => {
        setIsProcessing(false)
      })
    }
  }, [setUser, isProcessing])

  const handleLogin = () => {
    const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
    
    if (!CLIENT_ID) {
      alert('Error: CLIENT_ID no configurado. Revisa tu archivo .env')
      return
    }
    
    console.log('Redirigiendo a Discord OAuth...')
    window.location.href = DISCORD_OAUTH_URL
  }

  return (
    <div className="login-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Control Total</h1>
          <p className="hero-description">
            DSMB es un bot de Discord completo, fácil de usar, en el que<br />
            confían millones de servidores de Discord de todo el mundo para<br />
            gestionar, entretener y hacer crecer tu comunidad
          </p>
          <div className="hero-buttons">
            <button onClick={handleLogin} className="btn-primary">
              Iniciar Sesión
            </button>
            <button 
              onClick={() => setShowFeatures(!showFeatures)} 
              className="btn-secondary"
            >
              Ver Características
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="discord-characters">
            <span className="character">🎮</span>
            <span className="character">🎯</span>
            <span className="character">🎪</span>
            <span className="character">👑</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {showFeatures && (
        <section className="features-section">
        <h2 className="features-title">Características</h2>
        <div className="features-grid">
          <div className="feature-card">
            <p className="feature-text">
              Invitando a nuestro bot a tu servidor de Discord, obtenés acceso a un 
              <strong> panel en vivo</strong> donde podés ver todos los registros de 
              tu comunidad en tiempo real: unirte, salir, creación de canales, roles, 
              expulsiones, baneos y mucho más. Todo centralizado en un dashboard 
              moderno, rápido y seguro.
            </p>
          </div>
          <div className="feature-card">
            <p className="feature-text">
              Además, el sistema te permite <strong>buscar eventos</strong>, 
              revisar las acciones, y visualizar estadísticas de 
              tu servidor de manera clara. Con alertas en vivo y un control total de 
              permisos, nunca fue tan fácil mantener tu servidor organizado y protegido.
            </p>
          </div>
          <div className="feature-card">
            <p className="feature-text">
              Saluda al bot con !saludo. No seas malo con él 😉
            </p>
          </div>
            <div className="feature-card">
            <p className="feature-text">
              Proximamente mas comandos...⏳
            </p>
          </div>
        </div>
      </section>
      )}
    </div>
  )
}

export default Login