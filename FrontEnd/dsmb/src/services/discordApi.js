//FINAL.W.1
import { getStoredToken } from '../utils/auth'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

// Obtener información del usuario actual
//FINAL.PER.1
export async function getCurrentUser() {
  const token = getStoredToken()
  if (!token) throw new Error('No hay token disponible')

  console.log('Obteniendo información del usuario...')

  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    console.error('Error al obtener usuario:', response.status)
    if (response.status === 401) {
      // Token inválido, limpiar datos
      localStorage.removeItem('discord_token')
      localStorage.removeItem('discord_user')
      throw new Error('Token expirado')
    }
    throw new Error(`Error al obtener información del usuario: ${response.status}`)
  }

  return response.json()
}

// Obtener servidores del usuario
//FINAL.PER.2
export async function getUserGuilds({ signal } = {}) {
  const token = getStoredToken()
  if (!token) throw new Error('No hay token disponible')

  console.log('Obteniendo servidores del usuario...')

  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, { //Endpoint
      headers: { 'Authorization': `Bearer ${token}` },
      signal,
    })

    if (response.status === 401) {
      localStorage.removeItem('discord_token')
      localStorage.removeItem('discord_user')
      throw new Error('Token expirado')
    }

    if (response.status === 429) {
      const data = await response.json()
      const retryAfter = data.retry_after || 5
      console.warn(`Rate limitado. Reintentando en ${retryAfter} segundos...`)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      return getUserGuilds({ signal }) // reintentar automáticamente
    }

    if (!response.ok) {
      throw new Error(`Error al obtener los servidores: ${response.status}`)
    }

    return response.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Request de servidores abortada')
      return []
    }
    console.error('Error al obtener servidores:', err)
    throw err
  }
}
//////////////////////////////FIN W1//////////////////////////////////

// Intercambiar código por token de acceso
export async function exchangeCodeForToken(code) {
  const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
  const CLIENT_SECRET = import.meta.env.VITE_DISCORD_CLIENT_SECRET
  const REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI || 'http://localhost:5173/callback'

  console.log('Intercambiando código por token...', { CLIENT_ID: CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO' })

  //FINAL.PER.3
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI, //Para validar que Discord coincida con lo configurado
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Error al obtener token:', response.status, errorData)
    throw new Error(`Error al obtener el token de acceso: ${response.status}`)
  }

  return response.json()
}