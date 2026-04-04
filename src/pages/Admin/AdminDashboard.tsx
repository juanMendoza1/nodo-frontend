import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, ShieldCheck, 
  LogOut, Search, Bell, Activity, Store, ArrowRight,
  Plus, Edit, X, RefreshCw
} from 'lucide-react';
import { tercerosService, type Tercero } from '../../api/terceros.service';

// --- VISTAS DEL SUPER ADMIN ---
function MasterOverview() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-zinc-900 flex items-center gap-2">
          <Activity className="w-6 h-6" /> Visión Global del Holding
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {['Empresas', 'Terceros', 'Usuarios', 'Tablets'].map((title, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-0.5">{title}</p>
            <p className="text-2xl font-extrabold text-zinc-900">0</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- VISTA DE "HOLA DIEGO" (MIS NEGOCIOS) ---
function MisNegociosView({ usuarioData, onLogout }: { usuarioData: any, onLogout: () => void }) {
  const navigate = useNavigate();
  const empresasAsignadas = [{ id: usuarioData.empresaId, nombre: usuarioData.nombreEmpresa }];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 xl:px-12 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-zinc-900 font-extrabold text-lg tracking-tight">Mis Negocios</span>
        </div>
        <button onClick={onLogout} className="text-zinc-400 hover:text-zinc-900 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 xl:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight italic">¡Hola, {usuarioData.username.split(' ')[0]}!</h1>
          <p className="text-zinc-500 font-medium mt-2">Selecciona un negocio para administrar su operación.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasAsignadas.map((empresa) => (
            <div 
              key={empresa.id}
              onClick={() => navigate(`/admin/empresa/${empresa.id}`, { state: { empresaNombre: empresa.nombre } })}
              className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-zinc-900 transition-colors">
                <Building2 className="w-6 h-6 text-zinc-900 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 mb-1">{empresa.nombre}</h3>
              <p className="text-sm font-medium text-zinc-500 flex items-center justify-between mt-4 uppercase tracking-tighter italic">
                Entrar al panel <ArrowRight className="w-4 h-4 text-zinc-900" />
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;

  useEffect(() => { if (!usuarioData) navigate('/'); }, [navigate, usuarioData]);
  if (!usuarioData) return null;

  const roles: string[] = usuarioData.roles || [];
  const isSuperAdmin = roles.includes('SUPER') || roles.includes('ROLE_SUPER');

  if (!isSuperAdmin) {
    return <MisNegociosView usuarioData={usuarioData} onLogout={() => { localStorage.clear(); navigate('/'); }} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      <aside className="w-64 bg-black border-r border-zinc-800 flex flex-col text-white">
        <div className="p-6 border-b border-white/10 font-black italic">NODO MASTER</div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full text-left p-3 rounded-xl ${activeTab === 'overview' ? 'bg-white text-black' : 'text-zinc-400'}`}>Resumen Global</button>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {activeTab === 'overview' && <MasterOverview />}
      </main>
    </div>
  );
}