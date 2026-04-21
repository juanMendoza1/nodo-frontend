import React, { useState, useEffect } from 'react';
import { 
  PackageSearch, Plus, Search, Edit2, Trash2, 
  X, CheckCircle2, Loader2, Cpu, Code2, PlayCircle, Lock, CheckSquare, Server, AlertTriangle, Database
} from 'lucide-react';
import { programasService, type ProgramaData } from '../../../api/programas.service';
import api from '../../../api/axios.config';
import toast from 'react-hot-toast';

export default function ProgramasManager() {
  const [programas, setProgramas] = useState<ProgramaData[]>([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState<any[]>([]);
  const [dominios, setDominios] = useState<any[]>([]); 
  const [estructuras, setEstructuras] = useState<any[]>([]); // 🔥 NUEVO ESTADO PARA ESTRUCTURAS
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 🔥 AÑADIMOS estructurasIds AL ESTADO INICIAL
  const [formData, setFormData] = useState<ProgramaData>({
    codigo: '', nombre: '', descripcion: '', version: '1.0.0', activo: true, permisosIds: [], dominioId: undefined, estructurasIds: []
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 🔥 AÑADIMOS LA LLAMADA AL API DE ESTRUCTURAS
      const [progs, perms, doms, ests] = await Promise.all([
        programasService.obtenerTodos(),
        api.get('/api/permisos').then(r => r.data),
        api.get('/api/dominios-operativos').then(r => r.data),
        api.get('/api/estructuras').then(r => r.data)
      ]);
      setProgramas(progs || []);
      setPermisosDisponibles(perms || []);
      setDominios(doms || []);
      setEstructuras(ests || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los catálogos del sistema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenDrawer = (programa?: ProgramaData) => {
    if (programa) {
      setEditingId(programa.id!);
      setFormData({ 
        ...programa, 
        permisosIds: programa.permisosIds || [],
        dominioId: programa.dominioId,
        estructurasIds: programa.estructurasIds || [] // 🔥 CARGAMOS LAS ESTRUCTURAS GUARDADAS
      });
    } else {
      setEditingId(null);
      setFormData({ codigo: '', nombre: '', descripcion: '', version: '1.0.0', activo: true, permisosIds: [], dominioId: undefined, estructurasIds: [] });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  // 🔥 Lógica de Dependencias 100% Dinámica para MÓDULOS
  const togglePermiso = (permisoId: number) => {
    const actuales = new Set(formData.permisosIds || []);
    
    if (actuales.has(permisoId)) {
      // INTENTO DE DESMARCAR: Verificamos si alguien más lo necesita
      const requeridoPor = permisosDisponibles.find(p => 
        actuales.has(p.id) && p.dependenciasIds?.includes(permisoId)
      );
      
      if (requeridoPor) {
        toast.error(`No puedes quitar este módulo porque "${requeridoPor.codigo.replace('MOD_', '')}" lo requiere.`);
        return; 
      }
      
      actuales.delete(permisoId);
    } else {
      // INTENTO DE MARCAR: Lo agregamos y auto-marcamos sus dependencias
      actuales.add(permisoId);
      
      const permisoSeleccionado = permisosDisponibles.find(p => p.id === permisoId);
      if (permisoSeleccionado && permisoSeleccionado.dependenciasIds?.length > 0) {
        let agregadas = false;
        permisoSeleccionado.dependenciasIds.forEach((depId: number) => {
          if (!actuales.has(depId)) {
             actuales.add(depId);
             agregadas = true;
          }
        });
        if (agregadas) {
          toast.success("Dependencias añadidas automáticamente", { icon: '🔗' });
        }
      }
    }
    
    setFormData({ ...formData, permisosIds: Array.from(actuales) });
  };

  // 🔥 NUEVO: Función para alternar la selección de Estructuras
  const toggleEstructura = (estId: number) => {
    const actuales = new Set(formData.estructurasIds || []);
    if (actuales.has(estId)) {
      actuales.delete(estId);
    } else {
      actuales.add(estId);
    }
    setFormData({ ...formData, estructurasIds: Array.from(actuales) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guardarPromise = (async () => {
      const payload = {
        ...formData,
        codigo: formData.codigo.toUpperCase().replace(/\s/g, '_')
      };

      if (editingId) {
        await programasService.actualizar(editingId, payload);
      } else {
        await programasService.crear(payload);
      }
      handleCloseDrawer();
      await cargarDatos();
    })();

    toast.promise(guardarPromise, {
      loading: 'Empaquetando módulo...',
      success: 'Programa guardado con éxito',
      error: (err) => err.response?.data?.message || 'Error al guardar'
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este Programa? Afectará a los tenants suscritos.')) {
      const eliminarPromise = (async () => {
        await programasService.eliminar(id);
        await cargarDatos();
      })();

      toast.promise(eliminarPromise, {
        loading: 'Eliminando...',
        success: 'Programa eliminado correctamente',
        error: 'No se puede eliminar porque hay comercios con suscripciones activas a este programa.'
      });
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
          <p className="text-sm text-zinc-500 font-medium mt-1">Arma paquetes SaaS (Legos) agrupando funcionalidades, módulos y estructuras de datos.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" placeholder="Buscar por código o módulo..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
            />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md hover:shadow-xl shrink-0">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProgramas.map((prog) => (
            <div key={prog.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-black transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
              
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
                <p className="text-sm font-medium text-zinc-600 line-clamp-3 leading-relaxed mb-3">
                  {prog.descripcion || 'Sin descripción detallada.'}
                </p>
                
                {prog.dominioNombre ? (
                  <div className="flex items-center gap-1.5 mb-3 text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 w-max px-2 py-1 rounded-md shadow-sm">
                    <Server className="w-3 h-3" /> {prog.dominioNombre}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-3 text-[10px] font-extrabold uppercase text-red-600 bg-red-50 border border-red-100 w-max px-2 py-1 rounded-md shadow-sm animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> Sin Dominio Asignado
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {(prog.permisosCodigos || []).slice(0, 3).map(cod => (
                    <span key={cod} className="bg-zinc-100 text-zinc-600 text-[9px] font-bold px-2 py-0.5 rounded border border-zinc-200">{cod.replace('MOD_', '')}</span>
                  ))}
                  {(prog.permisosCodigos || []).length > 3 && (
                    <span className="bg-zinc-100 text-zinc-600 text-[9px] font-bold px-2 py-0.5 rounded border border-zinc-200">+{prog.permisosCodigos!.length - 3}</span>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" /> v{prog.version || '1.0'}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenDrawer(prog)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(prog.id!)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRAWER (PANEL LATERAL) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-black" />
              {editingId ? 'Editar Programa' : 'Nuevo Programa'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Configura el paquete SaaS, sus módulos y estructuras.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="programaForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Código Único *</label>
                <input required type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '_')})} disabled={!!editingId} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black disabled:opacity-50" placeholder="Ej. POS_CORE" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Versión</label>
                <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black" placeholder="Ej. 1.0.0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre del Programa *</label>
              <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black" placeholder="Ej. Sistema de Inventario Básico" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-zinc-400" /> Dominio Operativo (Motor de BD) *
              </label>
              <select 
                required 
                value={formData.dominioId || ''} 
                onChange={e => setFormData({...formData, dominioId: Number(e.target.value)})} 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:bg-white focus:outline-none focus:border-black transition-all cursor-pointer shadow-sm"
              >
                <option value="" disabled>Seleccionar Dominio Dinámico...</option>
                {dominios.filter(d => d.activo).map(dom => (
                   <option key={dom.id} value={dom.id}>
                     {dom.nombre} (Prefijo BD: {dom.prefijoTablas})
                   </option>
                ))}
              </select>
              <p className="text-[9px] font-bold text-zinc-400 mt-1">Define qué tablas de la base de datos recibirán la información de las tablets.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Descripción Comercial</label>
              <textarea rows={2} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black resize-none" placeholder="¿Qué funcionalidades incluye este paquete?" />
            </div>

            {/* 🔥 MÓDULOS SAAS */}
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-zinc-400" /> Módulos SaaS Incluidos
              </label>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-inner">
                {permisosDisponibles.length === 0 ? (
                  <p className="text-xs text-zinc-400 col-span-2 text-center py-2">No hay módulos creados en el sistema.</p>
                ) : (
                  permisosDisponibles.map(p => {
                    const isChecked = formData.permisosIds?.includes(p.id);
                    
                    // Verificamos si este módulo es requerido por otro que YA está chequeado
                    const isForcedByDependency = permisosDisponibles.some(other => 
                      formData.permisosIds?.includes(other.id) && other.dependenciasIds?.includes(p.id)
                    );

                    return (
                      <div 
                        key={p.id} 
                        onClick={() => togglePermiso(p.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                          isChecked 
                            ? isForcedByDependency ? 'bg-zinc-200 border-zinc-300 cursor-not-allowed opacity-80' : 'bg-white border-black cursor-pointer shadow-sm' 
                            : 'bg-transparent border-transparent hover:bg-zinc-100 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? (isForcedByDependency ? 'bg-zinc-400 border-zinc-400' : 'bg-black border-black') : 'bg-white border-zinc-300'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <p className={`text-xs font-bold truncate ${isChecked ? 'text-black' : 'text-zinc-600'}`} title={p.descripcion}>
                            {p.codigo.replace('MOD_', 'Módulo ')}
                          </p>
                        </div>
                        
                        {/* Candado si es dependencia obligatoria */}
                        {isForcedByDependency && (
                          <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" title="Requerido por otro módulo activo" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* 🔥 ESTRUCTURAS DE DATOS REQUERIDAS (NUEVO) */}
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-400" /> Estructuras de Datos (Parametrización)
              </label>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-inner">
                {estructuras.length === 0 ? (
                  <p className="text-xs text-zinc-400 col-span-2 text-center py-2">No hay estructuras creadas en el sistema.</p>
                ) : (
                  estructuras.map(est => {
                    const isChecked = formData.estructurasIds?.includes(est.id);
                    return (
                      <div 
                        key={est.id} 
                        onClick={() => toggleEstructura(est.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-zinc-100'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-black border-black' : 'bg-white border-zinc-300'}`}>
                          {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isChecked ? 'text-black' : 'text-zinc-600'}`}>{est.nombre}</p>
                          <p className="text-[9px] text-zinc-400 font-mono">{est.codigo}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              <input type="checkbox" id="estadoActivo" checked={formData.activo} onChange={(e) => setFormData({...formData, activo: e.target.checked})} className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black accent-black cursor-pointer" />
              <label htmlFor="estadoActivo" className="text-sm font-bold text-zinc-700 cursor-pointer">Programa Activo y Comercializable</label>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <div className="flex gap-3">
            <button type="button" onClick={handleCloseDrawer} className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 transition-colors text-sm">Cancelar</button>
            <button type="submit" form="programaForm" disabled={!formData.codigo || !formData.nombre || !formData.dominioId} className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar Paquete' : 'Guardar Paquete'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}