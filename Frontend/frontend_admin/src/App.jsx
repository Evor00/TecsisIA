import { useState, useEffect, useRef } from 'react'
import {
  Plus, History, FolderOpen, Bot, Paperclip, Send, ChevronDown,
  Lightbulb, BookOpen, BookMarked, FileCheck, Clock, Search,
  Filter, Download, Users, AlertCircle, CheckCircle2, XCircle,
  MinusCircle, User, Cpu, Bell, Shield, Globe, Settings,
  ChevronRight, FileText, TrendingUp, BarChart2,
} from 'lucide-react'

// ─── UTILS ────────────────────────────────────────────────────────────────────

function simColor(pct) {
  if (pct == null) return 'rgba(255,255,255,0.15)'
  if (pct >= 80) return '#ef4444'
  if (pct >= 60) return '#f59e0b'
  return '#22c55e'
}

// ─── FALLBACK DATA (usado si el backend no está disponible) ──────────────────

const HISTORIAL_FALLBACK = [
  { id: 1, titulo: 'Sistema web React + Spring Boot — análisis de similitud', tokens: 1240, fecha: '05 Jun 2026', hora: '10:32', coincidencias: 2, similitud: 88, estado: 'completado' },
  { id: 2, titulo: 'Aplicación móvil Flutter para gestión hospitalaria',       tokens: 980,  fecha: '04 Jun 2026', hora: '15:10', coincidencias: 1, similitud: 74, estado: 'completado' },
  { id: 3, titulo: 'Plataforma e-learning con microservicios',                  tokens: 1560, fecha: '03 Jun 2026', hora: '09:45', coincidencias: 3, similitud: 91, estado: 'alta-similitud' },
  { id: 4, titulo: 'API RESTful Node.js + MongoDB para control de activos',     tokens: 870,  fecha: '02 Jun 2026', hora: '14:20', coincidencias: 0, similitud: null, estado: 'sin-coincidencias' },
  { id: 5, titulo: 'Dashboard analítico con Python FastAPI y React',            tokens: 1120, fecha: '01 Jun 2026', hora: '11:55', coincidencias: 1, similitud: 67, estado: 'completado' },
  { id: 6, titulo: 'Sistema de matrícula universitaria con Vue.js',             tokens: 1340, fecha: '30 May 2026', hora: '08:30', coincidencias: 2, similitud: 79, estado: 'completado' },
  { id: 7, titulo: 'IoT con Raspberry Pi para monitoreo ambiental',             tokens: 760,  fecha: '28 May 2026', hora: '16:00', coincidencias: 0, similitud: null, estado: 'sin-coincidencias' },
]

const TECH_COLORS = {
  'React':       { bg: 'rgba(59,130,246,0.18)',  color: '#60a5fa' },
  'Spring Boot': { bg: 'rgba(34,197,94,0.18)',   color: '#4ade80' },
  'PostgreSQL':  { bg: 'rgba(99,102,241,0.18)',  color: '#a5b4fc' },
  'Flutter':     { bg: 'rgba(56,189,248,0.18)',  color: '#38bdf8' },
  'FastAPI':     { bg: 'rgba(100,116,139,0.22)', color: '#94a3b8' },
  'MongoDB':     { bg: 'rgba(34,197,94,0.18)',   color: '#4ade80' },
  'Node.js':     { bg: 'rgba(52,211,153,0.18)',  color: '#34d399' },
  'Firebase':    { bg: 'rgba(251,191,36,0.18)',  color: '#fbbf24' },
  'Vue.js':      { bg: 'rgba(52,211,153,0.18)',  color: '#34d399' },
  'MySQL':       { bg: 'rgba(251,146,60,0.18)',  color: '#fb923c' },
  'Angular':     { bg: 'rgba(239,68,68,0.18)',   color: '#f87171' },
  'Oracle':      { bg: 'rgba(239,68,68,0.18)',   color: '#f87171' },
}

