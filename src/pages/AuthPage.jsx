import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function AuthPage() {
  const { signIn, signUp, isDemoMode } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return }
      const { error } = await signUp(email, password, empresa)
      if (error) setError(error.message)
      else setSuccess('Cuenta creada. Revisa tu email para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa', fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 12, border: '1px solid #e8e9ed', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1a8a5c, #2471a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>S</div>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#1a1a2e', letterSpacing: '-0.02em' }}>Supply Brain</span>
          </div>
          <p style={{ fontSize: 13, color: '#888' }}>Inventario inteligente para tu negocio</p>
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#f7f8fa', borderRadius: 8, padding: 3 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#1a1a2e' : '#888', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>
        <div onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}>
          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Nombre de tu empresa</label>
              <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej: Cosméticos Naturales" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 12, padding: '8px 12px', background: '#fdedec', borderRadius: 6 }}>{error}</p>}
          {success && <p style={{ fontSize: 12, color: '#1a8a5c', marginBottom: 12, padding: '8px 12px', background: '#eafaf1', borderRadius: 6 }}>{success}</p>}
          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', background: '#1a1a2e', color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>
        {isDemoMode && (
          <div style={{ marginTop: 16, padding: 12, background: '#FEF9E7', borderRadius: 8, border: '1px solid #F39C1240' }}>
            <p style={{ fontSize: 11, color: '#8B6914', lineHeight: 1.5 }}><strong>Modo demo activo.</strong> Para conectar Supabase, agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env</p>
          </div>
        )}
      </div>
    </div>
  )
}
