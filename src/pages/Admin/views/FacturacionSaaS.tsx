import React, { useState, useEffect } from 'react';
import { 
  Server, Search, Calendar, Calculator,
  PlayCircle, CheckCircle2, Loader2, Printer, AlertCircle,
  ArrowRight, XCircle, Plus, DollarSign, ChevronDown, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { suscripcionesService } from '../../../api/suscripciones.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import { conceptosService } from '../../../api/conceptos.service';
import { empresasService } from '../../../api/empresas.service';
import { documentosService } from '../../../api/documentos.service'; 

// SELECT INTELIGENTE MONOCROMÁTICO
const SearchableSuscripcionSelect = ({ value, options, onChange, placeholder, disabled, loading }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const safeOptions = options || [];
  // 🔥 BLINDAJE 1: String() seguro
  const selectedOption = safeOptions.find((opt: any) => String(opt.id) === String(value));
  
  const filteredOptions = safeOptions.filter((opt: any) => {
    const term = searchTerm.toLowerCase();
    const nombreEmpresa = opt.empresa?.nombreComercial?.toLowerCase() || '';
    const nombrePrograma = opt.programa?.nombre?.toLowerCase() || '';
    return nombreEmpresa.includes(term) || nombrePrograma.includes(term);
  });

  return (
    <div className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white focus:border-black focus:ring-1 focus:ring-black'}`}
      >
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption ? `${selectedOption.empresa?.nombreComercial} - ${selectedOption.programa?.nombre}` : placeholder}
        </span>
        {loading ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus type="text" placeholder="Buscar por cliente o módulo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all" />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3 text-center">No hay suscripciones activas.</p>
              ) : (
                filteredOptions.map((opt: any) => (
                  <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex flex-col ${String(value) === String(opt.id) ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                    <span className="truncate">{opt.empresa?.nombreComercial}</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest mt-0.5 ${String(value) === String(opt.id) ? 'text-zinc-400' : 'text-zinc-500'}`}>{opt.programa?.nombre}</span>
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

export default function FacturacionSaaS() {
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [empresasFull, setEmpresasFull] = useState<any[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<any[]>([]);
  const [conceptosManuales, setConceptosManuales] = useState<any[]>([]); 

  const [filtros, setFiltros] = useState({
    suscripcionId: '',
    liquidacionCodigo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const [novedades, setNovedades] = useState<{codigo: string, nombre: string, valor: number, tipo: string}[]>([]);
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [nuevaNovedad, setNuevaNovedad] = useState({ concepto: '', valor: '' });

  const [borrador, setBorrador] = useState<any>(null);
  const [documentoEmitido, setDocumentoEmitido] = useState<any>(null);

  const NODO_MASTER_ID = 1;

  useEffect(() => {
    cargarSuscripciones();
    cargarPlantillasTransversales(); 
  }, []);

  const cargarSuscripciones = async () => {
    setLoading(true);
    try {
      const [subsRes, empsRes] = await Promise.all([suscripcionesService.obtenerTodas(), empresasService.obtenerTodas()]);
      setSuscripciones((subsRes || []).filter((s: any) => s.activo));
      setEmpresasFull(empsRes || []);
    } catch (e) {
      toast.error("Error cargando suscripciones");
    } finally {
      setLoading(false);
    }
  };

  const cargarPlantillasTransversales = async () => {
    try {
      const [liqs, conceptos] = await Promise.all([
        liquidacionesService.obtenerPlantillasPorPrograma(0),
        conceptosService.obtenerDisponibles(NODO_MASTER_ID, 0)
      ]);
      setLiquidaciones(liqs || []);
      setConceptosManuales((conceptos || []).filter((c: any) => c.tipoCalculo !== 'FORMULA'));
    } catch (e) {
      toast.error("Error cargando plantillas SaaS transversales");
    }
  };

  // ============================================================================
  // PASO 1: PRELIQUIDACIÓN REAL (Consulta al Backend)
  // ============================================================================
  const handleCalcular = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProcesando(true);
    setDocumentoEmitido(null);

    // 🔥 BLINDAJE 2: String seguro y Toast
    const sub = suscripciones.find(s => String(s.id) === String(filtros.suscripcionId));
    if (!sub) { 
      toast.error("Error: No se pudo identificar la suscripción seleccionada.");
      setProcesando(false); 
      return; 
    }

    const empresaInfo = empresasFull.find(emp => String(emp.id) === String(sub.empresa?.id));
    if (!empresaInfo || !empresaInfo.tercero) {
        toast.error("Error: La empresa cliente no tiene un tercero asociado para facturarle.");
        setProcesando(false); 
        return;
    }

    try {
      const valoresManuales: Record<string, number> = {};
      novedades.forEach(n => { valoresManuales[n.codigo] = n.valor; });
      valoresManuales["CANTIDAD_TABLETS"] = sub.dispositivosActivos || 0;

      const payload = {
        empresaId: NODO_MASTER_ID,         
        programaId: 0,                     
        terceroId: empresaInfo.tercero.id, 
        tipoDocumentoCodigo: "FV",         
        codigoLiquidacion: filtros.liquidacionCodigo,
        valoresOperativos: valoresManuales
      };

      const dataBorrador = await documentosService.preliquidar(payload);
      
      setBorrador(dataBorrador);
      toast.success("Proforma generada correctamente");

    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al calcular la proforma.");
    } finally {
      setProcesando(false);
    }
  };

  const agregarNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    const conceptoSelec = conceptosManuales.find(c => String(c.codigo) === String(nuevaNovedad.concepto));
    if (!conceptoSelec) return;
    
    const tipoNav = (conceptoSelec.nombre.toLowerCase().includes('descuento') || conceptoSelec.nombre.toLowerCase().includes('compensación')) ? 'RESTA' : 'SUMA';
    
    setNovedades([...novedades, { codigo: conceptoSelec.codigo, nombre: conceptoSelec.nombre, valor: Number(nuevaNovedad.valor), tipo: tipoNav }]);
    setIsNovedadModalOpen(false);
    setNuevaNovedad({ concepto: '', valor: '' });
  };

  useEffect(() => { 
    if (borrador && !procesando) handleCalcular(); 
  }, [novedades]);

  // ============================================================================
  // PASO 2: LIQUIDACIÓN OFICIAL REAL (Sella en BD)
  // ============================================================================
  const handleSellarDocumento = async () => {
    setProcesando(true);
    
    // 🔥 BLINDAJE 3
    const sub = suscripciones.find(s => String(s.id) === String(filtros.suscripcionId));
    if (!sub) {
      toast.error("Error de contexto: Suscripción perdida en memoria.");
      setProcesando(false); 
      return;
    }

    const empresaInfo = empresasFull.find(e => String(e.id) === String(sub.empresa?.id));
    if (!empresaInfo || !empresaInfo.tercero) {
        toast.error("La empresa seleccionada no tiene un tercero legal asignado.");
        setProcesando(false); 
        return;
    }

    const valoresManuales: Record<string, number> = {};
    novedades.forEach(n => { valoresManuales[n.codigo] = n.valor; });
    valoresManuales["CANTIDAD_TABLETS"] = sub.dispositivosActivos || 0;

    const payload = {
      empresaId: NODO_MASTER_ID, 
      programaId: 0, 
      terceroId: empresaInfo.tercero.id, 
      tipoDocumentoCodigo: "FV", 
      codigoLiquidacion: filtros.liquidacionCodigo,
      valoresOperativos: valoresManuales,
    };

    try {
      const response = await documentosService.liquidar(payload);
      
      setDocumentoEmitido({ consecutivo: response.consecutivo, total: response.total });
      setBorrador(null); 
      setNovedades([]);
      toast.success(`Factura SaaS emitida con éxito.`);

    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al sellar el documento");
    } finally {
      setProcesando(false);
    }
  };

  const isFormValid = filtros.suscripcionId && filtros.liquidacionCodigo && filtros.fechaInicio && filtros.fechaFin;
  // 🔥 BLINDAJE 4
  const suscripcionSel = suscripciones.find(s => String(s.id) === String(filtros.suscripcionId));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative h-full flex flex-col">
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <Server className="w-8 h-8 text-black" /> Facturación SaaS (B2B)
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Liquida y factura automáticamente el uso de la plataforma a tus clientes.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        
        {/* === PANEL FORMULARIO === */}
        <div className="w-full xl:w-80 shrink-0 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col h-fit">
          <div className="flex items-center gap-2 mb-5 border-b border-zinc-100 pb-4">
            <Calculator className="w-5 h-5 text-black" />
            <h3 className="font-black text-lg text-zinc-900">Datos del Cobro</h3>
          </div>

          <form onSubmit={handleCalcular} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Building2 className="w-3 h-3"/> Suscripción / Cliente *</label>
              <SearchableSuscripcionSelect 
                value={filtros.suscripcionId} options={suscripciones} onChange={(val: any) => setFiltros({...filtros, suscripcionId: val})}
                placeholder="Buscar suscripción..." loading={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Esquema Transversal *</label>
              <select required disabled={loading} value={filtros.liquidacionCodigo} onChange={e => setFiltros({...filtros, liquidacionCodigo: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:bg-white focus:border-black outline-none transition-all disabled:opacity-50">
                <option value="">Seleccionar Matriz...</option>
                {liquidaciones.map(l => <option key={l.codigo} value={l.codigo}>{l.nombre}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Desde</label>
                <input type="date" required value={filtros.fechaInicio} onChange={e => setFiltros({...filtros, fechaInicio: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:bg-white focus:border-black outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Hasta</label>
                <input type="date" required value={filtros.fechaFin} onChange={e => setFiltros({...filtros, fechaFin: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:bg-white focus:border-black outline-none transition-all" />
              </div>
            </div>

            <div className="pt-5 mt-2">
              <button type="submit" disabled={!isFormValid || procesando} className="w-full py-3.5 bg-black text-white font-black rounded-xl text-sm hover:bg-zinc-800 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                {procesando ? 'Midiendo Consumo...' : 'Generar Proforma'}
              </button>
            </div>
          </form>
        </div>

        {/* === PANEL VISOR (TICKET) === */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-3xl shadow-inner flex flex-col overflow-hidden relative">
          
          {!borrador && !documentoEmitido && !procesando && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <Server className="w-20 h-20 mb-4 opacity-20 text-black" />
              <h4 className="font-black text-xl text-zinc-500">Monitor de Facturación SaaS</h4>
              <p className="text-sm font-medium mt-2 max-w-md">Selecciona un cliente y la matriz transversal. El motor buscará automáticamente las métricas de uso.</p>
            </div>
          )}

          {procesando && !documentoEmitido && !borrador && (
             <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-zinc-100/50">
               <Loader2 className="w-16 h-16 animate-spin mb-4 text-black" />
               <h4 className="font-black text-lg animate-pulse text-black">Auditando Infraestructura...</h4>
               <p className="text-xs font-bold text-zinc-400 mt-2">Contando terminales, aplicando novedades y resolviendo fórmulas.</p>
             </div>
          )}

          {borrador && (
            <div className={`flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-zinc-100/80 transition-opacity ${procesando ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col h-max">
                
                <div className="bg-black p-5 text-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500"></div>
                  <h2 className="text-white font-black text-xl tracking-widest uppercase">PROFORMA B2B</h2>
                  <p className="text-zinc-400 text-[10px] font-bold mt-1 tracking-widest">NODO MASTER INC. - COBRO DE SERVICIOS</p>
                </div>

                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 text-sm flex justify-between items-center shrink-0">
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-400">Facturar a:</p>
                    <p className="font-black text-zinc-900">{suscripcionSel?.empresa?.nombreComercial || 'Empresa'}</p>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">Periodo: {filtros.fechaInicio} a {filtros.fechaFin}</p>
                  </div>
                  <div className="text-right bg-white border border-zinc-200 p-3 rounded-xl shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-500 mb-1">Métricas Base</p>
                    <p className="font-black text-black text-sm">{borrador.statsOperativas?.dispositivosActivos || 0} Terminales</p>
                  </div>
                </div>

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-end mb-4 border-b border-zinc-100 pb-2">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-widest">Conceptos Facturados</p>
                    <button onClick={() => setIsNovedadModalOpen(true)} className="text-xs font-black text-black hover:text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-zinc-200">
                      <Plus className="w-3.5 h-3.5" /> Añadir Ajuste al Vuelo
                    </button>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    {borrador.detalles?.map((det: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-zinc-50 rounded-lg transition-colors group">
                        <div className="flex items-center gap-2.5">
                          {det.naturaleza === 'SUMA' ? <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-zinc-600"/></div> : <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center"><AlertCircle className="w-3 h-3 text-red-500"/></div>}
                          <div>
                            <p className="font-bold text-zinc-800">{det.conceptoNombre}</p>
                            <p className="text-[9px] font-mono text-zinc-400">{det.conceptoCodigo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-black text-base ${det.naturaleza === 'SUMA' ? 'text-zinc-900' : 'text-red-600'}`}>
                            {det.naturaleza === 'RESTA' ? '-' : ''} ${det.valorTotal?.toLocaleString()}
                          </span>
                          {novedades.find(n => n.codigo === det.conceptoCodigo) && (
                            <button onClick={() => setNovedades(novedades.filter(n => n.codigo !== det.conceptoCodigo))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Quitar novedad">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-100 p-6 border-t-2 border-dashed border-zinc-200 shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-zinc-500 tracking-widest">Total Factura SaaS</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Este valor ingresará a la cartera de NODO.</p>
                    </div>
                    <p className="text-4xl font-black text-black font-mono">${borrador.total?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-5 bg-white flex gap-3 shrink-0">
                  <button onClick={() => {setBorrador(null); setNovedades([])}} className="px-5 py-3.5 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-colors text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                  <button onClick={handleSellarDocumento} className="flex-1 py-3.5 bg-black text-white font-black rounded-xl text-sm hover:bg-zinc-800 shadow-lg transition-all flex justify-center items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-zinc-300" /> Emitir Documento Oficial
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ESTADO 4: ÉXITO */}
          {documentoEmitido && (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-50 p-8 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white border border-zinc-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-black" />
              </div>
              <h4 className="font-black text-3xl text-zinc-900 tracking-tight mb-2">¡Factura Emitida!</h4>
              <p className="text-sm font-bold text-zinc-500 mb-8 max-w-sm">
                La factura ha sido registrada a favor de NODO MASTER INC. en tu cartera.
              </p>
              
              <div className="bg-white border border-zinc-200 shadow-md rounded-2xl p-6 w-full max-w-sm flex justify-between items-center mb-8">
                <div className="text-left">
                  <p className="text-[10px] font-extrabold uppercase text-zinc-400">Documento</p>
                  <p className="font-mono font-black text-xl text-black">{documentoEmitido.consecutivo}</p>
                </div>
                <div className="text-right border-l border-zinc-100 pl-6">
                  <p className="text-[10px] font-extrabold uppercase text-zinc-400">Gran Total</p>
                  <p className="font-mono font-black text-lg text-black">${documentoEmitido.total?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => {setDocumentoEmitido(null); setFiltros({...filtros, suscripcionId: ''})}} className="px-6 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-colors text-sm flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Nuevo Cobro
                </button>
                <button className="px-6 py-3 rounded-xl bg-black text-white font-black hover:bg-zinc-800 shadow-md transition-all text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE NOVEDADES MANUALES */}
      {isNovedadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200">
             <div className="flex justify-between items-center mb-5">
               <h3 className="font-black text-lg text-zinc-900">Ajuste Manual B2B</h3>
               <button onClick={() => setIsNovedadModalOpen(false)} className="text-zinc-400 hover:text-black"><XCircle className="w-5 h-5"/></button>
             </div>
             
             <form onSubmit={agregarNovedad} className="space-y-4">
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Concepto Paramétrico *</label>
                 <select required value={nuevaNovedad.concepto} onChange={e => setNuevaNovedad({...nuevaNovedad, concepto: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-900 focus:bg-white focus:border-black outline-none transition-all">
                   <option value="">Seleccionar Novedad...</option>
                   {conceptosManuales.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre} ({c.codigo})</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Valor en Dinero *</label>
                 <div className="relative">
                   <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input type="number" required min="1" value={nuevaNovedad.valor} onChange={e => setNuevaNovedad({...nuevaNovedad, valor: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-base font-black text-zinc-900 focus:bg-white focus:border-black outline-none transition-all font-mono" placeholder="20000" />
                 </div>
               </div>
               <div className="pt-2">
                 <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl text-sm hover:bg-zinc-800 shadow-md transition-colors flex justify-center items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Añadir
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}