const PROYECTOS_FALLBACK = [
  {
    codigo: 'C24-001', grupo: 'Grupo Alpha',   estado: 'aprobado',
    titulo: 'Sistema de Gestión de Inventarios Cloud',
    tecnologias: ['React', 'Spring Boot', 'PostgreSQL'],
    autores: 'K. Quispe · M. Torres · L. Ramos',
    similitud: 88, score: '94/100', fecha: '02 Jun 2026',
  },
  {
    codigo: 'C24-002', grupo: 'Grupo Beta',    estado: 'en-revision',
    titulo: 'Plataforma de Telemedicina con IA',
    tecnologias: ['Flutter', 'FastAPI', 'MongoDB'],
    autores: 'A. Mendoza · R. Ccori',
    similitud: 32, score: null, fecha: '03 Jun 2026',
  },
  {
    codigo: 'C24-003', grupo: 'Grupo Gamma',   estado: 'observado',
    titulo: 'App de Delivery con Seguimiento GPS',
    tecnologias: ['React', 'Node.js', 'Firebase'],
    autores: 'P. Solis · N. Huanca · C. Vargas',
    similitud: 61, score: null, fecha: '01 Jun 2026',
  },
  {
    codigo: 'C24-004', grupo: 'Grupo Delta',   estado: 'aprobado',
    titulo: 'Sistema ERP para PYMEs',
    tecnologias: ['Vue.js', 'Spring Boot', 'MySQL'],
    autores: 'F. Paredes · J. Llanos',
    similitud: 45, score: '87/100', fecha: '30 May 2026',
  },
  {
    codigo: 'C24-005', grupo: 'Grupo Epsilon', estado: 'en-revision',
    titulo: 'Chatbot de Atención al Cliente con NLP',
    tecnologias: ['React', 'FastAPI', 'PostgreSQL'],
    autores: 'D. Cueva · B. Arce · S. Puma',
    similitud: 28, score: null, fecha: '04 Jun 2026',
  },
  {
    codigo: 'C24-006', grupo: 'Grupo Zeta',    estado: 'rechazado',
    titulo: 'Control de Almacén con RFID',
    tecnologias: ['Angular', 'Spring Boot', 'Oracle'],
    autores: 'E. Valois · G. Cruz',
    similitud: 82, score: null, fecha: '28 May 2026',
  },
]

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function MetricCard({ label, value, gradientFrom, iconBg, iconColor, icon: Icon }) {
  return (
    <div className="relative rounded-xl p-4 overflow-hidden flex flex-col justify-between"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, transparent 60%)` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {label === 'Total Indexadas' ? 'tesis disponibles' : label === 'Aprobadas' ? 'con dictamen final' : 'pendientes de revisión'}
        </div>
      </div>
    </div>
  )
}

function SimilarityCard({ titulo, autor, similitud }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.2))' }}>
        <FileCheck size={16} style={{ color: '#60a5fa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{titulo}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{autor}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="text-lg font-bold" style={{ color: '#34d399' }}>{similitud}%</div>
        <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ width: `${similitud}%`, background: 'linear-gradient(to right, #10b981, #3b82f6)' }} />
        </div>
      </div>
    </div>
  )
}

function TechTag({ name }) {
  const c = TECH_COLORS[name] ?? { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }
  return (
    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium"
      style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
      {name}
    </span>
  )
}

function EstadoBadge({ estado }) {
  const map = {
    aprobado:          { label: 'Aprobado',          color: '#4ade80', bg: 'rgba(34,197,94,0.15)',  Icon: CheckCircle2 },
    'en-revision':     { label: 'En Revisión',        color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', Icon: Clock },
    observado:         { label: 'Observado',          color: '#fb923c', bg: 'rgba(251,146,60,0.15)', Icon: AlertCircle },
    rechazado:         { label: 'Rechazado',          color: '#f87171', bg: 'rgba(239,68,68,0.15)',  Icon: XCircle },
    completado:        { label: 'Completado',         color: '#4ade80', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircle2 },
    'alta-similitud':  { label: 'Alta similitud',     color: '#fb923c', bg: 'rgba(251,146,60,0.15)', Icon: AlertCircle },
    'sin-coincidencias': { label: 'Sin coincidencias', color: '#94a3b8', bg: 'rgba(100,116,139,0.2)', Icon: MinusCircle },
  }
  const { label, color, bg, Icon } = map[estado] ?? map.completado
  return (
    <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium whitespace-nowrap"
      style={{ background: bg, color }}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function PageBreadcrumb({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-b flex-shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <Icon size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
    </div>
  )
}

// ─── VIEW: HISTORIAL ──────────────────────────────────────────────────────────

function LoadingRows({ cols = 5 }) {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="grid px-4 py-4 animate-pulse"
      style={{ gridTemplateColumns: `1fr 130px 110px 110px 130px`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <div key={j} className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', width: j === 0 ? '70%' : '55%' }} />
      ))}
    </div>
  ))
}

function HistorialView() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/historial/')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setData(d))
      .catch(() => setData(HISTORIAL_FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(r =>
    r.titulo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={History} label="Historial de Análisis" />

      <div className="flex-1 overflow-y-auto px-6 py-5 tecsis-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Historial de Análisis</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {HISTORIAL_DATA.length} consultas RAG registradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
              <Filter size={12} /> Filtrar <ChevronDown size={12} />
            </button>
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Download size={12} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { value: '7',     label: 'Consultas este mes', color: '#818cf8' },
            { value: '1',     label: 'Alertas de similitud', color: '#fb923c' },
            { value: '1.124', label: 'Promedio de tokens',  color: '#4ade80' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.25)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en el historial..."
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
            }}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Header */}
          <div className="grid text-[10px] font-semibold tracking-widest px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr 130px 110px 110px 130px',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.35)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
            <span>CONSULTA RAG</span>
            <span>FECHA</span>
            <span>COINCIDENCIAS</span>
            <span>SIMILITUD MÁX.</span>
            <span>ESTADO</span>
          </div>

          {loading ? <LoadingRows /> : filtered.map((row, i) => (
            <div key={row.id}
              className="grid px-4 py-3.5 items-center transition-colors cursor-pointer"
              style={{
                gridTemplateColumns: '1fr 130px 110px 110px 130px',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}>
              {/* Title */}
              <div className="flex items-start gap-3 pr-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <FileText size={13} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white leading-snug">{row.titulo}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {row.tokens.toLocaleString()} tokens procesados
                  </div>
                </div>
              </div>
              {/* Fecha */}
              <div>
                <div className="text-sm text-white">{row.fecha}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{row.hora}</div>
              </div>
              {/* Coincidencias */}
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: row.coincidencias === 0 ? 'rgba(100,116,139,0.2)' : 'rgba(239,68,68,0.15)',
                    color: row.coincidencias === 0 ? '#94a3b8' : '#f87171',
                  }}>
                  {row.coincidencias} {row.coincidencias === 1 ? 'tesis' : 'tesis'}
                </span>
              </div>
              {/* Similitud */}
              <div>
                {row.similitud != null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${row.similitud}%`, background: simColor(row.similitud) }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: simColor(row.similitud) }}>{row.similitud}%</span>
                  </div>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                )}
              </div>
              {/* Estado */}
              <div><EstadoBadge estado={row.estado} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── VIEW: PROYECTOS C24 ──────────────────────────────────────────────────────

