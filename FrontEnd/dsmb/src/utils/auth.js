//FINAL.PER.4
import { exchangeCodeForToken, getCurrentUser } from '../services/discordApi'

// Guardar token en localStorage
export function storeToken(token) {
  localStorage.setItem('discord_token', token)
}

// Obtener token de localStorage
export function getStoredToken() {
  return localStorage.getItem('discord_token')
}

// Guardar información del usuario
export function storeUser(user) {
  localStorage.setItem('discord_user', JSON.stringify(user))
}

// Obtener información del usuario
export function getStoredUser() {
  const user = localStorage.getItem('discord_user')
  return user ? JSON.parse(user) : null
}

// Limpiar datos de autenticación
export function logout() {
  localStorage.removeItem('discord_token')
  localStorage.removeItem('discord_user')
}

// Manejar callback de Discord OAuth2
//FINAL.PER.5
export async function handleDiscordCallback(code, setUser) {
  try {
    console.log('Iniciando proceso de autenticación...')
    
    // Verificar si ya hay un token válido
    const existingToken = getStoredToken()
    const existingUser = getStoredUser()
    
    if (existingToken && existingUser) {
      console.log('Ya existe una sesión válida')
      setUser(existingUser)
      return
    }
    
    // Intercambiar código por token
    const tokenData = await exchangeCodeForToken(code)
    console.log('Token obtenido exitosamente')
    
    storeToken(tokenData.access_token)

    // Obtener información del usuario
    const userData = await getCurrentUser()
    console.log('Datos de usuario obtenidos:', userData.username)
    
    storeUser(userData)
    setUser(userData)
    
    console.log('Autenticación completada')
    
  } catch (error) {
    console.error('Error en autenticación:', error)
    
    // Limpiar datos en caso de error
    logout()
    
    // Mostrar error específico
    if (error.message.includes('400')) {
      alert('Error de configuración. Verifica que tu Client ID y Client Secret estén correctos.')
    } else if (error.message.includes('Token expirado')) {
      alert('Tu sesión ha expirado. Inicia sesión de nuevo.')
      window.location.reload()
    } else {
      alert('Error al iniciar sesión con Discord: ' + error.message)
    }
  }
}