import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ServerCard from '../components/ServerCard'
import { getUserGuilds } from '../services/discordApi'
import websocketService from '../services/websocket'
import './Servidores.css'

function Servidores() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wsStatus, setWsStatus] = useState('connecting')
  const navigate = useNavigate()

  useEffect(() => {
  let isMounted = true // evita actualizar el estado si el componente se desmonta
  let controller = new AbortController() // permite cancelar fetch si el user navega rápido

  initializeWebSocket()
  loadServers(controller, isMounted)

  return () => {
    // limpiar listeners
    websocketService.off('connected', handleWSConnected)
    websocketService.off('disconnected', handleWSDisconnected)
    websocketService.off('error', handleWSError)

    // cancelar request si sigue activa
    isMounted = false
    controller.abort()
  }
}, [])


  const initializeWebSocket = () => {
    websocketService.on('connected', handleWSConnected)
    websocketService.on('disconnected', handleWSDisconnected)
    websocketService.on('error', handleWSError)
    
    if (!websocketService.isConnected) {
      websocketService.connect()
    }
  }

  const handleWSConnected = () => {
    setWsStatus('connected')
    console.log('WebSocket conectado desde Servidores')
  }

  const handleWSDisconnected = () => {
    setWsStatus('disconnected')
    console.log('WebSocket desconectado desde Servidores')
  }

  const handleWSError = (error) => {
    setWsStatus('error')
    console.error('WebSocket error desde Servidores:', error)
  }

  const loadServers = async (controller, isMounted) => {
  try {
    setLoading(true)
    setError(null)

    console.log('Cargando servidores...')
    const guilds = await getUserGuilds({ signal: controller.signal }) // pasamos signal al fetch
    if (!isMounted) return

    console.log('Servidores obtenidos:', guilds.length)

    const adminGuilds = guilds.filter(guild => {
      const hasAdminPermission = (guild.permissions & 0x8) === 0x8
      const isOwner = guild.owner === true
      return hasAdminPermission || isOwner
    })

    setServers(adminGuilds)

  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request cancelada")
      return
    }

    console.error('Error al cargar servidores:', err)

    if (err.message.includes('429')) {
      setError('Demasiadas peticiones. Reintentando en 5s...')
      setTimeout(() => loadServers(controller, isMounted), 5000) // reintento con backoff
    } else if (err.message.includes('Token expirado')) {
      setError('Tu sesión ha expirado. Recarga la página para iniciar sesión de nuevo.')
    } else {
      setError('Error al cargar los servidores: ' + err.message)
    }
  } finally {
    if (isMounted) setLoading(false)
  }
}

  const handleDashboard = (serverId) => {
    navigate(`/dashboard/${serverId}`)
  }

  const getWSStatusText = () => {
    switch (wsStatus) {
      case 'connecting':
        return '🔄 Conectando al bot...'
      case 'connected':
        return '✅ Bot conectado'
      case 'disconnected':
        return '⚠️ Bot desconectado'
      case 'error':
        return '❌ Error de conexión con el bot'
      default:
        return '🔄 Verificando...'
    }
  }

  if (loading) {
    return <div className="loading">Cargando servidores...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="servidores-page">
      <h1>Mis Servidores</h1>
      <div className={`ws-status ${wsStatus}`}>
        {getWSStatusText()}
      </div>
      <p>Servidores donde tienes permisos de administrador</p>
      
      {servers.length === 0 ? (
        <div className="no-servers">
          <p>No administras ningún servidor en Discord</p>
        </div>
      ) : (
        <div className="servers-grid">
          {servers.map(server => (
            <ServerCard 
              key={server.id} 
              server={server} 
              onDashboard={handleDashboard}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Servidores