function ProyectosView() {
  const [proyectos, setProyectos] = useState([])
  const [conteos, setConteos]     = useState({ todos: 0, aprobado: 0, 'en-revision': 0, observado: 0, rechazado: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtro, setFiltro]       = useState('todos')

  useEffect(() => {
    fetch('/api/proyectos/')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        setProyectos(d.proyectos ?? [])
        setConteos(d.conteos ?? { todos: 0, aprobado: 0, 'en-revision': 0, observado: 0, rechazado: 0 })
      })
      .catch(() => {
        setProyectos(PROYECTOS_FALLBACK)
        setConteos({ todos: 6, aprobado: 2, 'en-revision': 2, observado: 1, rechazado: 1 })
      })
      .finally(() => setLoading(false))
  }, [])

  const TAB_DEFS = [
    { id: 'todos',       label: 'Todos' },
    { id: 'aprobado',    label: 'Aprobados' },
    { id: 'en-revision', label: 'En revisión' },
    { id: 'observado',   label: 'Observados' },
    { id: 'rechazado',   label: 'Rechazados' },
  ]

  const filtered = proyectos.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      p.titulo.toLowerCase().includes(q) ||
      (p.grupo || '').toLowerCase().includes(q) ||
      (p.tecnologias || []).some(t => t.toLowerCase().includes(q))
    const matchFiltro = filtro === 'todos' || p.estado === filtro
    return matchSearch && matchFiltro
  })

  const GridSkeleton = () => (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 animate-pulse"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '180px' }}>
          <div className="h-2 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.07)', width: '40%' }} />
          <div className="h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.07)', width: '80%' }} />
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '60%' }} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={FolderOpen} label="Proyectos C24" />

      <div className="flex-1 overflow-y-auto px-6 py-5 tecsis-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Proyectos C24</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Promoción 2024 · {conteos.todos} proyectos registrados
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Plus size={14} /> Registrar proyecto
          </button>
        </div>

        {/* Tabs — conteos desde la API */}
        <div className="flex items-center gap-1.5 mb-4">
          {TAB_DEFS.map(tab => (
            <button key={tab.id}
              onClick={() => setFiltro(tab.id)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              style={{
                background: filtro === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: filtro === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                border: filtro === tab.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              }}>
              {tab.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: filtro === tab.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }}>
                {conteos[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.25)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, grupo o tecnología..."
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
        </div>

        {/* Grid */}
        {loading ? <GridSkeleton /> : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.codigo}
                className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>{p.codigo}</span>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.grupo}</span>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </div>
                <div className="text-sm font-semibold text-white leading-snug">{p.titulo}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(p.tecnologias || []).map(t => <TechTag key={t} name={t} />)}
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <Users size={11} />{p.autores}
                </div>
                <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.similitud}%`, background: simColor(p.similitud) }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: simColor(p.similitud) }}>{p.similitud}% sim.</span>
                  </div>
                  {p.score && (
                    <span className="text-xs font-bold" style={{ color: '#818cf8' }}>
                      <BarChart2 size={11} className="inline mr-1" />{p.score}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>🗓 {p.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── VIEW: PERFIL ─────────────────────────────────────────────────────────────

function PerfilView() {
  const [activeTab, setActiveTab] = useState('info')
  const [form, setForm] = useState({
    nombre: 'Jaime Gomez Quispe',
    correo: 'j.gomez@tecsis.edu.pe',
    telefono: '+51 987 654 321',
    departamento: 'Ing. de Software',
    codigo: 'DOC-2024-047',
    rol: 'Docente / Administrador',
    bio: 'Docente de la carrera de Diseño y Desarrollo de Software con especialización en arquitectura de sistemas distribuidos y análisis semántico de documentos académicos.',
  })

  const subTabs = [
    { id: 'info',  label: 'Información Personal', icon: User },
    { id: 'ia',    label: 'Modelo de IA',          icon: Cpu },
    { id: 'notif', label: 'Notificaciones',        icon: Bell },
    { id: 'seg',   label: 'Seguridad',             icon: Shield },
    { id: 'sys',   label: 'Sistema',               icon: Globe },
  ]

  const stats = [
    { value: 47, label: 'Consultas RAG',      color: '#818cf8', icon: TrendingUp },
    { value: 23, label: 'Proyectos revisados', color: '#4ade80', icon: FolderOpen },
    { value: 8,  label: 'Alertas emitidas',   color: '#fbbf24', icon: Bell },
    { value: 70, label: 'Tesis indexadas',    color: '#a78bfa', icon: BookMarked },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={User} label="Perfil" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col p-5 gap-4 overflow-y-auto tecsis-scrollbar flex-shrink-0"
          style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Avatar */}
          <div className="rounded-xl p-5 flex flex-col items-center gap-2 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>JG</div>
            <div>
              <div className="font-semibold text-white text-sm">Prof. Jaime Gomez</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Docente / Administrador</div>
            </div>
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Activo
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ value, label, color, icon: Icon }) => (
              <div key={label} className="rounded-lg p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={11} style={{ color }} />
                </div>
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Sub-nav */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {subTabs.map((tab, i) => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                    color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                    borderBottom: i < subTabs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
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
            <div className="rounded-xl p-6 mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-sm font-semibold text-white mb-5">Información Personal</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nombre completo',     key: 'nombre',      icon: User,      readOnly: false },
                  { label: 'Correo institucional', key: 'correo',      icon: Globe,     readOnly: false },
                  { label: 'Teléfono',            key: 'telefono',    icon: Bell,      readOnly: false },
                  { label: 'Departamento',        key: 'departamento', icon: FolderOpen, readOnly: false },
                  { label: 'Código docente',      key: 'codigo',      icon: FileText,  readOnly: true },
                  { label: 'Rol del sistema',     key: 'rol',         icon: Shield,    readOnly: true },
                ].map(({ label, key, icon: Icon, readOnly }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Icon size={11} /> {label}
                    </label>
                    <input
                      value={form[key]}
                      readOnly={readOnly}
                      onChange={e => !readOnly && setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                      style={{
                        background: readOnly ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: readOnly ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                        cursor: readOnly ? 'default' : 'text',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <FileText size={11} /> Biografía profesional
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <button className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
              Cancelar
            </button>
            <button className="text-sm px-5 py-2 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW: DASHBOARD + CHAT ───────────────────────────────────────────────────

const METRIC_CARDS = [
  { label: 'Total Indexadas', key: 'total_tesis', icon: BookMarked, gradientFrom: 'rgba(59,130,246,0.12)',  iconBg: 'rgba(59,130,246,0.2)',  iconColor: '#60a5fa' },
  { label: 'Aprobadas',       key: 'aprobadas',   icon: FileCheck,  gradientFrom: 'rgba(16,185,129,0.12)', iconBg: 'rgba(16,185,129,0.2)', iconColor: '#34d399' },
  { label: 'En Revisión',     key: 'en_revision', icon: Clock,      gradientFrom: 'rgba(245,158,11,0.12)', iconBg: 'rgba(245,158,11,0.2)', iconColor: '#fbbf24' },
]

const INITIAL_MESSAGES = [
  { role: 'user', content: '¿Qué tesis hay relacionadas con sistemas web con React y Spring Boot?' },
  {
    role: 'assistant',
    content: 'He analizado el repositorio semántico y encontré los documentos con mayor similitud coseno para tu consulta:',
    documents: [
      { titulo: 'Gestión de Inventarios Cloud', autor: 'Jamir Venturo', similitud: 88 },
      { titulo: 'Control de Almacén',           autor: 'E. Valois',     similitud: 82 },
    ],
  },
]

function DashboardChatView({ metrics }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const prompt = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)
    try {
      const res = await fetch('/api/rag/query/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.llm_response, documents: data.similar_documents }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `He analizado el repositorio y encontré documentos relacionados con "${prompt}":`,
        documents: [
          { titulo: 'Gestión de Inventarios Cloud', autor: 'Jamir Venturo', similitud: 88 },
          { titulo: 'Control de Almacén',           autor: 'E. Valois',     similitud: 82 },
        ],
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { icon: Lightbulb, label: 'Analizar duplicidad',   prompt: 'Analiza si existen tesis con contenido duplicado en el repositorio' },
    { icon: BookOpen,  label: 'Buscar por tecnología', prompt: 'Muestra las tesis agrupadas por tecnología utilizada' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Dashboard (30%) */}
      <section className="border-b flex-shrink-0"
        style={{ height: '30%', minHeight: '190px', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-white leading-none">Resumen del Repositorio Local</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Métricas del ciclo académico 2024-C</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
              En línea
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1">
            {METRIC_CARDS.map(card => <MetricCard key={card.key} {...card} value={metrics?.[card.key]} />)}
          </div>
        </div>
      </section>

      {/* Chat (70%) */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-2 flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Bot size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Asistente de Revisión Semántica</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
            style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)' }}>
            RAG · Mistral-14B Local
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 tecsis-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <Bot size={14} />
                </div>
              )}
              <div className={`flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end max-w-[65%]' : 'max-w-[75%] items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{
                    background: msg.role === 'user' ? 'rgba(255,255,255,0.09)' : '#2a2a2a',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
                  }}>
                  {msg.content}
                </div>
                {msg.documents?.map((doc, j) => <SimilarityCard key={j} {...doc} />)}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>JG</div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5" style={{ background: '#2a2a2a' }}>
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex gap-2 mb-3">
            {quickActions.map(({ icon: Icon, label, prompt: qp }) => (
              <button key={label}
                onClick={() => { setInput(qp); textareaRef.current?.focus() }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl px-3 py-2.5"
            style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="pb-1.5 transition-colors flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
              <Paperclip size={17} />
            </button>
            <textarea ref={textareaRef} value={input} rows={1}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="¿Qué deseas consultar sobre los documentos?..."
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1"
              style={{ color: 'rgba(255,255,255,0.8)', minHeight: '24px', maxHeight: '120px' }} />
            <div className="flex items-center gap-2 flex-shrink-0 pb-1">
              <button className="flex items-center gap-1 text-xs transition-colors whitespace-nowrap"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                Mistral-14B Local <ChevronDown size={12} />
              </button>
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <Send size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard General',   icon: BookMarked },
  { id: 'historial', label: 'Historial de Análisis', icon: History },
  { id: 'proyectos', label: 'Proyectos C24',         icon: FolderOpen },
]

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')

  useEffect(() => {
    fetch('/api/dashboard/metrics/')
      .then(r => r.json())
      .then(data => setMetrics(data))
      .catch(() => setMetrics({ total_tesis: 70, aprobadas: 50, en_revision: 20 }))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#212121' }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col border-r flex-shrink-0"
        style={{ width: '210px', background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <Bot size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">TecSis-IA</div>
              <div className="text-[11px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>Panel Docente</div>
            </div>
          </div>
        </div>

        {/* New Query */}
        <div className="p-3">
          <button onClick={() => setActiveNav('dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors font-medium"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))', color: '#fff', border: '1px solid rgba(99,102,241,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Plus size={15} /> Nueva consulta RAG
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id
            return (
              <button key={id} onClick={() => setActiveNav(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
                <Icon size={14} />
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />}
              </button>
            )
          })}
        </nav>

        {/* Avatar */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
            style={{ cursor: 'default' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}>JG</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-none truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>Prof. Jaime Gomez</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Docente · DDS</div>
            </div>
            <button onClick={() => setActiveNav('perfil')}
              className="flex-shrink-0 p-1 rounded-md transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
              <Settings size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeNav === 'dashboard' && <DashboardChatView metrics={metrics} />}
        {activeNav === 'historial' && <HistorialView />}
        {activeNav === 'proyectos' && <ProyectosView />}
        {activeNav === 'perfil'    && <PerfilView />}
      </main>
    </div>
  )
}
