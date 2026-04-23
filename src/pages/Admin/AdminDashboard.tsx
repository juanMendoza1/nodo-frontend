import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Store, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { empresasService } from '../../api/empresas.service'; 
import { authService } from '../../api/auth.service'; // 🔥 Importamos authService
import toast from 'react-hot-toast'; // 🔥 Para feedback visual

// Tipado estricto
interface EmpresaInfo {
  id: number;
  nombreComercial: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const usuarioString = localStorage.getItem('usuario');
  const usuarioData = useMemo(() => {
    return usuarioString ? JSON.parse(usuarioString) : null;
  }, [usuarioString]);

  useEffect(() => { 
    if (!usuarioData) {
      navigate('/'); 
      return;
    }
    
    const roles: string[] = usuarioData?.roles || [];
    if (roles.includes('SUPER') || roles.includes('ROLE_SUPER')) {
      navigate('/super-admin');
      return;
    }

    const fetchMisEmpresas = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!usuarioData.terceroId) {
          throw new Error("No se encontró tu identificador de propietario en la sesión.");
        }

        const data = await empresasService.obtenerPorPropietario(usuarioData.terceroId);
        setEmpresas(data || []);

      } catch (err: any) {
        console.error("Error al cargar las empresas:", err);
        setError(err.message || "Error de conexión al cargar tus sucursales.");
      } finally {
        setLoading(false);
      }
    };

    fetchMisEmpresas();

  }, [navigate, usuarioString, usuarioData]);

  if (!usuarioData) return null;

  const handleLogout = () => {
    authService.logout(); // 🔥 Usamos el servicio centralizado
    navigate('/');
  };

  // 🔥 NUEVA FUNCIÓN: Entrar a la sucursal solicitando el nuevo token
  const handleEnterCompany = async (empresa: EmpresaInfo) => {
    const toastId = toast.loading(`Abriendo bóveda de ${empresa.nombreComercial}...`);
    try {
      // 1. Pedimos al backend que nos cambie el contexto a esta empresa
      const newSessionData = await authService.switchContext(empresa.id);
      
      // 2. Sobrescribimos el localStorage con la nueva sesión (¡Nuevos permisos estables!)
      localStorage.setItem('token', newSessionData.token);
      localStorage.setItem('usuario', JSON.stringify(newSessionData));
      
      toast.success('¡Conexión segura establecida!', { id: toastId });
      
      // 3. Redirigimos al Dashboard del negocio (Ahora leerá los permisos correctos)
      navigate(`/admin/empresa/${empresa.id}`, { state: { empresaNombre: empresa.nombreComercial } });
      
    } catch (error: any) {
      console.error("Error cambiando de contexto:", error);
      toast.error("Acceso denegado o error de conexión.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 xl:px-12 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-extrabold text-lg tracking-tight">Lobby Central</span>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-bold">
          Salir <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 xl:p-12 flex flex-col">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shrink-0">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            ¡Hola, {usuarioData.username.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 font-medium mt-2">Selecciona una de tus sucursales para administrar su operación.</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4"/>
            <p className="text-gray-500 font-bold">Verificando propiedades...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-black text-gray-900">Algo salió mal</h3>
            <p className="text-gray-500 font-medium max-w-md mt-1">{error}</p>
          </div>
        ) : empresas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white border border-dashed border-gray-300 rounded-3xl p-8 animate-in zoom-in-95 duration-300">
            <Building2 className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-800">Aún no tienes negocios asignados</h3>
            <p className="text-gray-500 font-medium max-w-md mt-2">
              Tu cuenta está activa, pero no hemos encontrado comercios vinculados a tu identidad fiscal. Contacta con soporte para asignar tu local.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {empresas.map((empresa) => (
              <div 
                key={empresa.id}
                onClick={() => handleEnterCompany(empresa)}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-900 hover:-translate-y-1.5 cursor-pointer transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors z-0"></div>
                
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 group-hover:bg-gray-900 group-hover:shadow-lg transition-colors duration-300 border border-gray-200 group-hover:border-gray-900">
                  <Building2 className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
                </div>
                
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-black text-gray-900 mb-1 leading-tight">{empresa.nombreComercial}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Sucursal: {empresa.id}</p>
                </div>
                
                <div className="relative z-10 mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm font-black text-gray-400 flex items-center justify-between uppercase tracking-tighter transition-colors group-hover:text-gray-900">
                    Entrar a la Sucursal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}