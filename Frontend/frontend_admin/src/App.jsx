import { useCallback, useEffect, useState } from 'react'
import { Bot, FolderOpen, History, LogOut, MessageSquare, Plus, Settings, Trash2, GitCompare, LayoutDashboard, Search, Moon, Sun, Bell } from 'lucide-react'
import { Component } from 'react'

import { apiFetch } from './services/api'
import DashboardChatView from './views/DashboardChatView'
import DashboardHomeView from './views/DashboardHomeView'
import HistorialView from './views/HistorialView'
import LoginScreen from './views/LoginScreen'
import PerfilView from './views/PerfilView'
import ProyectosView from './views/ProyectosView'
import ComparadorView from './views/ComparadorView'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat RAG', icon: MessageSquare },
  { id: 'historial', label: 'Historial de Análisis', icon: History },
  { id: 'proyectos', label: 'Proyectos C24', icon: FolderOpen },
  { id: 'comparador', label: 'Comparador de Tesis', icon: GitCompare },
]

class ViewErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, retryKey: 0 }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.viewKey !== this.props.viewKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#f8fafc' }} role="alert">
          <div className="max-w-md w-full rounded-2xl p-7 text-center" style={{ background: '#fff', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
            <div className="text-2xl mb-3">⚠️</div>
            <h1 className="text-lg font-bold text-slate-800">No se pudo mostrar esta vista</h1>
            <p className="mt-2 text-sm text-slate-500">La aplicación sigue disponible. Puedes reintentar o abrir otra sección desde el menú.</p>
            <button onClick={() => this.setState(state => ({ hasError: false, retryKey: state.retryKey + 1 }))}
              className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: '#4f46e5', color: '#fff' }}>
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return <div key={this.state.retryKey} className="flex-1 flex flex-col min-h-0">{this.props.children}</div>
  }
}

