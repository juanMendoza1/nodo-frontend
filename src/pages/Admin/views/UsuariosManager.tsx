import React, { useState, useEffect } from 'react';
import { 
  UserSquare2, Search, Plus, Edit2, Trash2, X, 
  CheckCircle2, Loader2, ChevronDown, ShieldCheck, KeyRound
} from 'lucide-react';
import { usuariosService, type UsuarioData } from '../../../api/usuarios.service';
import { tercerosService } from '../../../api/terceros.service';
import { empresasService } from '../../../api/empresas.service';

// ============================================================================
// COMPONENTE: SELECT BUSCADOR INTELIGENTE (Combobox)
// ============================================================================
const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading, isEmpresa = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  
  const filteredOptions = options.filter((opt: any) => {
    const term = searchTerm.toLowerCase();
    const nombre = isEmpresa 
      ? opt.nombreComercial 
      : (opt.nombreCompleto || opt.nombre || '');
    const identificador = isEmpresa ? '' : (opt.documento || '');
    
    return (nombre && nombre.toLowerCase().includes(term)) || 
           (identificador && identificador.toLowerCase().includes(term));
  });

  return (
    <div className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100 focus:border-black focus:ring-1 focus:ring-black'}`}
      >
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption 
            ? isEmpresa 
                ? selectedOption.nombreComercial 
                : `${selectedOption.nombreCompleto || selectedOption.nombre} (${selectedOption.documento})` 
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
                <p className="text-xs text-zinc-400 p-3 text-center">No hay resultados.</p>
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
                    <span className="truncate">
                      {isEmpresa ? opt.nombreComercial : (opt.nombreCompleto || opt.nombre)}
                    </span>
                    {!isEmpresa && opt.documento && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ml-2 shrink-0 ${value?.toString() === opt.id.toString() ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {opt.documento}
                      </span>
                    )}
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
export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Listas paramétricas para el formulario
  const [terceros, setTerceros] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Estados del Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const formatearFecha = (fecha: any) => {
    if (!fecha) return '---';
    try {
      // Si Spring Boot lo manda como array [Año, Mes, Día, Hora, Minuto]
      if (Array.isArray(fecha)) {
        const [year, month, day] = fecha;
        return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
      }
      // Si lo manda como String ISO
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarOpcionesFormulario = async () => {
    setLoadingOptions(true);
    try {
      const [tercerosRes, empresasRes] = await Promise.all([
        tercerosService.obtenerTodosAdmin(),
        empresasService.obtenerTodas()
      ]);
      setTerceros(tercerosRes || []);
      setEmpresas(empresasRes || []);
    } catch (error) {
      console.error("Error cargando opciones:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpenDrawer = (usuario?: any) => {
    cargarOpcionesFormulario();

    if (usuario) {
      setEditingId(usuario.id);
      setFormData({
        login: usuario.login,
        estado: usuario.estado || 'ACTIVO',
        terceroId: usuario.tercero?.id || '',
        empresaId: usuario.empresa?.id || '',
        password: '' // No traemos el password por seguridad
      });
    } else {
      setEditingId(null);
      setFormData({ login: '', estado: 'ACTIVO', terceroId: '', empresaId: '', password: '' });
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
      const payload: UsuarioData = {
        login: formData.login,
        estado: formData.estado,
        tercero: formData.terceroId ? { id: Number(formData.terceroId) } : undefined,
        empresa: formData.empresaId ? { id: Number(formData.empresaId) } : undefined,
      };

      // Solo mandamos el password si lo escribieron (para creaciones o cambios)
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
      }

      if (editingId) {
        await usuariosService.actualizar(editingId, payload);
      } else {
        await usuariosService.crear(payload);
      }
      
      handleCloseDrawer();
      cargarUsuarios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar el usuario");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este acceso permanentemente?')) {
      try {
        await usuariosService.eliminar(id);
        cargarUsuarios();
      } catch (error) {
        alert("No se puede eliminar porque este usuario ya tiene historial o facturas creadas. Te sugerimos cambiar su estado a INACTIVO.");
      }
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.login?.toLowerCase().includes(search.toLowerCase()) || 
    u.tercero?.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
    u.empresa?.nombreComercial?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full">
      
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <UserSquare2 className="w-8 h-8 text-black" /> Accesos de Sistema
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Gestión de credenciales, vinculación de personas y tenants.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por login o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
            />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md hover:shadow-xl shrink-0">
            <Plus className="w-4 h-4" /> Crear Usuario
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-5 pl-6">Login</th>
                <th className="p-5">Titular (Persona)</th>
                <th className="p-5">Empresa Asignada</th>
                <th className="p-5">Estado</th>
                <th className="p-5">F. Activación</th>
                <th className="p-5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">Cargando directorio de accesos...</p>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <ShieldCheck className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold text-sm">No se encontraron usuarios.</p>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-5 pl-6 text-sm font-black text-zinc-900">{u.login}</td>
                    
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-700">{u.tercero?.nombreCompleto || 'Sin Asignar'}</span>
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                          DOC: {u.tercero?.documento || '---'}
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-sm font-bold text-zinc-600">
                        {u.empresa?.nombreComercial || '---'}
                      </span>
                    </td>

                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                        u.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        u.estado === 'BLOQUEADO' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {u.estado || 'DESCONOCIDO'}
                      </span>
                    </td>
                      <td className="p-5 text-sm font-medium text-zinc-500">
                      {formatearFecha(u.fechaActivacion)}
                    </td>
                    <td className="p-5 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDrawer(u)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              <KeyRound className="w-5 h-5 text-black" />
              {editingId ? 'Editar Accesos' : 'Nuevo Usuario'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Vincula un tercero a una empresa.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="usuarioForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Nombre de Usuario (Login) *</label>
                <input 
                  required
                  type="text" 
                  value={formData.login}
                  onChange={e => setFormData({...formData, login: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="Ej. jperez2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex justify-between">
                  Contraseña {editingId ? '(Dejar en blanco para no cambiar)' : '*'}
                </label>
                <input 
                  required={!editingId}
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Tercero (Persona Real) *</label>
              <SearchableSelect 
                value={formData.terceroId}
                options={terceros}
                onChange={(val: any) => setFormData({...formData, terceroId: val})}
                placeholder="Buscar por nombre o documento..."
                loading={loadingOptions}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Comercio Asignado (Tenant) *</label>
              <SearchableSelect 
                value={formData.empresaId}
                options={empresas}
                onChange={(val: any) => setFormData({...formData, empresaId: val})}
                placeholder="Seleccionar empresa..."
                loading={loadingOptions}
                isEmpresa={true}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Estado de la Cuenta *</label>
              <select
                required
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO (Acceso Normal)</option>
                <option value="INACTIVO">INACTIVO (Suspendido temporalmente)</option>
                <option value="BLOQUEADO">BLOQUEADO (Violación de seguridad)</option>
              </select>
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
              form="usuarioForm"
              disabled={!formData.login || !formData.terceroId || !formData.empresaId}
              className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar Credenciales'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}