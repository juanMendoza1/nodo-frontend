import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Gamepad2, Timer, ShieldCheck, Beer, 
  Plus, ShoppingCart, Send, Clock, Zap, RefreshCw
} from 'lucide-react';
import type { MesaDTO } from '../CompanyDashboard';
import { inventarioService } from '../../../api/inventario.service'; // Importa tu servicio

interface MesaControlPanelProps {
  mesa: MesaDTO;
  empresaId: number;
  onClose: () => void;
  // Añadimos un trigger para que el panel sepa que hubo un WebSocket nuevo
  refreshTrigger?: number; 
}

export default function MesaControlPanel({ mesa, empresaId, onClose, refreshTrigger }: MesaControlPanelProps) {
  const isOcupada = mesa.estado === 'OCUPADA';
  const isPool = mesa.tipoJuego === 'POOL';

  const [cuenta, setCuenta] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Catálogo estático temporal (Pronto lo conectaremos al backend también)
  const [catalogo] = useState([
    { id: 1, nombre: 'Cerveza Club Colombia', precio: 5000 },
    { id: 2, nombre: 'Gatorade Azul', precio: 3500 },
    { id: 3, nombre: 'Paquete de Papas Limón', precio: 2000 },
    { id: 4, nombre: 'Agua Manantial con Gas', precio: 2500 }
  ]);

  const cargarCuentaDeLaMesa = useCallback(async () => {
    setCargando(true);
    try {
      const response = await api.get(`/api/mesas/empresa/${empresaId}/mesa/${mesa.idMesaLocal}/actividad`);
      const logs = response.data; // Lista de actividades

      let cuentaCalculada: any[] = [];
      let actividadesRecientes: any[] = [];

      // Recorremos los eventos de lo más nuevo a lo más viejo
      for (const log of logs) {
        // Si llegamos al momento en que la mesa se cerró anteriormente o se creó, detenemos la lectura
        if (log.tipoEvento === 'MESA_CERRADA' || log.tipoEvento === 'MESA_CREADA') {
          break; 
        }
        
        actividadesRecientes.push(log);

        // Si es una venta, extraemos los productos y los sumamos a la factura visual
        if (log.tipoEvento === 'DESPACHO_MESA' && log.detallesJson) {
          const data = JSON.parse(log.detallesJson);
          if (data.productos && Array.isArray(data.productos)) {
            data.productos.forEach((p: any) => {
              const existe = cuentaCalculada.find(x => x.nombre === p.nombre);
              if (existe) {
                existe.cantidad += p.cantidad;
              } else {
                cuentaCalculada.push({ ...p });
              }
            });
          }
        }
      }
      
      setCuenta(cuentaCalculada);
      // Opcional: Podrías crear un estado setHistorial(actividadesRecientes) para mostrar una tabla de logs en el futuro

    } catch (error) {
      console.error("Error cargando la cuenta:", error);
    } finally {
      setCargando(false);
    }
  }, [empresaId, mesa.idMesaLocal]);

  // Se recarga cuando se abre el panel o cuando llega un WebSocket (refreshTrigger cambia)
  useEffect(() => {
    cargarCuentaDeLaMesa();
  }, [cargarCuentaDeLaMesa, refreshTrigger]);


  const handleDespachar = (producto: any) => {
    // TODO: Enviar petición POST al backend para agregar a la mesa (y que el backend mande WS a la tablet)
    setCuenta(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const totalCuenta = cuenta.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 animate-in slide-in-from-right duration-300 flex flex-col">
      
      <header className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
              MESA {String(mesa.idMesaLocal).padStart(2, '0')}
              {isOcupada && <span className="flex h-4 w-4 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPool ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${isPool ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              </span>}
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Centro de Control Unificado</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Operario a Cargo</p>
             <p className="text-white font-extrabold">{mesa.usuarioActual?.alias || 'Sistema Central'}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6 text-blue-400" />
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex bg-slate-900">
        
        {/* COLUMNA IZQUIERDA: ADN DEL JUEGO */}
        <div className="w-1/4 p-6 border-r border-slate-800 overflow-y-auto bg-slate-900">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2 mb-6">
            <Gamepad2 className="text-indigo-400" /> Estado del Juego
          </h2>

          {mesa.estado !== 'DISPONIBLE' ? (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-inner">
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Modalidad</p>
                 <p className="text-2xl font-black text-white">{mesa.tipoJuego || 'N/A'}</p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-inner">
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Regla de Cobro</p>
                 <p className="text-xl font-bold text-indigo-300">{mesa.reglaDuelo?.replace(/_/g, ' ') || 'ESTÁNDAR'}</p>
              </div>

              {isOcupada && (
                <div className="bg-emerald-950/30 rounded-2xl p-5 border border-emerald-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest">Reloj de Sesión</p>
                    <Timer className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-3xl font-mono font-black text-emerald-400">En Curso...</p>
                  <p className="text-slate-400 text-xs mt-2 font-bold">
                    Inició: {mesa.fechaApertura ? new Date(mesa.fechaApertura).toLocaleTimeString() : ''}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 opacity-50">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">Mesa Apagada</p>
            </div>
          )}
        </div>

        {/* COLUMNA CENTRAL: LA CUENTA DE LA MESA */}
        <div className="flex-1 p-6 flex flex-col bg-slate-950 shadow-2xl z-10 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
              <ShoppingCart className="text-emerald-400" /> Cuenta Abierta
            </h2>
            <button onClick={cargarCuentaDeLaMesa} className="text-slate-500 hover:text-white transition-colors">
              <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {cargando && cuenta.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <RefreshCw className="w-8 h-8 mb-4 animate-spin text-slate-500" />
                <p className="font-bold">Sincronizando cuenta con la base de datos...</p>
              </div>
            ) : cuenta.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Beer className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">No hay consumos registrados aún.</p>
              </div>
            ) : (
              cuenta.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-slate-600">
                      {item.cantidad}
                    </div>
                    <div>
                      <p className="text-white font-bold">{item.nombre}</p>
                      <p className="text-slate-400 text-xs">${item.precio.toLocaleString()} c/u</p>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-black text-lg">
                    ${(item.precio * item.cantidad).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-end mb-4">
              <p className="text-slate-400 font-bold uppercase tracking-widest">Total Consumo</p>
              <p className="text-4xl font-black text-white">${totalCuenta.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CATÁLOGO DE DESPACHO RÁPIDO */}
        <div className="w-1/3 p-6 border-l border-slate-800 overflow-y-auto bg-slate-900">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2 mb-6">
            <Send className="text-amber-400" /> Despacho Web
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Despacha productos desde el administrador. Aparecerán en la Tablet del mesero al instante.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {catalogo.map(prod => (
              <button 
                key={prod.id}
                onClick={() => handleDespachar(prod)}
                className="flex flex-col items-start p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-2xl transition-all group text-left"
              >
                <span className="text-white font-bold text-sm mb-2 line-clamp-2">{prod.nombre}</span>
                <span className="text-amber-400 font-black mt-auto">${prod.precio.toLocaleString()}</span>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}