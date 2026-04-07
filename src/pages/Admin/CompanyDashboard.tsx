import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  LayoutDashboard, Package, Users, MonitorSmartphone, Settings, Bell, Search, 
  Menu, ArrowLeft, AlertTriangle, Store, Activity, RefreshCw, Clock, 
  Wifi, WifiOff, Gamepad2, UserCircle2, Timer, ShieldCheck
} from 'lucide-react';

import PersonalSlots from './PersonalSlots';
import Inventario from './Inventario';
import Terminales from './Terminales';
import { inventarioService } from '../../api/inventario.service';
import type { DashboardStats } from '../../types/inventario.types';
import MesaControlPanel from './components/MesaControlPanel';
import api from '../../api/axios.config';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================
export interface MesaDTO {
  id: number;
  idMesaLocal: number;
  nombre: string;
  estado: string; // "DISPONIBLE" | "ABIERTO" | "OCUPADA"
  tipoJuego?: string;
  tarifaTiempo?: number;
  reglaDuelo?: string;
  fechaApertura?: number;
  usuarioActual?: { alias: string; login: string }; 
}

// ============================================================================
// CUSTOM HOOK: WEBSOCKETS (ESTABILIZADO)
// ============================================================================
function useDashboardSocket(empresaId: number, onUpdateAudit: () => void, onUpdateMesa: (mesa: any) => void) {
  const [isLive, setIsLive] = useState(false);
  
  const auditRef = useRef(onUpdateAudit);
  const mesaRef = useRef(onUpdateMesa);

  useEffect(() => {
    auditRef.current = onUpdateAudit;
    mesaRef.current = onUpdateMesa;
  }, [onUpdateAudit, onUpdateMesa]);

  useEffect(() => {
    if (!empresaId) return;

    const socketUrl = 'http://localhost:8080/ws'; 

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000, 
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsLive(true);
        console.log('📡 WebSocket Conectado a la Empresa:', empresaId);
        
        client.subscribe(`/topic/empresa/${empresaId}/dashboard`, (message) => {
          if (message.body === 'NUEVA_VENTA') auditRef.current(); 
        });

        client.subscribe(`/topic/mesas/${empresaId}`, (message) => {
          try {
            const mesaActualizada = JSON.parse(message.body);
            mesaRef.current(mesaActualizada);
          } catch (e) {
             console.error("Error parseando mesa WS", e);
          }
        });
      },
      onDisconnect: () => setIsLive(false),
      onWebSocketError: () => setIsLive(false),
      onStompError: () => setIsLive(false),
    });

    client.activate();
    
    return () => { 
      client.deactivate(); 
    };
  }, [empresaId]); 

  return isLive;
}

