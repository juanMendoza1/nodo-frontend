import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Calendar, Search, UserCircle2, CheckCircle2, FileText, AlertTriangle, Briefcase, ShoppingCart, PowerOff } from 'lucide-react';
import { personalService } from '../../../api/personal.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import toast from 'react-hot-toast';

import AcuerdoPagoModal from '../components/AcuerdoPagoModal';

export default function LiquidacionSlotManager({ empresaId }: { empresaId: number }) {
  const [slots, setSlots] = useState<any[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [borrador, setBorrador] = useState<any>(null);
  const [isCalculando, setIsCalculando] = useState(false);
  const [isModalAcuerdoOpen, setIsModalAcuerdoOpen] = useState(false);

  const [contratoActivo, setContratoActivo] = useState<any>(null);
  const [resumenVentas, setResumenVentas] = useState<{cantidadVentas: number, totalRecaudado: number} | null>(null);

  const usuarioString = localStorage.getItem('usuario');
  const adminId = usuarioString ? JSON.parse(usuarioString).usuarioId : null;

  useEffect(() => {
    cargarSlots();
  }, [empresaId]);

  const recargarContrato = () => {
    if (slotSeleccionado) {
      liquidacionesService.obtenerAcuerdo(Number(slotSeleccionado))
        .then(data => setContratoActivo(data))
        .catch(() => setContratoActivo(null));
    } else {
      setContratoActivo(null);
    }
  };

  useEffect(() => {
    recargarContrato();
  }, [slotSeleccionado]);

  useEffect(() => {
    if (slotSeleccionado && fechaInicio && fechaFin) {
      liquidacionesService.obtenerResumenVentas(Number(slotSeleccionado), fechaInicio, fechaFin)
        .then(data => setResumenVentas(data))
        .catch(() => setResumenVentas(null));
    } else {
      setResumenVentas(null);
    }
  }, [slotSeleccionado, fechaInicio, fechaFin]);

  const cargarSlots = async () => {
    try {
      const data = await personalService.obtenerSlotsPorEmpresa(empresaId);
      setSlots(data);
    } catch (error) {
      console.error("Error cargando slots", error);
    }
  };

  const handleCalcular = async () => {
    setIsCalculando(true);
    setBorrador(null);
    try {
      const data = await liquidacionesService.previsualizar(empresaId, Number(slotSeleccionado), fechaInicio, fechaFin);
      setBorrador(data);
      toast.success("Cálculo generado exitosamente.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al calcular.");
    } finally {
      setIsCalculando(false);
    }
  };

  const handleAprobarPago = async () => {
    if (!window.confirm("¿Aprobar pago? Las novedades se quemarán y el recibo quedará sellado.")) return;
    const promise = liquidacionesService.generarPago(empresaId, Number(slotSeleccionado), fechaInicio, fechaFin, adminId);
    toast.promise(promise, {
      loading: 'Generando recibo oficial...',
      success: () => { setBorrador(null); return '¡Pago generado y sellado con éxito!'; },
      error: 'Error al generar el pago.'
    });
  };

  const handleFinalizarContrato = async () => {
    if (!window.confirm("¿Seguro que deseas finalizar este contrato? Deberás crear uno nuevo para calcular futuras nóminas.")) return;
    try {
      await liquidacionesService.finalizarAcuerdo(contratoActivo.id);
      toast.success("Contrato finalizado");
      recargarContrato();
      setBorrador(null);
    } catch (error) {
      toast.error("Error al finalizar el contrato");
    }
  };

  const noHayVentas = resumenVentas && resumenVentas.cantidadVentas === 0;
  const disableCalcular = !slotSeleccionado || !fechaInicio || !fechaFin || isCalculando || noHayVentas || !contratoActivo;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <BadgeDollarSign className="w-8 h-8 text-black" /> Nómina y Liquidación
          </h2>
          <p className="text-sm text-zinc-500 mt-1 font-medium">Calcula comisiones, fijos y cruza novedades automáticamente.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 items-end mb-6">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Operario (Slot)</label>
          <div className="relative">
            <UserCircle2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={slotSeleccionado} onChange={(e) => { setSlotSeleccionado(e.target.value); setBorrador(null); }}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Seleccione...</option>
              {slots.map(s => <option key={s.id} value={s.id}>{s.nombreCompleto} (Login: {s.login})</option>)}
            </select>
          </div>
        </div>

        <div className="w-full md:w-36">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:bg-white"/>
        </div>

        <div className="w-full md:w-36">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:bg-white"/>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* 🔥 BOTÓN DE NUEVO CONTRATO (Se bloquea si ya hay uno activo) */}
          <button 
            onClick={() => setIsModalAcuerdoOpen(true)}
            disabled={!slotSeleccionado || contratoActivo}
            className="w-full md:w-auto px-5 py-2.5 bg-white text-zinc-700 border border-zinc-200 font-bold rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 h-[42px] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Nuevo Contrato
          </button>

          <button onClick={handleCalcular} disabled={disableCalcular} className="w-full md:w-auto px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed h-[42px]">
            {isCalculando ? <Search className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {contratoActivo ? `Cálculo (Ref: ${contratoActivo.radicado.substring(4, 10)})` : 'Calcular'}
          </button>
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      {!borrador ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center flex-1 shadow-sm overflow-y-auto">
           
           {!slotSeleccionado ? (
             <>
                <FileText className="w-16 h-16 text-zinc-200 mb-4" />
                <h3 className="text-lg font-black text-zinc-800">Corte de Cuentas</h3>
                <p className="text-zinc-500 font-medium text-sm max-w-md mt-2">Selecciona un operario y un rango de fechas para visualizar su contrato y generar la liquidación.</p>
             </>
           ) : (
             <div className="w-full max-w-2xl text-left animate-in zoom-in-95 duration-300">
               
               {/* 1. SECCIÓN DE CONTRATO (IMPRESIÓN) */}
               <h3 className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Briefcase className="w-4 h-4" /> Contrato Vigente
               </h3>
               
               {contratoActivo ? (
                 <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 shadow-sm">
                   <div>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> {contratoActivo.estado}
                     </p>
                     <p className="text-lg font-black text-zinc-900">
                       {contratoActivo.tipoAcuerdo === 'COMISION_VENTAS' ? 'Pago por Comisiones' :
                        contratoActivo.tipoAcuerdo === 'FIJO_POR_DIA' ? 'Pago Fijo por Turno' : 'Modelo Mixto'}
                     </p>
                     <div className="flex flex-wrap gap-2 mt-2">
                       <span className="text-xs font-mono font-bold text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
                         Ref: {contratoActivo.radicado}
                       </span>
                       {contratoActivo.porcentajeComision > 0 && (
                         <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                           Comisión: {contratoActivo.porcentajeComision * 100}%
                         </span>
                       )}
                       {contratoActivo.valorFijoDia > 0 && (
                         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                           Fijo/Día: ${contratoActivo.valorFijoDia.toLocaleString()}
                         </span>
                       )}
                     </div>
                   </div>
                   <button onClick={handleFinalizarContrato} className="px-4 py-2 bg-white text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
                     <PowerOff className="w-3.5 h-3.5" /> Finalizar
                   </button>
                 </div>
               ) : (
                 <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8 flex items-center gap-4">
                   <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                   <div>
                     <p className="font-bold text-red-700">Sin Contrato Asignado</p>
                     <p className="text-sm text-red-600">Para poder calcular, haz clic en "Nuevo Contrato" en la barra superior.</p>
                   </div>
                 </div>
               )}

               {/* 2. SECCIÓN DE VENTAS PREVIAS */}
               {(fechaInicio && fechaFin) && (
                 <>
                   <h3 className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ShoppingCart className="w-4 h-4" /> Actividad en la Fecha
                   </h3>
                   {resumenVentas ? (
                     <div className={`rounded-2xl p-5 flex items-center justify-between border ${noHayVentas ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-200 shadow-sm'}`}>
                       <div>
                         <p className={`font-black text-lg ${noHayVentas ? 'text-amber-800' : 'text-zinc-900'}`}>
                           {noHayVentas ? 'Sin Operación Registrada' : 'Ventas Detectadas'}
                         </p>
                         <p className={`text-sm font-bold mt-1 ${noHayVentas ? 'text-amber-700' : 'text-zinc-500'}`}>
                           {noHayVentas ? 'El operario no facturó en estas fechas.' : `El sistema encontró ${resumenVentas.cantidadVentas} facturas en este rango.`}
                         </p>
                       </div>
                       {!noHayVentas && (
                         <div className="text-right">
                           <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Recaudo Bruto</p>
                           <p className="text-2xl font-mono font-black text-zinc-900">${resumenVentas.totalRecaudado.toLocaleString()}</p>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="p-5 text-center"><Search className="w-5 h-5 text-zinc-300 animate-spin mx-auto"/></div>
                   )}
                 </>
               )}
             </div>
           )}
        </div>
      ) : (
        // AQUÍ VA LA VISTA DEL BORRADOR QUE YA TENÍAMOS (Resumen Financiero, Aprobar pago, etc.)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 lg:p-8 flex flex-col overflow-y-auto">
             <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-6">
                <div>
                   <h3 className="font-extrabold text-xl text-zinc-900">Resumen Financiero</h3>
                   <p className="text-xs text-zinc-500 font-medium mt-1">Liquidación basada en el contrato <strong className="text-zinc-700">{contratoActivo?.radicado}</strong>.</p>
                </div>
                <span className="bg-zinc-100 text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">BORRADOR</span>
             </div>

             <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                   <span className="text-sm font-bold text-zinc-600">Base de Ventas Computada</span>
                   <span className="text-lg font-mono font-bold text-zinc-900">${borrador.baseVentasCalculada?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                   <span className="text-sm font-bold text-zinc-800 flex items-center gap-2"><span className="text-zinc-400 font-black">+</span> Comisión Generada</span>
                   <span className="text-lg font-mono font-black text-zinc-900">${borrador.totalComision?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                   <span className="text-sm font-bold text-zinc-800 flex items-center gap-2"><span className="text-zinc-400 font-black">+</span> Pago Fijo (Por días)</span>
                   <span className="text-lg font-mono font-black text-zinc-900">${borrador.totalFijo?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                   <span className="text-sm font-bold text-zinc-800 flex items-center gap-2"><span className="text-zinc-400 font-black">+</span> Bonos Adicionales</span>
                   <span className="text-lg font-mono font-black text-zinc-900">${borrador.totalBonos?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                   <span className="text-sm font-bold text-zinc-800 flex items-center gap-2"><span className="text-zinc-800 font-black">-</span> Descuentos y Anticipos</span>
                   <span className="text-lg font-mono font-black text-zinc-900">${borrador.totalDescuentos?.toLocaleString()}</span>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-between items-end">
                <div><p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total a Pagar</p></div>
                <p className="text-5xl font-black text-zinc-900 tracking-tight">${borrador.granTotalPagar?.toLocaleString()}</p>
             </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <h4 className="font-extrabold text-zinc-900 mb-2">Ajustes Finales</h4>
                <p className="text-xs text-zinc-500 font-medium mb-6">Agrega bonos o descuentos antes de sellar el pago.</p>
                <button className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 mb-3 shadow-sm">
                   <Plus className="w-4 h-4" /> Registrar Novedad
                </button>
             </div>
             <button onClick={handleAprobarPago} className="w-full py-5 bg-black hover:bg-zinc-800 rounded-3xl text-white font-black text-lg transition-all shadow-xl flex justify-center items-center gap-2 mt-auto">
                <CheckCircle2 className="w-6 h-6" /> Aprobar y Cerrar Pago
             </button>
          </div>

        </div>
      )}

      {/* MODAL DE CONTRATO (Solo para crear Nuevos) */}
      <AcuerdoPagoModal 
        isOpen={isModalAcuerdoOpen}
        onClose={() => setIsModalAcuerdoOpen(false)}
        slotId={slotSeleccionado ? Number(slotSeleccionado) : null}
        slotNombre={slots.find(s => s.id.toString() === slotSeleccionado)?.nombreCompleto || 'Operario'}
        onGuardadoExitoso={() => {
          recargarContrato();
        }}
      />
    </div>
  );
}