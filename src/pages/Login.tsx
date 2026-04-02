import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importamos el hook de navegación
import { Network } from 'lucide-react';
import { authService } from '../api/auth.service'; 

export default function Login() {
  const navigate = useNavigate(); // 2. Inicializamos la navegación
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data));
      
      console.log('¡Acceso concedido!', data);
      
      // 3. ¡Redirección mágica al Dashboard!
      navigate('/admin');
      
    } catch (err: any) {
      console.error("Error en login:", err);
      setError(err.response?.data?.error || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] w-full max-w-sm border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative group">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-gray-900/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Network className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">NODO</h1>
          <p className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-widest">
            Plataforma Central
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Usuario</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
              placeholder="Ej: superadmin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-4 bg-gray-900 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:bg-black hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

      </div>
    </div>
  );
}