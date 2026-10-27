import { useState } from 'react'
import { Bot, ArrowRight, Database, Shield, Zap, Sparkles } from 'lucide-react'

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
    <div className="flex min-h-screen w-full" style={{ fontFamily: "Inter, system-ui, sans-serif", background: '#061525' }}>
      
      {/* ── PANEL IZQUIERDO (DARK) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #312e81 0%, #4338ca 48%, #6d28d9 100%)' }}>
        
        {/* Decoraciones abstractas */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: '#c4b5fd' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: '#bfdbfe' }} />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.42) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: '#fff', color: '#4f46e5' }}>
            <Bot size={22} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TecSis<span className="text-violet-200">•</span>IA</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full text-xs font-semibold text-violet-100"
            style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)' }}>
            <Sparkles size={13} /> Academic Studio · DDS
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-[1.08] tracking-tight">
            Tu repositorio académico, ahora más inteligente.
          </h1>
          <p className="text-lg text-indigo-100 leading-relaxed mb-10 max-w-xl">
            Consulta, organiza y analiza proyectos de tesis con evidencia verificable y una experiencia pensada para docentes.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: Database, title: 'Repositorio Centralizado', desc: 'Acceso instantáneo a todas las tesis de DDS.' },
              { icon: Zap,      title: 'Motor RAG Local', desc: 'Consultas en lenguaje natural sin comprometer privacidad.' },
              { icon: Shield,   title: 'Análisis de Similitud', desc: 'Detección automática de superposición entre proyectos.' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.14)', color: '#ddd6fe' }}>
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-indigo-200">
          <span>TECSUP - Diseño y Desarrollo de Software</span>
          <span>Ciclo Académico 2024-C</span>
        </div>
      </div>

      {/* ── PANEL DERECHO (LOGIN FORM) ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,.14), transparent 22rem)' }}>
        <div className="w-full max-w-[430px] rounded-[28px] p-7 sm:p-9" style={{ background: 'rgba(9,27,47,.94)', border: '1px solid rgba(34,211,238,.22)', boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
          
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)', color: '#fff' }}><Bot size={21} /></div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] mb-3" style={{ color: '#22d3ee' }}>Panel docente</p>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Accede a tu cuenta</h2>
            <p className="text-sm" style={{ color: '#9fb1ca' }}>
              Ingresa con tus credenciales de docente para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#c5d3e8' }}>
                Correo Institucional
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="usuario@tecsup.edu.pe" required autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
                style={{ border: '1.5px solid rgba(148,163,184,.18)', background: '#10233a', color: '#e2e8f0' }}
                onFocus={e => { e.target.style.borderColor = '#22d3ee'; e.target.style.boxShadow = '0 0 0 4px rgba(6,182,212,.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,.18)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#c5d3e8' }}>
                Contraseña
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
                style={{ border: '1.5px solid rgba(148,163,184,.18)', background: '#10233a', color: '#e2e8f0' }}
                onFocus={e => { e.target.style.borderColor = '#22d3ee'; e.target.style.boxShadow = '0 0 0 4px rgba(6,182,212,.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,.18)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <Shield size={16} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mt-4 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#0ea5e9)', color: '#fff', boxShadow: '0 8px 18px rgba(6,182,212,.25)' }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,182,212,.42)' }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.boxShadow = '0 4px 14px rgba(6,182,212,.25)' }}>
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
              {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
          <p className="text-center text-[11px] mt-7" style={{ color: '#6f89aa' }}>Acceso seguro · Repositorio académico TECSUP</p>

        </div>
      </div>

    </div>
  )
}

export default LoginScreen
