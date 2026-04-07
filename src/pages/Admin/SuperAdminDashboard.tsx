import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ShieldCheck, LogOut, Database, UserSquare2, 
  CreditCard, Search, Plus, Menu, Bell, Settings , Cpu
} from 'lucide-react';
import TercerosManager from './views/TercerosManager';
import ConfiguracionMaster from './views/ConfiguracionMaster';
import EmpresasManager from './views/EmpresasManager';
import ProgramasManager from './views/ProgramasManager';
import UsuariosManager from './views/UsuariosManager';

// ============================================================================
// COMPONENTE GENÉRICO TEMPORAL (Solo para Usuarios y Suscripciones por ahora)
// ============================================================================
function MasterTable({ title, description, icon: Icon, columns, data, onAdd }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Icon className="w-6 h-6 text-gray-900" /> {title}
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all" />
          </div>
          <button onClick={onAdd} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors shrink-0 shadow-md">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-extrabold">
                {columns.map((col: string, i: number) => <th key={i} className="p-4 whitespace-nowrap">{col}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center">
                    <Database className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">Módulo en construcción.</p>
                  </td>
                </tr>
              ) : (
                data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    {/* Aquí renderizarás las celdas mapeadas desde tu API */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: NODO MASTER
// ============================================================================
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('terceros');
  const [usuario, setUsuario] = useState('');

  useEffect(() => {
    const usuarioString = localStorage.getItem('usuario');
    const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;
    
    if (!usuarioData) {
      navigate('/');
      return;
    }

    const roles: string[] = usuarioData.roles || [];
    if (!roles.includes('SUPER') && !roles.includes('ROLE_SUPER')) {
      navigate('/admin'); // Si no es super, lo mandamos a sus negocios
    } else {
      setUsuario(usuarioData.username.split(' ')[0]);
    }
  }, [navigate]);

  const menuItems = [
    { id: 'terceros', label: 'Terceros (Base)', icon: Database },
    { id: 'empresas', label: 'Comercios (Tenants)', icon: Building2 },
    { id: 'programas', label: 'Programas (SaaS)', icon: Cpu },
    { id: 'usuarios', label: 'Usuarios y Accesos', icon: UserSquare2 },
    { id: 'suscripciones', label: 'Suscripciones', icon: CreditCard },
    { id: 'configuracion', label: 'Parametrización', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* SIDEBAR SUPER ADMIN (Mismo estilo blanco/negro) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <ShieldCheck className="w-6 h-6 text-gray-900 mr-2" />
          <span className="font-black italic text-lg tracking-tight text-gray-900">NODO MASTER</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Administración Global</p>
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" /> 
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Cerrar Sesión <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-500 hover:text-gray-900">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-gray-900 hidden sm:block">Panel de Control Principal</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-sm uppercase">
                {usuario.charAt(0)}
              </div>
              <span className="text-sm font-bold text-gray-700 hidden sm:block">SuperAdmin</span>
            </div>
          </div>
        </header>

        {/* ÁREA DE TRABAJO (VISTAS CRUD) */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50/50">
          
          {/* MÓDULOS CONECTADOS */}
          {activeTab === 'terceros' && <TercerosManager />}
          {activeTab === 'empresas' && <EmpresasManager />}
          {activeTab === 'configuracion' && <ConfiguracionMaster />}

          {/* MÓDULOS PENDIENTES DE VISTA PROPIA */}
          {activeTab === 'usuarios' && <UsuariosManager />}

          {activeTab === 'suscripciones' && (
            <MasterTable 
              title="Suscripciones / Licencias" 
              description="Módulos (Programas) contratados por las empresas y límites de dispositivos."
              icon={CreditCard}
              columns={['Empresa', 'Programa', 'Dispositivos (Activos/Max)', 'F. Vencimiento', 'Estado', 'Acciones']}
              data={[]} onAdd={() => console.log('Nueva Suscripción')}
            />
          )}
          {activeTab === 'programas' && <ProgramasManager />}

        </div>
      </main>
    </div>
  );
}