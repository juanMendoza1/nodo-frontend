import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Store, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;

  useEffect(() => { 
    if (!usuarioData) navigate('/'); 
    // Opcional: Si detectas que es SUPER, mándalo al SuperAdmin
    const roles: string[] = usuarioData?.roles || [];
    if (roles.includes('SUPER') || roles.includes('ROLE_SUPER')) {
      navigate('/super-admin');
    }
  }, [navigate, usuarioData]);

  if (!usuarioData) return null;

  // Por ahora, usamos la empresa que venga en el login
  const empresasAsignadas = [{ id: usuarioData.empresaId, nombre: usuarioData.nombreEmpresa || 'Mi Negocio' }];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 xl:px-12 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-extrabold text-lg tracking-tight">Mis Negocios</span>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-bold">
          Salir <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 xl:p-12">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            ¡Hola, {usuarioData.username.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 font-medium mt-2">Selecciona un negocio para administrar su operación.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {empresasAsignadas.map((empresa) => (
            <div 
              key={empresa.id}
              onClick={() => navigate(`/admin/empresa/${empresa.id}`, { state: { empresaNombre: empresa.nombre } })}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-900 hover:-translate-y-1 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
                <Building2 className="w-6 h-6 text-gray-900 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">{empresa.nombre}</h3>
              <p className="text-sm font-bold text-gray-400 flex items-center justify-between mt-4 uppercase tracking-tighter transition-colors group-hover:text-gray-900">
                Entrar al panel <ArrowRight className="w-4 h-4" />
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}