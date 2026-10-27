import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, BrainCircuit, CheckCircle2, Clock3, FileText, GitCompareArrows, Layers3, MessageSquareText, Sparkles, UsersRound } from 'lucide-react'
import { apiFetch } from '../services/api'

const LIMITS = ['Hoy', 'Semana', 'Mes']

function Metric({ icon: Icon, value, label, change, tone, dark }) {
  const tones = {
    violet: ['#6d28d9', '#a78bfa'],
    emerald: ['#047857', '#34d399'],
    amber: ['#a16207', '#fbbf24'],
    cyan: ['#0369a1', '#22d3ee'],
  }
  const [from, accent] = tones[tone]
  return (
    <div className="astra-metric rounded-2xl p-4" style={{ background: dark ? `linear-gradient(135deg, ${from}52, ${dark ? '#101f34' : '#fff'} 78%)` : '#fff', border: `1px solid ${dark ? `${accent}26` : '#e7ebf4'}` }}>
      <div className="flex items-start justify-between">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}><Icon size={17} /></span>
        {change && <span className="text-[11px] font-bold" style={{ color: accent }}>{change}</span>}
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight" style={{ color: dark ? '#f8fafc' : '#172554' }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: dark ? '#91a4c1' : '#64748b' }}>{label}</div>
    </div>
  )
}