export default function App() {
  const [token, setToken]       = useState(() => localStorage.getItem('tecsis_token') || '')
  const [metrics, setMetrics]   = useState(null)
  const [perfil, setPerfil]     = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [theme, setTheme] = useState('dark')

  const [conversaciones, setConversaciones] = useState([])
  const [activeConv, setActiveConv]         = useState(null)   // id | null (chat nuevo)

  const handleLogin = (newToken) => setToken(newToken)

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light')

  useEffect(() => {
    localStorage.setItem('tecsis_theme', theme)
  }, [theme])

  const handleLogout = useCallback(() => {
    apiFetch('/api/auth/logout/', { method: 'POST' }).catch(() => {})
    localStorage.removeItem('tecsis_token')
    setToken('')
    setPerfil(null)
    setConversaciones([])
    setActiveConv(null)
  }, [])

  const loadConversaciones = useCallback(() => {
    apiFetch('/api/conversaciones/')
      .then(r => { if (r.status === 401) { handleLogout(); throw new Error() } return r.json() })
      .then(d => setConversaciones(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [handleLogout])

  useEffect(() => {
    if (!token) return
    apiFetch('/api/dashboard/metrics/')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setMetrics(data))
      .catch(() => setMetrics({ total_tesis: 70, aprobadas: 50, en_revision: 20 }))
  }, [token])

  useEffect(() => {
    if (!token) return
    apiFetch('/api/perfil/')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setPerfil(d))
      .catch(() => {})
  }, [token])

  useEffect(() => { if (token) loadConversaciones() }, [token, loadConversaciones])

  if (!token) return <LoginScreen onLogin={handleLogin} />

  const handleNuevaConsulta = () => {
    setActiveConv(null)
    setActiveNav('chat')
  }

  const handleAbrirConversacion = (id) => {
    setActiveConv(id)
    setActiveNav('chat')
  }

  // Cuando el chat crea/usa una conversación, refresca la lista del sidebar
  const handleConversation = (id) => {
    setActiveConv(id)
    // También se refresca al continuar un chat existente: su updated_at cambia
    // y debe subir al inicio de la lista lateral.
    loadConversaciones()
  }

  const handleEliminarConversacion = (id, e) => {
    e.stopPropagation()
    apiFetch(`/api/conversaciones/${id}/`, { method: 'DELETE' })
      .then(() => {
        setConversaciones(prev => prev.filter(c => c.id !== id))
        if (activeConv === id) setActiveConv(null)
      })
      .catch(() => {})
  }

  const sidebarInitials = perfil?.nombre
    ? perfil.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'JG'
  const sidebarNombre = perfil?.nombre
    ? perfil.nombre.split(' ').slice(0, 3).join(' ')
    : 'Prof. Jaime Gomez'
  const sidebarRol = perfil?.rol
    ? perfil.rol.charAt(0).toUpperCase() + perfil.rol.slice(1)
    : 'Docente'

  return (
    <div className={`flex h-screen overflow-hidden academic-grid ${theme === 'dark' ? 'theme-dark' : ''}`}
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: theme === 'dark' ? '#07111f' : '#f5f7fb', color: theme === 'dark' ? '#e5eefc' : '#17233c' }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col border-r flex-shrink-0 shadow-[10px_0_35px_rgba(30,41,59,0.04)]"
        style={{ width: '248px', background: theme === 'dark' ? 'rgba(9,22,40,.94)' : 'rgba(255,255,255,0.92)', borderColor: theme === 'dark' ? 'rgba(56,189,248,.14)' : '#e6eaf2', backdropFilter: 'blur(18px)' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(148,163,184,.12)' : '#edf0f6' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', color: '#fff', boxShadow: '0 8px 18px rgba(79,70,229,.25)' }}>
              <Bot size={16} />
            </div>
            <div>
              <div className="text-sm font-bold leading-none" style={{ color: theme === 'dark' ? '#e0f2fe' : '#172554' }}>TecSis<span style={{ color: theme === 'dark' ? '#22d3ee' : '#6366f1' }}>•</span>IA</div>
              <div className="text-[10px] mt-1 uppercase tracking-[0.16em] font-semibold" style={{ color: '#94a3b8' }}>Academic Studio</div>
            </div>
          </div>
        </div>

        {/* New Query */}
        <div className="px-4 pt-5 pb-3">
          <button onClick={handleNuevaConsulta}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors font-medium"
            style={{ background: 'linear-gradient(135deg, #4338ca, #6d28d9)', color: '#fff', boxShadow: '0 8px 16px rgba(79,70,229,.2)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Plus size={15} /> Nueva consulta RAG
          </button>
        </div>

        {/* Nav */}
        <nav className="px-4 py-1 space-y-1 flex-shrink-0">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id && (id !== 'dashboard' || activeConv === null)
            return (
              <button key={id} onClick={() => { setActiveNav(id); if (id === 'dashboard') setActiveConv(null) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? (theme === 'dark' ? 'rgba(8,145,178,.18)' : '#eef2ff') : 'transparent',
                  color: active ? (theme === 'dark' ? '#67e8f9' : '#4338ca') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = theme === 'dark' ? '#e2e8f0' : '#334155'; e.currentTarget.style.background = theme === 'dark' ? 'rgba(148,163,184,.08)' : '#f8fafc' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = theme === 'dark' ? '#94a3b8' : '#64748b'; e.currentTarget.style.background = 'transparent' } }}>
                <Icon size={14} />
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />}
              </button>
            )
          })}
        </nav>

        {/* Historial de chats */}
        <div className="flex-1 overflow-y-auto px-4 mt-5 tecsis-scrollbar min-h-0">
          {conversaciones.length > 0 && (
            <div className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1.5"
              style={{ color: '#94a3b8' }}>Conversaciones recientes</div>
          )}
          <div className="space-y-0.5">
            {conversaciones.map(c => {
              const active = activeNav === 'dashboard' && activeConv === c.id
              return (
                <div key={c.id} onClick={() => handleAbrirConversacion(c.id)}
                  className="group w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{ background: active ? (theme === 'dark' ? 'rgba(8,145,178,.18)' : '#eef2ff') : 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme === 'dark' ? 'rgba(148,163,184,.08)' : '#f8fafc' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <MessageSquare size={13} className="flex-shrink-0"
                    style={{ color: active ? (theme === 'dark' ? '#22d3ee' : '#6366f1') : '#94a3b8' }} />
                  <span className="flex-1 min-w-0 truncate text-xs"
                    style={{ color: active ? (theme === 'dark' ? '#67e8f9' : '#4338ca') : (theme === 'dark' ? '#cbd5e1' : '#64748b') }}>{c.titulo}</span>
                  <button onClick={e => handleEliminarConversacion(c.id, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                    style={{ color: '#cbd5e1' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Avatar */}
        <div className="p-4 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(148,163,184,.12)' : '#edf0f6' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors"
            style={{ cursor: 'default', background: theme === 'dark' ? 'rgba(148,163,184,.07)' : '#f8fafc', border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,.12)' : '#edf0f6'}` }}
            onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(148,163,184,.12)' : '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(148,163,184,.07)' : '#f8fafc'}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', color: '#fff', boxShadow: '0 3px 10px rgba(79,70,229,.2)' }}>{sidebarInitials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold leading-none truncate" style={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }}>{sidebarNombre}</div>
              <div className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>{sidebarRol} · DDS</div>
            </div>
            <div className="flex gap-0.5">
              <button onClick={() => setActiveNav('perfil')}
                className="flex-shrink-0 p-1.5 rounded-md transition-all"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.color = '#4338ca' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}>
                <Settings size={14} />
              </button>
              <button onClick={handleLogout} title="Cerrar sesión"
                className="flex-shrink-0 p-1.5 rounded-md transition-all"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16">
        <header className="fixed top-0 right-0 left-[248px] z-50 h-16 flex items-center justify-between px-6 border-b" style={{ background: theme === 'dark' ? 'rgba(8,20,37,.96)' : 'rgba(255,255,255,.94)', borderColor: theme === 'dark' ? 'rgba(56,189,248,.12)' : '#e8ecf3', backdropFilter: 'blur(16px)' }}>
          <label className="hidden md:flex items-center gap-2.5 w-full max-w-md px-3.5 py-2 rounded-xl" style={{ background: theme === 'dark' ? 'rgba(15,35,60,.9)' : '#f6f8fc', border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,.15)' : '#e8ecf3'}` }}>
            <Search size={15} style={{ color: theme === 'dark' ? '#38bdf8' : '#94a3b8' }} />
            <input className="w-full bg-transparent outline-none text-xs" placeholder="Buscar en el repositorio académico..." style={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }} />
          </label>
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: theme === 'dark' ? 'rgba(6,182,212,.12)' : '#ecfdf5', color: theme === 'dark' ? '#67e8f9' : '#059669' }}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{metrics?.total_tesis ?? 20} tesis</span>
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} className="p-2 rounded-xl transition-colors" style={{ color: theme === 'dark' ? '#67e8f9' : '#4f46e5', background: theme === 'dark' ? 'rgba(8,145,178,.15)' : '#eef2ff' }}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="hidden sm:flex p-2 rounded-xl" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}><Bell size={16} /></button>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col academic-view">
        <ViewErrorBoundary viewKey={`${activeNav}-${activeConv ?? 'nueva'}`}>
          {activeNav === 'dashboard' && <DashboardHomeView metrics={metrics} theme={theme} onOpenChat={handleNuevaConsulta} />}
          {activeNav === 'chat' && <DashboardChatView metrics={metrics} userInitials={sidebarInitials} conversacionId={activeConv} onConversation={handleConversation} />}
          {activeNav === 'historial' && <HistorialView />}
          {activeNav === 'proyectos' && <ProyectosView metrics={metrics} />}
          {activeNav === 'comparador' && <ComparadorView />}
          {activeNav === 'perfil'    && <PerfilView />}
        </ViewErrorBoundary>
        </div>
      </main>
    </div>
  )
}

