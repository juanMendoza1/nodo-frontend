import React, { useState, useEffect } from 'react';
import { 
  PackageSearch, Plus, Search, Edit2, Trash2, 
  X, CheckCircle2, Loader2, Cpu, Code2, PlayCircle, Lock
} from 'lucide-react';
import { programasService, type ProgramaData } from '../../../api/programas.service';

export default function ProgramasManager() {
  const [programas, setProgramas] = useState<ProgramaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Estados del Drawer (Panel lateral)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProgramaData>({
    codigo: '', nombre: '', descripcion: '', version: '1.0.0', activo: true
  });

  const cargarProgramas = async () => {
    setLoading(true);
    try {
      const data = await programasService.obtenerTodos();
      setProgramas(data || []);
    } catch (error) {
      console.error("Error cargando programas:", error);
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProgramas();
  }, []);

  const handleOpenDrawer = (programa?: ProgramaData) => {
    if (programa) {
      setEditingId(programa.id!);
      setFormData(programa);
    } else {
      setEditingId(null);
      setFormData({ codigo: '', nombre: '', descripcion: '', version: '1.0.0', activo: true });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await programasService.actualizar(editingId, formData);
      } else {
        await programasService.crear(formData);
      }
      handleCloseDrawer();
      cargarProgramas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar el Programa.");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este Programa? Afectará a los tenants suscritos.')) {
      try {
        await programasService.eliminar(id);
        cargarProgramas();
      } catch (error) {
        alert("No se puede eliminar porque hay comercios (Tenants) con suscripciones activas a este programa.");
      }
    }
  };

  const filteredProgramas = programas.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-black" /> Catálogo de Programas
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Gestión de Módulos (Software) y empaquetado de licencias SaaS.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por código o módulo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
            />
          </div>
          <button 
            onClick={() => handleOpenDrawer()} 
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md hover:shadow-xl shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo Programa
          </button>
        </div>
      </div>

      {/* ÁREA DE TRABAJO: GRID DE TARJETAS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-zinc-200 rounded-2xl">
          <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
          <p className="text-zinc-500 font-bold">Cargando portafolio de software...</p>
        </div>
      ) : filteredProgramas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-zinc-200 rounded-2xl">
          <PackageSearch className="w-12 h-12 text-zinc-300 mb-4" />
          <p className="text-zinc-500 font-bold text-lg">No hay programas registrados.</p>
          <p className="text-zinc-400 text-sm mt-1">Crea tu primer módulo para comenzar a comercializar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProgramas.map((prog) => (
            <div key={prog.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-black transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
              
              {/* Decoración de la tarjeta */}
              <div className="absolute -right-6 -top-6 text-zinc-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                 <Code2 className="w-32 h-32" />
              </div>

              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 group-hover:bg-black group-hover:border-black transition-colors">
                  <PlayCircle className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                  prog.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {prog.activo ? 'Vigente' : 'Deprecado'}
                </span>
              </div>
              
              <div className="relative z-10 flex-1">
                <h3 className="text-xl font-black text-zinc-900 leading-tight mb-1">{prog.nombre}</h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">ID: {prog.codigo}</p>
                <p className="text-sm font-medium text-zinc-600 line-clamp-3 leading-relaxed">
                  {prog.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" /> v{prog.version || '1.0'}
                </span>
                
                {/* Botones de Acción */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenDrawer(prog)} 
                    className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(prog.id!)} 
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRAWER (PANEL LATERAL) PARA EL FORMULARIO */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-black" />
              {editingId ? 'Editar Programa' : 'Nuevo Programa'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Configura el paquete SaaS.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="programaForm" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Código Único *</label>
                <input 
                  required
                  type="text" 
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="Ej. POS_CORE"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Versión</label>
                <input 
                  type="text" 
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="Ej. 1.0.0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre del Módulo *</label>
              <input 
                required
                type="text" 
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="Ej. Sistema de Inventario Básico"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Descripción / Detalles</label>
              <textarea 
                rows={4}
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                placeholder="¿Qué funcionalidades incluye este paquete?"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              <input 
                type="checkbox" 
                id="estadoActivo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black accent-black"
              />
              <label htmlFor="estadoActivo" className="text-sm font-bold text-zinc-700 cursor-pointer">
                Programa Activo y Comercializable
              </label>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-4">
               <p className="text-xs text-blue-700 font-medium">
                 <strong>Próximamente:</strong> Aquí podrás vincular los Roles y Funciones específicas (Permisos) que contiene este Módulo.
               </p>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleCloseDrawer}
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="programaForm"
              disabled={!formData.codigo || !formData.nombre}
              className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar Módulo'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}