import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, ShieldCheck, Settings, 
  LogOut, Search, Bell, Menu, Briefcase, Activity, Store, ArrowRight,
  Plus, Edit, X, RefreshCw
} from 'lucide-react';

import { tercerosService, type Tercero } from '../../api/terceros.service';

// ============================================================================
// 1. VISTAS DEL SUPER ADMIN (SaaS Command Center - Modo Monocromático)
// ============================================================================
function MasterOverview() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-zinc-900" /> Visión Global del Holding
        </h2>
        <p className="text-sm text-zinc-500 font-medium mt-1">Resumen de todas las empresas y licencias activas en la plataforma.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {['Empresas Activas', 'Terceros Registrados', 'Usuarios Totales', 'Tablets Conectadas'].map((title, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-zinc-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center border border-zinc-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-0.5">{title}</p>
              <p className="text-2xl font-extrabold text-zinc-900 leading-none">0</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GestionTerceros({ usuarioData }: { usuarioData: any }) {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ documento: '', nombre: '', apellido: '', correo: '', telefono: '' });

  const cargarTerceros = async () => {
    setLoading(true);
    try {
      const data = await tercerosService.obtenerTodos();
      setTerceros(data);
    } catch (error) {
      console.error("Error cargando terceros", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTerceros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mandamos a crear como GLOBAL (true) usando el ID del SuperAdmin y su Empresa
      await tercerosService.crear(formData, usuarioData.empresaId, usuarioData.usuarioId, true);
      setShowModal(false);
      setFormData({ documento: '', nombre: '', apellido: '', correo: '', telefono: '' });
      cargarTerceros(); // Recargamos la tabla
    } catch (error) {
      console.error("Error al crear tercero", error);
      alert("Error al guardar. Revisa la consola.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Gestión de Terceros</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Personas naturales y jurídicas registradas en el ecosistema.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nuevo Tercero
        </button>
      </div>

      {/* TABLA MINIMALISTA */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 font-bold flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-2" /> Cargando base de datos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50/50 border-b border-zinc-200">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                  <th className="p-4 pl-6">Documento / NIT</th>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {terceros.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-400 font-medium">No hay terceros registrados.</td>
                  </tr>
                ) : (
                  terceros.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-4 pl-6 font-mono text-sm font-bold text-zinc-900">{t.documento}</td>
                      <td className="p-4">
                        <p className="text-sm font-extrabold text-zinc-900">{t.nombreCompleto}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-zinc-600">{t.correo || 'Sin correo'}</p>
                        <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{t.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900">Registrar Nuevo Tercero</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Documento / NIT</label>
                <input required type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" placeholder="Ej. 900123456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre(s)</label>
                  <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Apellido(s)</label>
                  <input required type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Correo</label>
                  <input type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" placeholder="mail@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm">Guardar Tercero</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GestionEmpresas() {
  return (
    <div className="animate-in fade-in"><h2 className="text-2xl font-extrabold text-zinc-900">Gestión de Empresas</h2></div>
  );
}

function GestionUsuarios() {
  return (
    <div className="animate-in fade-in"><h2 className="text-2xl font-extrabold text-zinc-900">Usuarios y Accesos</h2></div>
  );
}

// ============================================================================
// 2. VISTA DEL CLIENTE NORMAL (Admin de Negocio - Monocromático)
// ============================================================================
function MisNegociosView({ usuarioData, onLogout }: { usuarioData: any, onLogout: () => void }) {
  const navigate = useNavigate();

  const empresasAsignadas = [
    { id: usuarioData.empresaId, nombre: usuarioData.nombreEmpresa }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 xl:px-12 shadow-sm relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-zinc-900 font-extrabold text-lg tracking-tight">Mis Negocios</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-zinc-900">{usuarioData.username}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Administrador</p>
          </div>
          <div className="w-px h-6 bg-zinc-200"></div>
          <button onClick={onLogout} className="text-zinc-400 hover:text-zinc-900 transition-colors" title="Cerrar Sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 xl:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Hola, {usuarioData.username}</h1>
          <p className="text-zinc-500 font-medium mt-2">Selecciona un negocio para administrar su operación.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasAsignadas.map((empresa) => (
            <div 
              key={empresa.id}
              onClick={() => navigate(`/admin/empresa/${empresa.id}`, { state: { empresaNombre: empresa.nombre } })}
              className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-xl hover:border-zinc-400 hover:-translate-y-1 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-zinc-900 transition-colors">
                <Building2 className="w-6 h-6 text-zinc-900 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 mb-1">{empresa.nombre}</h3>
              <p className="text-sm font-medium text-zinc-500 flex items-center justify-between mt-4">
                Entrar al panel <ArrowRight className="w-4 h-4 text-zinc-900 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 3. COMPONENTE ENRUTADOR (Decide qué mostrar según el ROL)
// ============================================================================
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;

  useEffect(() => {
    if (!usuarioData) navigate('/');
  }, [navigate, usuarioData]);

  if (!usuarioData) return null;

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/');
  };

  const roles: string[] = usuarioData.roles || [];
  const isSuperAdmin = roles.includes('SUPER') || roles.includes('ROLE_SUPER');

  if (!isSuperAdmin) {
    return <MisNegociosView usuarioData={usuarioData} onLogout={handleLogout} />;
  }

  // MUNDO SUPER ADMIN (Modo Oscuro Monocromático)
  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      <aside className="w-64 bg-[#09090b] border-r border-zinc-800 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        {/* Luz muy sutil en la parte superior */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>

        <div className="h-16 flex items-center px-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10">
              <ShieldCheck className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">NODO <span className="text-zinc-500">Master</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10">
          <p className="px-3 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-3">Principal</p>
          
          <button onClick={() => setActiveTab('overview')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'overview' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
            <LayoutDashboard className="w-4 h-4" /> Resumen Global
          </button>

          <p className="px-3 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mt-6 mb-3">Ecosistema SaaS</p>
          
          <button onClick={() => setActiveTab('terceros')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'terceros' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
            <Users className="w-4 h-4" /> Terceros (Clientes)
          </button>
          
          <button onClick={() => setActiveTab('empresas')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'empresas' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
            <Building2 className="w-4 h-4" /> Negocios / Empresas
          </button>
          
          <button onClick={() => setActiveTab('usuarios')} className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'usuarios' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
            <Briefcase className="w-4 h-4" /> Usuarios y Accesos
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-zinc-900 font-extrabold shadow-inner">
              {usuarioData.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{usuarioData.username}</p>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="hidden sm:flex items-center w-full max-w-md relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3" />
              <input type="text" placeholder="Buscar empresas, terceros o usuarios..." className="w-full pl-9 pr-4 py-2 bg-zinc-100 border-transparent rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {activeTab === 'overview' && <MasterOverview />}
          {/* 🔥 Se pasa usuarioData al componente GestionTerceros */}
          {activeTab === 'terceros' && <GestionTerceros usuarioData={usuarioData} />}
          {activeTab === 'empresas' && <GestionEmpresas />}
          {activeTab === 'usuarios' && <GestionUsuarios />}
        </div>
      </main>
    </div>
  );
}