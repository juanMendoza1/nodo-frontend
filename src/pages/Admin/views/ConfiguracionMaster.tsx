import React, { useState, useEffect } from 'react';
import { 
  Settings, Layers, ListTree, Hash, Shield, 
  Search, Plus, Edit2, Trash2, X, CheckCircle2, Loader2, ChevronDown,Store
} from 'lucide-react';
import { configuracionService } from '../../../api/configuracion.service';

// ============================================================================
// COMPONENTE: SELECT BUSCADOR INTELIGENTE (Combobox)
// ============================================================================
const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  
  const filteredOptions = options.filter((opt: any) => 
    opt.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.codigo && opt.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative w-full">
      {/* Input visual / Botón que abre el menú */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100 focus:border-black focus:ring-1 focus:ring-black'}`}
      >
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption ? `${selectedOption.nombre} (${selectedOption.codigo || selectedOption.id})` : placeholder}
        </span>
        {loading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {/* Menú desplegable con Buscador */}
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
                    <span>{opt.nombre}</span>
                    {opt.codigo && <span className={`text-[10px] font-extrabold uppercase tracking-widest ${value?.toString() === opt.id.toString() ? 'text-zinc-400' : 'text-zinc-400'}`}>{opt.codigo}</span>}
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
// DICCIONARIO INTELIGENTE
// ============================================================================
const TABS_CONFIG: Record<string, any> = {
  clases: {
    endpoint: 'clases',
    title: 'Clases',
    desc: 'Módulos o agrupadores principales.',
    icon: Layers,
    columns: ['ID', 'Código', 'Nombre', 'Estado'],
    fields: [
      { key: 'codigo', label: 'Código de Sistema', type: 'text', placeholder: 'Ej. INV' },
      { key: 'nombre', label: 'Nombre de la Clase', type: 'text', placeholder: 'Ej. INVENTARIO' },
      { key: 'descripcion', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Detalle del módulo...' }
    ]
  },
  estructuras: {
    endpoint: 'estructuras',
    title: 'Estructuras',
    desc: 'Listas desplegables que pertenecen a una Clase.',
    icon: ListTree,
    columns: ['ID', 'Código', 'Nombre', 'Clase (Padre)', 'Estado'],
    fields: [
      // 🔥 AÑADIDO: Ahora pide el código correctamente para la base de datos
      { key: 'codigo', label: 'Código Interno', type: 'text', placeholder: 'Ej. TIP_IDENTIFICACION' },
      { key: 'nombre', label: 'Nombre de la Estructura', type: 'text', placeholder: 'Ej. TIPOS DE IDENTIFICACIÓN' },
      // 🔥 MAGIA: Usa nuestro nuevo componente buscador
      { key: 'claseId', label: 'Clase a la que pertenece', type: 'searchable-select', parentEndpoint: 'clases', placeholder: 'Seleccionar Clase Padre' }
    ]
  },
  unidades: {
    endpoint: 'unidades',
    title: 'Unidades',
    desc: 'Los valores finales de las listas desplegables.',
    icon: Hash,
    columns: ['ID', 'Código', 'Nombre (Valor)', 'Estructura (Padre)', 'Estado'],
    fields: [
      { key: 'codigo', label: 'Código Corto', type: 'text', placeholder: 'Ej. CC, NIT, PASAPORTE' },
      { key: 'nombre', label: 'Nombre Completo o Valor', type: 'text', placeholder: 'Ej. CÉDULA DE CIUDADANÍA' },
      { key: 'estructuraId', label: 'Estructura a la que pertenece', type: 'searchable-select', parentEndpoint: 'estructuras', placeholder: 'Seleccionar Estructura Padre' }
    ]
  },
  roles: {
    endpoint: 'roles',
    title: 'Roles de Sistema',
    desc: 'Perfiles de acceso para los usuarios.',
    icon: Shield,
    columns: ['ID', 'Nombre del Rol', 'Estado'],
    fields: [
      { key: 'nombre', label: 'Nombre del Rol', type: 'text', placeholder: 'Ej. ROLE_CAJERO' },
      { key: 'descripcion', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Permisos...' }
    ]
  },
  giros: {
    endpoint: 'giros-negocio', // Asegúrate de crear luego un GiroNegocioController con este path
    title: 'Giros de Negocio',
    desc: 'Tipos de comercio y plantillas de la app.',
    icon: Store,
    columns: ['ID', 'Código', 'Nombre', 'Template Móvil', 'Estado'],
    fields: [
      { key: 'codigo', label: 'Código Corto', type: 'text', placeholder: 'Ej. BILLAR, REST, ZAPA' },
      { key: 'nombre', label: 'Nombre Comercial', type: 'text', placeholder: 'Ej. Billar y Bar' },
      { key: 'descripcion', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Detalle del comercio...' },
      { key: 'templateMovil', label: 'Template Móvil (App) *', type: 'text', placeholder: 'Ej. ARENA_DUELO o POS_ESTANDAR' }
    ]
  }
};

export default function ConfiguracionMaster() {
  const [activeTab, setActiveTab] = useState('unidades');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  const [parentOptions, setParentOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const tabActivo = TABS_CONFIG[activeTab];

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await configuracionService.obtenerTodos(tabActivo.endpoint);
      setData(res || []);
    } catch (error) {
      setData([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch('');
    cargarDatos();
  }, [activeTab]);

  const handleOpenDrawer = async (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        codigo: item.codigo || '',
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        claseId: item.clase?.id || '',
        estructuraId: item.estructura?.id || '',
        activo: item.activo !== false
      });
    } else {
      setEditingId(null);
      setFormData({ activo: true });
    }

    const selectField = tabActivo.fields.find((f: any) => f.type === 'searchable-select');
    if (selectField) {
      setLoadingOptions(true);
      try {
        const optionsData = await configuracionService.obtenerTodos(selectField.parentEndpoint);
        setParentOptions(optionsData || []);
      } catch (error) {
        console.error(`Error cargando ${selectField.parentEndpoint}`);
        setParentOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    }

    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setParentOptions([]);
  };

  const handleChange = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload = { ...formData };
      
      if (activeTab === 'estructuras' && payload.claseId) payload.clase = { id: Number(payload.claseId) };
      
      if (activeTab === 'unidades' && payload.estructuraId) {
         // Asegurar que también enviamos estructuraCodigo para tu UnidadDTO
         const estSeleccionada = parentOptions.find((opt: any) => opt.id.toString() === payload.estructuraId.toString());
         if (estSeleccionada) {
             payload.estructuraCodigo = estSeleccionada.codigo;
             payload.estructura = { id: Number(payload.estructuraId) };
         }
      }

      if (editingId) {
        await configuracionService.actualizar(tabActivo.endpoint, editingId, payload);
      } else {
        await configuracionService.crear(tabActivo.endpoint, payload);
      }
      handleCloseDrawer();
      cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Estás seguro de eliminar este registro de ${tabActivo.title}?`)) {
      try {
        await configuracionService.eliminar(tabActivo.endpoint, id);
        cargarDatos();
      } catch (error) {
        alert("No se puede eliminar porque está en uso por otros registros.");
      }
    }
  };

  const filteredData = data.filter((item: any) => 
    item.nombre?.toLowerCase().includes(search.toLowerCase()) || 
    item.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      
      {/* HEADER DE CONFIGURACIÓN */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-black" /> Motor de Parametrización
        </h2>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          Configura los catálogos, listas desplegables y variables del sistema dinámicamente.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        
        {/* SUB-MENÚ LATERAL INTELIGENTE */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-3 space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3 mt-2">Tablas Core</p>
            {Object.keys(TABS_CONFIG).map((key) => {
              const tab = TABS_CONFIG[key];
              const Icon = tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                    activeTab === key ? 'bg-black text-white shadow-md' : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${activeTab === key ? 'text-white' : 'text-zinc-400'}`} />
                  <div>
                    <p className="text-sm font-bold">{tab.title}</p>
                    <p className={`text-[10px] font-medium leading-tight mt-0.5 ${activeTab === key ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ÁREA DE TRABAJO DINÁMICA */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
          
          <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={`Buscar código o nombre...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
              />
            </div>
            <button onClick={() => handleOpenDrawer()} className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md shrink-0">
              <Plus className="w-4 h-4" /> Crear {tabActivo.title.slice(0, -1)}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-zinc-200">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold bg-zinc-50/95 backdrop-blur-md">
                  {tabActivo.columns.map((col: string, i: number) => (
                    <th key={i} className={`p-4 ${i===0?'pl-6':''}`}>{col}</th>
                  ))}
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={tabActivo.columns.length + 1} className="p-16 text-center">
                      <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
                      <p className="text-zinc-500 font-bold text-sm">Cargando {tabActivo.title}...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={tabActivo.columns.length + 1} className="p-16 text-center">
                      <Settings className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                      <p className="text-zinc-500 font-bold text-sm">No hay datos registrados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                      <td className="p-4 pl-6 text-sm font-black text-zinc-400">#{item.id}</td>
                      
                      <td className="p-4 text-[11px] font-black text-zinc-800 uppercase tracking-widest">{item.codigo || '---'}</td>
                      <td className="p-4 text-sm font-bold text-zinc-900">{item.nombre}</td>
                      
                      {activeTab === 'clases' && (
                        <td className="p-4 text-[12px] font-medium text-zinc-500">{item.descripcion || '---'}</td>
                      )}
                      
                      {activeTab === 'estructuras' && (
                        <td className="p-4">
                          <span className="text-[10px] font-extrabold text-zinc-600 bg-zinc-100 px-2.5 py-1.5 rounded-md uppercase tracking-wider border border-zinc-200">
                            {item.clase?.nombre || 'N/A'}
                          </span>
                        </td>
                      )}
                      {activeTab === 'unidades' && (
                        <td className="p-4">
                          <span className="text-[10px] font-extrabold text-zinc-600 bg-zinc-100 px-2.5 py-1.5 rounded-md uppercase tracking-wider border border-zinc-200">
                            {item.estructura?.nombre || 'N/A'}
                          </span>
                        </td>
                      )}
                      
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest ${item.activo !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.activo !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {item.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenDrawer(item)} className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-md transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
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
      </div>

      {/* DRAWER DESLIZABLE */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer}></div>
      )}
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              {editingId ? 'Editar' : 'Nuevo'} {tabActivo.title.slice(0, -1)}
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-1">Completa la información requerida.</p>
          </div>
          <button onClick={handleCloseDrawer} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="dinamicForm" onSubmit={handleSubmit} className="space-y-5">
            {tabActivo.fields.map((field: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                  <span>{field.label} {field.key === 'codigo' || field.key === 'nombre' ? '*' : ''}</span>
                </label>
                
                {/* NUESTRO NUEVO COMPONENTE */}
                {field.type === 'searchable-select' ? (
                  <SearchableSelect 
                    value={formData[field.key]}
                    options={parentOptions}
                    onChange={(val: any) => handleChange(field.key, val)}
                    placeholder={field.placeholder}
                    loading={loadingOptions}
                  />
                ) : (
                  <input 
                    required={field.key === 'codigo' || field.key === 'nombre'}
                    type={field.type} 
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                )}
              </div>
            ))}
            
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="estadoActivo"
                checked={formData.activo !== false}
                onChange={(e) => handleChange('activo', e.target.checked)}
                className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black accent-black"
              />
              <label htmlFor="estadoActivo" className="text-sm font-bold text-zinc-700 cursor-pointer">
                Registro Activo
              </label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <div className="flex gap-3">
            <button type="button" onClick={handleCloseDrawer} className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" form="dinamicForm" className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-sm flex justify-center items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}