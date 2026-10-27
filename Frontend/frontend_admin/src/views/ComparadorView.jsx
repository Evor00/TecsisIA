import { useEffect, useState, useRef } from 'react'
import { GitCompare, Search, Sparkles } from 'lucide-react'
import { apiFetch } from '../services/api'
import { PageBreadcrumb } from '../components/common'

export default function ComparadorView() {
  const [proyectos, setProyectos] = useState([])
  const [search, setSearch] = useState('')
  const [soloAprobados, setSoloAprobados] = useState(false)
  
  const [seleccionados, setSeleccionados] = useState([])
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  
  const resultRef = useRef(null)

  useEffect(() => {
    apiFetch('/api/proyectos/')
      .then(r => { if (!r.ok) throw new Error('No se pudieron cargar los proyectos') ; return r.json() })
      .then(d => setProyectos(Array.isArray(d) ? d : []))
      .catch(() => { setProyectos([]) })
  }, [])

  const filtered = proyectos.filter(p => {
    const s = search.toLowerCase()
    const match = p.titulo.toLowerCase().includes(s) || p.autor.toLowerCase().includes(s)
    const apro = soloAprobados ? p.estado === 'Aprobado' : true
    return match && apro
  })

  const toggleSelect = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(prev => prev.filter(x => x !== id))
    } else {
      if (seleccionados.length < 5) {
        setSeleccionados(prev => [...prev, id])
      }
    }
  }

  const handleComparar = async () => {
    if (seleccionados.length < 2) return
    setAnalizando(true)
    setResultado({ texto: '', streamStatus: 'loading', proyectosInfo: [] })
    
    // Scroll to result area smoothly after a short delay
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    try {
      const res = await apiFetch('/api/rag/comparar/', {
        method: 'POST',
        body: JSON.stringify({ tesis_ids: seleccionados })
      })
      if (!res.ok || !res.body) throw new Error('No se pudo iniciar la comparación')
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        
        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue
          const jsonStr = line.replace(/^data:\s*/, '')
          if (!jsonStr) continue
          
          try {
            const data = JSON.parse(jsonStr)
            if (data.type === 'proyectos') {
              setResultado(r => ({ ...r, proyectosInfo: data.proyectos }))
            } else if (data.type === 'delta') {
              setResultado(r => ({ ...r, texto: r.texto + data.text }))
            } else if (data.type === 'done') {
              setResultado(r => ({ ...r, streamStatus: 'done' }))
              setAnalizando(false)
            }
          } catch {
            // Un evento SSE incompleto se completa con el siguiente fragmento.
          }
        }
      }
    } catch {
      setResultado(r => ({ ...r, texto: "Hubo un error al comparar los proyectos.", streamStatus: 'done' }))
      setAnalizando(false)
    }
  }

  return (
    <div className="academic-comparator flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      <PageBreadcrumb icon={GitCompare} label="Comparador de Tesis" />
      
      <div className="flex-1 overflow-y-auto p-6 tecsis-scrollbar bg-gray-50/50">
        
        {/* Panel de Selección */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Seleccionar Proyectos</h2>
              <p className="text-sm text-gray-500">Selecciona entre 2 y 5 proyectos para realizar una comparación profunda.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={soloAprobados} onChange={e => setSoloAprobados(e.target.checked)} className="rounded text-indigo-500 focus:ring-indigo-500"/>
                Solo Aprobados
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" placeholder="Buscar por título o autor..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 tecsis-scrollbar">
            {filtered.map(p => {
              const selected = seleccionados.includes(p.id)
              const disabled = !selected && seleccionados.length >= 5
              return (
                <div 
                  key={p.id}
                  onClick={() => !disabled && toggleSelect(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 
                    disabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 
                    'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selected} readOnly className="mt-1 rounded text-indigo-500" />
                    <div>
                      <div className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{p.titulo}</div>
                      <div className="text-[10px] text-gray-500">{p.autor}</div>
                      <div className="text-[10px] mt-1 text-indigo-600 bg-indigo-100 inline-block px-1.5 rounded">{p.codigo}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="col-span-3 text-center py-6 text-sm text-gray-400">No se encontraron proyectos.</div>}
          </div>

          <div className="mt-5 pt-4 border-t flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              {seleccionados.length} / 5 proyectos seleccionados
            </div>
            <button 
              onClick={handleComparar} 
              disabled={seleccionados.length < 2 || analizando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <Sparkles size={16} />
              {analizando ? 'Analizando...' : 'Comparar Proyectos'}
            </button>
          </div>
        </div>

        {/* Panel de Resultados */}
        {(resultado || analizando) && (
          <div ref={resultRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <GitCompare size={20} className="text-indigo-500" />
              Resultado del Análisis
            </h2>

            {resultado?.proyectosInfo?.length > 0 && (
              <div className="flex gap-4 mb-6 pb-6 border-b overflow-x-auto">
                {resultado.proyectosInfo.map(p => (
                  <div key={p.id} className="min-w-[200px] flex-1 bg-gray-50 border rounded-lg p-3">
                    <div className="text-[10px] font-bold text-indigo-500 mb-1">{p.codigo}</div>
                    <div className="text-xs font-medium text-gray-800 line-clamp-2">{p.titulo}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {resultado?.texto ? (
                <>
                  <div>{resultado.texto}</div>
                  {resultado.streamStatus === 'loading' && <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle"></span>}
                </>
              ) : (
                <div className="flex items-center gap-2 text-indigo-500">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  Iniciando comparación...
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
