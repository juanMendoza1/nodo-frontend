// src/pages/Admin/CompanyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, MonitorSmartphone, Settings, Bell, Search, 
  Menu, ArrowLeft, Store, ShieldCheck, BadgeDollarSign
} from 'lucide-react';

import PersonalSlots from './PersonalSlots';
import Inventario from './Inventario';
import Terminales from './Terminales';
import LiquidacionSlotManager from './views/LiquidacionSlotManager';
import ResumenOperativo from './views/ResumenOperativo'; // 🔥 EL NUEVO COMPONENTE EXTRAÍDO

// Seguridad
import { usePermissions } from '../../hooks/usePermissions';
import ModuleGuard from './components/auth/ModuleGuard';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 
  
  const { usuarioData, isSuperAdmin, hasModule, permisos } = usePermissions();
  
  const [usuario, setUsuario] = useState(usuarioData?.username || 'U');
  const [activeTab, setActiveTab] = useState('resumen');
  
  const empresaId = Number(id); 
  const nombreEmpresa = location.state?.empresaNombre || 'Negocio Seleccionado';

  useEffect(() => {
    if (!usuarioData) {
      navigate('/');
      return;
    }

    if (activeTab === 'resumen' && !hasModule('MOD_CAJA')) {
      if (hasModule('MOD_INVENTARIO')) setActiveTab('inventario');
      else if (hasModule('MOD_PERSONAL')) setActiveTab('personal');
      else if (hasModule('MOD_TABLETS')) setActiveTab('terminales');
      else if (hasModule('MOD_LIQUID_SLOT')) setActiveTab('liquidaciones');
    }
  }, [navigate, usuarioData, hasModule, activeTab]);

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

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Módulos Contratados</p>
          
          <ModuleGuard module="MOD_CAJA">
            <button onClick={() => setActiveTab('resumen')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'resumen' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LayoutDashboard className="w-4 h-4" /> Panel de Caja
            </button>
          </ModuleGuard>
          
          <ModuleGuard module="MOD_INVENTARIO">
            <button onClick={() => setActiveTab('inventario')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventario' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Package className="w-4 h-4" /> Inventario
            </button>
          </ModuleGuard>
          
          <ModuleGuard module="MOD_PERSONAL">
            <button onClick={() => setActiveTab('personal')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Users className="w-4 h-4" /> Personal
            </button>
          </ModuleGuard>
          
          <ModuleGuard module="MOD_TABLETS">
            <button onClick={() => setActiveTab('terminales')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'terminales' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <MonitorSmartphone className="w-4 h-4" /> Terminales
            </button>
          </ModuleGuard>

          <ModuleGuard module="MOD_LIQUID_SLOT">
            <button onClick={() => setActiveTab('liquidaciones')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'liquidaciones' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <BadgeDollarSign className="w-4 h-4" /> Nómina Slots
            </button>
          </ModuleGuard>

          <div className="my-4 border-t border-gray-100"></div>
          
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Administración</p>
          <button className="flex items-center w-full gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all">
            <Settings className="w-4 h-4" /> Configuración
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER SUPERIOR */}
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
          <ModuleGuard module="MOD_CAJA">
             {activeTab === 'resumen' && <ResumenOperativo empresaId={empresaId} />}
          </ModuleGuard>

          <ModuleGuard module="MOD_PERSONAL">
             {activeTab === 'personal' && <PersonalSlots empresaId={empresaId} />}
          </ModuleGuard>

          <ModuleGuard module="MOD_INVENTARIO">
             {activeTab === 'inventario' && <Inventario empresaId={empresaId} />}
          </ModuleGuard>

          <ModuleGuard module="MOD_TABLETS">
             {activeTab === 'terminales' && <Terminales empresaId={empresaId} />}
          </ModuleGuard>

          <ModuleGuard module="MOD_LIQUID_SLOT">
             {activeTab === 'liquidaciones' && <LiquidacionSlotManager empresaId={empresaId} />}
          </ModuleGuard>
          
          {!isSuperAdmin && permisos.filter((p: string) => p.startsWith('MOD_')).length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center">
                 <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
                 <h2 className="text-xl font-bold text-gray-900">Tu suscripción está inactiva</h2>
                 <p className="text-gray-500 mt-2 max-w-md">No tienes módulos asignados. Contacta al administrador para adquirir un plan.</p>
             </div>
          )}
        </div>
      </main>
      
    </div>
  );
}