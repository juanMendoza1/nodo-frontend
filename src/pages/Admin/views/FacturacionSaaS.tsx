import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Server, Search, Calendar, Calculator,
  PlayCircle, CheckCircle2, Loader2, Printer, AlertCircle,
  ArrowRight, XCircle, Plus, DollarSign, ChevronDown, Building2,
  Users, Layers, Zap, CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

import { suscripcionesService } from '../../../api/suscripciones.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import { conceptosService } from '../../../api/conceptos.service';
import { empresasService } from '../../../api/empresas.service';
import { documentosService } from '../../../api/documentos.service'; 
import { ciclosService } from '../../../api/ciclos.service';
import { programasService } from '../../../api/programas.service'; // 🔥 IMPORTAMOS PROGRAMAS

// --- CUSTOM CONFIRM TOAST ---
const confirmarAccion = (titulo: string, mensaje: string, onConfirm: () => void) => {
  toast((t) => (
    <div className="flex flex-col gap-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-black text-zinc-900">{titulo}</h4>
          <p className="text-sm text-zinc-600 mt-1 font-medium leading-tight">{mensaje}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-100">
        <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold rounded-lg text-xs transition-colors">Cancelar</button>
        <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className="px-4 py-2 bg-black text-white hover:bg-zinc-800 font-bold rounded-lg text-xs transition-colors shadow-md">Sí, Ejecutar</button>
      </div>
    </div>
  ), { duration: 8000, position: 'top-center', style: { maxWidth: '400px', padding: '16px', borderRadius: '16px' }});
};

