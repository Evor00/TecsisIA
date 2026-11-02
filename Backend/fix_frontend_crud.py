import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

edit_modal = '''
function EditarProyectoModal({ proyecto, onClose, onUpdated }) {
  const [form, setForm]           = useState({ 
    titulo: proyecto.titulo || '', 
    autor: proyecto.autores || proyecto.autor || '', 
    grupo: proyecto.grupo || '', 
    promocion: proyecto.promocion || 'C24', 
    tecnologias: proyecto.tecnologias || [], 
    resumen: proyecto.resumen || '', 
    estado: proyecto.estado || 'en-revision', 
    codigo: proyecto.codigo || '', 
    score: proyecto.score || '',
    activo: proyecto.activo !== false
  })
  const [techInput, setTechInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const addTech = (name) => {
    const t = (name || techInput).trim()
    if (t && !form.tecnologias.includes(t))
      setForm(f => ({ ...f, tecnologias: [...f.tecnologias, t] }))
    setTechInput('')
  }
  const removeTech = (t) => setForm(f => ({ ...f, tecnologias: f.tecnologias.filter(x => x !== t) }))

  const handleUpdate = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(/api/proyectos//, {
        method: 'PATCH',
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      onUpdated({ ...proyecto, ...form })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Editar Proyecto</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Ttulo del Proyecto</label>
            <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Autor(es)</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.autor} onChange={e => setForm({...form, autor: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Grupo / Seccin</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.grupo} onChange={e => setForm({...form, grupo: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cdigo (Opcional)</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Promocin</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.promocion} onChange={e => setForm({...form, promocion: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                <option value="en-revision">En Revisin</option>
                <option value="aprobado">Aprobado</option>
                <option value="observado">Observado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Calificacin / Score (Opcional)</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.score} onChange={e => setForm({...form, score: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tecnologas</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ej. React, Python..." value={techInput} onChange={e=>setTechInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTech()} />
              <button onClick={()=>addTech()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tecnologias.map(t => (
                <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium flex items-center gap-1">
                  {t} <button onClick={()=>removeTech(t)} className="text-indigo-400 hover:text-indigo-700"><X size={12}/></button>
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Resumen (Actualiza el 1er chunk)</label>
            <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[100px]" value={form.resumen} onChange={e => setForm({...form, resumen: e.target.value})} />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
          <button onClick={handleUpdate} disabled={saving || !form.titulo || !form.autor} className="px-6 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
'''

content = content.replace("function RegistrarProyectoModal(", edit_modal + "\nfunction RegistrarProyectoModal(")

# Now we need to add the Edit state and button to the main ProyectosView
# Find: const [showModal, setShowModal] = useState(false)
content = content.replace(
    "const [showModal, setShowModal] = useState(false)",
    "const [showModal, setShowModal] = useState(false)\n  const [editingProyecto, setEditingProyecto] = useState(null)"
)

# Add Edit Icon to lucide-react imports if it's missing (let's assume we can use Edit2 from lucide-react)
# In ProyectosView.jsx: import { Search, Filter, Plus, FileText, Download, X, Eye, Trash2, CheckCircle2, AlertCircle, Clock, XCircle, Database, Server, RefreshCw } from 'lucide-react'
if "Edit2" not in content:
    content = content.replace("Trash2,", "Trash2, Edit2,")

# Add the editing modal at the bottom
# Replace: {showModal && (
replacement_modal = '''
      {editingProyecto && (
        <EditarProyectoModal 
          proyecto={editingProyecto} 
          onClose={() => setEditingProyecto(null)} 
          onUpdated={(updated) => {
            setProyectos(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingProyecto(null)
            showToast(? Proyecto "" actualizado)
          }} 
        />
      )}

      {showModal && (
'''
content = content.replace("{showModal && (", replacement_modal)

# Add the Edit button next to Delete
# Replace: <button onClick={e => handleEliminar(p, e)}
edit_btn = '''
                    <button 
                      onClick={e => { e.stopPropagation(); setEditingProyecto(p); }}
                      title="Editar proyecto"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
'''
content = content.replace("<button \n                      onClick={e => handleEliminar(p, e)}", edit_btn.strip() + " \n                      onClick={e => handleEliminar(p, e)}")

# Fix one issue: I need to replace strictly
content = re.sub(
    r"<button\s+onClick=\{e => handleEliminar\(p, e\)\}",
    edit_btn + r"<button onClick={e => handleEliminar(p, e)}",
    content
)

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected EditarProyectoModal and buttons.")
