import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  MonitorSmartphone, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  ArrowLeft, 
  TrendingUp, 
  AlertCircle,
  Store,
  Activity,
  RefreshCw // Icono para indicar carga
} from 'lucide-react';

// Componentes y Servicios
import PersonalSlots from './PersonalSlots';
import Inventario from './Inventario';
import Terminales from './Terminales';
import { inventarioService } from '../../api/inventario.service';
import { terminalesService } from '../../api/terminales.service';
import { personalService } from '../../api/personal.service';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Datos de Sesión
  const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
  const empresaId = usuarioData.empresaId;
  const nombreEmpresa = location.state?.empresaNombre || 'Negocio Seleccionado';

  // ESTADO PARA EL RESUMEN OPERATIVO EXACTO
  const [resumen, setResumen] = useState({
    ventasHoy: 0,
    stockBajo: 0,
    terminalesActivas: 0,
    totalTerminales: 0,
    alertasSistema: 0,
    loading: true
  });

  // Efecto principal para redirigir si no hay sesión
  useEffect(() => {
    if (!localStorage.getItem('usuario')) {
      navigate('/');
    } else {
      setUsuario(usuarioData.username);
    }
  }, [navigate]);

  // Efecto para cargar los datos exactos cuando entramos a la pestaña "resumen"
  useEffect(() => {
    if (activeTab === 'resumen' && empresaId) {
      cargarDatosDelResumen();
    }
  }, [activeTab, empresaId]);

  const cargarDatosDelResumen = async () => {
    setResumen(prev => ({ ...prev, loading: true }));
    try {
      // Pedimos todos los datos al backend al mismo tiempo para no hacer esperar al usuario
      const [productos, terminales, personal] = await Promise.all([
        inventarioService.obtenerProductosPorEmpresa(empresaId).catch(() => []),
        terminalesService.obtenerTerminales(empresaId).catch(() => []),
        personalService.obtenerSlotsPorEmpresa(empresaId).catch(() => [])
      ]);

      // 1. Calculamos Stock Bajo (productos cuyo stock actual es <= al mínimo)
      const cantStockBajo = productos.filter(p => p.stockActual <= p.stockMinimo).length;

      // 2. Calculamos Terminales Activas
      const cantTerminalesActivas = terminales.filter(t => t.estado === 'ACTIVA').length;

      // 3. Calculamos Alertas (Ej: Meseros bloqueados por múltiples intentos fallidos)
      const cantAlertas = personal.filter(p => p.bloqueado).length;

      setResumen({
        ventasHoy: 0, // Se actualizará cuando conectemos el módulo de facturación
        stockBajo: cantStockBajo,
        terminalesActivas: cantTerminalesActivas,
        totalTerminales: terminales.length > 0 ? terminales.length : 5, // 5 cupos por defecto
        alertasSistema: cantAlertas,
        loading: false
      });

    } catch (error) {
      console.error("Error cargando el resumen general:", error);
      setResumen(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Holding
          </button>
        </div>
        
        <div className="p-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
            <Store className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-sm font-extrabold text-gray-900 leading-tight">{nombreEmpresa}</h2>
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-500 hover:text-gray-900">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center w-full max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input type="text" placeholder="Buscar productos, terminales o personal..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"/>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              {resumen.alertasSistema > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-tr from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {usuario.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE TRABAJO SCROLLABLE */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          
          {/* VISTA: RESUMEN EXACTO */}
          {activeTab === 'resumen' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resumen Operativo</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Métricas calculadas en tiempo real desde la base de datos.</p>
                </div>
                {resumen.loading && (
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando...
                  </div>
                )}
              </div>

              {/* WIDGETS GENÉRICOS (Ahora con datos exactos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">En construcción</span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas Hoy</h3>
                  <p className="text-2xl font-extrabold text-gray-300">$0</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${resumen.stockBajo > 0 ? 'bg-amber-50' : 'bg-purple-50'}`}>
                      <Package className={`w-5 h-5 ${resumen.stockBajo > 0 ? 'text-amber-500' : 'text-purple-600'}`} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Crítico</h3>
                  <p className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    {resumen.loading ? '-' : resumen.stockBajo} 
                    <span className="text-sm font-medium text-gray-400 normal-case">
                      {resumen.stockBajo === 1 ? 'producto' : 'productos'}
                    </span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <MonitorSmartphone className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Terminales Activas</h3>
                  <p className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    {resumen.loading ? '-' : resumen.terminalesActivas} 
                    <span className="text-sm font-medium text-gray-400 normal-case">/ {resumen.totalTerminales} cupos</span>
                  </p>
                </div>

                <div className={`bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${resumen.alertasSistema > 0 ? 'border-red-200' : 'border-gray-100'}`}>
                  {resumen.alertasSistema > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${resumen.alertasSistema > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
                      <AlertCircle className={`w-5 h-5 ${resumen.alertasSistema > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 relative z-10 ${resumen.alertasSistema > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    Alertas Sistema
                  </h3>
                  <p className={`text-2xl font-extrabold relative z-10 ${resumen.alertasSistema > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {resumen.loading ? '-' : resumen.alertasSistema}
                  </p>
                </div>

              </div>

              {/* TABLA GENÉRICA */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Actividad Reciente</h3>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Ver todo</button>
                </div>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Sistema en línea y operando.</p>
                  <p className="text-xs text-gray-500 mt-1">Los registros del sistema de ventas aparecerán aquí próximamente.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && <PersonalSlots empresaId={empresaId} />}
          {activeTab === 'inventario' && <Inventario empresaId={empresaId} />}
          {activeTab === 'terminales' && <Terminales empresaId={empresaId} />}

        </div>
      </main>
      
    </div>
  );
}