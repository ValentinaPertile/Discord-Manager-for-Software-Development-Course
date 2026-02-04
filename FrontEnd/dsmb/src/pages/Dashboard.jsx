import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import websocketService from '../services/websocket'
import './Dashboard.css'
const Dashboard = () => {
  const { serverId } = useParams()
  const [serverInfo, setServerInfo] = useState({
    loading: true,
    found: false,
    name: '',
    memberCount: 0,
    channelCount: 0,
    roleCount: 0,
    channels: {
      text: 0,
      voice: 0,
      category: 0,
      total: 0
    },
    roles: {
      total: 0,
      list: []
    },
    todayLogs: 0
  })
  
  const [auditLogs, setAuditLogs] = useState([])

  // Usar useCallback para evitar recrear la función en cada render
  const requestServerInfo = useCallback(() => {
    if (websocketService.isConnected) {
      websocketService.requestServerInfo(serverId)
      websocketService.requestBotStatus([serverId])
    } else {
      websocketService.connect()
      const onConnected = () => {
        setTimeout(() => {
          websocketService.requestServerInfo(serverId)
          websocketService.requestBotStatus([serverId])
        }, 1000)
        websocketService.off('connected', onConnected)
      }
      websocketService.on('connected', onConnected)
    }
  }, [serverId])

  useEffect(() => {
    // Solicitar información del servidor
    requestServerInfo()
    
    // Escuchar actualizaciones del WebSocket
    const handleServerInfo = (data) => {
      if (data.serverId === serverId) {
        if (data.found) {
          setServerInfo(prev => ({
            ...prev,
            loading: false,
            found: true,
            name: data.name,
            memberCount: data.memberCount,
            channelCount: data.channelCount || data.channels?.total || 0,
            roleCount: data.roleCount || data.roles?.total || 0,
            channels: data.channels || {
              text: 0,
              voice: 0,
              category: 0,
              total: data.channelCount || 0
            },
            roles: data.roles || {
              total: data.roleCount || 0,
              list: []
            }
          }))
        } else {
          setServerInfo(prev => ({
            ...prev,
            loading: false,
            found: false
          }))
        }
      }
    }
    
    const handleAuditLog = (data) => {
      if (data.serverId === serverId) {
        setAuditLogs(prev => {
          // Evitar duplicados verificando si ya existe un log con el mismo timestamp y acción
          const isDuplicate = prev.some(log => 
            log.timestamp === data.timestamp && 
            log.action === data.action && 
            log.executor === data.executor
          )
          
          if (isDuplicate) {
            return prev // No agregar duplicados
          }
          
          const newLogs = [data, ...prev].slice(0, 50)
          
          // Actualizar contador de logs de hoy usando los logs actualizados
          const today = new Date().toDateString()
          const todayLogsCount = newLogs.filter(log => {
            const logDate = new Date(log.timestamp)
            return logDate.toDateString() === today
          }).length
          
          // Actualizar el contador de logs de hoy
          setServerInfo(prevInfo => ({
            ...prevInfo,
            todayLogs: todayLogsCount
          }))
          
          return newLogs
        })
      }
    }
    
    const handleBotStatusResponse = (data) => {
      if (data[serverId]) {
        const serverData = data[serverId]
        if (serverData.isInGuild) {
          setServerInfo(prev => ({
            ...prev,
            loading: false,
            found: true,
            memberCount: serverData.memberCount || prev.memberCount,
            channelCount: serverData.channelCount || serverData.channels?.total || prev.channelCount,
            roleCount: serverData.roleCount || prev.roleCount,
            channels: serverData.channels || prev.channels
          }))
        }
      }
    }
    
    // Registrar listeners
    websocketService.on('SERVER_INFO', handleServerInfo)
    websocketService.on('AUDIT_LOG', handleAuditLog)
    websocketService.on('BOT_STATUS_RESPONSE', handleBotStatusResponse)
    
    // Cleanup
    return () => {
      websocketService.off('SERVER_INFO', handleServerInfo)
      websocketService.off('AUDIT_LOG', handleAuditLog)
      websocketService.off('BOT_STATUS_RESPONSE', handleBotStatusResponse)
    }
  }, [serverId, requestServerInfo]) // Incluir requestServerInfo como dependencia
  
  if (serverInfo.loading) {
    return (
      <div className="dashboard-loading">
        <h2>Cargando información del servidor...</h2>
      </div>
    )
  }
  
  if (!serverInfo.found) {
    return (
      <div className="dashboard-error">
        <h2>Servidor no encontrado</h2>
        <p>El bot no está en este servidor o no tiene los permisos necesarios.</p>
      </div>
    )
  }
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{serverInfo.name}</h1>
        <p>ID: {serverId}</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Miembros</h3>
            <div className="stat-number">{serverInfo.memberCount}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Canales</h3>
            <div className="stat-number">{serverInfo.channelCount}</div>
            <div className="stat-details">
              <small>
                Texto: {serverInfo.channels.text} | 
                Voz: {serverInfo.channels.voice} | 
                Categorías: {serverInfo.channels.category}
              </small>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎭</div>
          <div className="stat-content">
            <h3>Roles</h3>
            <div className="stat-number">{serverInfo.roleCount}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Logs Hoy</h3>
            <div className="stat-number">{serverInfo.todayLogs}</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="recent-logs">
          <h2>Logs Recientes</h2>
          {auditLogs.length > 0 ? (
            <div className="logs-list">
              {auditLogs.slice(0, 10).map((log, index) => (
                <div key={`${log.timestamp}-${index}`} className="log-item">
                  <div className="log-header">
                    <span className="log-action">{log.action}</span>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="log-details">
                    <div className="log-executor">
                      <strong>Ejecutado por:</strong> {log.executor}
                    </div>
                    {log.target && (
                      <div className="log-target">
                        <strong>Objetivo:</strong> {log.target}
                      </div>
                    )}
                    {log.reason && log.reason !== 'No especificada' && (
                      <div className="log-reason">
                        <strong>Razón:</strong> {log.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay logs recientes disponibles</p>
          )}
        </div>
        
        {serverInfo.roles.list.length > 0 && (
          <div className="roles-preview">
            <h2>Roles del Servidor</h2>
            <div className="roles-list">
              {serverInfo.roles.list.map(role => (
                <div 
                  key={role.id} 
                  className="role-item"
                  style={{ borderLeft: `4px solid ${role.color}` }}
                >
                  {role.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard