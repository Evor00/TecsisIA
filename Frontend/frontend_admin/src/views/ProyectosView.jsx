import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BarChart2,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileText,
  FolderOpen,
  Paperclip,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { apiFetch } from '../services/api'
import { PROYECTOS_FALLBACK } from '../data/fallbackData'
import { simColor } from '../utils/similarity'
import { EstadoBadge, DistribucionBar, MetricCard, PageBreadcrumb, TechTag } from '../components/common'

const METRIC_CARDS = [
  { label: 'Total Indexadas', key: 'total_tesis', icon: BookMarked, gradientFrom: 'rgba(59,130,246,0.12)',  iconBg: 'rgba(59,130,246,0.2)',  iconColor: '#60a5fa' },
  { label: 'Aprobadas',       key: 'aprobadas',   icon: FileCheck,  gradientFrom: 'rgba(16,185,129,0.12)', iconBg: 'rgba(16,185,129,0.2)', iconColor: '#34d399' },
  { label: 'En Revisi?n',     key: 'en_revision', icon: Clock,      gradientFrom: 'rgba(245,158,11,0.12)', iconBg: 'rgba(245,158,11,0.2)', iconColor: '#fbbf24' },
]

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'rgba(0,0,0,0.45)' }}>{label}</label>
      {children}
    </div>
  )
}

function GridSkeleton() {
  return (
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
}

function DetalleTesisModal({ proyecto: p, onClose }) {
  const [detalle, setDetalle] = useState(null)

  useEffect(() => {
    if (!p.id) return
    apiFetch(`/api/proyectos/${p.id}/`)
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
        const token = localStorage.getItem('tecsis_token')
        await fetch('/api/rag/upload/', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        })
      }

      onCreated(data)
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo registrar el proyecto.')
    } finally {
      setSaving(false); setSavingStep('')
    }
  }


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

  // eslint-disable-next-line react-hooks/set-state-in-effect
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


export default ProyectosView
