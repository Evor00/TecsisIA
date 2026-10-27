import { FileCheck, CheckCircle2, Clock, AlertCircle, XCircle, MinusCircle } from 'lucide-react'
import { TECH_COLORS } from '../data/uiConfig'

function MetricCard({ label, value, gradientFrom, iconBg, iconColor, icon: Icon }) {
  return (
    <div className="academic-metric-card relative rounded-2xl p-4 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,.94)', border: '1px solid #e7eaf2', boxShadow: '0 8px 22px rgba(30,41,59,.045)' }}>
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

function SimilarityCard({ titulo, autor, similitud, cita, highlighted = false }) {
  return (
    <div className="academic-similarity-card rounded-xl p-3 flex items-center gap-3"
      style={{
        background: highlighted ? 'rgba(79,70,229,0.08)' : 'rgba(0,0,0,0.03)',
        border: highlighted ? '1px solid rgba(79,70,229,0.45)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: highlighted ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
      }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.2))' }}>
        <FileCheck size={16} style={{ color: '#60a5fa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">{titulo}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{autor}{cita ? ` · ${cita}` : ''}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="text-lg font-bold" style={{ color: '#34d399' }}>{similitud}%</div>
        <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }}>
          <div className="h-full rounded-full" style={{ width: `${similitud}%`, background: similitud >= 75 ? 'linear-gradient(to right,#22c55e,#16a34a)' : similitud >= 50 ? 'linear-gradient(to right,#f59e0b,#d97706)' : 'linear-gradient(to right,#6366f1,#8b5cf6)' }} />
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
    <div className="academic-breadcrumb flex items-center gap-2 px-6 py-3 border-b flex-shrink-0"
      style={{ background: 'rgba(255,255,255,.72)', borderColor: '#e8ecf3' }}>
      <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#eef2ff' }}><Icon size={13} style={{ color: '#6366f1' }} /></span>
      <span className="text-xs font-semibold" style={{ color: '#64748b' }}>{label}</span>
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

export {
  MetricCard,
  SimilarityCard,
  TechTag,
  EstadoBadge,
  PageBreadcrumb,
  LoadingRows,
  DistribucionBar,
}
