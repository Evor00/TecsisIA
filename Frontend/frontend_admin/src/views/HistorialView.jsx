import { useEffect, useState } from 'react'
import { ChevronDown, Download, FileText, Filter, History, Search } from 'lucide-react'
import { apiFetch } from '../services/api'
import { HISTORIAL_FALLBACK } from '../data/fallbackData'
import { simColor } from '../utils/similarity'
import { EstadoBadge, LoadingRows, PageBreadcrumb } from '../components/common'

function HistorialView() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    apiFetch('/api/historial/')
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


export default HistorialView
