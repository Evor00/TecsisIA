import { useState, useEffect, useRef } from 'react'
import {
  Plus, History, FolderOpen, Bot, Paperclip, Send, ChevronDown,
  Lightbulb, BookOpen, BookMarked, FileCheck, Clock, Search,
  Filter, Download, Users, AlertCircle, CheckCircle2, XCircle,
  MinusCircle, User, Cpu, Bell, Shield, Globe, Settings,
  ChevronRight, FileText, TrendingUp, BarChart2,
  MessageSquare, Trash2, LogOut,
} from 'lucide-react'

// ─── UTILS ────────────────────────────────────────────────────────────────────

function simColor(pct) {
  if (pct == null) return 'rgba(0,0,0,0.15)'
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
      style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, transparent 60%)` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.4)' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.3)' }}>
          {label === 'Total Indexadas' ? 'tesis disponibles' : label === 'Aprobadas' ? 'con dictamen final' : 'pendientes de revisión'}
        </div>
      </div>
    </div>
  )
}

function SimilarityCard({ titulo, autor, similitud }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.2))' }}>
        <FileCheck size={16} style={{ color: '#60a5fa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{titulo}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{autor}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="text-lg font-bold" style={{ color: '#34d399' }}>{similitud}%</div>
        <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }}>
          <div className="h-full rounded-full" style={{ width: `${similitud}%`, background: 'linear-gradient(to right, #10b981, #3b82f6)' }} />
        </div>
      </div>
    </div>
  )
}

function TechTag({ name }) {
  const c = TECH_COLORS[name] ?? { bg: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.6)' }
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
      style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
      <Icon size={13} style={{ color: 'rgba(0,0,0,0.3)' }} />
      <span className="text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>{label}</span>
    </div>
  )
}

// ─── VIEW: HISTORIAL ──────────────────────────────────────────────────────────

function LoadingRows({ cols = 5 }) {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="grid px-4 py-4 animate-pulse"
      style={{ gridTemplateColumns: `1fr 130px 110px 110px 130px`, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <div key={j} className="h-3 rounded-full" style={{ background: 'rgba(0,0,0,0.07)', width: j === 0 ? '70%' : '55%' }} />
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

  const handleExportCSV = () => {
    const headers = ['ID','Consulta RAG','Tokens','Fecha','Hora','Coincidencias','Similitud Máx.','Estado']
    const rows = filtered.map(r => [
      r.id, `"${r.titulo.replace(/"/g,'""')}"`, r.tokens,
      r.fecha, r.hora, r.coincidencias,
      r.similitud != null ? `${r.similitud}%` : '—', r.estado,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `historial_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const alertas   = data.filter(r => r.estado === 'alta-similitud').length
  const avgTokens = data.length
    ? Math.round(data.reduce((s, r) => s + (r.tokens || 0), 0) / data.length).toLocaleString('es-PE')
    : '—'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={History} label="Historial de Análisis" />

      <div className="flex-1 overflow-y-auto px-6 py-5 tecsis-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Historial de Análisis</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {data.length} consultas RAG registradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}>
              <Filter size={12} /> Filtrar <ChevronDown size={12} />
            </button>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
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
            { value: data.length, label: 'Consultas este mes', color: '#818cf8' },
            { value: alertas,     label: 'Alertas de similitud', color: '#fb923c' },
            { value: avgTokens,   label: 'Promedio de tokens',  color: '#4ade80' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(0,0,0,0.25)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en el historial..."
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)',
              color: 'rgba(0,0,0,0.8)',
            }}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {/* Header */}
          <div className="grid text-[10px] font-semibold tracking-widest px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr 130px 110px 110px 130px',
              background: 'rgba(0,0,0,0.04)',
              color: 'rgba(0,0,0,0.35)',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
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
                background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}>
              {/* Title */}
              <div className="flex items-start gap-3 pr-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <FileText size={13} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 leading-snug">{row.titulo}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(0,0,0,0.3)' }}>
                    {row.tokens.toLocaleString()} tokens procesados
                  </div>
                </div>
              </div>
              {/* Fecha */}
              <div>
                <div className="text-sm text-gray-900">{row.fecha}</div>
                <div className="text-[11px]" style={{ color: 'rgba(0,0,0,0.3)' }}>{row.hora}</div>
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
                    <div className="w-14 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${row.similitud}%`, background: simColor(row.similitud) }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: simColor(row.similitud) }}>{row.similitud}%</span>
                  </div>
                ) : (
                  <span style={{ color: 'rgba(0,0,0,0.25)' }}>—</span>
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

// ─── MODAL: DETALLE DE TESIS ──────────────────────────────────────────────────

function DetalleTesisModal({ proyecto: p, onClose }) {
  const [detalle, setDetalle] = useState(null)

  useEffect(() => {
    if (!p.id) return
    fetch(`/api/proyectos/${p.id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setDetalle(d))
      .catch(() => {})
  }, [p.id])

  const estadoColors = {
    aprobado:          { color: '#4ade80', bg: 'rgba(34,197,94,0.12)'   },
    'en-revision':     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
    observado:         { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
    rechazado:         { color: '#f87171', bg: 'rgba(239,68,68,0.12)'   },
  }
  const ec = estadoColors[p.estado] ?? estadoColors.aprobado

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', maxHeight: '85vh' }}>

        {/* Header con gradiente */}
        <div className="relative rounded-t-2xl px-6 pt-6 pb-5 overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }} />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))' }}>
                <FileText size={18} style={{ color: '#a5b4fc' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(99,102,241,0.25)', color: '#818cf8' }}>{p.codigo}</span>
                  <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.35)' }}>{p.grupo}</span>
                </div>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">{p.titulo}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
              style={{ color: 'rgba(0,0,0,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#111827' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.4)' }}>
              <XCircle size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 tecsis-scrollbar">
          {/* Estado + Score */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: ec.bg, color: ec.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ec.color }} />
              <EstadoBadge estado={p.estado} />
            </span>
            {p.score && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                <BarChart2 size={11} /> Score: {p.score}
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: 'rgba(0,0,0,0.35)' }}>
              Registrado {p.fecha}
            </span>
          </div>

          {/* Autores */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} style={{ color: 'rgba(0,0,0,0.4)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>AUTORES</span>
            </div>
            <div className="text-sm text-gray-900">{p.autores}</div>
          </div>

          {/* Tecnologías */}
          {p.tecnologias?.length > 0 && (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={13} style={{ color: 'rgba(0,0,0,0.4)' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>STACK TECNOLÓGICO</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.tecnologias.map(t => <TechTag key={t} name={t} />)}
              </div>
            </div>
          )}

          {/* Similitud */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} style={{ color: 'rgba(0,0,0,0.4)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>ANÁLISIS DE SIMILITUD RAG</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.similitud}%`, background: simColor(p.similitud) }} />
                </div>
              </div>
              <span className="text-lg font-bold flex-shrink-0" style={{ color: simColor(p.similitud) }}>
                {p.similitud}%
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(0,0,0,0.3)' }}>
              {p.similitud >= 80
                ? 'Similitud alta — se recomienda revisión exhaustiva antes de aprobar.'
                : p.similitud >= 60
                ? 'Similitud moderada — revisar secciones específicas señaladas.'
                : 'Similitud baja — el documento presenta contenido original.'}
            </p>
          </div>

          {/* Abstract / Resumen */}
          {detalle?.resumen ? (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={13} style={{ color: 'rgba(0,0,0,0.4)' }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>RESUMEN / ABSTRACT</span>
                </div>
                {detalle.total_chunks > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc' }}>
                    {detalle.total_chunks} {detalle.total_chunks === 1 ? 'página' : 'páginas'} indexadas
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,0,0,0.65)' }}>
                {detalle.resumen}
              </p>
            </div>
          ) : detalle !== null && !detalle?.resumen ? (
            <div className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.07)' }}>
              <p className="text-xs" style={{ color: 'rgba(0,0,0,0.25)' }}>
                Sin resumen registrado — sube el PDF del proyecto para habilitar la búsqueda semántica.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
          <button onClick={onClose}
            className="text-sm px-5 py-2 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL: REGISTRAR PROYECTO ───────────────────────────────────────────────

const TECH_QUICK = [
  'React','Vue.js','Angular','Node.js','FastAPI','Spring Boot',
  'Flutter','Django','PostgreSQL','MongoDB','Firebase','MySQL','Python','Docker',
]

const ESTADO_OPTS = [
  { value: 'En Revisión', label: 'En Revisión', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  { value: 'Aprobada',    label: 'Aprobada',    color: '#4ade80', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)'  },
  { value: 'Observada',   label: 'Observada',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)' },
  { value: 'Rechazada',   label: 'Rechazada',   color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)'  },
]

function RegistrarProyectoModal({ onClose, onCreated }) {
  const [form, setForm]           = useState({ titulo: '', autor: '', grupo: '', promocion: 'C24', tecnologias: [], resumen: '', estado: 'En Revisión', codigo: '', score: '' })
  const [techInput, setTechInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [pdfFile, setPdfFile]     = useState(null)
  const [xmlOk, setXmlOk]         = useState(null)   // nombre del XML importado
  const [savingStep, setSavingStep] = useState('')    // texto de progreso
  const xmlRef = useRef(null)
  const pdfRef = useRef(null)

  const addTech = (name) => {
    const t = (name || techInput).trim()
    if (t && !form.tecnologias.includes(t))
      setForm(f => ({ ...f, tecnologias: [...f.tecnologias, t] }))
    setTechInput('')
  }
  const removeTech = (t) => setForm(f => ({ ...f, tecnologias: f.tecnologias.filter(x => x !== t) }))

  // ── XML import (server-side: crea tesis + indexa chunks) ───────────────────
  const handleXML = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Modo rápido: autocompletar el formulario (fallback si el servidor falla)
    const autofill = () => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const doc   = new DOMParser().parseFromString(ev.target.result, 'text/xml')
          const get   = (tag) => doc.querySelector(tag)?.textContent?.trim() || ''
          const autores_el = doc.querySelector('autores')
          const autor = autores_el
            ? [...autores_el.querySelectorAll('autor')].map(a => a.textContent.trim()).join(' · ')
            : get('autor')
          const techs = [...doc.querySelectorAll('tecnologia')].map(n => n.textContent.trim()).filter(Boolean)
          setForm(f => ({
            ...f,
            titulo:      get('titulo')    || f.titulo,
            autor:       autor            || f.autor,
            grupo:       get('grupo')     || f.grupo,
            promocion:   get('promocion') || f.promocion,
            estado:      get('estado')    || f.estado,
            codigo:      get('codigo')    || f.codigo,
            score:       get('score')     || f.score,
            tecnologias: techs.length ? techs : f.tecnologias,
            resumen:     get('resumen')   || f.resumen,
          }))
          setXmlOk(file.name + ' (campos autocompletados — revisa y guarda)')
          setError(null)
        } catch {
          setError('El archivo XML no tiene el formato esperado.')
        }
      }
      reader.readAsText(file, 'UTF-8')
    }

    // Modo completo: subir al servidor → crea tesis + indexa secciones
    setSaving(true)
    setSavingStep('Subiendo XML e indexando contenido…')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('tecsis_token')
      const res = await fetch('/api/xml/upload/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        // Servidor rechazó — usar autofill como fallback
        setSaving(false); setSavingStep('')
        autofill()
        return
      }
      // Éxito: cerrar modal y añadir a la lista
      onCreated(data)
      onClose()
    } catch {
      // Sin conexión — usar autofill como fallback
      setSaving(false); setSavingStep('')
      autofill()
    }
  }

  // ── PDF attach ───────────────────────────────────────────────────────────────
  const handlePDF = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF.')
      return
    }
    setPdfFile(file)
    setError(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.autor.trim()) {
      setError('El título y el autor son obligatorios.')
      return
    }
    setSaving(true); setError(null)
    try {
      // 1. Registrar proyecto
      setSavingStep('Registrando proyecto…')
      const payload = { ...form }
      if (!payload.codigo.trim()) delete payload.codigo
      if (!payload.score.trim())  delete payload.score
      const res  = await apiFetch('/api/proyectos/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar')

      // 2. Subir PDF si está adjunto
      if (pdfFile && data.id) {
        setSavingStep('Indexando PDF en repositorio RAG…')
        const fd = new FormData()
        fd.append('file', pdfFile)
        fd.append('tesis_id', data.id)
        await fetch('/api/rag/upload/', { method: 'POST', body: fd })
      }

      onCreated(data)
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo registrar el proyecto.')
    } finally {
      setSaving(false); setSavingStep('')
    }
  }

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'rgba(0,0,0,0.45)' }}>{label}</label>
      {children}
    </div>
  )

  const inputStyle = {
    background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
    color: 'rgba(0,0,0,0.85)', borderRadius: '8px',
    padding: '9px 12px', fontSize: '14px', width: '100%', outline: 'none',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Registrar nuevo proyecto</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }}>Completa los datos o importa desde XML / PDF</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(0,0,0,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#111827' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.4)' }}>
            <XCircle size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 tecsis-scrollbar">

          {/* ── Zona de importación ─────────────────────────────────────────── */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px dashed rgba(99,102,241,0.35)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(165,180,252,0.7)' }}>Importar desde archivo</p>

            <div className="flex gap-2">
              {/* XML */}
              <input ref={xmlRef} type="file" accept=".xml" className="hidden" onChange={handleXML} />
              <button onClick={() => xmlRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}>
                <FileText size={13} /> XML — autocompletar
              </button>

              {/* PDF */}
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePDF} />
              <button onClick={() => pdfRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: pdfFile ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.06)',
                  color:      pdfFile ? '#4ade80'               : 'rgba(0,0,0,0.55)',
                  border:     `1px solid ${pdfFile ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.1)'}`,
                }}
                onMouseEnter={e => !pdfFile && (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
                onMouseLeave={e => !pdfFile && (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}>
                <Paperclip size={13} /> {pdfFile ? pdfFile.name.slice(0, 18) + '…' : 'PDF — adjuntar'}
              </button>
            </div>

            {/* Feedback XML */}
            {xmlOk && (
              <div className="flex items-center gap-2 text-[11px]"
                style={{ color: '#4ade80' }}>
                <CheckCircle2 size={12} />
                <span><strong>{xmlOk}</strong> importado — campos completados automáticamente</span>
              </div>
            )}

            {/* Feedback PDF */}
            {pdfFile && (
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: '#4ade80' }}>
                  <CheckCircle2 size={12} className="inline mr-1" />
                  PDF adjunto — se indexará al guardar (embeddings + pgvector)
                </span>
                <button onClick={() => setPdfFile(null)} style={{ color: 'rgba(0,0,0,0.3)', fontSize: '13px' }}>×</button>
              </div>
            )}
          </div>

          {/* ── Formulario ──────────────────────────────────────────────────── */}
          <Field label="Título del proyecto *">
            <input style={inputStyle} placeholder="Ej: Sistema de gestión de inventarios con IA"
              value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </Field>

          <Field label="Autor(es) *">
            <input style={inputStyle} placeholder="Ej: K. Quispe · M. Torres · L. Ramos"
              value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} />
          </Field>

          {/* ── Estado ── */}
          <Field label="Estado del proyecto">
            <div className="grid grid-cols-4 gap-2">
              {ESTADO_OPTS.map(opt => {
                const active = form.estado === opt.value
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, estado: opt.value, score: opt.value !== 'Aprobada' ? '' : f.score }))}
                    className="py-2 rounded-lg text-xs font-medium text-center transition-all"
                    style={{
                      background: active ? opt.bg : 'rgba(0,0,0,0.04)',
                      color:      active ? opt.color : 'rgba(0,0,0,0.45)',
                      border:     `1px solid ${active ? opt.border : 'rgba(0,0,0,0.08)'}`,
                      transform:  active ? 'scale(1.03)' : 'scale(1)',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Código del proyecto">
              <input style={inputStyle} placeholder="Ej: C24-007"
                value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
            </Field>
            {form.estado === 'Aprobada' ? (
              <Field label="Score / Calificación">
                <input style={{ ...inputStyle, borderColor: 'rgba(34,197,94,0.4)' }}
                  placeholder="Ej: 94/100"
                  value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
              </Field>
            ) : (
              <Field label="Promoción">
                <select style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.promocion} onChange={e => setForm(f => ({ ...f, promocion: e.target.value }))}>
                  {['C24','C23','C25','C22'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            )}
          </div>

          {form.estado === 'Aprobada' && (
            <Field label="Promoción">
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.promocion} onChange={e => setForm(f => ({ ...f, promocion: e.target.value }))}>
                {['C24','C23','C25','C22'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Grupo">
              <input style={inputStyle} placeholder="Ej: Grupo Alpha"
                value={form.grupo} onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))} />
            </Field>
          </div>

          <Field label="Tecnologías">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TECH_QUICK.map(t => (
                <button key={t} onClick={() => addTech(t)}
                  className="text-[11px] px-2 py-0.5 rounded-md transition-colors"
                  style={{
                    background: form.tecnologias.includes(t) ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.06)',
                    color:      form.tecnologias.includes(t) ? '#a5b4fc' : 'rgba(0,0,0,0.5)',
                    border:     `1px solid ${form.tecnologias.includes(t) ? 'rgba(99,102,241,0.4)' : 'rgba(0,0,0,0.08)'}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Otra tecnología..."
                value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTech()} />
              <button onClick={() => addTech()}
                className="px-3 rounded-lg text-xs font-medium flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.6)' }}>
                + Añadir
              </button>
            </div>
            {form.tecnologias.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tecnologias.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {t}
                    <button onClick={() => removeTech(t)} style={{ color: 'rgba(165,180,252,0.6)', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Resumen / Abstract">
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              placeholder="Descripción del proyecto, objetivos, metodología y resultados esperados…"
              value={form.resumen}
              onChange={e => setForm(f => ({ ...f, resumen: e.target.value }))}
            />
            {form.resumen && (
              <p className="text-[10px] mt-1" style={{ color: 'rgba(0,0,0,0.25)' }}>
                {form.resumen.length} caracteres — se indexará como embedding semántico
              </p>
            )}
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
          {saving
            ? <span className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>{savingStep}</span>
            : <span />
          }
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={saving}
              className="text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.11)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="text-sm px-5 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {saving ? 'Procesando…' : pdfFile ? 'Registrar + Indexar PDF' : 'Registrar proyecto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW: PROYECTOS C24 ──────────────────────────────────────────────────────

function ProyectosView({ metrics }) {
  const [proyectos, setProyectos] = useState([])
  const [conteos, setConteos]     = useState({ todos: 0, aprobado: 0, 'en-revision': 0, observado: 0, rechazado: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtro, setFiltro]       = useState('todos')
  const [showModal, setShowModal]       = useState(false)
  const [detalle, setDetalle]           = useState(null)
  const [toast, setToast]               = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggleActivo = (p, e) => {
    e.stopPropagation()
    const nuevoActivo = !p.activo
    setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, activo: nuevoActivo } : x))
    apiFetch(`/api/proyectos/${p.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: nuevoActivo }),
    }).catch(() => {
      setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, activo: p.activo } : x))
    })
  }

  const handleEliminar = (p, e) => {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${p.titulo}"? Esta acción también borrará todos sus chunks indexados y no se puede deshacer.`)) return
    setProyectos(prev => prev.filter(x => x.id !== p.id))
    setConteos(c => ({ ...c, todos: Math.max(0, c.todos - 1), [p.estado]: Math.max(0, (c[p.estado] || 1) - 1) }))
    apiFetch(`/api/proyectos/${p.id}/`, { method: 'DELETE' }).catch(() => {
      setProyectos(prev => [...prev, p].sort((a, b) => a.id - b.id))
    })
  }

  const loadData = () => {
    setLoading(true)
    apiFetch('/api/proyectos/')
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
  }

  useEffect(() => { loadData() }, [])

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
      (p.autores || '').toLowerCase().includes(q) ||
      (p.grupo || '').toLowerCase().includes(q) ||
      (p.codigo || '').toLowerCase().includes(q) ||
      (p.tecnologias || []).some(t => t.toLowerCase().includes(q))
    const matchFiltro = filtro === 'todos' || p.estado === filtro
    return matchSearch && matchFiltro
  })

  const GridSkeleton = () => (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 animate-pulse"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', height: '180px' }}>
          <div className="h-2 rounded-full mb-3" style={{ background: 'rgba(0,0,0,0.07)', width: '40%' }} />
          <div className="h-3 rounded-full mb-2" style={{ background: 'rgba(0,0,0,0.07)', width: '80%' }} />
          <div className="h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', width: '60%' }} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageBreadcrumb icon={FolderOpen} label="Proyectos C24" />

      <div className="flex-1 overflow-y-auto px-6 py-5 tecsis-scrollbar">
        {/* Métricas del repositorio */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 leading-none">Resumen del Repositorio Local</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(0,0,0,0.3)' }}>Métricas del ciclo académico 2024-C</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
              En línea
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-1">
            {METRIC_CARDS.map(({ key: k, ...rest }) => <MetricCard key={k} {...rest} value={metrics?.[k]} />)}
          </div>
          <DistribucionBar metrics={metrics} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Proyectos C24</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }}>
              Promoción 2024 · {conteos.todos} proyectos registrados
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg font-medium"
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
                background: filtro === tab.id ? 'rgba(0,0,0,0.08)' : 'transparent',
                color: filtro === tab.id ? '#111827' : 'rgba(0,0,0,0.4)',
                border: filtro === tab.id ? '1px solid rgba(0,0,0,0.15)' : '1px solid transparent',
              }}>
              {tab.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: filtro === tab.id ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.07)' }}>
                {conteos[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(0,0,0,0.25)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, grupo o tecnología..."
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.8)' }} />
        </div>

        {/* Grid */}
        {loading ? <GridSkeleton /> : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.codigo}
                className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all"
                style={{
                  background:  p.activo ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
                  border:      `1px solid ${p.activo ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)'}`,
                  opacity:     p.activo ? 1 : 0.55,
                }}
                onClick={() => setDetalle(p)}
                onMouseEnter={e => { if (p.activo) { e.currentTarget.style.background = 'rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.13)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = p.activo ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = p.activo ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>{p.codigo}</span>
                    <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.4)' }}>{p.grupo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EstadoBadge estado={p.estado} />
                    {/* Toggle activo */}
                    <button
                      onClick={e => handleToggleActivo(p, e)}
                      title={p.activo ? 'Desactivar (ocultar del RAG)' : 'Activar'}
                      className="flex-shrink-0 w-8 h-4 rounded-full transition-all relative"
                      style={{ background: p.activo ? '#4ade80' : 'rgba(0,0,0,0.15)' }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: p.activo ? '17px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                    {/* Eliminar */}
                    <button
                      onClick={e => handleEliminar(p, e)}
                      title="Eliminar proyecto"
                      className="flex items-center justify-center w-5 h-5 rounded transition-all"
                      style={{ color: 'rgba(0,0,0,0.2)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.2)'}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 leading-snug">{p.titulo}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(p.tecnologias || []).map(t => <TechTag key={t} name={t} />)}
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  <Users size={11} />{p.autores}
                </div>
                <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.similitud}%`, background: simColor(p.similitud) }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: simColor(p.similitud) }}>{p.similitud}% sim.</span>
                  </div>
                  {p.score && (
                    <span className="text-xs font-bold" style={{ color: '#818cf8' }}>
                      <BarChart2 size={11} className="inline mr-1" />{p.score}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.3)' }}>🗓 {p.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RegistrarProyectoModal
          onClose={() => setShowModal(false)}
          onCreated={(nuevo) => {
            setProyectos(prev => [nuevo, ...prev])
            const estadoKey = nuevo.estado || 'en-revision'
            setConteos(c => ({ ...c, todos: c.todos + 1, [estadoKey]: (c[estadoKey] || 0) + 1 }))
            showToast(`✓ Proyecto "${nuevo.titulo}" registrado correctamente`)
          }}
        />
      )}

      {detalle && (
        <DetalleTesisModal proyecto={detalle} onClose={() => setDetalle(null)} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: '#111827', color: '#fff', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── VIEW: PERFIL ─────────────────────────────────────────────────────────────

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

function DistribucionBar({ metrics }) {
  if (!metrics) return null
  const total = metrics.total_tesis || 1
  const items = [
    { label: 'Aprobadas',   value: metrics.aprobadas   || 0, color: '#4ade80' },
    { label: 'En Revisión', value: metrics.en_revision || 0, color: '#fbbf24' },
    { label: 'Observadas',  value: metrics.observadas  || 0, color: '#fb923c' },
    { label: 'Rechazadas',  value: metrics.rechazadas  || 0, color: '#f87171' },
  ]
  return (
    <div className="flex-shrink-0 pt-3 mt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(0,0,0,0.3)' }}>Distribución por estado</span>
        <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.2)' }}>{total} proyectos</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-2">
        {items.map(({ label, value, color }) =>
          value > 0 ? (
            <div key={label} title={`${label}: ${value}`}
              className="h-full transition-all duration-700"
              style={{ width: `${(value / total) * 100}%`, background: color, borderRadius: '999px' }} />
          ) : null
        )}
      </div>
      <div className="flex items-center gap-4">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {label} <span className="font-semibold" style={{ color: 'rgba(0,0,0,0.65)' }}>{value}</span>
            </span>
          </div>
        ))}
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
  {
    role: 'assistant',
    content: 'Bienvenido a TecSis-IA — plataforma centralizada para la gestión documental e investigación académica de la carrera de Diseño y Desarrollo de Software.\n\nEsta solución incorpora un backend en Django para la ingesta de documentos estructurados, un panel administrativo en React para supervisar estados de trámites y controlar la visibilidad de archivos, y un motor de Inteligencia Artificial local que permite realizar búsquedas y conteos analíticos en lenguaje natural sobre el repositorio semántico.\n\n¿En qué puedo ayudarte hoy?',
  },
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

function DashboardChatView({ metrics, userInitials = 'JG', conversacionId, onConversation }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput]       = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const fileInputRef   = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Carga los mensajes de la conversación seleccionada (o el saludo inicial si es nueva)
  useEffect(() => {
    if (!conversacionId) {
      setMessages(INITIAL_MESSAGES)
      return
    }
    let cancelled = false
    apiFetch(`/api/conversaciones/${conversacionId}/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        if (cancelled) return
        const msgs = (d.mensajes || []).map(m => ({
          role: m.role, content: m.content, documents: m.documents ?? undefined,
        }))
        setMessages(msgs.length ? msgs : INITIAL_MESSAGES)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [conversacionId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const prompt = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/rag/query/', {
        method: 'POST',
        body: JSON.stringify({ prompt, conversacion_id: conversacionId ?? null }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.llm_response, documents: data.similar_documents }])
      if (data.conversacion_id) onConversation?.(data.conversacion_id)
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setMessages(prev => [...prev, { role: 'user', content: `📄 Subiendo documento: ${file.name}` }])
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/rag/upload/', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar el PDF')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Documento indexado correctamente en el repositorio semántico.\n\n📋 Archivo: ${data.filename}\n📄 Páginas procesadas: ${data.pages}\n🧩 Chunks creados: ${data.chunks}\n🔢 Embeddings vectoriales: ${data.embeddings ? `✓ generados (384 dims · pgvector)` : '— en cola'}\n🏷️ Proyecto: ${data.tesis_codigo} — ${data.tesis_titulo}\n\nEl contenido ya está disponible para consultas RAG. Puedes preguntarme sobre el documento ahora.`,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `No pude procesar el archivo. ${err.message}`,
      }])
    } finally {
      setIsUploading(false)
    }
  }

  const quickActions = [
    { icon: Lightbulb, label: 'Analizar duplicidad',   prompt: 'Analiza si existen tesis con contenido duplicado en el repositorio' },
    { icon: BookOpen,  label: 'Buscar por tecnología', prompt: 'Muestra las tesis agrupadas por tecnología utilizada' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-2 flex-shrink-0"
          style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <Bot size={14} style={{ color: 'rgba(0,0,0,0.3)' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.5)' }}>Asistente de Revisión Semántica</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
            style={{ color: 'rgba(0,0,0,0.25)', background: 'rgba(0,0,0,0.05)' }}>
            RAG · sentence-transformers 384d
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 tecsis-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
                  <Bot size={14} />
                </div>
              )}
              <div className={`flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end max-w-[65%]' : 'max-w-[75%] items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{
                    background: msg.role === 'user' ? 'rgba(0,0,0,0.09)' : '#eceef1',
                    color: msg.role === 'user' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)',
                  }}>
                  {msg.content}
                </div>
                {msg.documents?.length > 0
                  ? msg.documents.map((doc, j) => <SimilarityCard key={j} {...doc} />)
                  : msg.role === 'assistant' && msg.documents !== undefined && (
                    <div className="text-xs px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.35)', border: '1px solid rgba(0,0,0,0.07)' }}>
                      No se encontraron documentos relacionados en el repositorio.
                    </div>
                  )
                }
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', color: '#fff' }}>{userInitials}</div>
              )}
            </div>
          ))}
          {(isLoading || isUploading) && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
                {isUploading ? <FileText size={14} /> : <Bot size={14} />}
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2" style={{ background: '#eceef1' }}>
                {isUploading && <span className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>Procesando PDF…</span>}
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'rgba(0,0,0,0.4)', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <div className="flex gap-2 mb-3">
            {quickActions.map(({ icon: Icon, label, prompt: qp }) => (
              <button key={label}
                onClick={() => { setInput(qp); textareaRef.current?.focus() }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; e.currentTarget.style.color = 'rgba(0,0,0,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'rgba(0,0,0,0.4)' }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-2xl px-3 py-2.5"
            style={{ background: '#eceef1', border: '1px solid rgba(0,0,0,0.08)' }}>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              title="Subir PDF al repositorio RAG"
              className="pb-1.5 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: isUploading ? '#818cf8' : 'rgba(0,0,0,0.3)' }}
              onMouseEnter={e => { if (!isUploading && !isLoading) e.currentTarget.style.color = '#818cf8' }}
              onMouseLeave={e => { if (!isUploading) e.currentTarget.style.color = 'rgba(0,0,0,0.3)' }}>
              <Paperclip size={17} />
            </button>
            <textarea ref={textareaRef} value={input} rows={1}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="¿Qué deseas consultar sobre los documentos?..."
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1"
              style={{ color: 'rgba(0,0,0,0.8)', minHeight: '24px', maxHeight: '120px' }} />
            <div className="flex items-center gap-2 flex-shrink-0 pb-1">
              <button className="flex items-center gap-1 text-xs transition-colors whitespace-nowrap"
                style={{ color: 'rgba(0,0,0,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,0,0,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.25)'}>
                MiniLM-L12 Local <ChevronDown size={12} />
              </button>
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(0,0,0,0.1)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(0,0,0,0.18)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}>
                <Send size={13} className="text-gray-900" />
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
  { id: 'historial', label: 'Historial de Análisis', icon: History },
  { id: 'proyectos', label: 'Proyectos C24',         icon: FolderOpen },
]

// ─── AUTH FETCH ───────────────────────────────────────────────────────────────

function apiFetch(url, options = {}) {
  const token = localStorage.getItem('tecsis_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

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

export default function App() {
  const [token, setToken]       = useState(() => localStorage.getItem('tecsis_token') || '')
  const [metrics, setMetrics]   = useState(null)
  const [perfil, setPerfil]     = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')

  const [conversaciones, setConversaciones] = useState([])
  const [activeConv, setActiveConv]         = useState(null)   // id | null (chat nuevo)

  const handleLogin = (newToken) => setToken(newToken)

  const handleLogout = () => {
    apiFetch('/api/auth/logout/', { method: 'POST' }).catch(() => {})
    localStorage.removeItem('tecsis_token')
    setToken('')
    setPerfil(null)
    setConversaciones([])
    setActiveConv(null)
  }

  const loadConversaciones = () => {
    apiFetch('/api/conversaciones/')
      .then(r => { if (r.status === 401) { handleLogout(); throw new Error() } return r.json() })
      .then(d => setConversaciones(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    if (!token) return
    fetch('/api/dashboard/metrics/')
      .then(r => r.json())
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

  useEffect(() => { if (token) loadConversaciones() }, [token])

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
