import React, { useState } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, X, CheckCircle2, Loader2, ChevronDown, Store } from 'lucide-react';
import { tercerosService } from '../../../api/terceros.service';
import api from '../../../api/axios.config';

// 🔥 IMPORTAMOS NUESTROS NUEVOS HOOKS DE REACT QUERY
import { useEmpresas, useMutateEmpresa, useDeleteEmpresa } from '../../../hooks/queries/useEmpresas';

// ============================================================================
// COMPONENTE: SELECT BUSCADOR INTELIGENTE (Combobox) - (Intacto)
// ============================================================================
const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  
  const filteredOptions = options.filter((opt: any) => {
    const term = searchTerm.toLowerCase();
    const nombre = opt.nombreCompleto || opt.nombre || '';
    const identificador = opt.documento || opt.codigo || '';
    return nombre.toLowerCase().includes(term) || identificador.toLowerCase().includes(term);
  });

  return (
    <div className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100 focus:border-black focus:ring-1 focus:ring-black'}`}
      >
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption 
            ? `${selectedOption.nombreCompleto || selectedOption.nombre} (${selectedOption.documento || selectedOption.codigo})` 
            : placeholder}
        </span>
        {loading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all"
                />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3 text-center">No se encontraron resultados.</p>
              ) : (
                filteredOptions.map((opt: any) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${value?.toString() === opt.id.toString() ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}
                  >
                    <span className="truncate">{opt.nombreCompleto || opt.nombre}</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ml-2 shrink-0 ${value?.toString() === opt.id.toString() ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {opt.documento || opt.codigo}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function EmpresasManager() {
  const [search, setSearch] = useState('');
  
  // Listas paramétricas para el formulario (Estas también las pasaremos a React Query después)
  const [terceros, setTerceros] = useState<any[]>([]);
  const [giros, setGiros] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Estados del Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  // =======================================================================
  // 🔥 MAGIA DE REACT QUERY AQUÍ: ¡Adiós useEffects y useStates confusos!
  // =======================================================================
  const { data: empresas = [], isLoading, isError } = useEmpresas();
  const mutateEmpresa = useMutateEmpresa();
  const deleteEmpresa = useDeleteEmpresa();

  const cargarOpcionesFormulario = async () => {
    setLoadingOptions(true);
    try {
      const [tercerosRes, girosRes] = await Promise.all([
        tercerosService.obtenerTodosAdmin(),
        api.get('/api/giros-negocio').then(r => r.data).catch(() => []) 
      ]);
      setTerceros(tercerosRes || []);
      setGiros(girosRes || []);
    } catch (error) {
      console.error("Error cargando opciones:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpenDrawer = (empresa?: any) => {
    cargarOpcionesFormulario();

    if (empresa) {
      setEditingId(empresa.id);
      setFormData({
        nombreComercial: empresa.nombreComercial,
        terceroId: empresa.tercero?.id || '',
        giroNegocioId: empresa.giroNegocio?.id || '',
        activo: empresa.activo !== false
      });
    } else {
      setEditingId(null);
      setFormData({ activo: true, nombreComercial: '', terceroId: '', giroNegocioId: '' });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      nombreComercial: formData.nombreComercial,
      activo: formData.activo,
      tercero: formData.terceroId ? { id: Number(formData.terceroId) } : undefined,
      giroNegocio: formData.giroNegocioId ? { id: Number(formData.giroNegocioId) } : undefined
    };

    // 🔥 Llamamos a la mutación. Cuando tenga éxito, el Drawer se cierra solo.
    mutateEmpresa.mutate(
      { id: editingId, payload },
      { onSuccess: () => handleCloseDrawer() }
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este comercio permanentemente?')) {
      deleteEmpresa.mutate(id);
    }
  };

  const filteredEmpresas = empresas.filter((e: any) => 
    e.nombreComercial?.toLowerCase().includes(search.toLowerCase()) || 
    e.tercero?.documento?.includes(search)
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-black" /> Comercios (Tenants)
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Gestión de negocios registrados y vinculados a terceros.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por comercio o NIT..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
            />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md hover:shadow-xl shrink-0">
            <Plus className="w-4 h-4" /> Registrar Comercio
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-5 pl-6">ID</th>
                <th className="p-5">Nombre Comercial</th>
                <th className="p-5">Titular (Tercero)</th>
                <th className="p-5">Giro de Negocio</th>
                <th className="p-5">Estado</th>
                <th className="p-5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? ( // Usamos el isLoading de React Query
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">Cargando portafolio de negocios...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-red-500">Error de conexión al servidor.</td>
                </tr>
              ) : filteredEmpresas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">No hay comercios registrados en la plataforma.</p>
                  </td>
                </tr>
              ) : (
                filteredEmpresas.map((e: any) => (
                  <tr key={e.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-5 pl-6 text-sm font-black text-zinc-400">#{e.id}</td>
                    <td className="p-5 text-sm font-black text-zinc-900">{e.nombreComercial}</td>
                    
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-700">{e.tercero?.nombreCompleto || 'Sin Asignar'}</span>
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                          NIT: {e.tercero?.documento || '---'}
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider w-fit">
                        <Store className="w-3 h-3 text-zinc-400" />
                        {e.giroNegocio?.nombre || 'General'}
                      </span>
                    </td>

                    <td className="p-5">
                      <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest ${e.activo !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${e.activo !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {e.activo !== false ? 'Operando' : 'Bloqueada'}
                      </span>
                    </td>

                    <td className="p-5 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDrawer(e)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Bloqueamos el botón si la mutación de borrar está en curso */}
                        <button 
                          onClick={() => handleDelete(e.id)} 
                          disabled={deleteEmpresa.isPending}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-black" />
              {editingId ? 'Editar Comercio' : 'Nuevo Comercio'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Vincula el negocio a un tercero legal.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="empresaForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre Comercial *</label>
              <input 
                required
                type="text" 
                value={formData.nombreComercial}
                onChange={e => setFormData({...formData, nombreComercial: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="Ej. Billares El Dorado"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Tercero / Propietario Legal *</label>
              <SearchableSelect 
                value={formData.terceroId}
                options={terceros}
                onChange={(val: any) => setFormData({...formData, terceroId: val})}
                placeholder="Buscar por nombre o NIT..."
                loading={loadingOptions}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Giro de Negocio *</label>
              <SearchableSelect 
                value={formData.giroNegocioId}
                options={giros}
                onChange={(val: any) => setFormData({...formData, giroNegocioId: val})}
                placeholder="Seleccionar rubro comercial..."
                loading={loadingOptions}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              <input 
                type="checkbox" 
                id="estadoActivo"
                checked={formData.activo !== false}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black accent-black"
              />
              <label htmlFor="estadoActivo" className="text-sm font-bold text-zinc-700 cursor-pointer">
                Comercio Activo (Habilitar acceso a plataforma)
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
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
              form="empresaForm"
              disabled={!formData.terceroId || !formData.giroNegocioId || !formData.nombreComercial || mutateEmpresa.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutateEmpresa.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}