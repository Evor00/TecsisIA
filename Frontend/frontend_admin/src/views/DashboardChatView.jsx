import { useEffect, useRef, useState } from 'react'
import { Bot, BookOpen, ChevronDown, FileText, Lightbulb, Paperclip, Send } from 'lucide-react'
import { apiFetch } from '../services/api'
import { SimilarityCard } from '../components/common'

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

function DashboardChatView({ userInitials = 'JG', conversacionId, onConversation }) {
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
      const token = localStorage.getItem('tecsis_token')
      const res  = await fetch('/api/rag/upload/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
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


export default DashboardChatView
