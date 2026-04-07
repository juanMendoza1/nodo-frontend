// src/pages/Admin/views/SuscripcionesManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Plus, Edit2, Trash2, X, 
  CheckCircle2, Loader2, ChevronDown, MonitorSmartphone
} from 'lucide-react';
import { suscripcionesService, type SuscripcionData } from '../../../api/suscripciones.service';
import { empresasService } from '../../../api/empresas.service';
import { programasService } from '../../../api/programas.service';

// --- COMPONENTE SEARCHABLE SELECT (Reutilizado) ---
const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading, labelKey = 'nombre' }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  
  const filteredOptions = options.filter((opt: any) => {
    const term = searchTerm.toLowerCase();
    const texto = opt[labelKey] || opt.nombre || '';
    return texto.toLowerCase().includes(term);
  });

  return (
    <div className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100 focus:border-black focus:ring-1 focus:ring-black'}`}
      >
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
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
                <p className="text-xs text-zinc-400 p-3 text-center">No hay resultados.</p>
              ) : (
                filteredOptions.map((opt: any) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${value?.toString() === opt.id.toString() ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}
                  >
                    <span className="truncate">{opt[labelKey]}</span>
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

// --- MAIN COMPONENT ---
export default function SuscripcionesManager() {
  const [suscripciones, setSuscripciones] = useState<SuscripcionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Listas paramétricas
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estructura del formulario
  const [formData, setFormData] = useState<any>({
    empresaId: '', programaId: '', maxDispositivos: 1, activo: true, fechaVencimiento: ''
  });

  const cargarSuscripciones = async () => {
    setLoading(true);
    try {
      const data = await suscripcionesService.obtenerTodas();
      setSuscripciones(data || []);
    } catch (error) {
      console.error("Error cargando suscripciones:", error);
      setSuscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSuscripciones();
  }, []);

  const cargarOpcionesFormulario = async () => {
    setLoadingOptions(true);
    try {
      const [empRes, progRes] = await Promise.all([
        empresasService.obtenerTodas(),
        programasService.obtenerTodos()
      ]);
      setEmpresas(empRes || []);
      setProgramas(progRes || []);
    } catch (error) {
      console.error("Error opciones:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpenDrawer = (sub?: SuscripcionData) => {
    cargarOpcionesFormulario();
    if (sub) {
      setEditingId(sub.id!);
      setFormData({
        empresaId: sub.empresa?.id || '',
        programaId: sub.programa?.id || '',
        maxDispositivos: sub.maxDispositivos,
        activo: sub.activo !== false,
        fechaVencimiento: sub.fechaVencimiento ? sub.fechaVencimiento.substring(0, 10) : ''
      });
    } else {
      setEditingId(null);
      setFormData({ empresaId: '', programaId: '', maxDispositivos: 1, activo: true, fechaVencimiento: '' });
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
      const payload = {
        maxDispositivos: Number(formData.maxDispositivos),
        activo: formData.activo,
        fechaVencimiento: formData.fechaVencimiento ? `${formData.fechaVencimiento}T23:59:59` : null,
        empresa: { id: Number(formData.empresaId) },
        programa: { id: Number(formData.programaId) }
      };

      if (editingId) {
        await suscripcionesService.actualizar(editingId, payload);
      } else {
        await suscripcionesService.crear(payload);
      }
      handleCloseDrawer();
      cargarSuscripciones();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar suscripción");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar esta suscripción permanentemente?')) {
      try {
        await suscripcionesService.eliminar(id);
        cargarSuscripciones();
      } catch (error) {
        alert("No se puede eliminar. Quizá existan dispositivos vinculados a esta suscripción.");
      }
    }
  };

  const filtered = suscripciones.filter(s => 
    s.empresa?.nombreComercial?.toLowerCase().includes(search.toLowerCase()) || 
    s.programa?.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-black" /> Licencias y Suscripciones
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Control de cupos por comercio y programas habilitados.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar empresa o programa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black transition-all" />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md shrink-0">
            <Plus className="w-4 h-4" /> Asignar Licencia
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-5 pl-6">Comercio (Tenant)</th>
                <th className="p-5">Módulo (SaaS)</th>
                <th className="p-5">Dispositivos</th>
                <th className="p-5">F. Vencimiento</th>
                <th className="p-5">Estado</th>
                <th className="p-5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-zinc-500 font-bold">No hay suscripciones registradas.</td></tr>
              ) : (
                filtered.map((s) => {
                   const cuposAgotados = s.dispositivosActivos! >= s.maxDispositivos;
                   return (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-5 pl-6 text-sm font-black text-zinc-900">{s.empresa?.nombreComercial}</td>
                    <td className="p-5 text-sm font-bold text-zinc-600">{s.programa?.nombre}</td>
                    
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <MonitorSmartphone className="w-4 h-4 text-zinc-400" />
                        <span className={`text-sm font-extrabold ${cuposAgotados ? 'text-red-500' : 'text-emerald-600'}`}>
                          {s.dispositivosActivos || 0} <span className="text-zinc-400 font-medium">/ {s.maxDispositivos}</span>
                        </span>
                      </div>
                    </td>

                    <td className="p-5 text-sm font-medium text-zinc-500">
                      {s.fechaVencimiento ? new Date(s.fechaVencimiento).toLocaleDateString() : 'Sin caducidad'}
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                        s.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {s.activo ? 'Vigente' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="p-5 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDrawer(s)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id!)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER (FORMULARIO) */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer}></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900">{editingId ? 'Editar Licencia' : 'Nueva Licencia'}</h3>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="subForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-zinc-500">Comercio (Tenant) *</label>
              <SearchableSelect 
                value={formData.empresaId} options={empresas} onChange={(v: any) => setFormData({...formData, empresaId: v})}
                placeholder="Seleccione la empresa..." loading={loadingOptions} labelKey="nombreComercial" disabled={!!editingId}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-zinc-500">Módulo (Software) *</label>
              <SearchableSelect 
                value={formData.programaId} options={programas} onChange={(v: any) => setFormData({...formData, programaId: v})}
                placeholder="Seleccione el módulo..." loading={loadingOptions} labelKey="nombre" disabled={!!editingId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Cupos Tablets *</label>
                <input required type="number" min="1" value={formData.maxDispositivos} onChange={e => setFormData({...formData, maxDispositivos: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Vencimiento</label>
                <input type="date" value={formData.fechaVencimiento} onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              <input type="checkbox" id="estadoActivo" checked={formData.activo} onChange={(e) => setFormData({...formData, activo: e.target.checked})} className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black accent-black" />
              <label htmlFor="estadoActivo" className="text-sm font-bold text-zinc-700 cursor-pointer">Suscripción Activa</label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex gap-3">
          <button type="button" onClick={handleCloseDrawer} className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 text-sm">Cancelar</button>
          <button type="submit" form="subForm" disabled={!formData.empresaId || !formData.programaId} className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md text-sm flex justify-center items-center gap-2 disabled:opacity-50">
            <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}