// --- SELECTORES INTELIGENTES ---
const SearchableSelect = ({ value, options, onChange, placeholder, disabled, loading, renderLabel }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const safeOptions = options || [];
  const selectedOption = safeOptions.find((opt: any) => String(opt.id) === String(value));
  
  const filteredOptions = safeOptions.filter((opt: any) => {
    const term = searchTerm.toLowerCase();
    const texto = renderLabel ? renderLabel(opt) : opt.nombre;
    return texto?.toLowerCase().includes(term);
  });

  return (
    <div className="relative w-full">
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white focus:border-black focus:ring-1 focus:ring-black'}`}>
        <span className={selectedOption ? 'text-zinc-900 font-bold' : 'text-zinc-400'}>
          {selectedOption ? (renderLabel ? renderLabel(selectedOption) : selectedOption.nombre) : placeholder}
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
                <input autoFocus type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filteredOptions.map((opt: any) => (
                <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex flex-col ${String(value) === String(opt.id) ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                  <span className="truncate">{renderLabel ? renderLabel(opt) : opt.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default function FacturacionSaaS() {
  const NODO_MASTER_ID = 1;
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'MASIVO'>('INDIVIDUAL');

  const { data: initData, isLoading: loadingInit } = useQuery({
    queryKey: ['facturacion_init'],
    queryFn: async () => {
      const [subsRes, empsRes, ciclosRes] = await Promise.all([
        suscripcionesService.obtenerTodas(), 
        empresasService.obtenerTodas(), 
        ciclosService.obtenerTodos()
      ]);
      return { 
        suscripciones: (subsRes || []).filter((s: any) => s.activo), 
        empresasFull: empsRes || [], 
        ciclos: ciclosRes || [] 
      };
    }
  });
  
  // 🔥 EL FIX NIVEL PRO: Traer todas las liquidaciones unificando globales y por programa
  const { data: plantillasData, isLoading: loadingPlantillas } = useQuery({
    queryKey: ['plantillas_transversales'],
    queryFn: async () => {
      // 1. Traemos los conceptos manuales de Nodo
      const conceptos = await conceptosService.obtenerDisponibles(NODO_MASTER_ID, 0);
      
      // 2. Traemos las plantillas globales (ID 0)
      const globales = await liquidacionesService.obtenerPlantillasPorPrograma(0) || [];
      globales.forEach((g: any) => g.tipoFiltro = 'GLOBAL');

      // 3. Traemos todos los programas para buscar sus plantillas específicas
      const programas = await programasService.obtenerTodos() || [];
      let especificas: any[] = [];
      
      // 4. Hacemos una promesa múltiple para traer las de cada programa
      if (programas.length > 0) {
        const peticionesProgramas = programas.map((p: any) => liquidacionesService.obtenerPlantillasPorPrograma(p.id));
        const respuestasProgramas = await Promise.all(peticionesProgramas);
        
        respuestasProgramas.forEach((res: any, index) => {
            if (res && res.length > 0) {
                res.forEach((plantilla: any) => {
                    plantilla.tipoFiltro = 'PROGRAMA';
                    plantilla.programaNombre = programas[index].nombre; // Le pegamos el nombre para verlo en el select
                    especificas.push(plantilla);
                });
            }
        });
      }

      // 5. Unimos las globales con las específicas
      const todasLasLiquidaciones = [...globales, ...especificas];

      return { 
        liquidaciones: todasLasLiquidaciones, 
        conceptosManuales: (conceptos || []).filter((c: any) => c.tipoCalculo !== 'FORMULA') 
      };
    }
  });

  const suscripciones = initData?.suscripciones || [];
  const empresasFull = initData?.empresasFull || [];
  const ciclos = initData?.ciclos || [];
  const liquidaciones = plantillasData?.liquidaciones || [];
  const conceptosManuales = plantillasData?.conceptosManuales || [];

  // ============================================================================
  // LÓGICA TAB 1: INDIVIDUAL
  // ============================================================================
  const [filtrosInd, setFiltrosInd] = useState({ suscripcionId: '', liquidacionCodigo: '' });
  const [novedades, setNovedades] = useState<any[]>([]);
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [nuevaNovedad, setNuevaNovedad] = useState({ concepto: '', valor: '' });
  const [borradorInd, setBorradorInd] = useState<any>(null);
  const [docEmitidoInd, setDocEmitidoInd] = useState<any>(null);

  const suscripcionSel = useMemo(() => suscripciones.find((s: any) => String(s.id) === String(filtrosInd.suscripcionId)), [suscripciones, filtrosInd.suscripcionId]);
  const cicloIdInd = suscripcionSel?.cicloFacturacion?.id;

  const { data: periodosInd = [] } = useQuery({ queryKey: ['periodos_ind', cicloIdInd], queryFn: () => ciclosService.obtenerPeriodos(cicloIdInd!), enabled: !!cicloIdInd });
  const periodoActivoInd = useMemo(() => periodosInd.find((p: any) => p.estado === 'ABIERTO'), [periodosInd]);

  const mutationPreliqInd = useMutation({
    mutationFn: (payload: any) => documentosService.preliquidar(payload),
    onSuccess: (data) => setBorradorInd(data),
    onError: (error: any) => toast.error(error.response?.data?.error || "Error al calcular la proforma.")
  });

  const mutationLiqInd = useMutation({
    mutationFn: (payload: any) => documentosService.liquidar(payload),
    onSuccess: (data) => {
      setDocEmitidoInd({ consecutivo: data.consecutivo, total: data.total });
      setBorradorInd(null); setNovedades([]);
      toast.success("Factura emitida con éxito.", { duration: 4000, icon: '🚀' });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Error al sellar el documento")
  });

  const handleCalcularInd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!suscripcionSel || !periodoActivoInd) return;
    const emp = empresasFull.find((e: any) => String(e.id) === String(suscripcionSel.empresa.id));
    const valoresOperativos: any = { "CANTIDAD_TABLETS": suscripcionSel.dispositivosActivos || 0 };
    novedades.forEach(n => { valoresOperativos[n.codigo] = n.valor; });

    mutationPreliqInd.mutate({
      empresaId: NODO_MASTER_ID, programaId: 0, terceroId: emp.tercero.id, tipoDocumentoCodigo: "FV",
      codigoLiquidacion: filtrosInd.liquidacionCodigo, valoresOperativos, cicloId: cicloIdInd, periodoId: periodoActivoInd.id
    });
  };

  useEffect(() => { if (borradorInd && !mutationPreliqInd.isPending) handleCalcularInd(); }, [novedades]);

  const handleSellarInd = () => {
    confirmarAccion(
      "Emitir Factura Oficial",
      `¿Estás seguro de generar la factura para ${suscripcionSel.empresa.nombreComercial} por $${borradorInd.total?.toLocaleString()}?`,
      () => {
        const emp = empresasFull.find((e: any) => String(e.id) === String(suscripcionSel.empresa.id));
        const valoresOperativos: any = { "CANTIDAD_TABLETS": suscripcionSel.dispositivosActivos || 0 };
        novedades.forEach(n => { valoresOperativos[n.codigo] = n.valor; });

        mutationLiqInd.mutate({
          empresaId: NODO_MASTER_ID, programaId: 0, terceroId: emp.tercero.id, tipoDocumentoCodigo: "FV",
          codigoLiquidacion: filtrosInd.liquidacionCodigo, valoresOperativos, cicloId: cicloIdInd, periodoId: periodoActivoInd.id
        });
      }
    );
  };

  const agregarNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    const conceptoSelec = conceptosManuales.find((c: any) => String(c.codigo) === String(nuevaNovedad.concepto));
    if (!conceptoSelec) return;
    const tipoNav = conceptoSelec.nombre.toLowerCase().includes('descuento') ? 'RESTA' : 'SUMA';
    setNovedades([...novedades, { codigo: conceptoSelec.codigo, nombre: conceptoSelec.nombre, valor: Number(nuevaNovedad.valor), tipo: tipoNav }]);
    setIsNovedadModalOpen(false); setNuevaNovedad({ concepto: '', valor: '' });
  };

  // ============================================================================
  // LÓGICA TAB 2: MASIVO (BATCH BILLING)
  // ============================================================================
  const [filtrosMasivo, setFiltrosMasivo] = useState({ cicloId: '', liquidacionCodigo: '' });
  const [resultadoMasivo, setResultadoMasivo] = useState<any>(null);

  const { data: periodosMasivo = [] } = useQuery({ queryKey: ['periodos_masivo', filtrosMasivo.cicloId], queryFn: () => ciclosService.obtenerPeriodos(Number(filtrosMasivo.cicloId)), enabled: !!filtrosMasivo.cicloId });
  const periodoActivoMasivo = useMemo(() => periodosMasivo.find((p: any) => p.estado === 'ABIERTO'), [periodosMasivo]);
  
  const clientesEnCiclo = useMemo(() => suscripciones.filter((s: any) => String(s.cicloFacturacion?.id) === String(filtrosMasivo.cicloId)).length, [suscripciones, filtrosMasivo.cicloId]);

  const mutationLiqMasivo = useMutation({
    mutationFn: (payload: any) => documentosService.liquidarLote(payload),
    onSuccess: (data) => {
      setResultadoMasivo(data);
      toast.success("Lote masivo procesado con éxito.", { duration: 5000, icon: '🚀' });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Error al procesar lote masivo.")
  });

  const handleSellarMasivo = () => {
    confirmarAccion(
      "Facturación por Lote",
      `Estás a punto de liquidar masivamente a ${clientesEnCiclo} comercios del ciclo seleccionado. Esta acción generará múltiples facturas oficiales. ¿Continuar?`,
      () => {
        mutationLiqMasivo.mutate({
          empresaId: NODO_MASTER_ID, // 🔥 FIX: Le mandamos el ID 1 (Nodo Master)
          cicloId: Number(filtrosMasivo.cicloId),
          periodoId: periodoActivoMasivo.id,
          codigoLiquidacion: filtrosMasivo.liquidacionCodigo
        });
      }
    );
  };


  const isLoadingUI = loadingInit || loadingPlantillas;

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <Server className="w-8 h-8 text-black" /> Motor de Facturación SaaS
          </h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Liquida y emite facturas de acuerdo al ciclo y fechas habilitadas en el calendario.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO (CONTROLES) */}
        <div className="w-full xl:w-96 shrink-0 flex flex-col gap-4">
          
          <div className="bg-zinc-100 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-zinc-200/60">
            <button onClick={() => { setActiveTab('INDIVIDUAL'); setBorradorInd(null); setResultadoMasivo(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'INDIVIDUAL' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}>
              <Building2 className="w-4 h-4" /> Individual
            </button>
            <button onClick={() => { setActiveTab('MASIVO'); setBorradorInd(null); setResultadoMasivo(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'MASIVO' ? 'bg-black text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}>
              <Layers className="w-4 h-4" /> Masivo (Lote)
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
            
            {/* ======================= VISTA INDIVIDUAL ======================= */}
            {activeTab === 'INDIVIDUAL' && (
              <form onSubmit={handleCalcularInd} className="space-y-5 animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center gap-2 mb-2 border-b border-zinc-100 pb-3">
                  <Calculator className="w-5 h-5 text-black" />
                  <h3 className="font-black text-lg text-zinc-900">Cobro Manual 1 a 1</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Suscripción / Cliente *</label>
                  <SearchableSelect 
                    value={filtrosInd.suscripcionId} options={suscripciones} 
                    onChange={(val: any) => { setFiltrosInd({...filtrosInd, suscripcionId: val}); setBorradorInd(null); }}
                    placeholder="Buscar cliente..." loading={isLoadingUI}
                    renderLabel={(opt: any) => `${opt.empresa?.nombreComercial} - ${opt.programa?.nombre}`}
                  />
                  {filtrosInd.suscripcionId && !periodoActivoInd && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><p className="text-[10px] text-red-700 font-bold leading-tight">El ciclo asignado a este cliente no tiene un periodo abierto.</p></div>
                  )}
                </div>

                {/* 🔥 VISIBILIDAD INFORMATIVA DEL CICLO Y PERIODO (INDIVIDUAL) */}
                {suscripcionSel && periodoActivoInd && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-in fade-in">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-widest border-b border-zinc-200 pb-1">Contexto de Cobro</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-600">Ciclo Asignado:</span>
                      <span className="font-black text-black bg-zinc-200 px-2 py-0.5 rounded">{suscripcionSel.cicloFacturacion?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-600">Fechas a Facturar:</span>
                      <span className="font-medium text-zinc-500">{periodoActivoInd.fechaInicio} al {periodoActivoInd.fechaFin}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Esquema / Matriz de Cobro *</label>
                  <select required value={filtrosInd.liquidacionCodigo} onChange={e => { setFiltrosInd({...filtrosInd, liquidacionCodigo: e.target.value}); setBorradorInd(null); }} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-black outline-none">
                    <option value="">Seleccionar Matriz...</option>
                    {liquidaciones.map((l: any) => <option key={l.codigo} value={l.codigo}>{l.nombre} {l.tipoFiltro === 'PROGRAMA' ? `(${l.programaNombre})` : '(Global)'}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={!filtrosInd.suscripcionId || !filtrosInd.liquidacionCodigo || !periodoActivoInd || mutationPreliqInd.isPending} className="w-full py-3.5 mt-4 bg-zinc-900 text-white font-black rounded-xl text-sm hover:bg-black shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {mutationPreliqInd.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Generar Proforma
                </button>
              </form>
            )}

            {/* ======================= VISTA MASIVA (BATCH) ======================= */}
            {activeTab === 'MASIVO' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 mb-2 border-b border-zinc-100 pb-3">
                  <Zap className="w-5 h-5 text-black" />
                  <h3 className="font-black text-lg text-zinc-900">Liquidación en Lote</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Ciclo de Facturación *</label>
                  <SearchableSelect 
                    value={filtrosMasivo.cicloId} options={ciclos} 
                    onChange={(val: any) => { setFiltrosMasivo({...filtrosMasivo, cicloId: val}); }}
                    placeholder="Seleccione el molde (Ej: Mensual)..." loading={isLoadingUI}
                  />
                  {filtrosMasivo.cicloId && !periodoActivoMasivo && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><p className="text-[10px] text-red-700 font-bold leading-tight">Debes ABRIR un periodo para este ciclo en el calendario.</p></div>
                  )}
                </div>

                {/* 🔥 VISIBILIDAD INFORMATIVA DEL PERIODO (MASIVO) */}
                {filtrosMasivo.cicloId && periodoActivoMasivo && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                      <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Resumen del Lote</p>
                      <span className="font-black text-emerald-800 text-xs">{periodoActivoMasivo.anioOrigen} - Mes {String(periodoActivoMasivo.mesOrigen).padStart(2,'0')}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <Users className="w-5 h-5 text-emerald-700" />
                      <span className="font-black text-emerald-900 text-base">{clientesEnCiclo} Clientes a Facturar</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="font-bold text-emerald-700">Fechas:</span>
                      <span className="font-medium text-emerald-600">{periodoActivoMasivo.fechaInicio} al {periodoActivoMasivo.fechaFin}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Esquema / Matriz de Cobro *</label>
                  <select required value={filtrosMasivo.liquidacionCodigo} onChange={e => { setFiltrosMasivo({...filtrosMasivo, liquidacionCodigo: e.target.value}); }} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-black outline-none">
                    <option value="">Seleccionar Matriz...</option>
                    {liquidaciones.map((l: any) => <option key={l.codigo} value={l.codigo}>{l.nombre} {l.tipoFiltro === 'PROGRAMA' ? `(${l.programaNombre})` : '(Global)'}</option>)}
                  </select>
                </div>

                <button onClick={handleSellarMasivo} disabled={!filtrosMasivo.cicloId || !filtrosMasivo.liquidacionCodigo || !periodoActivoMasivo || clientesEnCiclo === 0 || mutationLiqMasivo.isPending} className="w-full py-4 mt-4 bg-black text-white font-black rounded-xl text-sm hover:bg-zinc-800 shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 uppercase tracking-widest">
                  {mutationLiqMasivo.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                  Facturar Lote Completo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO (VISOR / RESULTADOS) */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-3xl shadow-inner flex flex-col overflow-hidden relative">
          
          {!borradorInd && !docEmitidoInd && !resultadoMasivo && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <Server className="w-20 h-20 mb-4 opacity-20 text-black" />
              <h4 className="font-black text-xl text-zinc-500">Monitor de Emisión</h4>
              <p className="text-sm font-medium mt-2 max-w-md">Configura los parámetros a la izquierda para visualizar la proforma individual o procesar el lote masivo.</p>
            </div>
          )}

          {activeTab === 'INDIVIDUAL' && borradorInd && !docEmitidoInd && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center items-center bg-zinc-100/80">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col h-max animate-in zoom-in-95 duration-200">
                <div className="bg-black p-5 text-center relative overflow-hidden">
                  <h2 className="text-white font-black text-xl tracking-widest uppercase">PROFORMA B2B</h2>
                  <p className="text-zinc-400 text-[10px] font-bold mt-1 tracking-widest">NODO MASTER INC.</p>
                </div>

                <div className="p-5 border-b border-zinc-100 bg-zinc-50 text-sm text-center">
                  <p className="text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Facturar a:</p>
                  <p className="font-black text-zinc-900 text-lg leading-tight">{suscripcionSel?.empresa?.nombreComercial}</p>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-end mb-4 border-b border-zinc-100 pb-2">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-widest">Conceptos</p>
                    <button onClick={() => setIsNovedadModalOpen(true)} className="text-xs font-black text-black hover:bg-zinc-100 px-3 py-1.5 rounded-lg flex gap-1 border border-zinc-200 transition-colors"><Plus className="w-3.5 h-3.5" /> Ajuste Manual</button>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    {borradorInd.detalles?.map((det: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-zinc-50 rounded-lg transition-colors group">
                        <div className="flex items-center gap-2"><p className="font-bold text-zinc-800">{det.conceptoNombre}</p></div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-black ${det.naturaleza === 'SUMA' ? 'text-zinc-900' : 'text-red-600'}`}>
                            {det.naturaleza === 'RESTA' ? '-' : ''} ${det.valorTotal?.toLocaleString()}
                          </span>
                          {novedades.find(n => n.codigo === det.conceptoCodigo) && (
                            <button onClick={() => setNovedades(novedades.filter(n => n.codigo !== det.conceptoCodigo))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><XCircle className="w-4 h-4" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-100 p-6 border-t-2 border-dashed border-zinc-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-extrabold uppercase text-zinc-500 tracking-widest">Total</p>
                    <p className="text-4xl font-black text-black font-mono">${borradorInd.total?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-5 flex gap-3">
                  <button onClick={() => {setBorradorInd(null); setNovedades([]);}} className="px-5 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 text-sm">Cancelar</button>
                  <button onClick={handleSellarInd} disabled={mutationLiqInd.isPending} className="flex-1 py-3 bg-black text-white font-black rounded-xl text-sm hover:bg-zinc-800 shadow-md flex justify-center items-center gap-2">
                    {mutationLiqInd.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>} Emitir Oficial
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INDIVIDUAL' && docEmitidoInd && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white border border-emerald-200 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 className="w-12 h-12 text-emerald-500" /></div>
              <h4 className="font-black text-3xl text-zinc-900 tracking-tight mb-2">¡Factura Emitida!</h4>
              <div className="bg-white border border-zinc-200 shadow-md rounded-2xl p-6 w-full max-w-sm mt-4 flex justify-between items-center">
                <div className="text-left"><p className="text-[10px] font-extrabold uppercase text-zinc-400">Documento</p><p className="font-mono font-black text-xl text-black">{docEmitidoInd.consecutivo}</p></div>
                <div className="text-right border-l border-zinc-100 pl-6"><p className="text-[10px] font-extrabold uppercase text-zinc-400">Total</p><p className="font-mono font-black text-lg text-black">${docEmitidoInd.total?.toLocaleString()}</p></div>
              </div>
              <button onClick={() => {setDocEmitidoInd(null); setFiltrosInd({...filtrosInd, suscripcionId: ''});}} className="mt-8 px-6 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-white transition-colors text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Nuevo Cobro</button>
            </div>
          )}

          {activeTab === 'MASIVO' && resultadoMasivo && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-black rounded-3xl rotate-12 flex items-center justify-center mb-8 shadow-xl"><Zap className="w-12 h-12 text-white -rotate-12" /></div>
              <h4 className="font-black text-4xl text-zinc-900 tracking-tight mb-2">¡Lote Procesado!</h4>
              <p className="text-sm font-bold text-zinc-500 mb-8 max-w-sm">El motor matemático emitió con éxito las facturas.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-center shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Facturas Generadas</p>
                  <p className="font-black text-3xl text-zinc-900">{resultadoMasivo.facturasGeneradas}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase text-emerald-600 mb-1">Total Recaudable</p>
                  <p className="font-black text-2xl text-emerald-900 font-mono">${resultadoMasivo.totalFacturado?.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => {setResultadoMasivo(null); setFiltrosMasivo({...filtrosMasivo, cicloId: ''});}} className="mt-8 px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 shadow-md text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Entendido</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJUSTE MANUAL */}
      {isNovedadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-5">
               <h3 className="font-black text-lg text-zinc-900">Ajuste Manual</h3>
               <button onClick={() => setIsNovedadModalOpen(false)} className="text-zinc-400 hover:text-black"><XCircle className="w-5 h-5"/></button>
             </div>
             <form onSubmit={agregarNovedad} className="space-y-4">
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Concepto *</label>
                 <select required value={nuevaNovedad.concepto} onChange={e => setNuevaNovedad({...nuevaNovedad, concepto: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:bg-white focus:border-black outline-none">
                   <option value="">Seleccionar...</option>
                   {conceptosManuales.map((c: any) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Valor *</label>
                 <div className="relative">
                   <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input type="number" required min="1" value={nuevaNovedad.valor} onChange={e => setNuevaNovedad({...nuevaNovedad, valor: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-base font-black font-mono focus:bg-white focus:border-black outline-none" />
                 </div>
               </div>
               <button type="submit" className="w-full py-3 bg-black text-white font-bold rounded-xl text-sm mt-2"><CheckCircle2 className="w-4 h-4 inline mr-2" /> Añadir</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}