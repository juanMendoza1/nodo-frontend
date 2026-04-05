import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Gamepad2, Timer, ShieldCheck, Beer, 
  Plus, ShoppingCart, Send, Zap, RefreshCw, 
  Store, Users, UserCircle2
} from 'lucide-react';
import type { MesaDTO } from '../CompanyDashboard';
import api from '../../../api/axios.config'; 

interface MesaControlPanelProps {
  mesa: MesaDTO;
  empresaId: number;
  onClose: () => void;
  refreshTrigger?: number; 
}

export default function MesaControlPanel({ mesa, empresaId, onClose, refreshTrigger }: MesaControlPanelProps) {
  const isOcupada = mesa.estado === 'OCUPADA' || mesa.estado === 'ABIERTO';
  const isJuego = ['POOL', '3BANDAS'].includes(mesa.tipoJuego?.toUpperCase() || '');

  const [cuenta, setCuenta] = useState<any[]>([]);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

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
      const logs = response.data; 

      let cuentaCalculada: any[] = [];
      let mapClientes = new Map<string, string>(); 
      let eventosProcesados = new Set<string>(); 

      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];

        if (eventosProcesados.has(log.eventoId)) continue;
        eventosProcesados.add(log.eventoId);

        if (log.tipoEvento === 'MESA_CERRADA' || log.tipoEvento === 'MESA_CREADA') {
          cuentaCalculada = [];
          mapClientes.clear();
          continue; 
        }

        if (log.detallesJson) {
          const data = JSON.parse(log.detallesJson);

          // 1. ESTANDARIZADO: Solo escuchamos CLIENTE_NUEVO
          if (log.tipoEvento === 'CLIENTE_NUEVO' && (data.nombreCliente || data.nombre)) {
            const n = data.nombreCliente || data.nombre;
            mapClientes.set(n, n);
          }

          // 2. ESTANDARIZADO: Solo escuchamos DUELO_INICIADO
          if (log.tipoEvento === 'DUELO_INICIADO' && data.jugadores) {
            data.jugadores.forEach((j: any) => mapClientes.set(j.nombre, j.nombre));
          }

          // 3. ESTANDARIZADO: Solo escuchamos DESPACHO_MESA (Aplica para duelo y pedido directo)
          if (log.tipoEvento === 'DESPACHO_MESA') {
            if (data.productos && Array.isArray(data.productos)) {
              data.productos.forEach((p: any) => {
                const cant = Number(p.cantidad) || 1;
                const prec = Number(p.precio) || 0;
                const existe = cuentaCalculada.find(x => x.nombre === p.nombre);
                if (existe) existe.cantidad += cant;
                else cuentaCalculada.push({ nombre: p.nombre, precio: prec, cantidad: cant });
              });
            } else if (data.nombre && data.precio) {
                const cant = Number(data.cantidad) || 1;
                const prec = Number(data.precio) || 0;
                const existe = cuentaCalculada.find(x => x.nombre === data.nombre);
                if (existe) existe.cantidad += cant;
                else cuentaCalculada.push({ nombre: data.nombre, precio: prec, cantidad: cant });
            }
          }
        }
      }
      
      setCuenta(cuentaCalculada.reverse());
      setJugadores(Array.from(mapClientes.values()).map(nombre => ({ nombre })));

    } catch (error) {
      console.error("Error cargando la cuenta:", error);
    } finally {
      setCargando(false);
    }
  }, [empresaId, mesa.idMesaLocal]);

  useEffect(() => {
    cargarCuentaDeLaMesa();
  }, [cargarCuentaDeLaMesa, refreshTrigger]);

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
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isJuego ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${isJuego ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
              </span>}
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Centro de Control de Servicio</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Operario a Cargo</p>
             <p className="text-white font-extrabold">{mesa.usuarioActual?.alias || 'Sistema Central'}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6 text-emerald-400" />
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex bg-slate-900">
        <div className="w-1/4 p-6 border-r border-slate-800 overflow-y-auto bg-slate-900">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2 mb-6 uppercase tracking-wider">
            {isJuego ? <Gamepad2 className="text-indigo-400" /> : <Store className="text-emerald-400" />}
            {isJuego ? 'Estado del Juego' : 'Mesa Servicio'}
          </h2>

          {mesa.estado !== 'DISPONIBLE' ? (
            <div className="space-y-5">
              {isJuego && (
                <>
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-inner">
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Modalidad</p>
                     <p className="text-2xl font-black text-white">{mesa.tipoJuego}</p>
                  </div>
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-inner">
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Regla de Cobro</p>
                     <p className="text-lg font-bold text-indigo-300">{mesa.reglaDuelo?.replace(/_/g, ' ') || 'ESTÁNDAR'}</p>
                  </div>
                </>
              )}

              <div className={`rounded-2xl p-4 border ${isJuego ? 'bg-indigo-950/30 border-indigo-900/50' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isJuego ? 'text-indigo-400/70' : 'text-slate-400'}`}>Inicio de Sesión</p>
                  <Timer className={`w-4 h-4 ${isJuego ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                </div>
                <p className="text-xl font-mono font-black text-white">
                  {mesa.fechaApertura ? new Date(mesa.fechaApertura).toLocaleTimeString() : 'En espera...'}
                </p>
              </div>

              {jugadores.length > 0 && (
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mt-6">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Personas en Mesa
                  </p>
                  <div className="flex flex-col gap-2">
                    {jugadores.map((j, i) => (
                      <span key={i} className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-2">
                         <UserCircle2 className="w-4 h-4 text-emerald-500"/> {j.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 opacity-50">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">Mesa Libre</p>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col bg-slate-950 shadow-2xl z-10 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
              <ShoppingCart className="text-emerald-400" /> Factura Abierta
            </h2>
            <button onClick={cargarCuentaDeLaMesa} className="text-slate-500 hover:text-white transition-colors">
              <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {cargando && cuenta.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <RefreshCw className="w-8 h-8 mb-4 animate-spin text-slate-500" />
                <p className="font-bold">Sincronizando caja negra...</p>
              </div>
            ) : cuenta.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Beer className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">No hay consumos registrados.</p>
              </div>
            ) : (
              cuenta.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-slate-600">
                      {item.cantidad}
                    </div>
                    <div>
                      <p className="text-white font-bold">{item.nombre}</p>
                      <p className="text-slate-400 text-xs">${item.precio?.toLocaleString()} c/u</p>
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

        <div className="w-1/3 p-6 border-l border-slate-800 overflow-y-auto bg-slate-900">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2 mb-6">
            <Send className="text-amber-400" /> Despacho Remoto
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Despacha productos desde el administrador. Aparecerán en la Tablet del operario.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {catalogo.map(prod => (
              <button 
                key={prod.id}
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