// ============================================================================
// SUB-COMPONENTE: RESUMEN DASHBOARD
// ============================================================================
function ResumenDashboard({ empresaId }: { empresaId: number }) {
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

  const handleMesaUpdate = useCallback((mesaActualizada: any) => {
    setMesas(prevMesas => {
      const index = prevMesas.findIndex(m => m.idMesaLocal === mesaActualizada.idMesaLocal);
      let nuevasMesas = [...prevMesas];
      
      if (index >= 0) nuevasMesas[index] = { ...nuevasMesas[index], ...mesaActualizada };
      else nuevasMesas.push(mesaActualizada);
      
      return nuevasMesas.sort((a, b) => a.idMesaLocal - b.idMesaLocal);
    });

    setMesaSeleccionada(prev => {
      if (prev && prev.idMesaLocal === mesaActualizada.idMesaLocal) return { ...prev, ...mesaActualizada };
      return prev;
    });
  }, []);

  const isLive = useDashboardSocket(empresaId, handleAuditUpdate, handleMesaUpdate);

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
              <Clock className="w-5 h-5 text-gray-400" /> Caja Negra (Log de Auditoría Global)
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

      {/* MODAL / PANEL DE LA MESA SELECCIONADA */}
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

// ============================================================================
// COMPONENTE PRINCIPAL: CONTENEDOR Y NAVEGACIÓN
// ============================================================================
export default function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 
  
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;
  
  const [usuario, setUsuario] = useState(usuarioData?.username || 'U');
  const [activeTab, setActiveTab] = useState('resumen');
  
  const empresaId = Number(id); 
  const nombreEmpresa = location.state?.empresaNombre || 'Negocio Seleccionado';

  // 🔥 LÓGICA DE LEGOS: Verificamos qué permisos/módulos tiene el usuario
  const permisosUsuario = usuarioData?.permisos || [];
  const rolesUsuario = usuarioData?.roles || [];
  const isSuperAdmin = rolesUsuario.includes('SUPER') || rolesUsuario.includes('ROLE_SUPER');

  const tieneModulo = (modulo: string) => {
    if (isSuperAdmin) return true; // El SuperAdmin ve todo para poder dar soporte
    return permisosUsuario.includes(modulo);
  };

  // 🔥 Efecto para que, si no tiene "Caja", lo mande a Inventario o al que tenga por defecto
  useEffect(() => {
    if (!usuarioData) {
      navigate('/');
      return;
    }
    if (!tieneModulo('MOD_CAJA') && activeTab === 'resumen') {
      if (tieneModulo('MOD_INVENTARIO')) setActiveTab('inventario');
      else if (tieneModulo('MOD_PERSONAL')) setActiveTab('personal');
      else if (tieneModulo('MOD_TABLETS')) setActiveTab('terminales');
    }
  }, [navigate, usuarioData, permisosUsuario, activeTab]);

  if (!usuarioData || !empresaId || isNaN(empresaId)) return null; 

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Holding
          </button>
        </div>
        
        <div className="p-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
            <Store className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-sm font-extrabold text-gray-900 leading-tight">{nombreEmpresa}</h2>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Operando
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Módulos Contratados</p>
          
          {/* 🔥 DIBUJAMOS LOS BOTONES SOLO SI TIENE EL MÓDULO */}
          {tieneModulo('MOD_CAJA') && (
            <button onClick={() => setActiveTab('resumen')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'resumen' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LayoutDashboard className="w-4 h-4" /> Panel de Caja
            </button>
          )}
          
          {tieneModulo('MOD_INVENTARIO') && (
            <button onClick={() => setActiveTab('inventario')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventario' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Package className="w-4 h-4" /> Inventario
            </button>
          )}
          
          {tieneModulo('MOD_PERSONAL') && (
            <button onClick={() => setActiveTab('personal')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Users className="w-4 h-4" /> Personal
            </button>
          )}
          
          {tieneModulo('MOD_TABLETS') && (
            <button onClick={() => setActiveTab('terminales')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'terminales' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <MonitorSmartphone className="w-4 h-4" /> Terminales
            </button>
          )}

          <div className="my-4 border-t border-gray-100"></div>
          
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Administración</p>
          <button className="flex items-center w-full gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all">
            <Settings className="w-4 h-4" /> Configuración
          </button>
        </nav>
      </aside>

      {/* HEADER SUPERIOR */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-500 hover:text-gray-900">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center w-full max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input type="text" placeholder="Buscar operaciones..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"/>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm uppercase">
                {usuario.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50/50">
          {activeTab === 'resumen' && tieneModulo('MOD_CAJA') && <ResumenDashboard empresaId={empresaId} />}
          {activeTab === 'personal' && tieneModulo('MOD_PERSONAL') && <PersonalSlots empresaId={empresaId} />}
          {activeTab === 'inventario' && tieneModulo('MOD_INVENTARIO') && <Inventario empresaId={empresaId} />}
          {activeTab === 'terminales' && tieneModulo('MOD_TABLETS') && <Terminales empresaId={empresaId} />}
          
          {/* Si no tiene nada */}
          {permisosUsuario.filter((p: string) => p.startsWith('MOD_')).length === 0 && !isSuperAdmin && (
             <div className="flex flex-col items-center justify-center h-full text-center">
                 <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
                 <h2 className="text-xl font-bold text-gray-900">Tu suscripción está inactiva</h2>
                 <p className="text-gray-500 mt-2 max-w-md">No tienes módulos asignados. Contacta al administrador para adquirir un plan (Inventario, POS, etc).</p>
             </div>
          )}
        </div>
      </main>
      
    </div>
  );
}