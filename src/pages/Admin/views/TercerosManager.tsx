import React, { useState, useEffect } from 'react';
import { Database, Search, Plus, X, Edit2, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { tercerosService, type Tercero } from '../../../api/terceros.service';
import { configuracionService } from '../../../api/configuracion.service'; // Para traer las unidades

export default function TercerosManager() {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Opciones paramétricas
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [tiposTercero, setTiposTercero] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Estados para el Drawer (Panel lateral)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Tercero>({
    documento: '', nombre: '', apellido: '', telefono: '', correo: '', tipoIdentificacionId: undefined, tipoTerceroId: undefined
  });

  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;
  const esSuperAdmin = usuarioData?.roles?.includes('SUPER') || usuarioData?.roles?.includes('ROLE_SUPER');

  const cargarTerceros = async () => {
    setLoading(true);
    try {
      const data = esSuperAdmin 
        ? await tercerosService.obtenerTodosAdmin()
        : await tercerosService.obtenerVisibles(usuarioData.empresaId);
      setTerceros(data);
    } catch (error) {
      console.error("Error cargando terceros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTerceros();
  }, []);

  const handleOpenDrawer = async (tercero?: Tercero) => {
    // Cargar parámetros al abrir el drawer
    setLoadingOptions(true);
    try {
       const unidades = await configuracionService.obtenerTodos('unidades');
       setTiposIdentificacion(unidades.filter((u: any) => u.estructura?.codigo === 'TIP_ID'));
       setTiposTercero(unidades.filter((u: any) => u.estructura?.codigo === 'TIP_TER'));
    } catch(e) {
       console.error("Error cargando parámetros", e);
    } finally {
       setLoadingOptions(false);
    }

    if (tercero) {
      setEditingId(tercero.id!);
      setFormData({
         ...tercero,
         tipoIdentificacionId: tercero.tipoIdentificacionId,
         tipoTerceroId: tercero.tipoTerceroId
      });
    } else {
      setEditingId(null);
      setFormData({ documento: '', nombre: '', apellido: '', telefono: '', correo: '', tipoIdentificacionId: undefined, tipoTerceroId: undefined });
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
        await tercerosService.actualizar(editingId, formData);
      } else {
        await tercerosService.crear(
          formData, 
          usuarioData.empresaId || 1, 
          usuarioData.usuarioId,             
          esSuperAdmin                
        );
      }
      handleCloseDrawer();
      cargarTerceros(); 
    } catch (error: any) {
      console.error("Error guardando:", error);
      alert(error.response?.data?.message || "Error al guardar el registro.");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este registro permanentemente?')) {
      try {
        await tercerosService.eliminar(id);
        cargarTerceros(); 
      } catch (error: any) {
        console.error("Error eliminando:", error);
        alert(error.response?.data?.message || "No se puede eliminar porque está asociado a operaciones activas.");
      }
    }
  };

  const filteredTerceros = terceros.filter(t => 
    t.documento.includes(search) || 
    t.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.apellido.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-black" /> Gestión de Terceros
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Directorio maestro de personas y entidades base.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por documento o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
            />
          </div>
          <button 
            onClick={() => handleOpenDrawer()} 
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md hover:shadow-xl shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo Tercero
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-5">Documento</th>
                <th className="p-5">Nombre Completo</th>
                <th className="p-5">Contacto</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">Cargando base de datos...</p>
                  </td>
                </tr>
              ) : filteredTerceros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Database className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">No se encontraron terceros registrados.</p>
                  </td>
                </tr>
              ) : (
                filteredTerceros.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-5 text-sm font-bold text-zinc-900">{t.documento}</td>
                    <td className="p-5 text-sm font-medium text-zinc-700">{t.nombreCompleto || `${t.nombre} ${t.apellido}`}</td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900">{t.telefono || 'N/A'}</span>
                        <span className="text-[11px] font-bold text-zinc-400">{t.correo || 'Sin correo'}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenDrawer(t)} 
                          className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id!)} 
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER (PANEL LATERAL) PARA EL FORMULARIO */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div>
            <h3 className="text-xl font-black text-zinc-900">
              {editingId ? 'Editar Tercero' : 'Nuevo Tercero'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Ingresa los datos fiscales o personales.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="terceroForm" onSubmit={handleSubmit} className="space-y-5">
            
            {/* SELECTS PARAMÉTRICOS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Tipo Tercero *</label>
                <select 
                  required
                  value={formData.tipoTerceroId || ''}
                  onChange={e => setFormData({...formData, tipoTerceroId: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none"
                  disabled={loadingOptions}
                >
                   <option value="" disabled>Seleccione...</option>
                   {tiposTercero.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Tipo Doc *</label>
                <select 
                  required
                  value={formData.tipoIdentificacionId || ''}
                  onChange={e => setFormData({...formData, tipoIdentificacionId: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none"
                  disabled={loadingOptions}
                >
                   <option value="" disabled>Seleccione...</option>
                   {tiposIdentificacion.map(t => <option key={t.id} value={t.id}>{t.codigo}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Documento / NIT *</label>
              <input 
                required
                type="text" 
                value={formData.documento}
                onChange={e => setFormData({...formData, documento: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="Ej. 1020304050"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre(s) *</label>
                <input 
                  required
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Apellido(s) *</label>
                <input 
                  required
                  type="text" 
                  value={formData.apellido}
                  onChange={e => setFormData({...formData, apellido: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Teléfono</label>
              <input 
                type="text" 
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="+57 300 000 0000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Correo Electrónico</label>
              <input 
                type="email" 
                value={formData.correo}
                onChange={e => setFormData({...formData, correo: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="correo@empresa.com"
              />
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl mt-4">
               <p className="text-xs text-zinc-500 font-medium text-center">
                 Al guardar, se vinculará automáticamente este registro con su espacio de trabajo.
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
              form="terceroForm"
              className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-sm flex justify-center items-center gap-2"
            >
              {editingId ? 'Guardar Cambios' : 'Crear Registro'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}