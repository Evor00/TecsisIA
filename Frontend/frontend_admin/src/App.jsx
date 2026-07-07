import { useCallback, useEffect, useState } from 'react'
import { Bot, FolderOpen, History, LogOut, MessageSquare, Plus, Settings, Trash2 } from 'lucide-react'

import { apiFetch } from './services/api'
import DashboardChatView from './views/DashboardChatView'
import HistorialView from './views/HistorialView'
import LoginScreen from './views/LoginScreen'
import PerfilView from './views/PerfilView'
import ProyectosView from './views/ProyectosView'

const NAV_ITEMS = [
  { id: 'historial', label: 'Historial de Análisis', icon: History },
  { id: 'proyectos', label: 'Proyectos C24', icon: FolderOpen },
]

export default function App() {
  const [token, setToken]       = useState(() => localStorage.getItem('tecsis_token') || '')
  const [metrics, setMetrics]   = useState(null)
  const [perfil, setPerfil]     = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')

  const [conversaciones, setConversaciones] = useState([])
  const [activeConv, setActiveConv]         = useState(null)   // id | null (chat nuevo)

  const handleLogin = (newToken) => setToken(newToken)

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
    setActiveNav('dashboard')
  }

  const handleAbrirConversacion = (id) => {
    setActiveConv(id)
    setActiveNav('dashboard')
  }

  // Cuando el chat crea/usa una conversación, refresca la lista del sidebar
  const handleConversation = (id) => {
    const esNueva = id !== activeConv
    setActiveConv(id)
    if (esNueva) loadConversaciones()
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
    <div className="flex h-screen overflow-hidden text-gray-900"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f4f5f7' }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col border-r flex-shrink-0"
        style={{ width: '210px', background: '#ffffff', borderColor: 'rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
              <Bot size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">TecSis-IA</div>
              <div className="text-[11px] mt-0.5 leading-none" style={{ color: 'rgba(0,0,0,0.4)' }}>Panel Docente</div>
            </div>
          </div>
        </div>

        {/* New Query */}
        <div className="p-3">
          <button onClick={handleNuevaConsulta}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors font-medium"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: '1px solid rgba(99,102,241,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Plus size={15} /> Nueva consulta RAG
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 space-y-0.5 flex-shrink-0">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id && (id !== 'dashboard' || activeConv === null)
            return (
              <button key={id} onClick={() => { setActiveNav(id); if (id === 'dashboard') setActiveConv(null) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: active ? '#4338ca' : 'rgba(0,0,0,0.45)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(0,0,0,0.75)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(0,0,0,0.45)' }}>
                <Icon size={14} />
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />}
              </button>
            )
          })}
        </nav>

        {/* Historial de chats */}
        <div className="flex-1 overflow-y-auto px-3 mt-3 tecsis-scrollbar min-h-0">
          {conversaciones.length > 0 && (
            <div className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1.5"
              style={{ color: 'rgba(0,0,0,0.3)' }}>Conversaciones</div>
          )}
          <div className="space-y-0.5">
            {conversaciones.map(c => {
              const active = activeNav === 'dashboard' && activeConv === c.id
              return (
                <div key={c.id} onClick={() => handleAbrirConversacion(c.id)}
                  className="group w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{ background: active ? 'rgba(99,102,241,0.12)' : 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <MessageSquare size={13} className="flex-shrink-0"
                    style={{ color: active ? '#4338ca' : 'rgba(0,0,0,0.35)' }} />
                  <span className="flex-1 min-w-0 truncate text-xs"
                    style={{ color: active ? '#4338ca' : 'rgba(0,0,0,0.6)' }}>{c.titulo}</span>
                  <button onClick={e => handleEliminarConversacion(c.id, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                    style={{ color: 'rgba(0,0,0,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.3)'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Avatar */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
            style={{ cursor: 'default' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', color: '#fff' }}>{sidebarInitials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-none truncate" style={{ color: 'rgba(0,0,0,0.8)' }}>{sidebarNombre}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.3)' }}>{sidebarRol} · DDS</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setActiveNav('perfil')}
                className="flex-shrink-0 p-1 rounded-md transition-colors"
                style={{ color: 'rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'rgba(0,0,0,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.3)' }}>
                <Settings size={13} />
              </button>
              <button onClick={handleLogout} title="Cerrar sesión"
                className="flex-shrink-0 p-1 rounded-md transition-colors"
                style={{ color: 'rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.3)' }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeNav === 'dashboard' && <DashboardChatView metrics={metrics} userInitials={sidebarInitials} conversacionId={activeConv} onConversation={handleConversation} />}
        {activeNav === 'historial' && <HistorialView />}
        {activeNav === 'proyectos' && <ProyectosView metrics={metrics} />}
        {activeNav === 'perfil'    && <PerfilView />}
      </main>
    </div>
  )
}
