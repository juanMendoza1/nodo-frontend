import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, Edit2, Trash2, X, 
  CheckCircle2, Loader2, ChevronDown, Calculator, 
  Delete, Eraser, Sigma, Binary, TerminalSquare, ShieldAlert, Globe, Building2, Server
} from 'lucide-react';
import { conceptosService } from '../../../api/conceptos.service';
import { configuracionService } from '../../../api/configuracion.service';
import { programasService } from '../../../api/programas.service';
import { empresasService } from '../../../api/empresas.service';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading, labelKey = 'nombre' }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const safeOptions = options || [];
  const selectedOption = safeOptions.find((opt: any) => opt.id?.toString() === value?.toString());
  const filteredOptions = safeOptions.filter((opt: any) => 
    (opt[labelKey] || opt.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100 focus:border-black focus:ring-1 focus:ring-black'}`}>
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>{selectedOption ? selectedOption[labelKey] : placeholder}</span>
        {loading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filteredOptions.map((opt: any) => (
                <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${value?.toString() === opt.id?.toString() ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                  {opt[labelKey] || opt.nombre}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const funcionesSistema = [
  { cmd: 'F_SUMA(', nombre: 'F_SUMA', desc: 'Suma múltiples valores separados por coma.' },
  { cmd: 'F_RESTA(', nombre: 'F_RESTA', desc: 'Resta en cascada a partir del primer valor.' },
  { cmd: 'F_PROMEDIO(', nombre: 'F_PROMEDIO', desc: 'Calcula la media aritmética exacta.' },
  { cmd: 'F_GET_IVA()', nombre: 'F_GET_IVA', desc: 'Trae el valor del IVA global configurado.' }
];

export default function ConceptosManager() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [programas, setProgramas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [estructuras, setEstructuras] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  
  const [formulaSearch, setFormulaSearch] = useState('');
  const [funcionSearch, setFuncionSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, nombre: '' });

  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;
  const NODO_MASTER_ID = 1;

  useEffect(() => { cargarConceptos(); }, []);

  const cargarConceptos = async () => {
    setLoading(true);
    try {
      const data = await conceptosService.obtenerTodos();
      setConceptos(data || []);
    } catch (error) {
      toast.error("Error cargando los conceptos financieros.");
    } finally {
      setLoading(false);
    }
  };

  const cargarOpciones = async () => {
    setLoadingOptions(true);
    try {
      const [prog, emp, est] = await Promise.all([
        programasService.obtenerTodos(),
        empresasService.obtenerTodas(),
        configuracionService.obtenerTodos('estructuras')
      ]);
      setProgramas(prog || []);
      setEmpresas(emp || []);
      setEstructuras(est || []);
    } catch (e) {
      console.error("Error al cargar listados", e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOpenDrawer = (item?: any) => {
    cargarOpciones();
    setFormulaSearch(''); 
    setFuncionSearch(''); 
    if (item) {
      setEditingId(item.id);
      
      let alcanceInicial = 'LOCAL';
      if (!item.programa) alcanceInicial = 'NODO';
      else if (item.esGlobal) alcanceInicial = 'GLOBAL';

      setFormData({
        codigo: item.codigo, 
        nombre: item.nombre, 
        tipoCalculo: item.tipoCalculo,
        naturaleza: item.naturaleza || 'SUMA', // 🔥 Carga paramétrica de Naturaleza
        valorFijo: item.valorFijo || '', 
        formula: item.formula || '',
        esRecaudable: item.esRecaudable !== false, 
        financiable: item.financiable || false, 
        generaInteres: item.generaInteres || false, 
        aplicaIva: item.aplicaIva || false, 
        esFuncion: item.esFuncion || false,
        alcance: alcanceInicial, 
        programaId: item.programa?.id || '', 
        empresaId: item.empresa?.id || '', 
        estructuraAgrupadoraId: item.estructuraAgrupadora?.id || '',
        activo: item.activo !== false
      });
    } else {
      setEditingId(null);
      setFormData({ 
        codigo: '', 
        nombre: '', 
        tipoCalculo: 'DINAMICO', 
        naturaleza: 'SUMA', // 🔥 Valor por defecto al crear
        valorFijo: '', 
        formula: '', 
        esRecaudable: true, 
        financiable: false, 
        generaInteres: false, 
        aplicaIva: false, 
        esFuncion: false, 
        alcance: 'GLOBAL', 
        programaId: '', 
        empresaId: '', 
        estructuraAgrupadoraId: '', 
        activo: true 
      });
    }
    setIsDrawerOpen(true);
  };

  const inyectarEnFormula = (texto: string, esNumero: boolean = false) => {
    setFormData((prev: any) => {
      const formulaActual = prev.formula ? prev.formula : '';
      const ultimoChar = formulaActual.slice(-1);
      let nuevaFormula = formulaActual;

      if (esNumero) {
        if (/[0-9.]/.test(ultimoChar)) nuevaFormula += texto;
        else nuevaFormula += (formulaActual.length > 0 && ultimoChar !== ' ' ? ' ' : '') + texto;
      } else {
        nuevaFormula += (formulaActual.length > 0 && ultimoChar !== ' ' ? ' ' : '') + texto + ' ';
      }

      return { ...prev, formula: nuevaFormula };
    });
  };

  const borrarUltimoToken = () => {
    setFormData((prev: any) => {
      if (!prev.formula) return prev;
      const tokens = prev.formula.trim().split(' ');
      tokens.pop();
      return { ...prev, formula: tokens.length > 0 ? tokens.join(' ') + ' ' : '' };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tipoCalculo === 'FORMULA' && (!formData.formula || formData.formula.trim() === '')) {
      toast.error('La fórmula no puede estar vacía.'); return;
    }

    const payload = {
      ...formData,
      valorFijo: formData.tipoCalculo === 'ESTATICO' ? Number(formData.valorFijo) : null,
      formula: formData.tipoCalculo === 'FORMULA' ? formData.formula.trim() : null,
      estructuraAgrupadora: formData.estructuraAgrupadoraId ? { id: formData.estructuraAgrupadoraId } : null,
      usuario: usuarioData?.usuarioId ? { id: usuarioData.usuarioId } : null,
      
      esGlobal: formData.alcance === 'GLOBAL',
      programa: (formData.alcance === 'NODO' || !formData.programaId) ? null : { id: formData.programaId },
      empresa: formData.alcance === 'LOCAL' ? { id: formData.empresaId } : { id: NODO_MASTER_ID }
    };

    const request = editingId ? conceptosService.actualizar(editingId, payload) : conceptosService.crear(payload);

    toast.promise(request, {
      loading: 'Guardando concepto...',
      success: () => { setIsDrawerOpen(false); cargarConceptos(); return 'Concepto guardado con éxito'; },
      error: (err) => err.response?.data?.error || 'Error al guardar'
    });
  };

  const confirmarEliminacion = async () => {
    toast.promise(
      conceptosService.eliminar(confirmDialog.id),
      {
        loading: 'Eliminando...',
        success: () => {
          cargarConceptos();
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return 'Eliminado correctamente';
        },
        error: (err) => {
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return err.response?.data?.error || 'No se puede eliminar porque está en uso.';
        }
      }
    );
  };

  const filtered = conceptos.filter(c => 
    c.codigo.toLowerCase().includes(search.toLowerCase()) || c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const isFormValid = formData.codigo?.trim() && 
                      formData.nombre?.trim() && 
                      formData.estructuraAgrupadoraId &&
                      (formData.alcance === 'NODO' || formData.alcance === 'GLOBAL' || formData.programaId) &&
                      (formData.alcance !== 'LOCAL' || formData.empresaId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-black" /> Catálogo de Conceptos
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Variables, fijos y fórmulas para el motor de cálculo.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar concepto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black transition-all shadow-sm" />
          </div>
          <button onClick={() => handleOpenDrawer()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md shrink-0">
            <Plus className="w-4 h-4" /> Nuevo Concepto
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-5 pl-6">Código (Var)</th>
                <th className="p-5">Nombre / Descripción</th>
                <th className="p-5">Cálculo</th>
                <th className="p-5">Módulo SaaS</th>
                <th className="p-5">Nivel de Acceso</th>
                <th className="p-5 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center font-bold text-zinc-500">No hay conceptos registrados.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-4 pl-6 font-mono text-sm font-black text-zinc-800">{c.codigo}</td>
                    <td className="p-4 text-sm font-bold text-zinc-900">{c.nombre}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border ${
                        c.tipoCalculo === 'FORMULA' ? 'bg-zinc-800 text-white border-zinc-800' :
                        c.tipoCalculo === 'ESTATICO' ? 'bg-zinc-100 text-zinc-800 border-zinc-300' :
                        'bg-white text-zinc-600 border-zinc-200 shadow-sm'
                      }`}>
                        {c.tipoCalculo}
                      </span>
                      {/* 🔥 BADGE VISUAL DE NATURALEZA */}
                      <span className={`ml-2 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border ${
                        c.naturaleza === 'RESTA' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {c.naturaleza === 'RESTA' ? 'RESTA (-)' : 'SUMA (+)'}
                      </span>

                      {c.tipoCalculo === 'ESTATICO' && <span className="block mt-1 text-xs font-mono font-bold text-zinc-500">${c.valorFijo}</span>}
                      {c.tipoCalculo === 'FORMULA' && <span className="block mt-1 text-[10px] font-mono text-zinc-600 truncate max-w-[150px]" title={c.formula}>{c.formula}</span>}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-zinc-600">
                        {c.programa ? c.programa.nombre : <span className="text-zinc-400 font-medium">N/A (Transversal)</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      {!c.programa ? (
                         <span className="px-2 py-1 rounded bg-black text-white text-[10px] font-extrabold uppercase tracking-widest">NODO (SaaS)</span>
                      ) : c.esGlobal ? (
                         <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-100 border border-zinc-800 text-[10px] font-extrabold uppercase tracking-widest">Global</span>
                      ) : (
                         <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-extrabold uppercase tracking-widest">{c.empresa?.nombreComercial}</span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDrawer(c)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDialog({ isOpen: true, id: c.id!, nombre: c.nombre })} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDrawerOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsDrawerOpen(false)}></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div>
             <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
               <TerminalSquare className="w-5 h-5 text-black"/> 
               {editingId ? 'Editar Concepto' : 'Nuevo Concepto'}
             </h3>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="conceptoForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="mb-6">
               <label className="text-[11px] font-extrabold uppercase text-zinc-500 flex items-center gap-2 mb-3">
                 <ShieldAlert className="w-4 h-4 text-black" /> Nivel de Acceso (Alcance)
               </label>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 
                 <div 
                   onClick={() => setFormData({...formData, alcance: 'NODO', programaId: ''})}
                   className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${formData.alcance === 'NODO' ? 'bg-black border-black text-white shadow-md scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'}`}
                 >
                   <div className="flex items-center gap-2 mb-1.5">
                     <Server className={`w-4 h-4 ${formData.alcance === 'NODO' ? 'text-zinc-300' : 'text-zinc-500'}`} />
                     <h4 className={`font-black text-sm ${formData.alcance === 'NODO' ? 'text-white' : 'text-zinc-900'}`}>NODO (SaaS)</h4>
                   </div>
                   <p className={`text-[11px] font-medium leading-tight ${formData.alcance === 'NODO' ? 'text-zinc-400' : 'text-zinc-500'}`}>Exclusivo SuperAdmin. Uso interno para facturación y cobros.</p>
                 </div>

                 <div 
                   onClick={() => setFormData({...formData, alcance: 'GLOBAL', programaId: ''})}
                   className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${formData.alcance === 'GLOBAL' ? 'bg-zinc-800 border-zinc-800 text-white shadow-md scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'}`}
                 >
                   <div className="flex items-center gap-2 mb-1.5">
                     <Globe className={`w-4 h-4 ${formData.alcance === 'GLOBAL' ? 'text-zinc-300' : 'text-zinc-500'}`} />
                     <h4 className={`font-black text-sm ${formData.alcance === 'GLOBAL' ? 'text-white' : 'text-zinc-900'}`}>GLOBAL</h4>
                   </div>
                   <p className={`text-[11px] font-medium leading-tight ${formData.alcance === 'GLOBAL' ? 'text-zinc-400' : 'text-zinc-500'}`}>Disponible para todos los clientes (Tenants) suscritos al módulo.</p>
                 </div>

                 <div 
                   onClick={() => setFormData({...formData, alcance: 'LOCAL'})}
                   className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${formData.alcance === 'LOCAL' ? 'bg-zinc-100 border-zinc-900 text-zinc-900 shadow-sm scale-[1.02]' : 'bg-white border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'}`}
                 >
                   <div className="flex items-center gap-2 mb-1.5">
                     <Building2 className={`w-4 h-4 ${formData.alcance === 'LOCAL' ? 'text-black' : 'text-zinc-500'}`} />
                     <h4 className={`font-black text-sm ${formData.alcance === 'LOCAL' ? 'text-black' : 'text-zinc-900'}`}>LOCAL (Tenant)</h4>
                   </div>
                   <p className={`text-[11px] font-medium leading-tight ${formData.alcance === 'LOCAL' ? 'text-zinc-600' : 'text-zinc-500'}`}>Privado y exclusivo para un solo cliente y módulo.</p>
                 </div>

               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-[11px] font-extrabold uppercase text-zinc-500">Código Variable *</label>
                 <input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '_')})} disabled={!!editingId} placeholder="Ej. IVA_19" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:border-black uppercase disabled:opacity-50" />
               </div>
               
               {formData.alcance !== 'NODO' && (
                 <div className="space-y-1.5 animate-in fade-in">
                   <label className="text-[11px] font-extrabold uppercase text-zinc-500 flex items-center gap-1">
                     Módulo SaaS {formData.alcance === 'GLOBAL' && <span className="lowercase font-medium text-zinc-400">(Opcional)</span>}
                   </label>
                   <SearchableSelect 
                     value={formData.programaId} 
                     options={formData.alcance === 'GLOBAL' ? [{ id: '', nombre: '--- Ninguno (Transversal) ---' }, ...programas] : programas} 
                     onChange={(v:any) => setFormData({...formData, programaId: v})} 
                     placeholder={formData.alcance === 'GLOBAL' ? "Transversal (Aplica a todos)..." : "Seleccionar Módulo..."} 
                     loading={loadingOptions} 
                     labelKey="nombre" 
                   />
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Nombre / Etiqueta *</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Impuesto Valor Agregado (19%)" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:border-black" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Agrupador / Estructura *</label>
                <SearchableSelect value={formData.estructuraAgrupadoraId} options={estructuras} onChange={(v:any) => setFormData({...formData, estructuraAgrupadoraId: v})} placeholder="Clasificación (Ej. Deducciones)..." loading={loadingOptions} labelKey="nombre" />
              </div>
            </div>

            {/* 🔥 NUEVO BLOQUE: TIPO DE CÁLCULO Y NATURALEZA CONTABLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Tipo de Cálculo *</label>
                <select value={formData.tipoCalculo} onChange={e => setFormData({...formData, tipoCalculo: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:border-black cursor-pointer">
                  <option value="DINAMICO">Dinámico (Viene de la Venta/Tablet)</option>
                  <option value="ESTATICO">Estático (Valor fijo paramétrico)</option>
                  <option value="FORMULA">Fórmula (Evaluación Matemática)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Naturaleza Contable *</label>
                <select value={formData.naturaleza} onChange={e => setFormData({...formData, naturaleza: e.target.value})} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:border-black cursor-pointer">
                  <option value="SUMA">Suma (+)</option>
                  <option value="RESTA">Resta (-)</option>
                </select>
              </div>
            </div>

            {formData.tipoCalculo === 'ESTATICO' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Valor Fijo ($ o %)</label>
                <input required type="number" step="0.01" value={formData.valorFijo} onChange={e => setFormData({...formData, valorFijo: e.target.value})} placeholder="Ej. 15000" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-black focus:bg-white focus:border-black" />
              </div>
            )}

            {formData.tipoCalculo === 'FORMULA' && (
              <div className="animate-in fade-in bg-zinc-50 border border-zinc-200 p-5 rounded-2xl shadow-inner mt-6">
                
                <div className="relative mb-5">
                  <textarea 
                    readOnly 
                    rows={2}
                    value={formData.formula} 
                    placeholder="LA FÓRMULA SE CONSTRUIRÁ AQUÍ..." 
                    className="w-full p-4 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-800 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 resize-none uppercase shadow-sm cursor-not-allowed pr-14" 
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    <button type="button" onClick={borrarUltimoToken} className="p-1.5 bg-zinc-100 text-zinc-500 hover:text-white hover:bg-black rounded-lg border border-zinc-200 transition-colors shadow-sm" title="Borrar último bloque">
                      <Delete className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, formula: ''})} className="p-1.5 bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg border border-zinc-200 transition-colors shadow-sm" title="Limpiar pantalla">
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-4 h-4 text-zinc-400" />
                      <p className="text-[10px] font-extrabold uppercase text-zinc-500">Teclado Numérico</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['(', ')', '<', '>'].map(op => (
                        <button key={op} type="button" onClick={() => inyectarEnFormula(op, false)} className="h-12 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-black text-zinc-600 hover:bg-zinc-200 transition-colors">{op}</button>
                      ))}
                      {['7', '8', '9', '/'].map((op, i) => (
                        <button key={op} type="button" onClick={() => inyectarEnFormula(op, i<3)} className={`h-12 border border-zinc-200 rounded-xl text-lg font-black transition-colors ${i<3 ? 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-200 border-zinc-200'}`}>{op}</button>
                      ))}
                      {['4', '5', '6', '*'].map((op, i) => (
                        <button key={op} type="button" onClick={() => inyectarEnFormula(op, i<3)} className={`h-12 border border-zinc-200 rounded-xl text-lg font-black transition-colors ${i<3 ? 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-200 border-zinc-200'}`}>{op}</button>
                      ))}
                      {['1', '2', '3', '-'].map((op, i) => (
                        <button key={op} type="button" onClick={() => inyectarEnFormula(op, i<3)} className={`h-12 border border-zinc-200 rounded-xl text-lg font-black transition-colors ${i<3 ? 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-200 border-zinc-200'}`}>{op}</button>
                      ))}
                      {['0', '.', ',', '+'].map((op, i) => (
                        <button key={op} type="button" onClick={() => inyectarEnFormula(op, i<2)} className={`h-12 border border-zinc-200 rounded-xl text-lg font-black transition-colors ${i<3 ? 'bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-200 border-zinc-200'}`}>{op}</button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col h-[345px]">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <Sigma className="w-4 h-4 text-black" />
                      <p className="text-[10px] font-extrabold uppercase text-zinc-500">Funciones de Motor</p>
                    </div>
                    
                    <div className="relative mb-3 shrink-0">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Filtrar funciones..." 
                        value={funcionSearch}
                        onChange={(e) => setFuncionSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {funcionesSistema
                        .filter(fn => fn.nombre.toLowerCase().includes(funcionSearch.toLowerCase()) || fn.desc.toLowerCase().includes(funcionSearch.toLowerCase()))
                        .map(fn => (
                        <button 
                          key={fn.cmd} type="button" 
                          onClick={() => inyectarEnFormula(fn.cmd, false)}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left hover:bg-black hover:border-black group transition-all"
                        >
                          <p className="text-xs font-black text-zinc-700 font-mono group-hover:text-white">{fn.nombre}</p>
                          <p className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 mt-1 leading-tight">{fn.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col h-[345px]">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <Binary className="w-4 h-4 text-black" />
                      <p className="text-[10px] font-extrabold uppercase text-zinc-500">Variables Disponibles</p>
                    </div>
                    <div className="relative mb-3 shrink-0">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Filtrar variables..." 
                        value={formulaSearch}
                        onChange={(e) => setFormulaSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {conceptos
                        .filter(c => c.codigo !== formData.codigo && (c.codigo.toLowerCase().includes(formulaSearch.toLowerCase()) || c.nombre.toLowerCase().includes(formulaSearch.toLowerCase())))
                        .map(c => (
                          <button 
                            key={c.id} type="button"
                            onClick={() => inyectarEnFormula(c.codigo, false)}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left hover:bg-black hover:border-black group transition-all"
                            title={c.nombre}
                          >
                            <p className="text-xs font-black text-zinc-700 font-mono group-hover:text-white truncate">{c.codigo}</p>
                            <p className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 mt-1 truncate">{c.nombre}</p>
                          </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            <div className="pt-6 border-t border-zinc-100">
               <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Comportamiento Contable</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-inner">
                 
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="checkbox" checked={formData.esRecaudable} onChange={e => setFormData({...formData, esRecaudable: e.target.checked})} className="w-4 h-4 accent-black" />
                   <span className="text-sm font-bold text-zinc-700">Es Recaudable <span className="text-xs font-medium text-zinc-500 block">(Afecta Totales)</span></span>
                 </label>

                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="checkbox" checked={formData.esFuncion} onChange={e => setFormData({...formData, esFuncion: e.target.checked})} className="w-4 h-4 accent-black" />
                   <span className="text-sm font-bold text-zinc-700">Contiene Función <span className="text-xs font-medium text-zinc-500 block">(Lógica de Motor)</span></span>
                 </label>

                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="checkbox" checked={formData.aplicaIva} onChange={e => setFormData({...formData, aplicaIva: e.target.checked})} className="w-4 h-4 accent-black" />
                   <span className="text-sm font-bold text-zinc-700">Aplica Impuesto (IVA) <span className="text-xs font-medium text-zinc-500 block">(Base gravable)</span></span>
                 </label>

                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="checkbox" checked={formData.financiable} onChange={e => setFormData({...formData, financiable: e.target.checked})} className="w-4 h-4 accent-black" />
                   <span className="text-sm font-bold text-zinc-700">Es Financiable <span className="text-xs font-medium text-zinc-500 block">(A crédito)</span></span>
                 </label>

               </div>
            </div>

            {formData.alcance === 'LOCAL' && (
              <div className="space-y-1.5 animate-in fade-in pb-4">
                <label className="text-[11px] font-extrabold uppercase text-zinc-500">Asignar a Cliente (Tenant) *</label>
                <SearchableSelect value={formData.empresaId} options={empresas} onChange={(v:any) => setFormData({...formData, empresaId: v})} placeholder="Seleccionar Tenant..." loading={loadingOptions} labelKey="nombreComercial" />
              </div>
            )}

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 transition-colors text-sm">Cancelar</button>
            <button 
              type="submit" 
              form="conceptoForm" 
              disabled={!isFormValid} 
              className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar Concepto'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="Eliminar Concepto"
        message={`¿Estás seguro que deseas eliminar el concepto "${confirmDialog.nombre}"? Si ya está en uso, el sistema bloqueará la acción.`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, nombre: '' })}
        onConfirm={confirmarEliminacion}
      />
    </div>
  );
}