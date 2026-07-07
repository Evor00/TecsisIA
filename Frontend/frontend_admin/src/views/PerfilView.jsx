import { useEffect, useState } from 'react'
import { Bell, BookMarked, CheckCircle2, ChevronRight, FileText, FolderOpen, Globe, Shield, TrendingUp, User, XCircle } from 'lucide-react'
import { apiFetch } from '../services/api'
import { PageBreadcrumb } from '../components/common'

const PERFIL_FALLBACK = {
  nombre: 'Jaime Gomez Quispe',
  correo: 'j.gomez@tecsis.edu.pe',
  departamento: 'Ing. de Software',
  codigo: 'DOC-2024-047',
  rol: 'docente',
  bio: 'Docente de la carrera de Diseño y Desarrollo de Software con especialización en arquitectura de sistemas distribuidos y análisis semántico de documentos académicos.',
  stats: { consultas_rag: 0, proyectos_revisados: 0, alertas_emitidas: 0, tesis_indexadas: 0 },
}

function PerfilView() {
  const [activeTab, setActiveTab] = useState('info')
  const [form, setForm]           = useState(PERFIL_FALLBACK)
  const [original, setOriginal]   = useState(PERFIL_FALLBACK)
  const [stats, setStats]         = useState(PERFIL_FALLBACK.stats)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null) // { type: 'ok'|'err', msg }

  useEffect(() => {
    apiFetch('/api/perfil/')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        const { stats: s, ...fields } = d
        setForm(fields)
        setOriginal(fields)
        if (s) setStats(s)
      })
      .catch(() => {})
  }, [])

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/perfil/', {
        method: 'PATCH',
        body: JSON.stringify({
          nombre:       form.nombre,
          correo:       form.correo,
          departamento: form.departamento,
          bio:          form.bio,
        }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      const { stats: s, ...fields } = d
      setForm(fields)
      setOriginal(fields)
      if (s) setStats(s)
      showToast('ok', 'Cambios guardados correctamente')
    } catch {
      showToast('err', 'No se pudo guardar. Verifica la conexión.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => setForm(original)

  const initials = form.nombre
    ? form.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'JG'

  const subTabs = [
    { id: 'info',  label: 'Información Personal', icon: User },
    { id: 'sys',   label: 'Sistema',               icon: Globe },
  ]

  const statCards = [
    { value: stats.consultas_rag,       label: 'Consultas RAG',      color: '#818cf8', icon: TrendingUp },
    { value: stats.proyectos_revisados, label: 'Proyectos revisados', color: '#4ade80', icon: FolderOpen },
    { value: stats.alertas_emitidas,   label: 'Alertas emitidas',   color: '#fbbf24', icon: Bell },
    { value: stats.tesis_indexadas,    label: 'Tesis indexadas',    color: '#a78bfa', icon: BookMarked },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={User} label="Perfil" />

      {/* Toast */}
      {toast && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-lg"
          style={{
            background: toast.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'ok' ? '#4ade80' : '#f87171',
          }}>
          {toast.type === 'ok' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col p-5 gap-4 overflow-y-auto tecsis-scrollbar flex-shrink-0"
          style={{ width: '260px', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
          {/* Avatar */}
          <div className="rounded-xl p-5 flex flex-col items-center gap-2 text-center"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>{initials}</div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{form.nombre}</div>
              <div className="text-xs mt-0.5 capitalize" style={{ color: 'rgba(0,0,0,0.4)' }}>{form.rol}</div>
            </div>
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Activo
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {statCards.map(({ value, label, color, icon: Icon }) => (
              <div key={label} className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={11} style={{ color }} />
                </div>
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Sub-nav */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            {subTabs.map((tab, i) => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.02)',
                    color: active ? '#a5b4fc' : 'rgba(0,0,0,0.5)',
                    borderBottom: i < subTabs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}>
                  <div className="flex items-center gap-2.5">
                    <tab.icon size={13} />
                    {tab.label}
                  </div>
                  {active && <ChevronRight size={13} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 tecsis-scrollbar">
            {activeTab === 'sys' && (
              <div className="space-y-4 mb-4">
                {/* Descripción del sistema */}
                <div className="rounded-xl p-6"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))' }}>
                      <Globe size={15} style={{ color: '#a5b4fc' }} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 leading-none">Acerca de TecSis-IA</h2>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }}>Versión 1.0 · Ciclo 2024-C</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.65)' }}>
                    Ante esta necesidad, surge la propuesta de una plataforma web centralizada diseñada para
                    automatizar la gestión documental y optimizar el acceso a las investigaciones de la carrera.
                    La solución incorpora un backend en Django para la ingesta de resúmenes estructurados en
                    formato XML, un panel administrativo en React para supervisar los estados de los trámites
                    y controlar la visibilidad de los archivos, y un motor de Inteligencia Artificial local
                    que permite realizar búsquedas y conteos analíticos en lenguaje natural sobre el contenido almacenado.
                  </p>
                </div>

                {/* Stack técnico */}
                <div className="rounded-xl p-6"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4"
                    style={{ color: 'rgba(0,0,0,0.35)' }}>Stack Tecnológico</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { capa: 'Frontend',   tech: 'React 19 + Tailwind CSS 4',           color: '#60a5fa', icon: '⚛️' },
                      { capa: 'Backend',    tech: 'Django 6 + Django REST Framework',     color: '#4ade80', icon: '🐍' },
                      { capa: 'Base de datos', tech: 'PostgreSQL + pgvector (HNSW)',      color: '#a78bfa', icon: '🗄️' },
                      { capa: 'Motor IA',   tech: 'sentence-transformers · 384 dims',     color: '#fbbf24', icon: '🤖' },
                      { capa: 'Build tool', tech: 'Vite 8 + proxy /api',                 color: '#fb923c', icon: '⚡' },
                      { capa: 'PDF Parser', tech: 'pypdf · chunking por página',          color: '#34d399', icon: '📄' },
                    ].map(({ capa, tech, color, icon }) => (
                      <div key={capa} className="rounded-lg p-3 flex items-start gap-3"
                        style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <span className="text-base flex-shrink-0">{icon}</span>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                            style={{ color }}>{capa}</div>
                          <div className="text-xs" style={{ color: 'rgba(0,0,0,0.6)' }}>{tech}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arquitectura RAG */}
                <div className="rounded-xl p-6"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4"
                    style={{ color: 'rgba(0,0,0,0.35)' }}>Flujo RAG</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['PDF / XML', 'pypdf', 'Chunks', 'Embeddings 384d', 'pgvector HNSW', 'Cosine Search', 'Respuesta'].map((step, i, arr) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="text-xs px-2.5 py-1.5 rounded-lg text-center"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', whiteSpace: 'nowrap' }}>
                          {step}
                        </div>
                        {i < arr.length - 1 && (
                          <ChevronRight size={12} style={{ color: 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'sys' && (
            <div className="rounded-xl p-6 mb-4"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-5">Información Personal</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nombre completo',      key: 'nombre',       icon: User,       readOnly: false },
                  { label: 'Correo institucional',  key: 'correo',       icon: Globe,      readOnly: false },
                  { label: 'Departamento',          key: 'departamento', icon: FolderOpen, readOnly: false },
                  { label: 'Código docente',        key: 'codigo',       icon: FileText,   readOnly: true  },
                  { label: 'Rol del sistema',       key: 'rol',          icon: Shield,     readOnly: true  },
                ].map(({ label, key, icon: Icon, readOnly }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5"
                      style={{ color: 'rgba(0,0,0,0.4)' }}>
                      <Icon size={11} /> {label}
                    </label>
                    <input
                      value={form[key] ?? ''}
                      readOnly={readOnly}
                      onChange={e => !readOnly && setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                      style={{
                        background: readOnly ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        color: readOnly ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.85)',
                        cursor: readOnly ? 'default' : 'text',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  <FileText size={11} /> Biografía profesional
                </label>
                <textarea
                  value={form.bio ?? ''}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
                  style={{
                    background: 'rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: 'rgba(0,0,0,0.85)',
                  }}
                />
              </div>
            </div>
            )}
          </div>

          {/* Footer buttons */}
          {activeTab !== 'sys' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <button onClick={handleCancel}
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="text-sm px-5 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DISTRIBUCIÓN BAR ─────────────────────────────────────────────────────────


export default PerfilView