export default function DashboardHomeView({ metrics, theme, onOpenChat }) {
  const dark = theme === 'dark'
  const [range, setRange] = useState('Semana')
  const [projects, setProjects] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    apiFetch('/api/proyectos/').then(r => r.ok ? r.json() : null).then(d => setProjects(d?.proyectos?.slice(0, 4) || [])).catch(() => {})
    apiFetch('/api/historial/').then(r => r.ok ? r.json() : null).then(d => setHistory((Array.isArray(d) ? d : []).slice(0, 4))).catch(() => {})
  }, [])

  const recent = useMemo(() => projects.map((p, index) => ({ ...p, color: ['#06b6d4', '#f59e0b', '#8b5cf6', '#10b981'][index] })), [projects])
  const panel = dark ? '#0d1d31' : '#fff'
  const border = dark ? 'rgba(56,189,248,.16)' : '#e5eaf3'
  const muted = dark ? '#91a4c1' : '#64748b'
  const title = dark ? '#f8fafc' : '#172554'

  return (
    <div className="astra-home flex-1 min-h-0 h-full overflow-y-auto tecsis-scrollbar" style={{ background: dark ? '#071525' : '#f5f7fb' }}>
      <div className="max-w-6xl mx-auto px-6 py-7 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: dark ? '#22d3ee' : '#6366f1' }}>Repositorio académico</p>
            <h1 className="text-2xl font-bold mt-1" style={{ color: title }}>Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: muted }}>Resumen de tu actividad académica</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: dark ? '#10243d' : '#e9eef8', border: `1px solid ${border}` }}>
            {LIMITS.map(item => <button key={item} onClick={() => setRange(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: range === item ? (dark ? '#344862' : '#fff') : 'transparent', color: range === item ? (dark ? '#fff' : '#334155') : muted, boxShadow: range === item ? (dark ? '0 3px 10px rgba(0,0,0,.22)' : '0 2px 7px rgba(30,41,59,.08)') : 'none' }}>{item}</button>)}
            <button className="px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ color: muted }}>2024 C⌄</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Metric dark={dark} icon={Layers3} value={metrics?.total_tesis ?? 20} label="Tesis indexadas" change="+12%" tone="violet" />
          <Metric dark={dark} icon={CheckCircle2} value={metrics?.aprobadas ?? 16} label="Aprobadas" change="+9%" tone="emerald" />
          <Metric dark={dark} icon={Clock3} value={metrics?.en_revision ?? 2} label="En revisión" change="-10%" tone="amber" />
          <Metric dark={dark} icon={BrainCircuit} value={history.length || '—'} label="Consultas IA" change="+23%" tone="cyan" />
        </div>

        <section className="rounded-[24px] p-5 sm:p-6 mb-5 overflow-hidden relative" style={{ background: dark ? 'linear-gradient(130deg,#0a2640,#0e1c32 60%,#102a46)' : 'linear-gradient(130deg,#eef2ff,#fff 55%,#ecfeff)', border: `1px solid ${dark ? 'rgba(34,211,238,.38)' : '#c7d2fe'}`, boxShadow: dark ? '0 18px 45px rgba(0,0,0,.22)' : '0 14px 34px rgba(79,70,229,.08)' }}>
          <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,.24), transparent 67%)' }} />
          <div className="flex flex-wrap gap-4 items-start relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)', color: '#fff', boxShadow: '0 10px 20px rgba(6,182,212,.22)' }}><Sparkles size={23} /></div>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2"><h2 className="font-bold text-lg" style={{ color: title }}>Asistente RAG</h2><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: dark ? 'rgba(34,211,238,.13)' : '#e0f2fe', color: dark ? '#67e8f9' : '#0369a1' }}>BASE ACADÉMICA</span></div>
              <p className="text-xs mt-1" style={{ color: muted }}>Tu asistente inteligente para análisis de tesis y evidencia verificable.</p>
            </div>
            <div className="flex gap-2"><span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: dark ? 'rgba(34,211,238,.09)' : '#eef2ff', color: dark ? '#67e8f9' : '#4f46e5' }}><BookOpen size={16} /></span><span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: dark ? 'rgba(34,211,238,.09)' : '#eef2ff', color: dark ? '#67e8f9' : '#4f46e5' }}><GitCompareArrows size={16} /></span></div>
          </div>
          <div className="relative mt-6">
            <h3 className="font-semibold" style={{ color: title }}>¿En qué puedo ayudarte hoy?</h3>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Analizar similitud', 'Metodologías ágiles', 'Comparar proyectos', 'Generar conclusiones'].map(item => <button key={item} onClick={onOpenChat} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ background: dark ? 'rgba(15,35,59,.86)' : '#fff', color: dark ? '#b9c9df' : '#475569', border: `1px solid ${dark ? 'rgba(56,189,248,.15)' : '#e2e8f0'}` }}>{item}</button>)}
            </div>
            <button onClick={onOpenChat} className="mt-4 w-full flex items-center justify-between rounded-xl p-3 text-left" style={{ background: dark ? '#10263e' : '#fff', border: `1px solid ${dark ? 'rgba(34,211,238,.23)' : '#dbeafe'}` }}>
              <span className="text-sm" style={{ color: muted }}>Pregunta sobre tesis, temas, autores…</span><span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: '#06b6d4', color: '#fff' }}><ArrowUpRight size={16} /></span>
            </button>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] font-medium" style={{ color: dark ? '#70b5c4' : '#64748b' }}><span>RAG Local</span><span>• Base académica</span><span>• Respuestas con fuentes</span></div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_.8fr] gap-5">
          <section className="rounded-2xl p-5" style={{ background: panel, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-sm" style={{ color: title }}>Últimos proyectos</h2><button className="text-xs font-semibold flex items-center gap-1" style={{ color: dark ? '#22d3ee' : '#4f46e5' }}>Ver todos <ArrowUpRight size={13} /></button></div>
            <div className="space-y-2.5">
              {recent.length ? recent.map(p => <div key={p.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: dark ? 'rgba(148,163,184,.045)' : '#f8fafc' }}><span className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: `${p.color}20`, color: p.color }}><FileText size={16} /></span><div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate" style={{ color: title }}>{p.codigo} · {p.titulo}</div><div className="text-[11px] mt-1" style={{ color: muted }}>{p.estado === 'aprobado' ? 'Aprobado' : p.estado} · {p.fecha}</div></div><span className="text-xs font-bold" style={{ color: p.color }}>{p.similitud}%</span></div>) : <div className="text-xs py-7 text-center" style={{ color: muted }}>Cargando proyectos…</div>}
            </div>
          </section>
          <section className="rounded-2xl p-5" style={{ background: panel, border: `1px solid ${border}` }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: title }}>Actividad reciente</h2>
            <div className="space-y-4">{history.length ? history.map((item, index) => <div className="flex gap-3" key={item.id}><span className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: index % 2 ? 'rgba(139,92,246,.13)' : 'rgba(6,182,212,.13)', color: index % 2 ? '#a78bfa' : '#22d3ee' }}>{index % 2 ? <UsersRound size={14} /> : <MessageSquareText size={14} />}</span><div><div className="text-xs font-semibold line-clamp-1" style={{ color: title }}>{item.titulo}</div><div className="text-[11px] mt-1" style={{ color: muted }}>Hace {index * 2 + 1} hora{index ? 's' : ''}</div></div></div>) : <div className="text-xs py-7 text-center" style={{ color: muted }}>Tu actividad aparecerá aquí.</div>}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
