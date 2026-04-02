import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, ShieldAlert, ShieldCheck, ShieldOff, UserCircle } from 'lucide-react';
import { personalService } from '../../api/personal.service';
import type { UsuarioSlot } from '../../types/personal.types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SlotModal from './components/SlotModal';

interface PersonalSlotsProps {
  empresaId: number;
}

const formInicial: UsuarioSlot = {
  nombreCompleto: '',
  login: '',
  password: ''
};

export default function PersonalSlots({ empresaId }: PersonalSlotsProps) {
  const [slots, setSlots] = useState<UsuarioSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<UsuarioSlot>(formInicial);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, nombre: '', isActivo: true });

  useEffect(() => {
    cargarSlots();
  }, [empresaId]);

  const cargarSlots = async () => {
    setLoading(true);
    try {
      const data = await personalService.obtenerSlotsPorEmpresa(empresaId);
      // El backend actualmente solo devuelve los activos por defecto (findByEmpresaIdAndEstado). 
      // Idealmente, el backend en la lista general debería devolver todos.
      setSlots(data);
    } catch (error) {
      console.error("Error al cargar personal", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarCambioEstado = async () => {
    try {
      await personalService.cambiarEstadoSlot(confirmDialog.id);
      cargarSlots();
      setConfirmDialog({ isOpen: false, id: 0, nombre: '', isActivo: true });
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  const slotsFiltrados = slots.filter(s => 
    (s.nombreCompleto || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (s.login || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Control de Personal
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona los usuarios y accesos a las tablets operativas.</p>
        </div>
        
        <button 
          onClick={() => { setSlotSeleccionado(formInicial); setIsModalOpen(true); }} 
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Personal
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por alias o credencial..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* GRID DE CARDS (Mucho más visual que una tabla para usuarios) */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando personal...</div>
      ) : slotsFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 font-bold">No hay personal registrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slotsFiltrados.map((slot) => {
            // Asumimos Activo si no viene el estado (por si el backend DTO antiguo no lo manda)
            const isActivo = slot.estado !== 'INACTIVO'; 
            
            return (
              <div key={slot.id} className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full ${!isActivo ? 'border-gray-200 opacity-60 grayscale' : 'border-gray-100'}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActivo ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <UserCircle className="w-7 h-7" />
                  </div>
                  
                  {/* Botones de acción rápidos */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSlotSeleccionado(slot); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setConfirmDialog({ isOpen: true, id: slot.id!, nombre: slot.nombreCompleto, isActivo })} 
                      className={`p-1.5 text-gray-400 rounded-md transition-colors ${isActivo ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-green-600 hover:bg-green-50'}`}
                      title={isActivo ? "Desactivar" : "Reactivar"}
                    >
                      {isActivo ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{slot.nombreCompleto}</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">ROL: {slot.rolUsuario || 'OPERATIVO'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isActivo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-mono font-bold text-gray-600">{slot.login}</span>
                  </div>
                  {!isActivo && <ShieldAlert className="w-4 h-4 text-red-500" title="Cuenta Inactiva" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Componentes Refactorizados */}
      <SlotModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        empresaId={empresaId} 
        slotInicial={slotSeleccionado} 
        onGuardadoExitoso={cargarSlots} 
      />

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={`${confirmDialog.isActivo ? 'Revocar' : 'Restaurar'} Acceso`}
        message={`¿Estás seguro que deseas ${confirmDialog.isActivo ? 'desactivar' : 'reactivar'} al usuario "${confirmDialog.nombre}"? ${confirmDialog.isActivo ? 'Ya no podrá ingresar el PIN en la tablet.' : 'Volverá a tener acceso al sistema.'}`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, nombre: '', isActivo: true })}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}