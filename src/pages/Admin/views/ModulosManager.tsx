import React, { useState, useEffect } from 'react';
import { 
  Puzzle, Plus, Search, Edit2, Trash2, X, CheckCircle2, Loader2, Link2, ShieldAlert
} from 'lucide-react';
import { permisosService } from '../../../api/permisos.service';
import toast from 'react-hot-toast';

export default function ModulosManager() {
  const [modulos, setModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: 'MOD_', descripcion: '', dependenciasIds: [] as number[]
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await permisosService.obtenerTodos();
      setModulos(data || []);
    } catch (error) {
      toast.error("Error al cargar los módulos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenDrawer = (modulo?: any) => {
    if (modulo) {
      setEditingId(modulo.id);
      setFormData({ 
        codigo: modulo.codigo, 
        descripcion: modulo.descripcion || '', 
        dependenciasIds: modulo.dependenciasIds || [] 
      });
    } else {
      setEditingId(null);
      setFormData({ codigo: 'MOD_', descripcion: '', dependenciasIds: [] });
    }
    setIsDrawerOpen(true);
  };

  const toggleDependencia = (depId: number) => {
    const actuales = formData.dependenciasIds;
    if (actuales.includes(depId)) {
      setFormData({ ...formData, dependenciasIds: actuales.filter(id => id !== depId) });
    } else {
      setFormData({ ...formData, dependenciasIds: [...actuales, depId] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guardarPromise = (async () => {
      // 1. Forzamos formato del código (Ej: mod_caja -> MOD_CAJA)
      const payload = {
        codigo: formData.codigo.toUpperCase().trim().replace(/\s/g, '_'),
        descripcion: formData.descripcion
      };

      let moduloGuardado;
      if (editingId) {
        moduloGuardado = await permisosService.actualizar(editingId, payload);
      } else {
        moduloGuardado = await permisosService.crear(payload);
      }

      // 2. Guardamos sus dependencias
      await permisosService.actualizarDependencias(moduloGuardado.id, formData.dependenciasIds);
      
      setIsDrawerOpen(false);
      await cargarDatos();
    })();

    toast.promise(guardarPromise, {
      loading: 'Configurando módulo y dependencias...',
      success: 'Módulo guardado exitosamente',
      error: 'Error al guardar el módulo'
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar este módulo? Podría romper programas que lo usen.')) {
      try {
        await permisosService.eliminar(id);
        toast.success('Módulo eliminado');
        cargarDatos();
      } catch (error) {
        toast.error('No se puede eliminar. Está siendo usado.');
      }
    }
  };

  const filteredModulos = modulos.filter(m => 
    m.codigo.toLowerCase().includes(search.toLowerCase()) || 
    m.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Puzzle className="w-8 h-8 text-black" /> Módulos SaaS (Fichas Lego)
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Crea las funcionalidades base y establece sus reglas de dependencia.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar módulo..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shrink-0">
            <Plus className="w-4 h-4" /> Nuevo Módulo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 bg-white border border-zinc-200 rounded-2xl"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModulos.map(mod => (
            <div key={mod.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-zinc-100 p-2.5 rounded-lg border border-zinc-200">
                  <Puzzle className="w-5 h-5 text-zinc-700" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenDrawer(mod)} className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-md"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(mod.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-black text-zinc-900">{mod.codigo}</h3>
              <p className="text-xs text-zinc-500 font-medium mb-4 flex-1">{mod.descripcion || 'Sin descripción'}</p>
              
              {/* Render de dependencias */}
              {mod.dependenciasIds?.length > 0 && (
                <div className="pt-3 border-t border-zinc-100">
                  <p className="text-[10px] font-extrabold uppercase text-zinc-400 mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> Requiere de:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.dependenciasIds.map((depId: number) => {
                      const dep = modulos.find(m => m.id === depId);
                      return dep ? <span key={depId} className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100">{dep.codigo.replace('MOD_', '')}</span> : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DRAWER DE EDICIÓN */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsDrawerOpen(false)}></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900">{editingId ? 'Editar Módulo' : 'Nuevo Módulo'}</h3>
            <p className="text-xs font-medium text-zinc-500">Define la ficha y sus reglas.</p>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="modForm" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Código del Módulo *</label>
              <input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} disabled={!!editingId} className="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm font-bold focus:bg-white outline-none focus:border-black disabled:opacity-50" placeholder="Ej. MOD_CAJA" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Descripción *</label>
              <textarea required rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm font-medium focus:bg-white outline-none focus:border-black resize-none" placeholder="¿Qué hace este módulo?" />
            </div>

            {/* SELECCIÓN DE DEPENDENCIAS */}
            <div className="pt-4 space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Dependencias (Opcional)</label>
              <p className="text-xs text-zinc-500 mb-3">Si activas esto, obligarás a que se incluyan estos módulos al empaquetar programas.</p>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {modulos.filter(m => m.id !== editingId).map(mod => {
                  const isSelected = formData.dependenciasIds.includes(mod.id);
                  return (
                    <div key={mod.id} onClick={() => toggleDependencia(mod.id)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-white border-indigo-300 shadow-sm' : 'border-transparent hover:bg-zinc-100'}`}>
                       <div className={`w-4 h-4 rounded border flex justify-center items-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-zinc-300'}`}>
                         {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                       </div>
                       <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-zinc-600'}`}>{mod.codigo}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex gap-3">
          <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 rounded-xl border text-sm font-bold text-zinc-600 hover:bg-zinc-100">Cancelar</button>
          <button type="submit" form="modForm" className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold shadow-md hover:bg-zinc-800">Guardar</button>
        </div>
      </div>
    </div>
  );
}