// src/pages/Admin/views/ResumenOperativo.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Package, AlertTriangle, MonitorSmartphone, Users, Gamepad2, Store, UserCircle2, Timer } from 'lucide-react';
import { inventarioService } from '../../../api/inventario.service';
import api from '../../../api/axios.config';
import { useWebSockets } from '../../../hooks/useWebSockets';
import MesaControlPanel from '../components/MesaControlPanel';

// Tipos
import type { DashboardStats } from '../../../types/inventario.types';
import type { MesaDTO } from '../../../types/mesas.types';

interface ResumenOperativoProps {
  empresaId: number;
}

export default function ResumenOperativo({ empresaId }: ResumenOperativoProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [mesas, setMesas] = useState<MesaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizandoFondo, setActualizandoFondo] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaDTO | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const cargarDatosAuditoria = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setActualizandoFondo(true); 

    try {
      const [statsData, actData] = await Promise.all([
        inventarioService.obtenerDashboardStats(empresaId),
        api.get(`/api/actividad/empresa/${empresaId}`).then(res => res.data) 
      ]);
      setStats(statsData);
      setActividades(actData);
    } catch (error) {
      console.error("Error cargando auditoría", error);
    } finally {
      setLoading(false);
      setTimeout(() => setActualizandoFondo(false), 1000); 
    }
  }, [empresaId]);

  const cargarEstadoMesas = useCallback(async () => {
    try {
      const res = await api.get(`/api/mesas/empresa/${empresaId}`);
      if (res.status === 200) {
        const mesasOrdenadas = res.data.sort((a: MesaDTO, b: MesaDTO) => a.idMesaLocal - b.idMesaLocal);
        setMesas(mesasOrdenadas);
      }
    } catch (error) {
      console.error("Error cargando mesas", error);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatosAuditoria();
    cargarEstadoMesas();
  }, [cargarDatosAuditoria, cargarEstadoMesas]);

  const handleAuditUpdate = useCallback(() => {
    cargarDatosAuditoria(true);
    setRefreshTrigger(Date.now()); 
  }, [cargarDatosAuditoria]);

  const handleMesaUpdate = useCallback((mesaActualizada: MesaDTO) => {
    setMesas(prevMesas => {
      const index = prevMesas.findIndex(m => m.idMesaLocal === mesaActualizada.idMesaLocal);
      const nuevasMesas = [...prevMesas];
      
      if (index >= 0) nuevasMesas[index] = { ...nuevasMesas[index], ...mesaActualizada };
      else nuevasMesas.push(mesaActualizada);
      
      return nuevasMesas.sort((a, b) => a.idMesaLocal - b.idMesaLocal);
    });

    setMesaSeleccionada(prev => {
      if (prev && prev.idMesaLocal === mesaActualizada.idMesaLocal) return { ...prev, ...mesaActualizada };
      return prev;
    });
  }, []);

  const isLive = useWebSockets(empresaId, [
    { 
      topic: `/topic/empresa/${empresaId}/dashboard`, 
      callback: (msg: string) => { if (msg === 'NUEVA_VENTA') handleAuditUpdate() } 
    },
    { 
      topic: `/topic/mesas/${empresaId}`, 
      callback: (msg: MesaDTO) => handleMesaUpdate(msg) 
    }
  ]);

  if (loading && !stats) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Iniciando Centro de Comando...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER DEL DASHBOARD */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" /> Resumen Operativo
            </h2>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-colors ${
              isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-50 text-red-500 border-red-200'
            }`}>
              {isLive ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'En Vivo' : 'Offline'}
            </span>
            {actualizandoFondo && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">El estado de tu salón de billar y la caja negra en tiempo real.</p>
        </div>
        <button onClick={() => { cargarDatosAuditoria(false); cargarEstadoMesas(); }} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refrescar
        </button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 relative overflow-hidden group transition-all duration-500 ${actualizandoFondo ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center relative z-10 border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Catálogo</p>
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                {stats.totalProductos} <span className="text-xs font-bold text-gray-400 lowercase">ítems</span>
              </p>
            </div>
          </div>

          <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 relative overflow-hidden group transition-all duration-500 ${stats.productosBajoStock > 0 ? 'border-red-200' : 'border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative z-10 border ${stats.productosBajoStock > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${stats.productosBajoStock > 0 ? 'text-red-400' : 'text-gray-400'}`}>Stock Crítico</p>
              <p className={`text-2xl font-extrabold leading-none ${stats.productosBajoStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.productosBajoStock} <span className={`text-xs font-bold lowercase ${stats.productosBajoStock > 0 ? 'text-red-400' : 'text-gray-400'}`}>ítems</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group transition-all duration-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center relative z-10 border border-emerald-100">
              <MonitorSmartphone className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Tablets Activas</p>
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                {stats.terminalesActivas} <span className="text-xs font-bold text-gray-400 lowercase">en red</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden group transition-all duration-500">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center relative z-10 border border-purple-100">
              <Users className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Personal</p>
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                {stats.personalActivo} <span className="text-xs font-bold text-gray-400 lowercase">operando</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SALÓN EN VIVO */}
      <div className="mb-10">
        <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-indigo-500" /> Salón en Vivo
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {mesas.length === 0 ? (
             <div className="col-span-full p-8 border-2 border-dashed border-gray-300 rounded-2xl text-center bg-white">
                <p className="text-gray-500 font-bold">No hay mesas instaladas en el local. Configúralas desde la Tablet.</p>
             </div>
          ) : (
            mesas.map(mesa => {
              const isOcupada = mesa.estado === 'OCUPADA';
              const isAbierta = mesa.estado === 'ABIERTO'; 
              const isActiva = isOcupada || isAbierta;
              const isJuego = ['POOL', '3BANDAS'].includes(mesa.tipoJuego?.toUpperCase() || '');

              return (
                <div 
                  key={mesa.idMesaLocal} 
                  onClick={() => setMesaSeleccionada(mesa)}
                  className={`cursor-pointer relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
                    isOcupada 
                      ? 'bg-slate-900 border border-slate-700 shadow-xl hover:scale-[1.03] ring-1 ring-indigo-500/30 hover:ring-indigo-400/60 hover:shadow-indigo-500/20' 
                      : isAbierta 
                      ? 'bg-slate-800 border border-amber-500/50 shadow-lg hover:scale-[1.02] ring-1 ring-amber-500/30 hover:ring-amber-400/60 hover:shadow-amber-500/20'
                      : 'bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md opacity-95 hover:opacity-100'
                  }`}
                >
                  {isActiva && (
                    <div className={`absolute -inset-20 opacity-20 blur-2xl rounded-full ${
                      isOcupada ? (isJuego ? 'bg-indigo-500/30' : 'bg-emerald-500/30') : 'bg-amber-500/20'
                    }`}></div>
                  )}

                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div>
                      <h4 className={`text-2xl font-black italic tracking-tight ${isActiva ? 'text-white' : 'text-gray-800'}`}>
                        MESA {String(mesa.idMesaLocal).padStart(2, '0')}
                      </h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                        isOcupada ? 'text-indigo-400' : isAbierta ? 'text-amber-400' : 'text-gray-400'
                      }`}>
                        {isOcupada ? 'Sesión Activa' : isAbierta ? 'En Espera...' : 'Standby'}
                      </p>
                    </div>
                    {isOcupada ? (
                      <span className="flex h-3 w-3 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isJuego ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isJuego ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                      </span>
                    ) : isAbierta ? (
                      <span className="flex h-3 w-3 relative">
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-gray-300 border border-gray-400"></span>
                    )}
                  </div>

                  <div className="relative z-10 space-y-3">
                    {isActiva ? (
                      <>
                        <div className={`flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border ${isOcupada ? 'border-slate-700' : 'border-amber-900/50'}`}>
                          <div className="flex items-center gap-2">
                            {isJuego ? <Gamepad2 className="w-4 h-4 text-indigo-400" /> : <Store className="w-4 h-4 text-emerald-400" />}
                            <span className="text-xs font-bold text-white">{mesa.tipoJuego || 'Servicio'}</span>
                          </div>
                          {isOcupada && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {mesa.fechaApertura ? new Date(mesa.fechaApertura).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-1">
                          <UserCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] font-bold text-gray-300 uppercase truncate">
                            Op: {mesa.usuarioActual?.alias || 'SISTEMA'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 opacity-50">
                        <Store className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mesa Libre</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CAJA NEGRA GLOBAL DE AUDITORÍA */}
      <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-500 ${actualizandoFondo ? 'border-blue-300 shadow-blue-900/10' : 'border-gray-200'}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
              <Timer className="w-5 h-5 text-gray-400" /> Caja Negra (Log de Auditoría Global)
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Registro 1 a 1 de todos los eventos operativos del establecimiento.</p>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">
            {actividades.length} Registros
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
              <tr className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold bg-gray-50/95 backdrop-blur-md">
                <th className="p-4 pl-6">Fecha / Hora</th>
                <th className="p-4">Tipo de Evento</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4">Detalles del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actividades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold">No hay eventos en la caja negra.</p>
                  </td>
                </tr>
              ) : (
                actividades.map((act) => {
                  const fechaFormateada = new Date(act.fechaDispositivo).toLocaleString('es-CO', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                  });

                  const data = act.detallesJson ? JSON.parse(act.detallesJson) : {};
                  let detalleTexto = "";
                  
                  if (['CLIENTE_NUEVO', 'CLIENTE_CREADO'].includes(act.tipoEvento)) {
                    detalleTexto = `Ingreso de Cliente: ${data.nombreCliente || data.nombre || 'N/A'}`;
                  } else if (['DESPACHO_MESA', 'PEDIDO_DIRECTO', 'DESPACHO', 'MUNICION_AGREGADA'].includes(act.tipoEvento)) {
                    if (data.productos && Array.isArray(data.productos)) {
                      detalleTexto = `Consumo: ${data.productos.map((p:any) => `${p.cantidad}x ${p.nombre}`).join(", ")}`;
                    } else if (data.nombre) {
                      detalleTexto = `Consumo: ${data.cantidad || 1}x ${data.nombre}`;
                    } else {
                      detalleTexto = "Consumo registrado";
                    }
                  } else if (act.tipoEvento.includes('DUELO')) {
                    detalleTexto = `Sesión iniciada: ${data.tipoJuego || 'N/A'} - Tarifa: $${data.tarifaTiempo || 0}/min`;
                  } else if (act.tipoEvento === 'MESA_CERRADA') {
                    detalleTexto = `Mesa liberada / Turno cerrado`;
                  } else if (act.tipoEvento === 'MESA_ABIERTA') {
                    detalleTexto = `Mesa Habilitada (${data.tipoJuego || 'Servicio'})`;
                  } else {
                    detalleTexto = "Actualización de sistema";
                  }

                  return (
                    <tr key={act.eventoId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-6 text-xs font-bold text-gray-600 whitespace-nowrap">
                        {fechaFormateada}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">
                          {act.tipoEvento.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        {act.mesaId ? (
                           <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                             Mesa {String(act.mesaId).padStart(2, '0')}
                           </span>
                        ) : (
                           <span className="text-gray-400 font-bold text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-gray-700">
                        {detalleTexto}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mesaSeleccionada && (
        <MesaControlPanel 
          mesa={mesaSeleccionada} 
          empresaId={empresaId} 
          onClose={() => setMesaSeleccionada(null)} 
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}