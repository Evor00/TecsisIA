import { useEffect, useRef, useState, useCallback } from 'react'
import { BookOpen, ChevronDown, FileText, Lightbulb, Paperclip, Send, Cpu, WifiOff, Wifi, Check, Sparkles, Download, AlertCircle, Copy, RotateCcw, Square, Pencil, CheckCheck, X } from 'lucide-react'
import { apiFetch } from '../services/api'
import { SimilarityCard } from '../components/common'

// ─── Indicador de estado de La BestIA ────────────────────────────────────────
function StatusIndicator({ status }) {
  if (!status) return null
  const online = status.online
  return (
    <div className="flex items-center gap-1.5" title={status.mensaje}>
      {online
        ? <><Wifi size={11} style={{ color: '#10b981' }} /><span className="text-[11px] font-medium" style={{ color: '#10b981' }}>IA Online</span></>
        : <><WifiOff size={11} style={{ color: '#f59e0b' }} /><span className="text-[11px] font-medium" style={{ color: '#f59e0b' }}>Modo Local</span></>
      }
    </div>
  )
}

// ─── Selector de modelo ───────────────────────────────────────────────────────
function ModelSelector({ modelos, modeloActual, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const actual = modelos.find(m => m.id === modeloActual) || modelos[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled || modelos.length <= 1}
        className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors whitespace-nowrap disabled:opacity-40"
        style={{ color: 'rgba(0,0,0,0.5)', background: open ? 'rgba(0,0,0,0.05)' : 'transparent' }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = 'rgba(79,70,229,0.05)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.color = 'rgba(0,0,0,0.5)'; e.currentTarget.style.background = 'transparent' } }}
      >
        <span className="max-w-[120px] truncate">{actual?.name ?? 'Modelo'}</span>
        {modelos.length > 1 && <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 rounded-xl shadow-xl py-1.5 z-50 min-w-[220px]"
          style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
          {modelos.map(m => (
            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
              style={{ color: m.id === modeloActual ? '#4f46e5' : 'rgba(0,0,0,0.7)', background: m.id === modeloActual ? 'rgba(79,70,229,0.05)' : 'transparent' }}
              onMouseEnter={e => { if (m.id !== modeloActual) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
              onMouseLeave={e => { if (m.id !== modeloActual) e.currentTarget.style.background = 'transparent' }}>
              {m.id === modeloActual ? <Check size={14} /> : <span style={{ width: 14 }} />}
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Renderizador ligero y seguro: React escapa el texto por defecto, por lo que
// no se inyecta HTML generado por el modelo. Cubre el Markdown más útil para
// respuestas RAG: títulos, listas, negrita, código y citas.
function RichMarkdown({ content, onCitation }) {
  const renderInline = (text, lineIndex) => text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[FUENTE:\s*[^\]]+\])/g).map((part, index) => {
    const key = `${lineIndex}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="px-1 py-0.5 rounded text-[13px]" style={{ background: 'rgba(79,70,229,0.1)', color: '#4338ca' }}>{part.slice(1, -1)}</code>
    }
    const citation = part.match(/^\[FUENTE:\s*([^\]]+)\]$/)
    if (citation) {
      const code = citation[1].trim()
      return <button key={key} type="button" onClick={() => onCitation?.(code)}
        className="mx-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors"
        title={`Ver fuente ${code}`}
        style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}>
        {part}
      </button>
    }
    return part
  })

  return (
    <div className="space-y-2">
      {(content || '').split('\n').map((line, index) => {
        const heading = line.match(/^(#{1,3})\s+(.+)$/)
        const bullet = line.match(/^\s*[-*•]\s+(.+)$/)
        const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/)
        if (line.trim() === '---') return <hr key={index} className="border-slate-200 my-3" />
        if (heading) {
          const Tag = heading[1].length === 1 ? 'h2' : heading[1].length === 2 ? 'h3' : 'h4'
          return <Tag key={index} className={heading[1].length === 1 ? 'text-xl font-bold text-slate-800 pt-1' : 'text-base font-semibold text-slate-800 pt-1'}>{renderInline(heading[2], index)}</Tag>
        }
        if (bullet) return <div key={index} className="flex gap-2"><span className="text-indigo-500">•</span><span>{renderInline(bullet[1], index)}</span></div>
        if (ordered) return <div key={index} className="flex gap-2"><span className="font-semibold text-indigo-600">{ordered[1]}.</span><span>{renderInline(ordered[2], index)}</span></div>
        if (!line.trim()) return <div key={index} className="h-2" />
        return <p key={index}>{renderInline(line, index)}</p>
      })}
    </div>
  )
}

// ─── Vista principal del chat ─────────────────────────────────────────────────
function DashboardChatView({ conversacionId, onConversation }) {
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [streaming, setStreaming]     = useState(false)  // true mientras llegan tokens

  const [iaStatus, setIaStatus]       = useState(null)
  const [modelos, setModelos]         = useState([{ id: 'local-rag', name: 'RAG Local' }])
  const [modeloActual, setModeloActual] = useState('local-rag')

  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(null)
  const [selectedCitation, setSelectedCitation] = useState(null)
  const [chatError, setChatError] = useState('')

  const messagesEndRef     = useRef(null)
  const scrollContainerRef = useRef(null)
  const textareaRef        = useRef(null)
  const fileInputRef       = useRef(null)
  const abortControllerRef = useRef(null)

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120
    setUserScrolledUp(!isNearBottom)
  }

  useEffect(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, userScrolledUp])

  const checkStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/status/')
      if (!res.ok) return
      const data = await res.json()
      setIaStatus(data)
      if (data.online) {
        const r2 = await apiFetch('/api/modelos/')
        if (r2.ok) {
          const d2 = await r2.json()
          if (d2.modelos?.length) {
            setModelos(d2.modelos)
            const pred = d2.modelos.find(m => m.id === data.modelo)
            setModeloActual(pred ? pred.id : d2.modelos[0].id)
          }
        }
      } else {
        setModelos([{ id: 'local-rag', name: 'RAG Local (sin IA)' }])
        setModeloActual('local-rag')
      }
    } catch {
      // El estado de IA es informativo; el chat mantiene su modo de demostración.
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 60_000)
    return () => clearInterval(interval)
  }, [checkStatus])

  useEffect(() => {
    if (!conversacionId) { setMessages([]); setSelectedCitation(null); return }
    let cancelled = false
    apiFetch(`/api/conversaciones/${conversacionId}/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => {
        if (cancelled) return
        const msgs = (d.mensajes || []).map(m => ({
          role: m.role, content: m.content, documents: m.documents ?? undefined,
        }))
        setMessages(msgs)
      })
      .catch(() => setChatError('No se pudo cargar esta conversación. Intenta abrirla nuevamente.'))
    return () => { cancelled = true }
  }, [conversacionId])

  // ── Enviar con Streaming SSE ──────────────────────────────────────────────
  const handleSend = async (promptOverride = null) => {
    const prompt = (promptOverride ?? input).trim()
    if (!prompt || isLoading || streaming) return
    if (!prompt) return

    setUserScrolledUp(false)
    setChatError('')

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)

    // Agregar placeholder del asistente (se llenará con el stream)
    setMessages(prev => [...prev, { role: 'assistant', content: '', documents: undefined, streaming: true }])

    const token = localStorage.getItem('tecsis_token')
    let fullText = ''
    let docs = undefined
    let retrieval = undefined
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const res = await fetch('/api/rag/stream/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: abortController.signal,
        body: JSON.stringify({
          prompt,
          conversacion_id: conversacionId ?? null,
          model: modeloActual !== 'local-rag' ? modeloActual : undefined,
        }),
      })

      if (!res.ok || !res.body) throw new Error('stream no disponible')

      setIsLoading(false)
      setStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))

            if (evt.type === 'docs') {
              docs = evt.docs
              retrieval = evt.retrieval
              setMessages(prev => {
                const updated = [...prev]
                const idx = updated.findLastIndex(m => m.streaming)
                if (idx !== -1) updated[idx] = { ...updated[idx], documents: docs, retrieval }
                return updated
              })
            }

            if (evt.type === 'delta') {
              fullText += evt.text
              const snapshot = fullText
              setMessages(prev => {
                const updated = [...prev]
                const idx = updated.findLastIndex(m => m.streaming)
                if (idx !== -1) updated[idx] = { ...updated[idx], content: snapshot }
                return updated
              })
            }

            if (evt.type === 'done') {
              setMessages(prev => {
                const updated = [...prev]
                const idx = updated.findLastIndex(m => m.streaming)
                if (idx !== -1) updated[idx] = { ...updated[idx], streaming: false, retrieval: evt.retrieval ?? retrieval }
                return updated
              })
              if (evt.persistence_error) {
                setChatError('La respuesta se mostró, pero no se pudo guardar el chat. Inténtalo nuevamente.')
              }
              if (evt.conversacion_id) onConversation?.(evt.conversacion_id)
              // ── Alerta de alta similitud ──────────────────────────────
              const highSim = docs?.find(d => d.similitud >= 75)
              if (highSim) {
                setMessages(prev => [...prev, {
                  role: 'system-alert',
                  content: `⚠️ Alta similitud detectada: "${highSim.titulo}" tiene ${highSim.similitud}% de coincidencia. Se recomienda revisión exhaustiva antes de aprobar este proyecto.`,
                  similitud: highSim.similitud,
                }])
              }
            }

          } catch {
            // Un evento SSE puede llegar fragmentado; se procesará al completar el buffer.
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          const idx = updated.findLastIndex(m => m.streaming)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: fullText || 'Generación detenida por el usuario.',
              streaming: false,
              cancelled: true,
            }
          }
          return updated
        })
        return
      }
      // Fallback: usar endpoint normal si el stream falla
      try {
        const res2 = await apiFetch('/api/rag/query/', {
          method: 'POST',
          body: JSON.stringify({
            prompt,
            conversacion_id: conversacionId ?? null,
            model: modeloActual !== 'local-rag' ? modeloActual : undefined,
          }),
        })
        const data = await res2.json()
        setMessages(prev => {
          const updated = [...prev]
          const idx = updated.findLastIndex(m => m.streaming)
          if (idx !== -1) updated[idx] = { role: 'assistant', content: data.llm_response, documents: data.similar_documents, retrieval: data.retrieval, streaming: false }
          return updated
        })
        if (data.conversacion_id) onConversation?.(data.conversacion_id)
      } catch {
        setMessages(prev => {
          const updated = [...prev]
          const idx = updated.findLastIndex(m => m.streaming)
          if (idx !== -1) updated[idx] = { role: 'assistant', content: '⚠️ Error de conexión. Inténtalo de nuevo.', streaming: false, failed: true }
          return updated
        })
      }
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
      setStreaming(false)
    }
  }

  const handleStopGeneration = () => abortControllerRef.current?.abort()

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessage(index)
      window.setTimeout(() => setCopiedMessage(null), 1800)
    } catch {
      setChatError('No se pudo copiar la respuesta. Selecciona el texto manualmente.')
    }
  }

  const handleEditQuestion = (content) => {
    setInput(content)
    textareaRef.current?.focus()
  }

  const handleRegenerate = (index) => {
    const previousQuestion = messages.slice(0, index).reverse().find(message => message.role === 'user')
    if (!previousQuestion) return
    setInput(previousQuestion.content)
    setChatError('La pregunta se cargó nuevamente. Puedes ajustarla y enviarla para generar otra respuesta.')
    textareaRef.current?.focus()
  }

  // ── Subir PDF ─────────────────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setMessages(prev => [...prev, { role: 'user', content: `📄 Adjunto documento: ${file.name}` }])
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const token = localStorage.getItem('tecsis_token')
      const res = await fetch('/api/rag/upload/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `El documento fue indexado y vectorizado correctamente.\n\n• Proyecto: ${data.tesis_codigo} — ${data.tesis_titulo}\n• Páginas procesadas: ${data.pages}\n• Vectores creados: ${data.chunks}\n\nYa puedes consultarme sobre su contenido.`,
      }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error al procesar el archivo: ${err.message}` }])
    } finally {
      setIsUploading(false)
    }
  }

  // ── Exportar conversación a PDF ───────────────────────────────────────────
  const handleExportPDF = () => {
    const contenido = messages
      .filter(m => m.role !== 'system-alert')
      .map(m =>
        `<div class="msg ${m.role}">
          <strong>${m.role === 'user' ? '👤 Consulta' : '🤖 TecSis-IA'}</strong>
          <p>${m.content.replace(/\n/g, '<br>')}</p>
          ${m.documents?.map(d => `<div class="doc">📄 ${d.titulo} — ${d.autor} (${d.similitud}% similitud)</div>`).join('') || ''}
        </div>`
      ).join('')

    const html = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>TecSis-IA Reporte</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        .msg { margin: 15px 0; padding: 12px; border-radius: 8px; }
        .msg.user { background: #f1f5f9; border-left: 4px solid #6366f1; }
        .msg.assistant { background: #fafafa; border-left: 4px solid #10b981; }
        .msg strong { display: block; margin-bottom: 6px; }
        .doc { background: #ede9fe; padding: 6px 10px; border-radius: 6px; margin: 4px 0; font-size: 13px; }
      </style>
    </head><body>
      <h1>🎓 TecSis-IA — Reporte de Análisis</h1>
      <p class="meta">Generado: ${new Date().toLocaleString('es-PE')} | Repositorio DDS TECSUP</p>
      ${contenido}
    </body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.print()
  }

  const promptSuggestions = [
    { icon: Lightbulb, title: 'Analizar duplicidad',    desc: 'Compara proyectos y detecta similitudes' },
    { icon: BookOpen,  title: 'Buscar por tecnología',  desc: 'Tesis que usan React, Python, etc.' },
    { icon: Cpu,       title: 'Metodologías ágiles',    desc: 'Evalúa estructura y metodología' },
    { icon: Sparkles,  title: 'Extraer conclusiones',   desc: 'Resume los hallazgos principales' },
  ]

  const isThinking = isLoading || streaming

  return (
    <div className="academic-chat flex-1 flex flex-col relative h-full min-h-0 overflow-hidden" style={{ background: 'rgba(248,250,252,.74)' }}>

      {/* ── Top Bar ── */}
      <div className="academic-chat-toolbar absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-7 z-10 border-b"
        style={{ background: 'rgba(255,255,255,.76)', borderColor: '#e8ecf3', backdropFilter: 'blur(14px)', pointerEvents: 'none' }}>
        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
          <span className="text-sm font-bold tracking-wide text-slate-800">Academic <span className="text-indigo-600">Studio</span></span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: '#eef2ff', color: '#4f46e5' }}>C24</span>
        </div>
        <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
          <StatusIndicator status={iaStatus} />
          <button
            onClick={handleExportPDF}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors disabled:opacity-40"
            style={{ color: 'rgba(0,0,0,0.5)', background: 'transparent' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = 'rgba(79,70,229,0.07)' } }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)'; e.currentTarget.style.background = 'transparent' }}
            title="Exportar conversación como PDF"
          >
            <Download size={13} />
            Exportar
          </button>
        </div>
      </div>

      {/* ── Mensajes ── */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full pt-20 pb-44 tecsis-scrollbar min-h-0">
        <div className="max-w-4xl mx-auto w-full px-4">

          {chatError && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
              role="alert" style={{ background: 'rgba(245,158,11,0.11)', border: '1px solid rgba(245,158,11,0.28)', color: '#92400e' }}>
              <span>{chatError}</span>
              <button onClick={() => setChatError('')} className="p-1 rounded" title="Cerrar aviso"><X size={15} /></button>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="academic-chat-empty flex flex-col items-center justify-center pt-16 pb-12">
              <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', color: '#fff', boxShadow: '0 16px 34px rgba(79,70,229,.28)' }}>
                <Sparkles size={38} />
              </div>
              <p className="text-[11px] uppercase tracking-[.2em] font-bold mb-3" style={{ color: '#6366f1' }}>Repositorio académico</p>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">¿En qué te puedo ayudar?</h1>
              <p className="text-slate-500 mb-10 text-center max-w-md">
                Soy tu asistente RAG. Puedo consultar, analizar y comparar proyectos de tesis del repositorio.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {promptSuggestions.map((s, idx) => (
                  <button key={idx}
                    onClick={() => { setInput(s.title); textareaRef.current?.focus() }}
                    className="flex flex-col text-left p-4 rounded-2xl transition-all"
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <s.icon size={16} style={{ color: '#6366f1' }} />
                      <span className="font-semibold text-sm text-slate-700">{s.title}</span>
                    </div>
                    <span className="text-xs text-slate-500">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {/* ── Alerta de similitud alta ── */}
                {msg.role === 'system-alert' ? (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium w-full"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#92400e' }}>
                    <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    {msg.role === 'assistant'
                      ? <RichMarkdown content={msg.content} onCitation={setSelectedCitation} />
                      : msg.content}
                  </div>
                ) : (
                  <>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                    <Sparkles size={14} className={msg.streaming ? 'animate-pulse' : ''} />
                  </div>
                )}

                <div className={`flex flex-col space-y-3 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="text-[15px] leading-relaxed"
                    style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 'transparent',
                      color: msg.role === 'user' ? '#1e293b' : '#334155',
                      padding: msg.role === 'user' ? '12px 20px' : '0 8px',
                      borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '0',
                      whiteSpace: 'pre-wrap',
                    }}>
                    {msg.content}
                    {/* Cursor parpadeante mientras hace stream */}
                    {msg.streaming && (
                      <span className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-sm animate-pulse"
                        style={{ background: '#6366f1', verticalAlign: 'text-bottom' }} />
                    )}
                  </div>

                  {!msg.streaming && (
                    <div className="flex items-center gap-1 pl-1 opacity-80">
                      {msg.role === 'assistant' ? (
                        <>
                          <button onClick={() => handleCopy(msg.content, i)} title="Copiar respuesta"
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                            style={{ color: copiedMessage === i ? '#059669' : '#64748b' }}>
                            {copiedMessage === i ? <CheckCheck size={13} /> : <Copy size={13} />}
                            {copiedMessage === i ? 'Copiado' : 'Copiar'}
                          </button>
                          <button onClick={() => handleRegenerate(i)} title="Volver a consultar"
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                            style={{ color: '#64748b' }}>
                            <RotateCcw size={12} /> Reintentar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleEditQuestion(msg.content)} title="Editar esta pregunta"
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                          style={{ color: '#64748b' }}>
                          <Pencil size={12} /> Editar y consultar
                        </button>
                      )}
                    </div>
                  )}

                  {msg.retrieval && (
                    <div className="pl-2 text-[11px] text-slate-400">
                      {msg.retrieval.fuentes_recuperadas} fuente{msg.retrieval.fuentes_recuperadas === 1 ? '' : 's'} · {msg.retrieval.tiempo_recuperacion_ms} ms
                      {msg.retrieval.cache_hit ? ' · resultado en caché' : ''}
                    </div>
                  )}

                  {msg.documents?.length > 0 && (
                    <div className="pl-2 w-full space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuentes consultadas</div>
                      {msg.documents.map((doc, j) => <SimilarityCard key={j} {...doc} highlighted={selectedCitation === doc.cita} />)}
                    </div>
                  )}
                  </div>
                </>
                )}
              </div>
            ))}

            {/* Indicador "pensando..." antes de llegar el primer token */}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pl-2 h-8">
                  <span className="text-sm text-slate-400 font-medium">Analizando el repositorio...</span>
                  <span className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#6366f1', animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                  <FileText size={14} className="animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pl-2 h-8">
                  <span className="text-sm text-slate-400 font-medium">Procesando y vectorizando documento...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── Botón flotante para bajar a últimos mensajes ── */}
      {userScrolledUp && (
        <button
          onClick={() => {
            setUserScrolledUp(false)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-36 right-8 p-2.5 rounded-full shadow-lg transition-all z-20 flex items-center justify-center"
          style={{ background: '#4f46e5', color: '#fff', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
          title="Ir a los últimos mensajes"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* ── Input Flotante ── */}
      <div className="academic-chat-composer absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent pt-12 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="academic-chat-input relative rounded-3xl shadow-lg flex flex-col transition-all"
            style={{ background: '#fff', border: isThinking ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(0,0,0,0.08)', boxShadow: isThinking ? '0 0 0 3px rgba(99,102,241,0.08)' : '0 4px 20px rgba(0,0,0,0.05)' }}>

            <div className="flex items-end px-3 py-2">
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isThinking}
                className="p-3 rounded-full transition-colors flex-shrink-0 disabled:opacity-40"
                style={{ color: 'rgba(0,0,0,0.4)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#4f46e5' } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.4)' }}>
                <Paperclip size={20} />
              </button>

              <textarea ref={textareaRef} value={input} rows={1}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={isThinking ? 'Generando respuesta...' : 'Pregúntale a La BestIA sobre los proyectos...'}
                disabled={isThinking}
                className="flex-1 bg-transparent text-[15px] resize-none outline-none leading-relaxed py-3.5 px-2 tecsis-scrollbar disabled:opacity-60"
                style={{ color: '#1e293b', minHeight: '52px', maxHeight: '200px' }} />

              {isThinking ? (
                <button onClick={handleStopGeneration} title="Detener generación"
                  className="p-3 mb-0.5 rounded-full flex items-center justify-center transition-all"
                  style={{ background: '#ef4444' }}>
                  <Square size={15} fill="#fff" style={{ color: '#fff' }} />
                </button>
              ) : (
                <button onClick={() => handleSend()} disabled={!input.trim()}
                  className="p-3 mb-0.5 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-95"
                  style={{ background: input.trim() ? '#4f46e5' : '#e2e8f0' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#4338ca' }}
                  onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#4f46e5' }}>
                  <Send size={18} style={{ color: input.trim() ? '#fff' : '#94a3b8' }} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
              <ModelSelector modelos={modelos} modeloActual={modeloActual} onChange={setModeloActual} disabled={isThinking} />
              <span className="text-[10px] text-slate-400 font-medium">
                {isThinking ? 'Pulsa ■ para detener la generación' : 'Shift + Enter para nueva línea'}
              </span>
            </div>
          </div>

          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400">Las respuestas de la IA pueden ser inexactas. Verifica la información importante.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardChatView
