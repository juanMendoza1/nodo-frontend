import React, { useState } from 'react';
import { Layers, X, Check, Trash2 } from 'lucide-react';
import { inventarioService } from '../../../api/inventario.service';
import type { UnidadParametro } from '../../../types/inventario.types';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

interface ParametrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: UnidadParametro[];
  unidades: UnidadParametro[];
  onParametrosChange: () => void; // Para avisarle al padre que recargue
}

export default function ParametrosModal({ isOpen, onClose, categorias, unidades, onParametrosChange }: ParametrosModalProps) {
  const [estructuraActiva, setEstructuraActiva] = useState('CAT_PROD');
  const [nuevoParametro, setNuevoParametro] = useState({ nombre: '', codigo: '' });
  
  // Estado para confirmación local de este modal
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, nombre: '' });

  if (!isOpen) return null;

  const handleParametroNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNuevoParametro({
      nombre: val,
      codigo: val.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
    });
  };

  const handleGuardarParametro = async () => {
    if (!nuevoParametro.nombre.trim() || !nuevoParametro.codigo.trim()) {
      alert("Por favor ingrese el código y el nombre.");
      return;
    }
    try {
      await inventarioService.guardarParametro({
        codigo: nuevoParametro.codigo.toUpperCase(),
        nombre: nuevoParametro.nombre,
        estructuraCodigo: estructuraActiva
      });
      onParametrosChange(); 
      setNuevoParametro({ nombre: '', codigo: '' });
    } catch (err: any) {
      alert("Error al guardar el parámetro. Es posible que el código ya exista.");
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await inventarioService.eliminarParametro(confirmDialog.id);
      onParametrosChange();
      setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al eliminar. Es posible que esté en uso.");
      setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
    }
  };

  const parametrosActuales = estructuraActiva === 'CAT_PROD' ? categorias : unidades;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">Configuración de Parámetros</h3>
              <p className="text-xs text-gray-500 mt-1">Gestiona las listas desplegables del sistema.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 bg-gray-50/50">
            <div className="flex bg-gray-200/70 p-1 rounded-lg mb-6">
              <button onClick={() => setEstructuraActiva('CAT_PROD')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${estructuraActiva === 'CAT_PROD' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Categorías ({categorias.length})
              </button>
              <button onClick={() => setEstructuraActiva('UNI_MED')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${estructuraActiva === 'UNI_MED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Medidas ({unidades.length})
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <p className="text-xs font-bold text-gray-700 mb-3">NUEVO REGISTRO</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input type="text" placeholder="Nombre (Ej: Bebidas)" value={nuevoParametro.nombre} onChange={handleParametroNombreChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"/>
                </div>
                <div className="w-24">
                  <input type="text" placeholder="CÓDIGO" value={nuevoParametro.codigo} maxLength={5} onChange={(e) => setNuevoParametro({...nuevoParametro, codigo: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-shadow font-mono uppercase"/>
                </div>
                <button onClick={handleGuardarParametro} className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors">
                  Agregar
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-52 overflow-y-auto">
                {parametrosActuales.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Layers className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-medium">No hay registros configurados.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {parametrosActuales.map(item => (
                      <li key={item.id} className="flex justify-between items-center p-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{item.nombre}</p>
                            <p className="text-[10px] font-mono text-gray-400">COD: {item.codigo}</p>
                          </div>
                        </div>
                        <button onClick={() => setConfirmDialog({ isOpen: true, id: item.id!, nombre: item.nombre })} className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
             <button onClick={onClose} className="px-5 py-2 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-black transition-colors">
                Cerrar
              </button>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="Eliminar Parámetro"
        message={`¿Estás seguro que deseas eliminar "${confirmDialog.nombre}"? Si ya está en uso, el sistema bloqueará la acción.`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, nombre: '' })}
        onConfirm={confirmarEliminacion}
      />
    </>
  );
}