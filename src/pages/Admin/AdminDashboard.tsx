import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ChevronRight, 
  Activity, 
  Store, 
  LogOut,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../../api/auth.service';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');

  useEffect(() => {
    const dataString = localStorage.getItem('usuario');
    if (!dataString) {
      navigate('/');
      return;
    }
    const data = JSON.parse(dataString);
    setUsuario(data.username);
    setNombreEmpresa(data.nombreEmpresa); // ¡Tomamos el nombre real de tu base de datos!
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Usamos los datos reales del Login. 
  // (Las métricas de terminales e ingresos las dejamos simuladas por ahora hasta que hagamos el endpoint).
  const misEmpresas = [
    { 
      id: 1, 
      nombre: nombreEmpresa || 'Cargando...', // Se llena con BILLARES DIEGO o SISTEMAS NODO
      giro: 'Operación Principal', 
      estado: 'Operando', 
      color: 'bg-emerald-500',
      terminales: 1, // Coincide con tu DataInitializer (La tablet Motorola)
      ingresosHoy: '$0' // Aún no hay ventas reales hoy
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">NODO</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Holding Center</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nueva Empresa
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{usuario}</p>
              <p className="text-xs text-gray-500 font-medium">Administrador</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tu Mundo de Negocios</h2>
          <p className="text-gray-500 mt-2 font-medium">Selecciona tu empresa para gestionar el inventario, personal y terminales.</p>
        </div>

        {/* GRID DE EMPRESAS (Ahora solo muestra las reales que tienes en BD) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {misEmpresas.map((empresa) => (
            <div 
              key={empresa.id}
              onClick={() => navigate(`/admin/empresa/${empresa.id}`, { state: { empresaNombre: empresa.nombre } })}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${empresa.color} opacity-80`}></div>

              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors duration-300">
                  <Store className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${empresa.color} animate-pulse`}></div>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{empresa.estado}</span>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{empresa.nombre}</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{empresa.giro}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 mb-6">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Terminales</p>
                  <p className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> {empresa.terminales}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Hoy</p>
                  <p className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" /> {empresa.ingresosHoy}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                <span>Gestionar Operación</span>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}

          {/* TARJETA PARA AGREGAR NUEVO NEGOCIO (Opcional, para no ver el espacio tan vacío) */}
          <div className="bg-transparent rounded-2xl p-6 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full min-h-[250px] group">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 group-hover:text-gray-900">Registrar nueva sucursal</h3>
          </div>

        </div>
      </main>
    </div>
  );
}