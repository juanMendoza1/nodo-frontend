import React, { useState, useEffect } from 'react';
import { X, UserCircle, KeyRound, Info } from 'lucide-react';
import { personalService } from '../../../api/personal.service';
import type { UsuarioSlot } from '../../../types/personal.types';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  slotInicial: UsuarioSlot;
  onGuardadoExitoso: () => void;
}

export default function SlotModal({ isOpen, onClose, empresaId, slotInicial, onGuardadoExitoso }: SlotModalProps) {
  const [formData, setFormData] = useState<UsuarioSlot>(slotInicial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(slotInicial);
  }, [slotInicial, isOpen]);

  if (!isOpen) return null;

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Si es un slot nuevo, sugerimos el login basado en el alias
    if (!formData.id) {
      const suggestedLogin = val.trim().toUpperCase().replace(/\s+/g, '_');
      setFormData({ ...formData, nombreCompleto: val, login: suggestedLogin });
    } else {
      setFormData({ ...formData, nombreCompleto: val });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id && (!formData.password || formData.password.length < 4)) {
      alert("El PIN debe tener 4 dígitos.");
      return;
    }
    
    try {
      setSaving(true);
      await personalService.guardarSlot(empresaId, formData);
      onGuardadoExitoso();
      onClose();
    } catch (error) {
      alert("Error al guardar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            {formData.id ? 'Editar Personal' : 'Nuevo Personal'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">ALIAS (NOMBRE EN TABLET)</label>
              <input 
                required 
                type="text" 
                value={formData.nombreCompleto} 
                onChange={handleAliasChange} 
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase" 
                placeholder="Ej: MESERO ALEJO" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">CREDENCIAL (LOGIN)</label>
              <div className="relative">
                <input 
                  required 
                  name="login"
                  type="text" 
                  value={formData.login} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none font-mono text-gray-700 uppercase" 
                  placeholder="Ej: M1_ALEJO" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                  <Info className="w-4 h-4 text-gray-400" />
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-[10px] p-2 rounded-md shadow-lg z-10">
                    Es el usuario con el que se identifica el sistema. No puede repetirse.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {formData.id ? 'NUEVO PIN (Opcional)' : 'PIN DE ACCESO (4 DÍGITOS)'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input 
                  required={!formData.id} 
                  type="password" 
                  maxLength={4}
                  value={formData.password || ''} 
                  onChange={(e) => setFormData({...formData, password: e.target.value.replace(/[^0-9]/g, '')})} 
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none font-mono tracking-[0.5em] text-lg" 
                  placeholder="****" 
                />
              </div>
              {formData.id && <p className="text-[10px] text-gray-500 mt-1">Déjalo en blanco para conservar el PIN actual.</p>}
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Personal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}