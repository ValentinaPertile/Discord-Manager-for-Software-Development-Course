import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/NavBar'
import Servidores from './pages/Servidores'
import AboutUs from './pages/AboutUs'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard' 
import { getStoredToken, getStoredUser } from './utils/auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un token y usuario guardado
    const token = getStoredToken()
    const storedUser = getStoredUser()
    
    if (token && storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <Router>
      <div className="app">
        {/* Navbar siempre visible */}
        <Navbar user={user} setUser={setUser} />
        
        <main className="main-content">
          {user ? (
            // Rutas para usuarios autenticados
            <Routes>
              <Route path="/" element={<Navigate to="/servidores" />} />
              <Route path="/servidores" element={<Servidores />} />
              <Route path="/dashboard/:serverId" element={<Dashboard />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="*" element={<Navigate to="/servidores" />} />
            </Routes>
          ) : (
            // Rutas para usuarios no autenticados
            <Routes>
              <Route path="/" element={<Login setUser={setUser} />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/callback" element={<Login setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  )
}

export default App