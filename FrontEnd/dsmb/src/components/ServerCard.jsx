import { useState, useEffect, useCallback } from 'react'
import websocketService from '../services/websocket'
import './ServerCard.css'

const ServerCard = ({ server }) => {
  const [botStatus, setBotStatus] = useState({
    checking: true,
    isInGuild: false,
    hasPermissions: false,
    error: null
  })

  // Usar useCallback para evitar que la función se recree en cada render
  const checkBotStatus = useCallback(() => {
    setBotStatus(prev => ({ ...prev, checking: true }))
    
    // Verificar si WebSocket está conectado
    if (websocketService.isConnected) {
      // Usar los métodos existentes de tu websocket service
      websocketService.requestBotStatus([server.id])
    } else {
      // Si no está conectado, conectar y esperar
      websocketService.connect()
      
      const onConnected = () => {
        setTimeout(() => {
          websocketService.requestBotStatus([server.id])
        }, 1000)
        websocketService.off('connected', onConnected)
      }
      
      websocketService.on('connected', onConnected)
    }
  }, [server.id]) // Incluir server.id como dependencia

  useEffect(() => {
    // Verificar si el bot está en el servidor cuando se monta el componente
    checkBotStatus()

    // Escuchar actualizaciones del WebSocket
    const handleBotGuildCheck = (data) => {
      if (data.serverId === server.id) {
        setBotStatus({
          checking: false,
          isInGuild: data.isInGuild,
          hasPermissions: data.guildInfo?.hasPermissions || false,
          error: null
        })
      }
    }

    const handleBotStatusResponse = (data) => {
      if (data[server.id]) {
        setBotStatus({
          checking: false,
          isInGuild: data[server.id].isInGuild,
          hasPermissions: data[server.id].hasPermissions || false,
          error: null
        })
      }
    }

    const handleBotJoined = (data) => {
      if (data.guildId === server.id) {
        setBotStatus(prev => ({
          ...prev,
          isInGuild: true,
          checking: false
        }))
      }
    }

    const handleBotLeft = (data) => {
      if (data.guildId === server.id) {
        setBotStatus(prev => ({
          ...prev,
          isInGuild: false,
          checking: false
        }))
      }
    }

    const handleWebSocketError = () => {
      setBotStatus(prev => ({
        ...prev,
        checking: false,
        error: 'Error de conexión'
      }))
    }

    const handleConnected = () => {
      // Cuando se conecte el WebSocket, verificar estado del bot
      setTimeout(() => checkBotStatus(), 500)
    }

    // Registrar listeners
    websocketService.on('BOT_IN_GUILD_STATUS', handleBotGuildCheck)
    websocketService.on('BOT_STATUS_RESPONSE', handleBotStatusResponse)
    websocketService.on('BOT_JOINED_GUILD', handleBotJoined)
    websocketService.on('BOT_LEFT_GUILD', handleBotLeft)
    websocketService.on('error', handleWebSocketError)
    websocketService.on('disconnected', handleWebSocketError)
    websocketService.on('connected', handleConnected)

    // Cleanup
    return () => {
      websocketService.off('BOT_IN_GUILD_STATUS', handleBotGuildCheck)
      websocketService.off('BOT_STATUS_RESPONSE', handleBotStatusResponse)
      websocketService.off('BOT_JOINED_GUILD', handleBotJoined)
      websocketService.off('BOT_LEFT_GUILD', handleBotLeft)
      websocketService.off('error', handleWebSocketError)
      websocketService.off('disconnected', handleWebSocketError)
      websocketService.off('connected', handleConnected)
    }
  }, [server.id, checkBotStatus]) // Incluir checkBotStatus como dependencia

  const handleInviteBot = () => {
    // Obtener el Client ID del bot desde las variables de entorno
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID
    
    if (!clientId) {
      alert('Error: Client ID no configurado')
      return
    }
    
    const permissions = '8' // Permisos de administrador
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot&guild_id=${server.id}`
    
    window.open(inviteUrl, '_blank')
  }

  const getStatusDisplay = () => {
    if (botStatus.checking) {
      return <span className="status-checking">Verificando...</span>
    }
    
    if (botStatus.error) {
      return <span className="status-error">Error de conexión</span>
    }
    
    if (botStatus.isInGuild) {
      return (
        <div className="status-connected">
          <span className="status-indicator connected"></span>
          Bot conectado
          {!botStatus.hasPermissions && (
            <span className="permission-warning">⚠️ Sin permisos</span>
          )}
        </div>
      )
    }
    
    return <span className="status-disconnected">Bot no está en el servidor</span>
  }

  const getActionButton = () => {
    if (botStatus.checking) {
      return (
        <button disabled className="btn-checking">
          Verificando...
        </button>
      )
    }
    
    if (botStatus.error) {
      return (
        <button onClick={checkBotStatus} className="btn-retry">
          Reintentar
        </button>
      )
    }
    
    if (botStatus.isInGuild) {
      return (
        <button onClick={() => window.location.href = `/dashboard/${server.id}`} className="btn-dashboard">
          Abrir Dashboard
        </button>
      )
    }
    
    return (
      <button onClick={handleInviteBot} className="btn-invite">
        Invitar Bot
      </button>
    )
  }

  return (
    <div className="server-card">
      <div className="server-icon">
        {server.icon ? (
          <img 
            src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`} 
            alt={server.name}
          />
        ) : (
          <div className="default-icon">
            {server.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="server-info">
        <h3 className="server-name">{server.name}</h3>
        <p className="server-id">ID: {server.id}</p>
        
        <div className="server-status">
          {getStatusDisplay()}
        </div>
      </div>
      
      <div className="server-actions">
        {getActionButton()}
      </div>
    </div>
  )
}

export default ServerCard