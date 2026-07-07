import { useState } from 'react'
import { Bot } from 'lucide-react'

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const resp = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()
      if (!resp.ok) { setError(data.error || 'Error al iniciar sesión.'); return }
      localStorage.setItem('tecsis_token', data.token)
      onLogin(data.token)
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f4f5f7' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
            <Bot size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TecSis-IA</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Panel Docente · DDS TECSUP</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold text-gray-900 mb-5">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,0,0,0.6)' }}>Correo institucional</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="usuario@tecsup.edu.pe" required autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1px solid rgba(0,0,0,0.15)', background: '#fafafa', color: '#111' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(0,0,0,0.6)' }}>Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1px solid rgba(0,0,0,0.15)', background: '#fafafa', color: '#111' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
              />
            </div>
            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(0,0,0,0.3)' }}>
          Sistema de gestión de tesis · Ciclo 2024-C
        </p>
      </div>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default LoginScreen
