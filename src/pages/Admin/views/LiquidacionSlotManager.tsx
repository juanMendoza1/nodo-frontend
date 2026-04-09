import React, { useState, useEffect } from 'react';
import { 
  BadgeDollarSign, Calendar, Search, UserCircle2, CheckCircle2, 
  FileText, AlertTriangle, Briefcase, PowerOff, 
  History, Edit, Trash2, ChevronRight, Loader2, X, Plus,
  Receipt, ArrowDownRight, ArrowUpRight, ChevronDown, Eye, Wallet
} from 'lucide-react';
import { personalService } from '../../../api/personal.service';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import toast from 'react-hot-toast';
import AcuerdoPagoModal from '../components/AcuerdoPagoModal';
import NotaOperativaModal from '../components/NotaOperativaModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

// 🔥 COMPONENTE: SELECT BUSCADOR PARA OPERARIOS
const SearchableSelectSlot = ({ value, options, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  const filteredOptions = options.filter((opt: any) => 
    opt.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer hover:bg-white transition-all">
        <UserCircle2 className="w-4 h-4 text-zinc-400 absolute left-3" />
        <span className={selectedOption ? 'text-zinc-700' : 'text-zinc-400'}>
          {selectedOption ? `${selectedOption.nombreCompleto} (Login: ${selectedOption.login})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input autoFocus type="text" placeholder="Buscar operario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-black transition-all" />
              </div>
            </div>
            <div className="overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3 text-center">No se encontraron operarios.</p>
              ) : (
                filteredOptions.map((opt: any) => (
                  <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${value?.toString() === opt.id.toString() ? 'bg-black text-white font-bold' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                    <span>{opt.nombreCompleto}</span>
                    <span className={`text-[10px] font-extrabold tracking-widest ${value?.toString() === opt.id.toString() ? 'text-zinc-400' : 'text-zinc-400'}`}>{opt.login}</span>
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

export default function LiquidacionSlotManager({ empresaId }: { empresaId: number }) {
  const [slots, setSlots] = useState<any[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  
  const [activeTab, setActiveTab] = useState<'vigente' | 'historial_contratos' | 'historial_pagos'>('vigente');
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [borrador, setBorrador] = useState<any>(null);
  const [isCalculando, setIsCalculando] = useState(false);

  // Notas Operativas
  const [isModalNotaOpen, setIsModalNotaOpen] = useState(false);
  const [novedadesPendientes, setNovedadesPendientes] = useState<any[]>([]);
  const [isModalVerNotasOpen, setIsModalVerNotasOpen] = useState(false);
  
  // Modal de Contrato y Edición/Vista
  const [isModalAcuerdoOpen, setIsModalAcuerdoOpen] = useState(false);
  const [acuerdoAEditar, setAcuerdoAEditar] = useState<any>(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [contratoActivo, setContratoActivo] = useState<any>(null);
  const [historialContratos, setHistorialContratos] = useState<any[]>([]);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]); // 🔥 NUEVO ESTADO
  const [resumenVentas, setResumenVentas] = useState<{cantidadVentas: number, totalRecaudado: number} | null>(null);

  const usuarioString = localStorage.getItem('usuario');
  const adminId = usuarioString ? JSON.parse(usuarioString).usuarioId : null;

  useEffect(() => {
    cargarSlots();
  }, [empresaId]);

  const recargarDataOperario = () => {
    if (slotSeleccionado) {
      liquidacionesService.obtenerAcuerdo(Number(slotSeleccionado))
        .then(data => {
          setContratoActivo(data);
          // 🔥 Si hay contrato activo, traemos SUS notas
          if (data && data.id) {
            liquidacionesService.obtenerNovedadesPendientes(data.id)
              .then(notas => setNovedadesPendientes(notas || []))
              .catch(() => setNovedadesPendientes([]));
          } else {
            setNovedadesPendientes([]);
          }
        })
        .catch(() => {
          setContratoActivo(null);
          setNovedadesPendientes([]);
        });
        
      liquidacionesService.obtenerHistorialAcuerdos(Number(slotSeleccionado))
        .then(data => setHistorialContratos(data || [])).catch(() => setHistorialContratos([]));

      liquidacionesService.obtenerHistorialPagos(Number(slotSeleccionado))
        .then(data => setHistorialPagos(data || [])).catch(() => setHistorialPagos([]));
    } else {
      setContratoActivo(null);
      setHistorialContratos([]);
      setNovedadesPendientes([]);
      setHistorialPagos([]);
    }
  };

  useEffect(() => {
    recargarDataOperario();
    setBorrador(null);
  }, [slotSeleccionado]);

  useEffect(() => {
    if (slotSeleccionado && fechaInicio && fechaFin) {
      liquidacionesService.obtenerResumenVentas(Number(slotSeleccionado), fechaInicio, fechaFin)
        .then(data => setResumenVentas(data)).catch(() => setResumenVentas(null));
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

  const confirmarAprobarPago = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aprobar Pago Oficial',
      message: '¿Estás seguro de sellar este recibo? Las novedades descontadas quedarán como aplicadas y no se podrán revertir.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        const promise = liquidacionesService.generarPago(empresaId, Number(slotSeleccionado), fechaInicio, fechaFin, adminId);
        toast.promise(promise, {
          loading: 'Generando recibo oficial...',
          success: () => { 
            setBorrador(null); 
            recargarDataOperario(); 
            return '¡Pago generado y sellado con éxito!'; 
          },
          error: 'Error al generar el pago.'
        });
      }
    });
  };

  const confirmarFinalizarContrato = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Finalizar Contrato',
      message: '¿Seguro que deseas finalizar este contrato? Deberás crear uno nuevo para procesar futuras nóminas.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await liquidacionesService.finalizarAcuerdo(id);
          toast.success("Contrato finalizado");
          recargarDataOperario();
          setBorrador(null);
        } catch (error) {
          toast.error("Error al finalizar el contrato");
        }
      }
    });
  };

  const confirmarEliminarContrato = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Contrato',
      message: '¿Estás seguro de eliminar este contrato de forma permanente del historial?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await liquidacionesService.eliminarAcuerdo(id);
          toast.success("Contrato eliminado");
          recargarDataOperario();
        } catch (error) {
          toast.error("Error al eliminar");
        }
      }
    });
  };

  const abrirModalParaEditar = (acuerdo: any, isReadOnly = false) => {
    setAcuerdoAEditar(acuerdo);
    setIsModalReadOnly(isReadOnly);
    setIsModalAcuerdoOpen(true);
  };

  const noHayVentas = resumenVentas && resumenVentas.cantidadVentas === 0;
  const disableCalcular = !fechaInicio || !fechaFin || isCalculando || noHayVentas || !contratoActivo;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
            <BadgeDollarSign className="w-8 h-8 text-black" /> Nómina y Liquidación
          </h2>
          <p className="text-sm text-zinc-500 mt-1 font-medium">Calcula comisiones, fijos y cruza novedades automáticamente.</p>
        </div>
      </div>

      {/* BLOQUE DE CONTROL PRINCIPAL */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 items-end mb-6 z-10 relative">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Operario (Slot)</label>
          <SearchableSelectSlot 
            value={slotSeleccionado} 
            options={slots} 
            onChange={(val: any) => { setSlotSeleccionado(val.toString()); setBorrador(null); }}
            placeholder="Seleccione un operario..."
          />
        </div>

        <div className="w-full md:w-36">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:bg-white"/>
        </div>

        <div className="w-full md:w-36">
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5 block">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:bg-white"/>
        </div>

        <button onClick={handleCalcular} disabled={disableCalcular} className="w-full md:w-auto px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed h-[42px] shrink-0">
          {isCalculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Generar Liquidación
        </button>
      </div>

      {/* ÁREA DE CONTENIDO */}
      {!slotSeleccionado ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center flex-1 shadow-sm">
          <UserCircle2 className="w-16 h-16 text-zinc-200 mb-4" />
          <h3 className="text-lg font-black text-zinc-800">Corte de Cuentas</h3>
          <p className="text-zinc-500 font-medium text-sm max-w-md mt-2">Busca y selecciona un operario en la barra superior para visualizar sus contratos y pagos.</p>
        </div>
      ) : !borrador ? (
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* TABS DE NAVEGACIÓN */}
          <div className="flex gap-6 mb-6 border-b border-zinc-200 overflow-x-auto">
            <button onClick={() => setActiveTab('vigente')} className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'vigente' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
              <span className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Contrato Activo</span>
              {activeTab === 'vigente' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab('historial_pagos')} className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'historial_pagos' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
              <span className="flex items-center gap-2"><Wallet className="w-4 h-4"/> Pagos Slot</span>
              {activeTab === 'historial_pagos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab('historial_contratos')} className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'historial_contratos' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
              <span className="flex items-center gap-2"><History className="w-4 h-4"/> Historial Contratos</span>
              {activeTab === 'historial_contratos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full"></div>}
            </button>
          </div>

          {/* CONTENIDO DEL TAB */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 lg:p-8 flex-1 shadow-sm overflow-y-auto">
            
            {activeTab === 'vigente' && (
              <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                {contratoActivo ? (
                  <div className="bg-white border border-zinc-200 rounded-[28px] p-8 relative shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
                    <div className="absolute top-0 right-0 bg-[#00d188] text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-[20px] rounded-tr-[28px]">
                      Vigente
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="pr-10">
                        <h3 className="text-3xl font-black text-zinc-900 mb-1 tracking-tight">
                          {contratoActivo.tipoAcuerdo === 'COMISION_VENTAS' ? 'Pago por Comisiones' :
                           contratoActivo.tipoAcuerdo === 'FIJO_POR_DIA' ? 'Pago Fijo por Turno' : 'Modelo Mixto'}
                        </h3>
                        <p className="text-sm font-mono text-zinc-500 mb-4">Ref: {contratoActivo.radicado}</p>
                        
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl w-max shadow-sm">
                           <Calendar className="w-4 h-4 text-zinc-400" />
                           {contratoActivo.fechaInicio ? new Date(contratoActivo.fechaInicio).toLocaleDateString() : new Date(contratoActivo.fechaCreacion).toLocaleDateString()} 
                           {' '} - {' '}
                           {contratoActivo.fechaFin ? new Date(contratoActivo.fechaFin).toLocaleDateString() : 'Indefinido'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-8">
                        <button onClick={() => setIsModalNotaOpen(true)} className="p-2.5 bg-white border border-zinc-200 text-zinc-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl shadow-sm transition-all" title="Añadir Nota a este Contrato">
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirModalParaEditar(contratoActivo, false)} className="p-2.5 bg-white border border-zinc-200 text-zinc-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl shadow-sm transition-all" title="Editar Condiciones">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmarFinalizarContrato(contratoActivo.id)} className="p-2.5 bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl shadow-sm transition-all" title="Finalizar Contrato">
                          <PowerOff className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-2">
                      {contratoActivo.porcentajeComision > 0 && (
                        <div className="bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm min-w-[120px]">
                          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-0.5">Comisión</p>
                          <p className="text-xl font-black text-indigo-600">{contratoActivo.porcentajeComision}%</p>
                        </div>
                      )}
                      {contratoActivo.valorFijoDia > 0 && (
                        <div className="bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm min-w-[120px]">
                          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-0.5">Fijo / Día</p>
                          <p className="text-xl font-black text-indigo-600">${contratoActivo.valorFijoDia.toLocaleString()}</p>
                        </div>
                      )}
                      {contratoActivo.frecuenciaPago && (
                        <div className="bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm min-w-[120px]">
                          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-0.5">Frecuencia</p>
                          <p className="text-xl font-black text-zinc-900 capitalize">{contratoActivo.frecuenciaPago.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                    
                    {contratoActivo.observaciones && (
                      <div className="mt-6 pt-5 border-t border-zinc-100">
                         <p className="text-xs font-extrabold text-zinc-400 mb-1.5 uppercase tracking-widest">Observaciones Legales</p>
                         <p className="text-sm font-medium text-zinc-700 italic">{contratoActivo.observaciones}</p>
                      </div>
                    )}

                    {novedadesPendientes.length > 0 && (
                      <div className="mt-6 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                             <Receipt className="w-5 h-5 text-amber-600" />
                           </div>
                           <div>
                             <p className="text-sm font-black text-amber-900">Notas Pendientes de Cobro/Pago</p>
                             <p className="text-xs font-bold text-amber-700 mt-0.5">Este contrato tiene {novedadesPendientes.length} nota(s) lista(s) para cruzar.</p>
                           </div>
                        </div>
                        <button onClick={() => setIsModalVerNotasOpen(true)} className="px-4 py-2 bg-white border border-amber-200 text-amber-800 font-bold text-xs rounded-xl hover:bg-amber-100 transition-colors shadow-sm w-full sm:w-auto">
                          Ver Detalles
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-dashed border-zinc-300">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-zinc-800">Sin contrato activo</h3>
                    <p className="text-sm text-zinc-500 mt-1 mb-6">Este operario no tiene reglas de liquidación asignadas.</p>
                    <button onClick={() => { setAcuerdoAEditar(null); setIsModalReadOnly(false); setIsModalAcuerdoOpen(true); }} className="px-6 py-3 bg-black text-white font-bold rounded-xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4"/> Crear Nuevo Contrato
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL DE PAGOS */}
            {activeTab === 'historial_pagos' && (
              <div className="animate-in fade-in duration-300">
                {historialPagos.length === 0 ? (
                  <div className="text-center py-16">
                    <Wallet className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold">No hay pagos registrados para este operario.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                          <th className="p-4">ID Pago</th>
                          <th className="p-4">Periodo Pagado</th>
                          <th className="p-4">F. Generación</th>
                          <th className="p-4">Admin</th>
                          <th className="p-4 text-right">Total Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {historialPagos.map((p: any) => (
                          <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-zinc-600">PGO-{String(p.id).padStart(5, '0')}</td>
                            <td className="p-4 text-xs font-bold text-zinc-800">
                              {new Date(p.fechaInicio).toLocaleDateString()} - {new Date(p.fechaFin).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-xs font-medium text-zinc-500">
                              {new Date(p.fechaGeneracion).toLocaleString()}
                            </td>
                            <td className="p-4 text-xs font-bold text-zinc-600 uppercase">
                              {p.generadaPor}
                            </td>
                            <td className="p-4 text-right text-sm font-black text-emerald-600">
                              ${p.granTotalPagar.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL DE CONTRATOS */}
            {activeTab === 'historial_contratos' && (
              <div className="animate-in fade-in duration-300">
                {historialContratos.length === 0 ? (
                  <div className="text-center py-16">
                    <History className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold">No hay historial de contratos pasados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                          <th className="p-4">Radicado</th>
                          <th className="p-4">Modelo</th>
                          <th className="p-4">Vigencia Real</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {historialContratos.map((c: any) => (
                          <tr key={c.id} className="hover:bg-zinc-50 transition-colors group">
                            <td className="p-4 font-mono text-xs font-bold text-zinc-600">{c.radicado}</td>
                            <td className="p-4 text-sm font-bold text-zinc-800">{c.tipoAcuerdo.replace(/_/g, ' ')}</td>
                            <td className="p-4 text-xs font-medium text-zinc-500">
                              {c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString() : new Date(c.fechaCreacion).toLocaleDateString()} - {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4">
                              <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-1 rounded text-[10px] font-extrabold uppercase">
                                {c.estado}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* 🔥 BOTÓN VER DETALLES */}
                                <button onClick={() => abrirModalParaEditar(c, true)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalles">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => confirmarEliminarContrato(c.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Contrato">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      ) : (
        // VISTA DEL BORRADOR AL CALCULAR
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 animate-in slide-in-from-right duration-300">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 lg:p-8 flex flex-col overflow-y-auto">
             <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-6">
                <div>
                   <h3 className="font-extrabold text-xl text-zinc-900">Resumen Financiero</h3>
                   <p className="text-xs text-zinc-500 font-medium mt-1">Liquidación basada en el contrato <strong className="text-zinc-700">{contratoActivo?.radicado}</strong>.</p>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="bg-zinc-100 text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">BORRADOR</span>
                  <button onClick={() => setBorrador(null)} className="text-zinc-400 hover:text-zinc-800"><X className="w-5 h-5"/></button>
                </div>
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
                <p className="text-xs text-zinc-500 font-medium mb-6">Emite Notas Débito (Anticipos) o Notas Crédito (Bonos).</p>
                <button 
                  onClick={() => setIsModalNotaOpen(true)} 
                  className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 mb-3 shadow-sm"
                >
                   <Plus className="w-4 h-4" /> Emitir Nota
                </button>
             </div>
             <button onClick={confirmarAprobarPago} className="w-full py-5 bg-black hover:bg-zinc-800 rounded-3xl text-white font-black text-lg transition-all shadow-xl flex justify-center items-center gap-2 mt-auto">
                <CheckCircle2 className="w-6 h-6" /> Aprobar y Cerrar Pago
             </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONTRATO (Crear / Editar / Leer) */}
      <AcuerdoPagoModal 
        isOpen={isModalAcuerdoOpen}
        onClose={() => setIsModalAcuerdoOpen(false)}
        slotId={slotSeleccionado ? Number(slotSeleccionado) : null}
        slotNombre={slots.find(s => s.id.toString() === slotSeleccionado)?.nombreCompleto || 'Operario'}
        acuerdoAEditar={acuerdoAEditar}
        onGuardadoExitoso={recargarDataOperario}
        readOnly={isModalReadOnly}
      />

      {/* MODAL DE REGISTRO DE NOTAS */}
      <NotaOperativaModal 
        isOpen={isModalNotaOpen}
        onClose={() => setIsModalNotaOpen(false)}
        slotId={slotSeleccionado ? Number(slotSeleccionado) : null}
        slotNombre={slots.find(s => s.id.toString() === slotSeleccionado)?.nombreCompleto || 'Operario'}
        empresaId={empresaId}
        acuerdoId={contratoActivo ? contratoActivo.id : null}
        onGuardadoExitoso={() => {
          recargarDataOperario();
          if (borrador) {
            setBorrador(null);
            toast.success("Nota registrada. Vuelve a calcular la liquidación para incluirla.");
          }
        }}
      />

      {/* MODAL DE VER NOTAS */}
      {isModalVerNotasOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" /> Notas por Aplicar
              </h3>
              <button onClick={() => setIsModalVerNotasOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {novedadesPendientes.map((nota) => {
                  const isDebito = ['ANTICIPO', 'DESCUENTO'].includes(nota.tipoNovedad);
                  return (
                    <div key={nota.id} className={`p-4 rounded-2xl border ${isDebito ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'} flex justify-between items-center`}>
                       <div className="flex gap-4 items-center">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDebito ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {isDebito ? <ArrowDownRight className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                         </div>
                         <div>
                           <p className={`text-xs font-black uppercase tracking-widest ${isDebito ? 'text-red-800' : 'text-emerald-800'}`}>{nota.tipoNovedad.replace('_', ' ')}</p>
                           <p className="text-sm font-medium text-zinc-700 mt-0.5">{nota.descripcion}</p>
                           <p className="text-[10px] text-zinc-400 mt-1 font-bold">{new Date(nota.fechaRegistro).toLocaleString()}</p>
                         </div>
                       </div>
                       <div className={`text-lg font-black font-mono ${isDebito ? 'text-red-600' : 'text-emerald-600'}`}>
                         {isDebito ? '-' : '+'}${nota.valor.toLocaleString()}
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button onClick={() => setIsModalVerNotasOpen(false)} className="px-6 py-2.5 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}