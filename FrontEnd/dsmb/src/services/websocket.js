const WEBSOCKET_URL = 'ws://localhost:8080'

class WebSocketService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.listeners = new Map()
  }

  connect() {
    try {
      this.ws = new WebSocket(WEBSOCKET_URL)
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onclose = () => {
        console.log('WebSocket desconectado')
        this.isConnected = false
        this.emit('disconnected')
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.emit('message', message)
          
          // Emitir eventos específicos por tipo
          if (message.type) {
            this.emit(message.type, message.data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Error al conectar WebSocket:', error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }

  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket no está conectado')
    }
  }

  // Solicitar información del servidor
  requestServerInfo(serverId) {
    this.send({
      type: 'GET_SERVER_INFO',
      serverId: serverId
    })
  }

  // Solicitar estado del bot en servidores
  requestBotStatus(serverIds) {
    this.send({
      type: 'GET_BOT_STATUS',
      serverIds: serverIds
    })
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => {
        this.connect()
      }, 2000 * this.reconnectAttempts)
    }
  }

  // Sistema de eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket listener:', error)
        }
      })
    }
  }
}

// Instancia singleton
const websocketService = new WebSocketService()
export default websocketService