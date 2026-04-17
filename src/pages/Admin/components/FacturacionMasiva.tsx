import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Zap, Layers, CheckCircle2, Loader2, Users, CalendarDays, Server, AlertCircle, PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect, confirmarAccion } from './FacturacionUtils';
import { documentosService } from '../../../api/documentos.service';
import { ciclosService } from '../../../api/ciclos.service';

export default function FacturacionMasiva({ data, isLoadingUI, TabSwitcher }: any) {
  const NODO_MASTER_ID = 1;
  const { suscripciones, ciclos } = data.initData || { suscripciones: [], ciclos: [] };

  const [filtrosMasivo, setFiltrosMasivo] = useState({ cicloId: '' });
  const [resultadoMasivo, setResultadoMasivo] = useState<any>(null);
  const [loteAprobado, setLoteAprobado] = useState(false);

  const { data: periodosMasivo = [] } = useQuery({ queryKey: ['periodos_masivo', filtrosMasivo.cicloId], queryFn: () => ciclosService.obtenerPeriodos(Number(filtrosMasivo.cicloId)), enabled: !!filtrosMasivo.cicloId });
  const periodoActivoMasivo = useMemo(() => periodosMasivo.find((p: any) => p.estado === 'ABIERTO' || p.estado === 'LIQUIDANDO'), [periodosMasivo]);
  
  const clientesAptosParaLote = useMemo(() => 
    suscripciones.filter((s: any) => String(s.cicloFacturacion?.id) === String(filtrosMasivo.cicloId) && s.liquidacion != null).length, 
  [suscripciones, filtrosMasivo.cicloId]);

  const mutationLiqMasivo = useMutation({
    mutationFn: (payload: any) => documentosService.liquidarLote(payload),
    onSuccess: (data) => {
      setResultadoMasivo(data);
      setLoteAprobado(false);
      toast.success("Lote pre-liquidado correctamente.", { duration: 5000, icon: '⏳' });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Error al procesar lote masivo.")
  });

  const mutationAprobarLote = useMutation({
    mutationFn: () => documentosService.aprobarLote(Number(filtrosMasivo.cicloId), periodoActivoMasivo.id),
    onSuccess: () => {
      setLoteAprobado(true);
      toast.success("¡Facturas Oficializadas y Activas!", { duration: 5000, icon: '🎉' });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Error al aprobar el lote.")
  });

  const handleSellarMasivo = () => {
    confirmarAccion(
      "Generar Pre-Liquidación",
      `Se generarán las facturas en estado BORRADOR (G) para ${clientesAptosParaLote} comercios. Luego podrás revisarlas y aprobarlas. ¿Continuar?`,
      () => {
        mutationLiqMasivo.mutate({
          empresaId: NODO_MASTER_ID, 
          cicloId: Number(filtrosMasivo.cicloId),
          periodoId: periodoActivoMasivo.id
        });
      }
    );
  };

  const handleAprobarLote = () => {
    confirmarAccion(
      "Aprobar Lote Definitivo",
      "Esto pasará todas las facturas generadas a estado ACTIVO (A) y serán legalmente vinculantes. ¿Estás seguro?",
      () => mutationAprobarLote.mutate()
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-full xl:w-96 shrink-0 flex flex-col gap-4">
        {TabSwitcher}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 border-b border-zinc-100 pb-3">
              <Zap className="w-5 h-5 text-black" />
              <h3 className="font-black text-lg text-zinc-900">Liquidación en Lote</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Ciclo de Facturación *</label>
              <SearchableSelect 
                value={filtrosMasivo.cicloId} options={ciclos} 
                onChange={(val: any) => { setFiltrosMasivo({ cicloId: val }); setResultadoMasivo(null); }}
                placeholder="Seleccione el molde (Ej: Mensual)..." loading={isLoadingUI} disabled={!!resultadoMasivo}
              />
            </div>

            {filtrosMasivo.cicloId && periodoActivoMasivo && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Resumen del Lote</p>
                  <span className="font-black text-emerald-800 text-xs">{periodoActivoMasivo.anioOrigen} - Mes {String(periodoActivoMasivo.mesOrigen).padStart(2,'0')}</span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Users className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div><span className="font-black text-emerald-900 text-base">{clientesAptosParaLote} Clientes a Facturar</span></div>
                </div>
              </div>
            )}

            {!resultadoMasivo && (
              <button onClick={handleSellarMasivo} disabled={!filtrosMasivo.cicloId || !periodoActivoMasivo || clientesAptosParaLote === 0 || mutationLiqMasivo.isPending} className="w-full py-4 mt-4 bg-black text-white font-black rounded-xl text-sm hover:bg-zinc-800 shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 uppercase tracking-widest">
                {mutationLiqMasivo.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                Generar Pre-Lote ({clientesAptosParaLote})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO (VISOR) */}
      <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-3xl shadow-inner flex flex-col overflow-hidden relative">
        {!resultadoMasivo ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
            <Server className="w-20 h-20 mb-4 opacity-20 text-black" />
            <h4 className="font-black text-xl text-zinc-500">Monitor de Emisión Masiva</h4>
            <p className="text-sm font-medium mt-2 max-w-md">Configura los parámetros a la izquierda para procesar el lote masivo en estado Borrador.</p>
          </div>
        ) : (
          <div className="h-full flex flex-col p-4 sm:p-6 animate-in zoom-in duration-500 bg-zinc-50">
            
            {/* 🔥 BANNER SUPERIOR COMPACTO */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 bg-white p-4 rounded-xl border ${loteAprobado ? 'border-emerald-200 shadow-emerald-100' : 'border-amber-200 shadow-amber-100'} shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${loteAprobado ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {loteAprobado ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h4 className="font-black text-lg text-zinc-900 tracking-tight leading-none">{loteAprobado ? '¡Lote Aprobado!' : 'Pre-Liquidación Exitosa'}</h4>
                  <p className="text-xs font-bold text-zinc-500 mt-0.5">
                    {loteAprobado ? 'Las facturas son oficiales.' : 'Revisa el listado antes de hacer el lote oficial.'}
                  </p>
                </div>
              </div>
              
              {!loteAprobado ? (
                <button onClick={handleAprobarLote} disabled={mutationAprobarLote.isPending || resultadoMasivo.facturasGeneradas === 0} className="px-5 py-2 rounded-lg bg-black text-white font-black hover:bg-zinc-800 shadow-md text-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 transition-all">
                  {mutationAprobarLote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                  Aprobar Lote y Finalizar
                </button>
              ) : (
                <button onClick={() => {setResultadoMasivo(null); setFiltrosMasivo({ cicloId: '' });}} className="px-5 py-2 rounded-lg bg-zinc-100 text-zinc-600 font-black hover:bg-zinc-200 text-xs flex items-center justify-center shrink-0 transition-colors">
                  Cerrar Panel
                </button>
              )}
            </div>

            {/* 🔥 TARJETAS DE MÉTRICAS COMPACTAS (A 2 COLUMNAS) */}
            <div className="grid grid-cols-2 gap-3 mb-4 shrink-0 max-w-lg">
              <div className="bg-white border border-zinc-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] font-extrabold uppercase text-zinc-400 mb-0.5">Pre-Liquidadas</p>
                <p className="font-black text-2xl text-zinc-900 leading-none">{resultadoMasivo.facturasGeneradas}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center shadow-sm" title="Clientes que ya tenían factura en este periodo">
                <p className="text-[10px] font-extrabold uppercase text-amber-600 mb-0.5">Omitidas (Ya Cobradas)</p>
                <p className="font-black text-2xl text-amber-900 leading-none">{resultadoMasivo.facturasOmitidas || 0}</p>
              </div>
            </div>

            {/* 🔥 TABLA PROTAGONISTA CON COLUMNA DE SUSCRIPCIÓN */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
               {!loteAprobado && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] z-0">
                   <span className="text-[100px] font-black uppercase -rotate-12 whitespace-nowrap">BORRADOR</span>
                 </div>
               )}

               <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 z-10">
                  <h5 className="font-black text-zinc-800 text-xs">Detalle de Facturas (Estado: {loteAprobado ? 'ACTIVO' : 'GENERADO'})</h5>
               </div>
               
               <div className="flex-1 overflow-y-auto z-10 custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm border-b border-zinc-100">
                     <tr className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                       <th className="p-3 pl-4">Consecutivo</th>
                       <th className="p-3">Cliente (Tenant)</th>
                       <th className="p-3">Suscripción</th>
                       <th className="p-3 text-center">Estado</th>
                       <th className="p-3 text-right pr-4">Total Cobrado</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-50">
                     {resultadoMasivo.detalleFacturas?.map((fac: any, i: number) => (
                       <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                         <td className="p-3 pl-4 font-mono font-black text-xs text-zinc-900">{fac.consecutivo}</td>
                         <td className="p-3">
                           <p className="font-bold text-zinc-700 text-xs">{fac.cliente}</p>
                           <p className="text-[9px] font-bold text-zinc-400">NIT: {fac.nit}</p>
                         </td>
                         <td className="p-3 text-[10px] font-extrabold text-zinc-500">{fac.suscripcion}</td>
                         <td className="p-3 text-center">
                           <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${loteAprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {loteAprobado ? 'A' : 'G'}
                           </span>
                         </td>
                         <td className="p-3 text-right pr-4 font-mono font-black text-emerald-600 text-sm">${fac.total?.toLocaleString()}</td>
                       </tr>
                     ))}
                     {(!resultadoMasivo.detalleFacturas || resultadoMasivo.detalleFacturas.length === 0) && (
                       <tr><td colSpan={5} className="p-8 text-center text-zinc-400 font-bold text-xs">No se registraron nuevos cobros en esta ejecución.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}