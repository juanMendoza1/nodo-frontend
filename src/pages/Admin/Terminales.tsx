// src/pages/Admin/Terminales.tsx
import React, { useState, useEffect } from 'react';
import { 
  MonitorSmartphone, Plus, Wifi, MoreVertical, Tablet, X,
  RefreshCw, ServerCrash, CreditCard, CheckCircle2, Cpu
} from 'lucide-react';
import { terminalesService } from '../../api/terminales.service';
import type { Terminal } from '../../types/terminales.types';

interface TerminalesProps {
  empresaId: number;
}

export default function Terminales({ empresaId }: TerminalesProps) {
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  
  // 🔥 ESTADOS DINÁMICOS PARA PROGRAMAS
  const [programas, setProgramas] = useState<any[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [errorBackend, setErrorBackend] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenQr, setTokenQr] = useState<string | null>(null); 
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [empresaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorBackend(false);
      
      const [dataTerminales, dataCupos] = await Promise.all([
        terminalesService.obtenerTerminales(empresaId),
        terminalesService.obtenerCuposEmpresa(empresaId) // 🔥 Llama al nuevo endpoint
      ]);

      setTerminales(dataTerminales);
      setProgramas(dataCupos);
      
      // Si tiene programas, seleccionamos el primero por defecto
      if (dataCupos.length > 0 && !programaSeleccionado) {
        setProgramaSeleccionado(dataCupos[0].programaCod);
      }
    } catch (error: any) {
      console.error("Error al cargar datos de terminales", error);
      setErrorBackend(true);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalQr = async () => {
    if (!programaSeleccionado) return;
    
    setModalOpen(true);
    setLoadingQr(true);
    setTokenQr(null);
    
    try {
      // 🔥 Pasamos el programa dinámico
      const tokenDesdeBackend = await terminalesService.generarQrActivacion(empresaId, programaSeleccionado);
      setTokenQr(tokenDesdeBackend);
    } catch (error) {
      console.error("Error generando token", error);
      alert("Hubo un error al generar el token de autorización o no hay cupos.");
      setModalOpen(false);
    } finally {
      setLoadingQr(false);
    }
  };

  // Buscamos los cupos del programa actualmente seleccionado en la UI
  const cuposActuales = programas.find(p => p.programaCod === programaSeleccionado) || { maxDispositivos: 0, dispositivosActivos: 0, disponibles: 0 };
  const tieneCupo = cuposActuales.disponibles > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MonitorSmartphone className="w-6 h-6 text-emerald-600" />
            Terminales y Dispositivos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona las tablets operativas y controla tus licencias por módulo.
          </p>
        </div>
        
        {/* 🔥 SELECTOR DINÁMICO DE PROGRAMA Y BOTONERA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {programas.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <Cpu className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select 
                value={programaSeleccionado}
                onChange={(e) => setProgramaSeleccionado(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none shadow-sm cursor-pointer"
              >
                {programas.map(p => (
                  <option key={p.programaCod} value={p.programaCod}>
                    Módulo: {p.programaNombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {programas.length === 0 ? (
             <div className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
               No hay suscripciones
             </div>
          ) : tieneCupo ? (
            <button 
              onClick={abrirModalQr}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" /> Registrar Terminal
            </button>
          ) : (
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200 w-full sm:w-auto">
              <span className="flex items-center px-4 py-2 text-sm font-bold text-gray-400 cursor-not-allowed">
                Sin cupos
              </span>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg shadow-sm hover:text-blue-700 transition-all border border-gray-200">
                <CreditCard className="w-4 h-4" /> Ampliar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INDICADORES DE CUPOS DINÁMICOS */}
      {!errorBackend && !loading && programas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Licencias</p>
              <p className="text-3xl font-extrabold text-gray-900">{cuposActuales.maxDispositivos}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <MonitorSmartphone className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Equipos en Uso</p>
              <p className="text-3xl font-extrabold text-blue-600">{cuposActuales.dispositivosActivos}</p>
            </div>
          </div>

          <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between relative overflow-hidden ${tieneCupo ? 'border-emerald-100' : 'border-red-100'}`}>
             <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -z-0 ${tieneCupo ? 'bg-emerald-50' : 'bg-red-50'}`}></div>
            <div className="relative z-10">
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${tieneCupo ? 'text-emerald-500' : 'text-red-500'}`}>Cupos Libres</p>
              <p className={`text-3xl font-extrabold ${tieneCupo ? 'text-emerald-600' : 'text-red-600'}`}>{cuposActuales.disponibles}</p>
            </div>
             <div className="relative z-10">
               {tieneCupo ? <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" /> : <X className="w-8 h-8 text-red-400 opacity-50" />}
             </div>
          </div>
        </div>
      )}

      {/* ESTADO DE CARGA O ERROR */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando infraestructura...</div>
      ) : errorBackend ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-red-100 shadow-sm">
          <ServerCrash className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-bold text-lg">Error de conexión</p>
        </div>
      ) : programas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
          <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold mb-2 text-lg">No tienes módulos contratados.</p>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Contacta al SuperAdmin para que te asigne una licencia de sistema (Ej. Punto de Venta o Inventario).
          </p>
        </div>
      ) : terminales.filter(t => t.programa?.codigo === programaSeleccionado).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Tablet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold mb-2">No tienes terminales registradas en este módulo.</p>
          {tieneCupo && (
             <button onClick={abrirModalQr} className="text-emerald-600 font-bold text-sm hover:underline">
               Haz clic aquí para vincular tu primer equipo
             </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {terminales.filter(t => t.programa?.codigo === programaSeleccionado).map((terminal: any) => (
            <div key={terminal.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <Tablet className="w-6 h-6" />
                </div>
                <button className="text-gray-400 hover:text-gray-900 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 mb-4">
                <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{terminal.alias || 'Terminal Genérica'}</h3>
                <p className="text-xs font-mono font-bold text-gray-400 mt-1 uppercase">ID: {terminal.uuidHardware?.substring(0, 8)}...</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Wifi className={`w-3.5 h-3.5 ${terminal.bloqueado ? 'text-red-500' : 'text-emerald-500'}`} />
                    Estado
                  </span>
                  <span className={`text-xs font-bold ${terminal.bloqueado ? 'text-red-600' : 'text-gray-900'}`}>
                    {terminal.bloqueado ? 'Bloqueada' : 'Operativa'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DEL QR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900">Vincular Terminal</h3>
              <button onClick={() => { setModalOpen(false); setTokenQr(null); cargarDatos(); }} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 text-center">
              <p className="text-xs text-gray-500 font-medium mb-6">Escanea este código desde la App TPV Nodo para enlazar la tablet al módulo <strong className="text-gray-900">{programaSeleccionado}</strong>.</p>
              
              <div className="mx-auto w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
                {loadingQr ? (
                  <div className="flex flex-col items-center text-emerald-600">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs font-bold text-gray-500">Generando Token...</span>
                  </div>
                ) : tokenQr ? (
                  <>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tokenQr)}`} alt="QR" className="w-36 h-36"/>
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_3px_rgba(52,211,153,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </>
                ) : (
                  <span className="text-red-500 font-bold text-xs">Error al generar</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes scan { 0% { transform: translateY(-10px); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(192px); opacity: 0; } }`}</style>
    </div>
  );
}