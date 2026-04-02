import React, { useState, useEffect } from 'react';
import { 
  MonitorSmartphone, 
  Plus, 
  QrCode, 
  Wifi, 
  WifiOff, 
  MoreVertical, 
  Tablet, 
  X,
  RefreshCw,
  ShieldCheck,
  ServerCrash
} from 'lucide-react';
import { terminalesService } from '../../api/terminales.service';
import type { Terminal } from '../../types/terminales.types';

interface TerminalesProps {
  empresaId: number;
}

export default function Terminales({ empresaId }: TerminalesProps) {
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorBackend, setErrorBackend] = useState(false);
  
  // Estados para el Modal del QR
  const [modalOpen, setModalOpen] = useState(false);
  const [terminalActiva, setTerminalActiva] = useState<Terminal | null>(null);
  
  // Aquí guardaremos el token que devuelve tu Spring Boot
  const [tokenQr, setTokenQr] = useState<string | null>(null); 
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    cargarTerminales();
  }, [empresaId]);

  const cargarTerminales = async () => {
    try {
      setLoading(true);
      setErrorBackend(false);
      const data = await terminalesService.obtenerTerminales(empresaId);
      setTerminales(data);
    } catch (error: any) {
      console.error("Error al cargar terminales", error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        setErrorBackend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const abrirModalQr = async () => {
    setModalOpen(true);
    setLoadingQr(true);
    setTokenQr(null);
    
    try {
      // Llamada REAL a tu backend usando el programaCod 'POS' por defecto (o cámbialo si usas otro)
      const tokenDesdeBackend = await terminalesService.generarQrActivacion(empresaId, 'POS');
      setTokenQr(tokenDesdeBackend);
    } catch (error) {
      console.error("Error generando token en el backend", error);
      alert("Hubo un error al generar el token de autorización.");
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MonitorSmartphone className="w-6 h-6 text-emerald-600" />
            Terminales y Dispositivos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona las tablets operativas, visualiza su estado y genera códigos QR de acceso.
          </p>
        </div>
        
        {/* Este botón ahora dispara la creación del QR para una NUEVA tablet */}
        <button 
          onClick={abrirModalQr}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Nueva Terminal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Sincronizando dispositivos...</div>
      ) : errorBackend ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-red-100 shadow-sm">
          <ServerCrash className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-bold text-lg">Endpoint No Encontrado</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Por favor, asegúrate de haber agregado el endpoint <b>@GetMapping("/empresa/&#123;empresaId&#125;")</b> en tu controlador de Java y de reiniciar Spring Boot.
          </p>
        </div>
      ) : terminales.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Tablet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold mb-2">No tienes terminales registradas.</p>
          <button onClick={abrirModalQr} className="text-blue-600 font-bold text-sm hover:underline">
            Haz clic aquí para generar el primer QR de vinculación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {terminales.map((terminal) => (
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
                <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{terminal.nombre}</h3>
                <p className="text-xs font-mono font-bold text-gray-400 mt-1 uppercase">UUID: {terminal.codigo?.substring(0, 8)}...</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    Conexión
                  </span>
                  <span className="text-xs font-bold text-gray-900">Vinculada</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DEL CÓDIGO QR GENERADO POR EL BACKEND */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900">Vincular Nueva Terminal</h3>
              <button onClick={() => { setModalOpen(false); setTokenQr(null); }} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8 text-center">
              <p className="text-xs text-gray-500 font-medium mb-6">Escanea este código desde la cámara de la tablet para vincularla a este negocio.</p>
              
              <div className="mx-auto w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden group">
                {loadingQr ? (
                  <div className="flex flex-col items-center text-blue-600">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs font-bold text-gray-500">Solicitando Token al Backend...</span>
                  </div>
                ) : tokenQr ? (
                  <>
                    {/* ESTA IMAGEN CONVIERTE TU TOKEN EN UN QR REAL */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tokenQr)}`} 
                      alt="QR Vinculación" 
                      className="w-36 h-36"
                    />
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_3px_rgba(52,211,153,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </>
                ) : (
                  <span className="text-red-500 font-bold text-xs">Error al generar</span>
                )}
              </div>

              {!loadingQr && tokenQr && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Token Generado Exitosamente</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium">Válido por 10 minutos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes scan { 0% { transform: translateY(-10px); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(192px); opacity: 0; } }`}</style>
    </div>
  );
}