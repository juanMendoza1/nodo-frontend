// src/pages/Admin/views/LiquidacionesMaster.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Search, Layers, ChevronRight, X, 
  CheckCircle2, Loader2, ArrowUp, ArrowDown, 
  Settings2, Activity, Trash2, Globe, FileText
} from 'lucide-react';

// Servicios
import { programasService, type ProgramaData } from '../../../api/programas.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import { conceptosService } from '../../../api/conceptos.service';
import { tiposDocumentosService } from '../../../api/tiposDocumentos.service';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

// 🔥 Importamos las interfaces fuertemente tipadas
import type { 
  ConceptoFacturacion, 
  LiquidacionPlantilla, 
  ConceptoRelacionadoItem, 
  TipoDocumento 
} from '../../../types/facturacion.types';

export default function LiquidacionesMaster() {
  // --- Estados de Catálogos ---
  const [programas, setProgramas] = useState<ProgramaData[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]); 
  const [programaSeleccionado, setProgramaSeleccionado] = useState<number | null>(0); 
  
  // --- Estados de Liquidaciones ---
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPlantilla[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Modal de Creación de Plantilla ---
  const [isPlantillaModalOpen, setIsPlantillaModalOpen] = useState<boolean>(false);
  const [nuevaLiquidacion, setNuevaLiquidacion] = useState<{codigo: string; nombre: string; tipoDocumentoId: string}>({ 
    codigo: '', nombre: '', tipoDocumentoId: '' 
  });

  // --- Modal (Drawer) de Construcción de Receta ---
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [liquidacionActiva, setLiquidacionActiva] = useState<LiquidacionPlantilla | null>(null);
  const [conceptosDisponibles, setConceptosDisponibles] = useState<ConceptoFacturacion[]>([]);
  const [conceptosRelacionados, setConceptosRelacionados] = useState<ConceptoRelacionadoItem[]>([]);
  const [searchConcepto, setSearchConcepto] = useState<string>('');

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; id: number; nombre: string}>({ 
    isOpen: false, id: 0, nombre: '' 
  });

  const EMPRESA_MASTER_ID = 1; 

  useEffect(() => {
    // 🔥 Carga inicial de programas y tipos de documentos
    Promise.all([
      programasService.obtenerTodos(),
      tiposDocumentosService.obtenerTodos()
    ]).then(([dataProg, dataDocs]) => {
      setProgramas(dataProg as ProgramaData[] || []);
      setTiposDocumentos(dataDocs as TipoDocumento[] || []);
      cargarLiquidaciones(0);
    });
  }, []);

  useEffect(() => {
    if (programaSeleccionado !== null) {
      cargarLiquidaciones(programaSeleccionado);
    }
  }, [programaSeleccionado]);

  const cargarLiquidaciones = async (progId: number) => {
    setLoading(true);
    try {
      const res = await liquidacionesService.obtenerPlantillasPorPrograma(progId);
      setLiquidaciones(res as LiquidacionPlantilla[] || []);
    } catch (e) {
      toast.error("Error cargando liquidaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearLiquidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaLiquidacion.tipoDocumentoId) {
      toast.error("Debe seleccionar un tipo de documento");
      return;
    }

    const promesa = liquidacionesService.crearPlantilla({
      ...nuevaLiquidacion,
      programaId: programaSeleccionado === 0 ? null : programaSeleccionado
    });

    toast.promise(promesa, {
      loading: 'Creando liquidación...',
      success: () => {
        setIsPlantillaModalOpen(false);
        setNuevaLiquidacion({ codigo: '', nombre: '', tipoDocumentoId: '' });
        cargarLiquidaciones(programaSeleccionado!);
        return 'Esquema creado con éxito';
      },
      error: (err: any) => err.response?.data?.error || 'Error al crear'
    });
  };

  const confirmarEliminacion = async () => {
    toast.promise(liquidacionesService.eliminarPlantilla(confirmDialog.id), {
        loading: 'Eliminando liquidación...',
        success: () => {
          cargarLiquidaciones(programaSeleccionado!);
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return 'Esquema eliminado correctamente';
        },
        error: (err: any) => {
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return err.response?.data?.error || 'No se puede eliminar porque está en uso.';
        }
    });
  };

  const abrirRelacionador = async (liquidacion: LiquidacionPlantilla) => {
    setLiquidacionActiva(liquidacion);
    setIsBuilderOpen(true);
    setSearchConcepto('');
    
    try {
      const disponibles = await conceptosService.obtenerDisponibles(EMPRESA_MASTER_ID, programaSeleccionado!);
      const configuracion = await liquidacionesService.obtenerRecetaActual(EMPRESA_MASTER_ID, liquidacion.codigo, programaSeleccionado!);
      
      const relacionadosMapeados: ConceptoRelacionadoItem[] = configuracion.map((c: any) => ({
        conceptoId: c.concepto.id,
        conceptoNombre: c.concepto.nombre,
        codigo: c.concepto.codigo,
        ordenCalculo: c.ordenCalculo
      })).sort((a: ConceptoRelacionadoItem, b: ConceptoRelacionadoItem) => a.ordenCalculo - b.ordenCalculo);

      setConceptosDisponibles(disponibles as ConceptoFacturacion[]);
      setConceptosRelacionados(relacionadosMapeados);
    } catch (e) {
      toast.error("Error al cargar los conceptos relacionados");
    }
  };

  const agregarConcepto = (concepto: ConceptoFacturacion) => {
    if (conceptosRelacionados.find(r => r.conceptoId === concepto.id)) return;
    setConceptosRelacionados([...conceptosRelacionados, {
      conceptoId: concepto.id,
      conceptoNombre: concepto.nombre,
      codigo: concepto.codigo,
      ordenCalculo: conceptosRelacionados.length + 1
    }]);
  };

  const quitarConcepto = (conceptoId: number) => {
    const nuevos = conceptosRelacionados.filter(r => r.conceptoId !== conceptoId);
    setConceptosRelacionados(nuevos.map((r, index) => ({ ...r, ordenCalculo: index + 1 })));
  };

  const moverOrden = (index: number, direccion: 'UP' | 'DOWN') => {
    const nuevos = [...conceptosRelacionados];
    if (direccion === 'UP' && index > 0) {
      const temp = nuevos[index]; nuevos[index] = nuevos[index - 1]; nuevos[index - 1] = temp;
    } else if (direccion === 'DOWN' && index < nuevos.length - 1) {
      const temp = nuevos[index]; nuevos[index] = nuevos[index + 1]; nuevos[index + 1] = temp;
    }
    setConceptosRelacionados(nuevos.map((r, i) => ({ ...r, ordenCalculo: i + 1 })));
  };

  const guardarRelacion = async () => {
    if (!liquidacionActiva) return;

    const payload = {
      codigo: liquidacionActiva.codigo,
      programaId: programaSeleccionado === 0 ? null : programaSeleccionado,
      conceptosRelacionados: conceptosRelacionados
    };
    
    toast.promise(liquidacionesService.configurarReceta(EMPRESA_MASTER_ID, payload), {
      loading: 'Guardando matriz...',
      success: () => {
        setIsBuilderOpen(false);
        return 'Conceptos ensamblados correctamente';
      },
      error: (err: any) => err.response?.data?.error || "Error al guardar"
    });
  };

  const conceptosFiltrados = conceptosDisponibles.filter(c => 
    c.nombre.toLowerCase().includes(searchConcepto.toLowerCase()) || 
    c.codigo.toLowerCase().includes(searchConcepto.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full flex flex-col">
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <Calculator className="w-8 h-8 text-black" /> Matrices de Liquidación
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Diseña esquemas financieros transversales o específicos por módulo.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* SIDEBAR DE CATEGORÍAS */}
        <div className="w-full lg:w-64 shrink-0 bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3 px-2">Categorías</p>
          <div className="space-y-1.5 overflow-y-auto pr-1">
            <button
              onClick={() => setProgramaSeleccionado(0)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${programaSeleccionado === 0 ? 'bg-black text-white shadow-md' : 'text-zinc-600 hover:bg-zinc-100 border border-transparent'}`}
            >
              <Globe className="w-4 h-4" /> Global / Transversal
            </button>
            <div className="my-2 border-t border-zinc-100"></div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2 mt-2 px-2">Módulos SaaS</p>
            {programas.map(prog => (
              <button
                key={prog.id}
                onClick={() => setProgramaSeleccionado(prog.id!)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${programaSeleccionado === prog.id ? 'bg-black text-white shadow-md' : 'text-zinc-600 hover:bg-zinc-100 border border-transparent'}`}
              >
                {prog.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO CENTRAL */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <h3 className="font-extrabold text-zinc-900 flex items-center gap-2 text-lg">
              <Layers className="w-5 h-5 text-zinc-400" /> Esquemas Configuradas
            </h3>
            <button onClick={() => setIsPlantillaModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md">
              <Plus className="w-4 h-4" /> Nuevo Esquema
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 bg-zinc-50/30">
            {loading ? (
              <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400"/></div>
            ) : liquidaciones.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 font-medium">No hay matrices configuradas en esta categoría.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liquidaciones.map(liq => (
                  <div key={liq.id} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-black transition-all duration-300 group relative flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-base font-black text-zinc-900 leading-tight">{liq.nombre}</h4>
                        <div className="flex gap-2 mt-2">
                          <span className="bg-zinc-100 text-zinc-500 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest">{liq.codigo}</span>
                          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {liq.tipoDocumentoGenerado?.codigo || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setConfirmDialog({ isOpen: true, id: liq.id, nombre: liq.nombre })} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-3 border-t border-zinc-100 flex justify-end">
                       <button onClick={() => abrirRelacionador(liq)} className="text-xs font-bold text-zinc-600 hover:text-black flex items-center gap-1">
                         <Settings2 className="w-3.5 h-3.5" /> Editar Matriz (POMDAS) <ChevronRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: CREAR LIQUIDACIÓN */}
      {isPlantillaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
             <h3 className="font-black text-lg mb-5 text-zinc-900">Nuevo Esquema</h3>
             <form onSubmit={handleCrearLiquidacion} className="space-y-4">
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Código Único</label>
                 <input required value={nuevaLiquidacion.codigo} onChange={e => setNuevaLiquidacion({...nuevaLiquidacion, codigo: e.target.value.toUpperCase().replace(/\s/g, '_')})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:bg-white focus:border-black outline-none uppercase transition-all" placeholder="Ej. COBRO_MENSUAL" />
               </div>
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Nombre Descriptivo</label>
                 <input required value={nuevaLiquidacion.nombre} onChange={e => setNuevaLiquidacion({...nuevaLiquidacion, nombre: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all" placeholder="Ej. Facturación Licencia SaaS" />
               </div>
               
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Documento Contable a Generar *</label>
                 <select 
                   required 
                   value={nuevaLiquidacion.tipoDocumentoId} 
                   onChange={e => setNuevaLiquidacion({...nuevaLiquidacion, tipoDocumentoId: e.target.value})}
                   className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:bg-white focus:border-black outline-none transition-all"
                 >
                   <option value="">Seleccionar Tipo...</option>
                   {tiposDocumentos.map(td => (
                     <option key={td.id} value={td.id.toString()}>{td.nombre} ({td.codigo})</option>
                   ))}
                 </select>
               </div>

               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setIsPlantillaModalOpen(false)} className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-sm hover:bg-zinc-200 transition-colors">Cancelar</button>
                 <button type="submit" className="flex-1 py-2.5 bg-black text-white font-bold rounded-xl text-sm hover:bg-zinc-800 shadow-md transition-colors">Guardar</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* DRAWER 2: RELACIONAR CONCEPTOS */}
      {isBuilderOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsBuilderOpen(false)}></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isBuilderOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div>
             <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
               <Activity className="w-4 h-4 text-black"/> Compilar Matriz
             </h3>
             <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
               Configurando esquema: <span className="font-bold text-zinc-800 uppercase">{liquidacionActiva?.nombre}</span>
             </p>
          </div>
          <button onClick={() => setIsBuilderOpen(false)} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex bg-zinc-50/50 p-4 gap-4">
          {/* PANEL IZQ: DISPONIBLES */}
          <div className="w-1/2 bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b border-zinc-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar concepto..." value={searchConcepto} onChange={e => setSearchConcepto(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {conceptosFiltrados.map(c => {
                const yaAgregado = conceptosRelacionados.find(r => r.conceptoId === c.id);
                return (
                  <div 
                    key={c.id} 
                    onClick={() => !yaAgregado && agregarConcepto(c)}
                    className={`p-2.5 rounded-lg border flex justify-between items-center transition-all ${
                      yaAgregado ? 'bg-zinc-50 border-transparent opacity-40 cursor-not-allowed' : 'bg-white border-zinc-200 cursor-pointer hover:border-black hover:shadow-sm group'
                    }`}
                  >
                     <div className="min-w-0 pr-2">
                       <p className="font-bold text-zinc-900 text-xs truncate">{c.nombre}</p>
                       <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{c.codigo}</p>
                     </div>
                     {!yaAgregado && <Plus className="w-4 h-4 text-zinc-300 group-hover:text-black shrink-0 transition-colors" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL DER: RELACIONADOS */}
          <div className="w-1/2 bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b border-zinc-100 bg-zinc-50">
              <h4 className="font-black text-xs text-zinc-800 uppercase tracking-widest">Pipeline de Cálculo</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {conceptosRelacionados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <Layers className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs font-medium text-center px-4">Haz clic en los conceptos de la izquierda para agregarlos al flujo matemático.</p>
                </div>
              ) : (
                conceptosRelacionados.map((item, index) => (
                  <div key={item.conceptoId} className="bg-white border border-zinc-200 rounded-lg p-2 flex items-center gap-2 shadow-sm hover:border-black transition-colors group">
                    <div className="flex items-center bg-zinc-100 rounded-md p-0.5 shrink-0 border border-zinc-200">
                      <button onClick={() => moverOrden(index, 'UP')} disabled={index === 0} className="p-1 text-zinc-500 hover:text-black hover:bg-white rounded disabled:opacity-30 disabled:bg-transparent"><ArrowUp className="w-3 h-3"/></button>
                      <span className="px-1.5 text-[10px] font-black text-zinc-700 w-4 text-center">{item.ordenCalculo}</span>
                      <button onClick={() => moverOrden(index, 'DOWN')} disabled={index === conceptosRelacionados.length - 1} className="p-1 text-zinc-500 hover:text-black hover:bg-white rounded disabled:opacity-30 disabled:bg-transparent"><ArrowDown className="w-3 h-3"/></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-zinc-900 text-xs truncate">{item.conceptoNombre}</h5>
                      <p className="text-[9px] font-mono text-zinc-500 font-bold">{item.codigo}</p>
                    </div>
                    <button onClick={() => quitarConcepto(item.conceptoId)} className="w-7 h-7 rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 bg-white shrink-0 flex justify-end gap-3">
            <button onClick={() => setIsBuilderOpen(false)} className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-colors text-sm">Cancelar</button>
            <button onClick={guardarRelacion} className="px-6 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md transition-all text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ensamblar Matriz
            </button>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="Eliminar Esquema"
        message={`¿Estás seguro que deseas eliminar "${confirmDialog.nombre}"? Se perderá la configuración de la matriz matemática.`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, nombre: '' })}
        onConfirm={confirmarEliminacion}
      />
    </div>
  );
}