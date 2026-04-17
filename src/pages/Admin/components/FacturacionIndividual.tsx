import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Calculator, PlayCircle, CheckCircle2, Loader2, Printer, 
  ArrowRight, XCircle, Plus, DollarSign, X, Receipt, AlertCircle, Info, Server
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect, confirmarAccion } from './FacturacionUtils';
import { documentosService } from '../../../api/documentos.service';
import { ciclosService } from '../../../api/ciclos.service';

export default function FacturacionIndividual({ data, isLoadingUI, TabSwitcher }: any) {
  const NODO_MASTER_ID = 1;
  const { suscripciones, empresasFull } = data.initData || { suscripciones: [], empresasFull: [] };
  const { conceptosManuales, liquidaciones } = data.plantillasData || { conceptosManuales: [], liquidaciones: [] };

  const [filtrosInd, setFiltrosInd] = useState({ suscripcionId: '' });
  const [novedades, setNovedades] = useState<any[]>([]);
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [nuevaNovedad, setNuevaNovedad] = useState({ concepto: '', valor: '' });
  const [borradorInd, setBorradorInd] = useState<any>(null);
  const [docEmitidoInd, setDocEmitidoInd] = useState<any>(null);

  const suscripcionSel = useMemo(() => suscripciones.find((s: any) => String(s.id) === String(filtrosInd.suscripcionId)), [suscripciones, filtrosInd.suscripcionId]);
  const cicloIdInd = suscripcionSel?.cicloFacturacion?.id;
  const liquidacionAsignada = suscripcionSel?.liquidacion; 

  const { data: periodosInd = [] } = useQuery({ queryKey: ['periodos_ind', cicloIdInd], queryFn: () => ciclosService.obtenerPeriodos(cicloIdInd!), enabled: !!cicloIdInd });
  const periodoActivoInd = useMemo(() => periodosInd.find((p: any) => p.estado === 'ABIERTO' || p.estado === 'LIQUIDANDO'), [periodosInd]);

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
    
    if (!liquidacionAsignada) {
       toast.error("El contrato de este cliente no tiene una Matriz de Liquidación asignada.");
       return;
    }

    const emp = empresasFull.find((e: any) => String(e.id) === String(suscripcionSel.empresa.id));
    const valoresOperativos: any = { "CANTIDAD_TABLETS": suscripcionSel.dispositivosActivos || 0 };
    novedades.forEach(n => { valoresOperativos[n.codigo] = n.valor; });

    const matrizCompleta = liquidaciones?.find((l: any) => l.codigo === liquidacionAsignada.codigo);
    const programaIdCorrecto = matrizCompleta?.programa?.id || 0;
    const tipoDocCorrecto = matrizCompleta?.tipoDocumento?.codigo || "FV";

    mutationPreliqInd.mutate({
      empresaId: NODO_MASTER_ID, 
      programaId: programaIdCorrecto, 
      terceroId: emp.tercero.id, 
      tipoDocumentoCodigo: tipoDocCorrecto,
      codigoLiquidacion: liquidacionAsignada.codigo, 
      valoresOperativos, 
      cicloId: cicloIdInd, 
      periodoId: periodoActivoInd.id,
      suscripcionId: suscripcionSel.id // 🔥 ENVIAMOS LA SUSCRIPCIÓN PARA VALIDAR
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

        const matrizCompleta = liquidaciones?.find((l: any) => l.codigo === liquidacionAsignada.codigo);
        const programaIdCorrecto = matrizCompleta?.programa?.id || 0;
        const tipoDocCorrecto = matrizCompleta?.tipoDocumento?.codigo || "FV";

        mutationLiqInd.mutate({
          empresaId: NODO_MASTER_ID, 
          programaId: programaIdCorrecto, 
          terceroId: emp.tercero.id, 
          tipoDocumentoCodigo: tipoDocCorrecto,
          codigoLiquidacion: liquidacionAsignada.codigo,
          valoresOperativos, 
          cicloId: cicloIdInd, 
          periodoId: periodoActivoInd.id,
          suscripcionId: suscripcionSel.id ,
          estadoDocumento: "A"
        });
      }
    );
  };

  const agregarNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    const conceptoSelec = conceptosManuales.find((c: any) => String(c.codigo) === String(nuevaNovedad.concepto));
    if (!conceptoSelec) return;
    
    // 🔥 CORRECCIÓN AQUÍ: Evaluamos con el Enum oficial de la BD 'R' o 'S' (Si el concepto no tiene naturaleza, inferimos por nombre)
    const tipoNav = conceptoSelec.naturaleza ? conceptoSelec.naturaleza : (conceptoSelec.nombre.toLowerCase().includes('descuento') ? 'R' : 'S');
    
    setNovedades([...novedades, { codigo: conceptoSelec.codigo, nombre: conceptoSelec.nombre, valor: Number(nuevaNovedad.valor), tipo: tipoNav }]);
    setIsNovedadModalOpen(false); setNuevaNovedad({ concepto: '', valor: '' });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-full xl:w-96 shrink-0 flex flex-col gap-4">
        {TabSwitcher}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleCalcularInd} className="space-y-5 animate-in fade-in slide-in-from-left-4">
            <div className="flex items-center gap-2 mb-2 border-b border-zinc-100 pb-3">
              <Calculator className="w-5 h-5 text-black" />
              <h3 className="font-black text-lg text-zinc-900">Cobro Manual 1 a 1</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Suscripción / Cliente *</label>
              <SearchableSelect 
                value={filtrosInd.suscripcionId} options={suscripciones} 
                onChange={(val: any) => { setFiltrosInd({ suscripcionId: val }); setBorradorInd(null); }}
                placeholder="Buscar por nombre o ID..." loading={isLoadingUI}
                renderLabel={(opt: any) => `${opt.empresa?.nombreComercial} - ${opt.programa?.nombre}`}
              />
              {filtrosInd.suscripcionId && !periodoActivoInd && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><p className="text-[10px] text-red-700 font-bold leading-tight">El ciclo asignado a este cliente no tiene un periodo abierto.</p></div>
              )}
            </div>

            {suscripcionSel && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3 animate-in fade-in shadow-inner">
                <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-widest flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                   <Info className="w-3.5 h-3.5" /> Condiciones del Contrato
                </p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-600">Ciclo Base:</span>
                    <span className="font-black text-black bg-zinc-200 px-2 py-0.5 rounded">{suscripcionSel.cicloFacturacion?.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-600">Matriz Asignada:</span>
                    {liquidacionAsignada ? (
                       <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded truncate max-w-[150px]" title={liquidacionAsignada.nombre}>
                         {liquidacionAsignada.nombre}
                       </span>
                    ) : (
                       <span className="font-bold text-red-500 italic">No configurada</span>
                    )}
                  </div>
                  {periodoActivoInd && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-200/50">
                      <span className="font-bold text-zinc-600">Corte Actual:</span>
                      <span className="font-medium text-emerald-600">{periodoActivoInd.fechaInicio} al {periodoActivoInd.fechaFin}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={!filtrosInd.suscripcionId || !liquidacionAsignada || !periodoActivoInd || mutationPreliqInd.isPending} className="w-full py-3.5 mt-4 bg-zinc-900 text-white font-black rounded-xl text-sm hover:bg-black shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50">
              {mutationPreliqInd.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Generar Proforma
            </button>
          </form>
        </div>
      </div>

      {/* PANEL DERECHO (VISOR) */}
      <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-3xl shadow-inner flex flex-col overflow-hidden relative">
        {!borradorInd && !docEmitidoInd && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
            <Server className="w-20 h-20 mb-4 opacity-20 text-black" />
            <h4 className="font-black text-xl text-zinc-500">Monitor de Emisión</h4>
            <p className="text-sm font-medium mt-2 max-w-md">Configura los parámetros a la izquierda para visualizar la proforma individual.</p>
          </div>
        )}

        {borradorInd && !docEmitidoInd && (
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
                        {/* 🔥 CORRECCIÓN AQUÍ: Evaluación S o R */}
                        <span className={`font-mono font-black ${det.naturaleza === 'S' ? 'text-zinc-900' : 'text-red-600'}`}>
                          {det.naturaleza === 'R' ? '-' : ''} ${det.valorTotal?.toLocaleString()}
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
                  <p className="text-xs font-extrabold uppercase text-zinc-500 tracking-widest">Total Facturado</p>
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

        {docEmitidoInd && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white border border-emerald-200 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 className="w-12 h-12 text-emerald-500" /></div>
            <h4 className="font-black text-3xl text-zinc-900 tracking-tight mb-2">¡Factura Emitida!</h4>
            <div className="bg-white border border-zinc-200 shadow-md rounded-2xl p-6 w-full max-w-sm mt-4 flex justify-between items-center">
              <div className="text-left"><p className="text-[10px] font-extrabold uppercase text-zinc-400">Documento</p><p className="font-mono font-black text-xl text-black">{docEmitidoInd.consecutivo}</p></div>
              <div className="text-right border-l border-zinc-100 pl-6"><p className="text-[10px] font-extrabold uppercase text-zinc-400">Total Facturado</p><p className="font-mono font-black text-lg text-black">${docEmitidoInd.total?.toLocaleString()}</p></div>
            </div>
            <button onClick={() => {setDocEmitidoInd(null); setFiltrosInd({suscripcionId: ''});}} className="mt-8 px-6 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold hover:bg-white transition-colors text-sm flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Nuevo Cobro</button>
          </div>
        )}
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