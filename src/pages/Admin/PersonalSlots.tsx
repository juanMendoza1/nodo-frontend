// Archivo: src/pages/Admin/PersonalSlots.tsx

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  MoreVertical,
  UserX
} from 'lucide-react';
import { personalService } from '../../api/personal.service';
import type { UsuarioSlot } from '../../types/personal.types';

interface PersonalSlotsProps {
  empresaId: number;
}

export default function PersonalSlots({ empresaId }: PersonalSlotsProps) {
  const [slots, setSlots] = useState<UsuarioSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarSlots();
  }, [empresaId]);

  const cargarSlots = async () => {
    try {
      setLoading(true);
      // Llamada real a tu backend de Spring Boot
      const data = await personalService.obtenerSlotsPorEmpresa(empresaId);
      setSlots(data);
    } catch (error) {
      console.error("Error al cargar personal", error);
    } finally {
      setLoading(false);
    }
  };

  const slotsFiltrados = slots.filter(slot => 
    slot.nombreCompleto.toLowerCase().includes(filtro.toLowerCase()) ||
    slot.login.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Gestión de Personal (Slots)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra los accesos operativos para las terminales y tablets.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 transition-all">
          <Plus className="w-4 h-4" /> Nuevo Operador
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por alias o login (Ej: M1_ALEJO)"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Grid de Personal (Tarjetas) */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando personal...</div>
      ) : slotsFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">No se encontraron operadores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slotsFiltrados.map((slot) => (
            <div key={slot.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
              
              {/* Opciones del Slot (Tres puntos) */}
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold text-white shadow-inner
                  ${slot.bloqueado ? 'bg-red-500' : 'bg-gradient-to-tr from-blue-600 to-indigo-500'}`}
                >
                  {slot.nombreCompleto.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 leading-tight">{slot.nombreCompleto}</h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">{slot.rolUsuario}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Credencial Login</p>
                <p className="font-mono text-sm font-bold text-gray-800">{slot.login}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  {slot.bloqueado ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      <ShieldAlert className="w-3.5 h-3.5" /> Bloqueado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" /> Activo
                    </span>
                  )}
                </div>
                
                <button 
                  title="Restablecer PIN"
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}