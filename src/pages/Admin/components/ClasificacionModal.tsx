import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Database, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { inventarioService } from '../../../api/inventario.service';
import { configuracionService } from '../../../api/configuracion.service';
import type { UnidadParametro } from '../../../types/inventario.types';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { SearchableSelect } from './FacturacionUtils';
import toast from 'react-hot-toast';

interface EstructuraPermitida {
  id: number;
  codigo: string;
  nombre: string;
}

interface ClasificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  onParametrosChange: () => void; 
}

export default function ClasificacionModal({ isOpen, onClose, empresaId, onParametrosChange }: ClasificacionModalProps) {
  // Estados de carga y catálogos
  const [estructuras, setEstructuras] = useState<EstructuraPermitida[]>([]);
  const [estructuraSelId, setEstructuraSelId] = useState<string>('');
  const [unidades, setUnidades] = useState<UnidadParametro[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstructuras, setLoadingEstructuras] = useState(true);

  // Formulario de nueva Unidad
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, nombre: '' });

  // 1. Cargar las Estructuras permitidas por la licencia
  useEffect(() => {
    if (isOpen) {
      setLoadingEstructuras(true);
      configuracionService.obtenerEstructurasPermitidas(empresaId)
        .then((data: EstructuraPermitida[]) => {
          setEstructuras(data);
          if (data.length > 0) {
            setEstructuraSelId(String(data[0].id)); // Seleccionamos la primera por defecto
          }
        })
        .catch(() => toast.error("Error al cargar configuración de la licencia"))
        .finally(() => setLoadingEstructuras(false));
    }
  }, [isOpen, empresaId]);

  const estructuraActiva = useMemo(() => 
    estructuras.find(e => String(e.id) === String(estructuraSelId)), 
  [estructuras, estructuraSelId]);

  // 2. Cargar las Unidades (valores) cuando se selecciona una Estructura
  useEffect(() => {
    if (isOpen && estructuraActiva) {
      setLoading(true);
      inventarioService.obtenerParametrosPorEstructura(estructuraActiva.codigo, empresaId)
        .then(setUnidades)
        .finally(() => setLoading(false));
    } else {
      setUnidades([]);
    }
  }, [estructuraActiva, isOpen, empresaId]);

  if (!isOpen) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estructuraActiva || !nuevoCodigo.trim() || !nuevoNombre.trim()) return;

    toast.promise(
      inventarioService.guardarParametro({
        codigo: nuevoCodigo.toUpperCase().replace(/\s/g, '_'),
        nombre: nuevoNombre.trim(),
        estructuraCodigo: estructuraActiva.codigo, 
        empresaId: empresaId 
      }),
      {
        loading: 'Guardando...',
        success: () => {
          // Refrescamos la lista de la estructura actual
          inventarioService.obtenerParametrosPorEstructura(estructuraActiva.codigo, empresaId).then(setUnidades);
          onParametrosChange(); 
          setNuevoCodigo('');
          setNuevoNombre('');
          return 'Unidad agregada correctamente';
        },
        error: 'Error al procesar el registro (Verifique que el código no esté repetido)'
      }
    );
  };

  const confirmarEliminacion = async () => {
    if(!estructuraActiva) return;
    toast.promise(
      inventarioService.eliminarParametro(confirmDialog.id),
      {
        loading: 'Eliminando...',
        success: () => {
          inventarioService.obtenerParametrosPorEstructura(estructuraActiva.codigo, empresaId).then(setUnidades);
          onParametrosChange();
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return 'Registro eliminado';
        },
        error: () => {
          setConfirmDialog({ isOpen: false, id: 0, nombre: '' });
          return "Denegado. Esta unidad ya está asignada a uno o más productos.";
        }
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-zinc-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[85vh]">
          
          <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
            <div>
              <h3 className="font-black text-zinc-900 text-xl flex items-center gap-2">
                <Database className="w-5 h-5 text-black" /> Configuración de Catálogos
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-1">Selecciona una estructura para gestionar sus unidades de valor.</p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {loadingEstructuras ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500 font-bold animate-pulse">
                Cargando esquema de la licencia...
              </div>
            ) : estructuras.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                 <AlertCircle className="w-12 h-12 mb-3 text-red-300" />
                 <p className="font-black text-lg text-zinc-600">No hay estructuras asignadas</p>
                 <p className="text-sm mt-1 max-w-xs text-center">Tu plan actual no incluye módulos de parametrización. Contacta a soporte.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                
                {/* PANEL IZQUIERDO: SELECTOR Y FORMULARIO */}
                <div className="w-full md:w-1/2 flex flex-col gap-6 shrink-0">
                  
                  {/* Buscador de Estructuras */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-sm">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2 block">1. Seleccionar Clasificación</label>
                    <SearchableSelect 
                      value={estructuraSelId} 
                      options={estructuras} 
                      onChange={(val) => setEstructuraSelId(String(val))}
                      placeholder="Buscar estructura..."
                      renderLabel={(opt: EstructuraPermitida) => opt.nombre}
                    />
                    {estructuraActiva && (
                      <p className="text-[9px] font-mono text-zinc-400 mt-2 font-bold flex items-center gap-1">
                        ID: {estructuraActiva.codigo}
                      </p>
                    )}
                  </div>

                  {/* Formulario de Creación de Unidades */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex-1">
                    {!estructuraActiva && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-500">Selecciona una estructura arriba</span>
                      </div>
                    )}
                    <h4 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-blue-600" /> Nueva Unidad
                    </h4>
                    <form onSubmit={handleGuardar} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Código Corto *</label>
                        <input 
                          required 
                          type="text" 
                          maxLength={10}
                          value={nuevoCodigo} 
                          onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                          placeholder="Ej: CERV, BOTELLA, LTR"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-black transition-all uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Nombre Descriptivo *</label>
                        <input 
                          required 
                          type="text" 
                          value={nuevoNombre} 
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          placeholder="Ej: Cervezas Nacionales"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                      <button type="submit" disabled={!nuevoCodigo || !nuevoNombre} className="w-full py-2.5 bg-black text-white font-bold rounded-xl text-sm hover:bg-zinc-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <CheckCircle2 className="w-4 h-4" /> Agregar a Catálogo
                      </button>
                    </form>
                  </div>
                </div>

                {/* PANEL DERECHO: LISTA DE UNIDADES */}
                <div className="w-full md:w-1/2 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100 bg-zinc-50 shrink-0">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest flex items-center justify-between">
                      <span>Valores Registrados</span>
                      <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md text-[9px]">{unidades.length}</span>
                    </h4>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading ? (
                      <div className="p-10 text-center text-zinc-400 font-bold animate-pulse text-sm">Sincronizando base de datos...</div>
                    ) : unidades.length === 0 ? (
                      <div className="p-10 text-center text-zinc-400 flex flex-col items-center">
                        <Database className="w-8 h-8 text-zinc-200 mb-2" />
                        <p className="text-sm font-bold">No hay registros creados.</p>
                        <p className="text-xs mt-1">Usa el formulario de la izquierda.</p>
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {unidades.map(item => (
                          <li key={item.id} className="flex justify-between items-center p-3 rounded-xl border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all group">
                            <div>
                              <p className="font-bold text-zinc-800 text-sm leading-tight">{item.nombre}</p>
                              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 font-bold">{item.codigo}</p>
                            </div>
                            <button onClick={() => setConfirmDialog({ isOpen: true, id: item.id, nombre: item.nombre })} className="text-zinc-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="Eliminar Unidad"
        message={`¿Seguro que deseas eliminar la unidad "${confirmDialog.nombre}"? Si hay productos usando esta clasificación, la operación será denegada por seguridad.`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, nombre: '' })}
        onConfirm={confirmarEliminacion}
      />
    </>
  );
}