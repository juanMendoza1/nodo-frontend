import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  LayoutDashboard, Package, Users, MonitorSmartphone, Settings, Bell, Search, 
  Menu, ArrowLeft, AlertTriangle, Store, Activity, RefreshCw, Clock, 
  ArrowUpRight, ArrowDownRight, Wifi, WifiOff
} from 'lucide-react';

import PersonalSlots from './PersonalSlots';
import Inventario from './Inventario';
import Terminales from './Terminales';
import { inventarioService } from '../../api/inventario.service';
import type { DashboardStats, Movimiento } from '../../types/inventario.types';

// ============================================================================
// PARCHE PRO: Solución para que SockJS no crashee en React Moderno (Vite/Webpack)
// ============================================================================
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

// ============================================================================
// CUSTOM HOOK: LÓGICA DE WEBSOCKETS AISLADA
// ============================================================================
function useDashboardSocket(empresaId: number, onUpdateRequired: () => void) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!empresaId) return;

    // IMPORTANTE: Cambia esta URL a la ruta de tu backend
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
          console.log("⚡ Chispazo recibido del Backend:", message.body);
          if (message.body === 'NUEVA_VENTA') {
            onUpdateRequired(); 
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
  }, [empresaId, onUpdateRequired]);

  return isLive;
}

// ============================================================================
// SUB-COMPONENTE: RESUMEN DASHBOARD
// ============================================================================
function ResumenDashboard({ empresaId }: { empresaId: number }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizandoFondo, setActualizandoFondo] = useState(false);

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setActualizandoFondo(true); 

    try {
      const [statsData, movsData] = await Promise.all([
        inventarioService.obtenerDashboardStats(empresaId),
        inventarioService.obtenerHistorialAuditoria(empresaId)
      ]);
      setStats(statsData);
      setMovimientos(movsData);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    } finally {
      setLoading(false);
      setTimeout(() => setActualizandoFondo(false), 1000); 
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSocketUpdate = useCallback(() => {
    cargarDatos(true);
  }, [cargarDatos]);

  const isLive = useDashboardSocket(empresaId, handleSocketUpdate);

  if (loading && !stats) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Calculando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" /> Resumen Operativo
            </h2>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-colors ${
              isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              {isLive ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'En Vivo' : 'Offline'}
            </span>
            {actualizandoFondo && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">Métricas en tiempo real y auditoría de operaciones.</p>
        </div>
        
        <button onClick={() => cargarDatos(false)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refrescar
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
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

      <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-500 ${actualizandoFondo ? 'border-blue-300 shadow-blue-900/10' : 'border-gray-200'}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Historial de Movimientos
          </h3>
          <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
            Últimos registros
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
              <tr className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold bg-gray-50/95 backdrop-blur-md">
                <th className="p-4 pl-6">Fecha / Hora</th>
                <th className="p-4">Tipo de Movimiento</th>
                <th className="p-4">Producto</th>
                <th className="p-4 text-center">Cant.</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold">No hay movimientos registrados aún.</p>
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const isSalida = mov.cantidad < 0;
                  const fechaFormateada = new Date(mov.fecha).toLocaleString('es-CO', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                  });

                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 text-xs font-bold text-gray-600 whitespace-nowrap">
                        {fechaFormateada}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          mov.tipo === 'DESPACHO_MESA' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          isSalida ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {isSalida ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {mov.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-gray-900 text-sm">
                        {mov.productoNombre}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-sm font-extrabold ${isSalida ? 'text-red-600' : 'text-emerald-600'}`}>
                          {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-700">
                        {mov.creador}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {mov.referencia || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: CONTENEDOR Y NAVEGACIÓN
// ============================================================================
export default function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔥 SOLUCIÓN: Leemos el Storage de forma 100% segura
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;
  
  // Inicializamos el estado directamente para evitar renders innecesarios
  const [usuario, setUsuario] = useState(usuarioData?.username || 'U');
  const [activeTab, setActiveTab] = useState('resumen');
  
  const empresaId = usuarioData?.empresaId;
  const nombreEmpresa = location.state?.empresaNombre || 'Negocio Seleccionado';

  // El useEffect solo sirve para redirigir si se borra la sesión
  useEffect(() => {
    if (!usuarioData) {
      navigate('/');
    }
  }, [navigate, usuarioData]);

  // 🔥 PROTECCIÓN ANTI-PANTALLA BLANCA:
  // Si no hay datos, no dibujamos nada.
  if (!usuarioData || !empresaId) {
    return null; 
  }

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
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Principal</p>
          
          <button onClick={() => setActiveTab('resumen')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'resumen' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-4 h-4" /> Panel General
          </button>
          
          <button onClick={() => setActiveTab('inventario')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventario' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Package className="w-4 h-4" /> Inventario
          </button>
          
          <button onClick={() => setActiveTab('personal')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" /> Personal
          </button>
          
          <button onClick={() => setActiveTab('terminales')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'terminales' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MonitorSmartphone className="w-4 h-4" /> Terminales (Tablets)
          </button>

          <div className="my-4 border-t border-gray-100"></div>
          
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Administración</p>
          <button className="flex items-center w-full gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all">
            <Settings className="w-4 h-4" /> Configuración
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-500 hover:text-gray-900">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center w-full max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input type="text" placeholder="Buscar productos, terminales o personal..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"/>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm uppercase">
                {/* Ahora usuario está 100% garantizado que no será undefined */}
                {usuario.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50/50">
          {activeTab === 'resumen' && <ResumenDashboard empresaId={empresaId} />}
          {activeTab === 'personal' && <PersonalSlots empresaId={empresaId} />}
          {activeTab === 'inventario' && <Inventario empresaId={empresaId} />}
          {activeTab === 'terminales' && <Terminales empresaId={empresaId} />}
        </div>
      </main>
      
    </div>
  );
}