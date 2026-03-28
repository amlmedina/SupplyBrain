import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import AuthPage from './pages/AuthPage.jsx'
import SupplyBrain from './App.jsx'

function AppRouter() {
  const { user, loading, isDemoMode } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#888' }}>Cargando...</p></div>
  if (isDemoMode || user) return <SupplyBrain />
  return <AuthPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider><AppRouter /></AuthProvider>
  </React.StrictMode>
)
