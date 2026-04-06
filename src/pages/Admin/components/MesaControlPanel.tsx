import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Gamepad2, Timer, ShieldCheck, Beer, 
  ShoppingCart, Zap, RefreshCw, Store, Users, 
  UserCircle2, MoreVertical, Swords
} from 'lucide-react';
import type { MesaDTO } from '../CompanyDashboard';
import api from '../../../api/axios.config'; 

interface MesaControlPanelProps {
  mesa: MesaDTO;
  empresaId: number;
  onClose: () => void;
  refreshTrigger?: number; 
}

interface Consumo {
  nombre: string;
  precio: number;
  cantidad: number;
}

interface ClienteState {
  nombre: string;
  consumos: Consumo[];
  subtotal: number;
}

interface DueloState {
  activo: boolean;
  modalidad: string;
  regla: string;
  jugadores: string[];
}

export default function MesaControlPanel({ mesa, empresaId, onClose, refreshTrigger }: MesaControlPanelProps) {
  const isOcupada = mesa.estado === 'OCUPADA' || mesa.estado === 'ABIERTO';
  const isJuego = ['POOL', '3BANDAS'].includes(mesa.tipoJuego?.toUpperCase() || '');

  const [cargando, setCargando] = useState(true);
  
  // Estados Estructurados por Entidades
  const [consumosMesa, setConsumosMesa] = useState<Consumo[]>([]); 
  const [clientesMap, setClientesMap] = useState<Map<string, ClienteState>>(new Map());
  const [dueloInfo, setDueloInfo] = useState<DueloState>({ activo: false, modalidad: '', regla: '', jugadores: [] });

  const cargarCuentaDeLaMesa = useCallback(async () => {
    setCargando(true);
    try {
      const response = await api.get(`/api/mesas/empresa/${empresaId}/mesa/${mesa.idMesaLocal}/actividad`);
      const logs = response.data; 

      let calcConsumosMesa: Consumo[] = [];
      let calcClientes = new Map<string, ClienteState>(); 
      let calcDuelo: DueloState = { activo: false, modalidad: '', regla: '', jugadores: [] };
      let eventosProcesados = new Set<string>(); 

      const agregarProducto = (targetArray: Consumo[], p: any) => {
        const cant = Number(p.cantidad) || 1;
        const prec = Number(p.precio) || 0;
        const existe = targetArray.find(x => x.nombre === p.nombre);
        if (existe) {
            existe.cantidad += cant;
        } else {
            targetArray.push({ nombre: p.nombre, precio: prec, cantidad: cant });
        }
      };

      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];

        if (eventosProcesados.has(log.eventoId)) continue;
        eventosProcesados.add(log.eventoId);

        if (log.tipoEvento === 'MESA_CERRADA' || log.tipoEvento === 'MESA_CREADA') {
          calcConsumosMesa = [];
          calcClientes.clear();
          calcDuelo = { activo: false, modalidad: '', regla: '', jugadores: [] };
          continue; 
        }

        if (log.detallesJson) {
          const data = JSON.parse(log.detallesJson);

          // 1. Detección de Clientes en la mesa
          if (['CLIENTE_NUEVO', 'CLIENTE_CREADO'].includes(log.tipoEvento) && (data.nombreCliente || data.nombre)) {
            const n = data.nombreCliente || data.nombre;
            if (!calcClientes.has(n)) {
                calcClientes.set(n, { nombre: n, consumos: [], subtotal: 0 });
            }
          }

          // 2. Detección de Duelos (Unión de Equipos/Jugadores)
          if (['DUELO_INICIADO', 'DUELO_POOL_INICIADO'].includes(log.tipoEvento)) {
            calcDuelo = {
                activo: true,
                modalidad: data.modalidad || mesa.tipoJuego || 'DUELO',
                regla: data.reglaCobro || mesa.reglaDuelo || 'ESTANDAR',
                jugadores: data.jugadores ? data.jugadores.map((j:any) => j.nombre) : []
            };
            // Aseguramos que los jugadores del duelo existan como CardViews de clientes
            calcDuelo.jugadores.forEach(jName => {
                if (!calcClientes.has(jName)) calcClientes.set(jName, { nombre: jName, consumos: [], subtotal: 0 });
            });
          }

          if (['DUELO_FINALIZADO', 'DUELO_TERMINADO'].includes(log.tipoEvento)) {
             calcDuelo.activo = false; 
          }

          // 3. Enlace de Consumos a las CardViews
          if (['DESPACHO_MESA', 'PEDIDO_DIRECTO', 'DESPACHO'].includes(log.tipoEvento)) {
            const clienteAsignado = data.clienteNombre || data.nombreCliente || data.nombreJugador;
            
            if (clienteAsignado && !calcClientes.has(clienteAsignado)) {
                calcClientes.set(clienteAsignado, { nombre: clienteAsignado, consumos: [], subtotal: 0 });
            }

            const targetArray = clienteAsignado ? calcClientes.get(clienteAsignado)!.consumos : calcConsumosMesa;

            if (data.productos && Array.isArray(data.productos)) {
              data.productos.forEach((p: any) => agregarProducto(targetArray, p));
            } else if (data.nombre && data.precio) {
              agregarProducto(targetArray, data);
            }
          }
        }
      }
      
      // Recalcular los subtotales de cada CardView
      calcClientes.forEach(cliente => {
          cliente.subtotal = cliente.consumos.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
      });

      setConsumosMesa(calcConsumosMesa);
      setClientesMap(calcClientes);
      setDueloInfo(calcDuelo);

    } catch (error) {
      console.error("Error cargando la cuenta estructurada:", error);
    } finally {
      setCargando(false);
    }
  }, [empresaId, mesa.idMesaLocal, mesa.tipoJuego, mesa.reglaDuelo]);

  useEffect(() => {
    cargarCuentaDeLaMesa();
  }, [cargarCuentaDeLaMesa, refreshTrigger]);

  const subtotalMesa = consumosMesa.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const subtotalClientes = Array.from(clientesMap.values()).reduce((acc, cli) => acc + cli.subtotal, 0);
  const granTotal = subtotalMesa + subtotalClientes;

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
        
        {/* PANEL IZQUIERDO - ESTADO DE MESA */}
        <div className="w-1/4 max-w-sm p-6 border-r border-slate-800 overflow-y-auto bg-slate-900 shrink-0">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2 mb-6 uppercase tracking-wider">
            {isJuego ? <Gamepad2 className="text-indigo-400" /> : <Store className="text-emerald-400" />}
            {isJuego ? 'Estado de Mesa' : 'Mesa Servicio'}
          </h2>

          {mesa.estado !== 'DISPONIBLE' ? (
            <div className="space-y-5">
              <div className={`rounded-2xl p-4 border ${isJuego ? 'bg-indigo-950/30 border-indigo-900/50' : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isJuego ? 'text-indigo-400/70' : 'text-slate-400'}`}>Inicio de Sesión</p>
                  <Timer className={`w-4 h-4 ${isJuego ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                </div>
                <p className="text-xl font-mono font-black text-white">
                  {mesa.fechaApertura ? new Date(mesa.fechaApertura).toLocaleTimeString() : 'En espera...'}
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Entidades Detectadas</p>
                  <p className="text-2xl font-black text-white flex items-center gap-2">
                     <Users className="w-5 h-5 text-emerald-500"/> {clientesMap.size}
                  </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 opacity-50">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">Mesa Libre</p>
            </div>
          )}
        </div>

        {/* PANEL CENTRAL Y DERECHO EXPANDIDO - VISTA DE CARDVIEWS */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col bg-slate-950 shadow-2xl z-10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-white font-extrabold text-2xl flex items-center gap-3">
              <ShoppingCart className="text-emerald-400 w-8 h-8" /> Cuentas Activas
            </h2>
            <button onClick={cargarCuentaDeLaMesa} className="text-slate-500 hover:text-white transition-colors bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2 font-bold text-sm">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-emerald-500' : ''}`} />
              Sincronizar Cuentas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 pb-20">
            {cargando && consumosMesa.length === 0 && clientesMap.size === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <RefreshCw className="w-10 h-10 mb-4 animate-spin text-slate-500" />
                <p className="font-bold text-lg">Sincronizando entidades...</p>
              </div>
            ) : consumosMesa.length === 0 && clientesMap.size === 0 && !dueloInfo.activo ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Beer className="w-20 h-20 mb-4 opacity-20" />
                <p className="font-bold text-lg">No hay clientes ni consumos registrados.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                
                {/* 1. CARD COMPARTIDA: DUELO ACTIVO */}
                {dueloInfo.activo && (
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                    <div className="absolute -top-10 -right-10 p-3 opacity-10">
                       <Swords className="w-64 h-64 text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-500/20">Duelo Activo</span>
                            <span className="text-indigo-300 font-bold text-base tracking-wider">{dueloInfo.modalidad} • {dueloInfo.regla?.replace(/_/g, ' ')}</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-12">
                            {dueloInfo.jugadores.map((jugador, idx) => (
                                <React.Fragment key={jugador}>
                                    <div className="text-center flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-indigo-400 flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.4)] mb-4">
                                            <UserCircle2 className="w-10 h-10 text-indigo-300" />
                                        </div>
                                        <p className="text-white font-extrabold text-2xl tracking-tight">{jugador}</p>
                                    </div>
                                    {idx < dueloInfo.jugadores.length - 1 && (
                                        <div className="text-4xl font-black text-indigo-500 italic mt-[-30px]">VS</div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                  </div>
                )}

                {/* 2. GRID DE CARDVIEWS (Mesa y Clientes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Tarjeta de Mesa General */}
                    {consumosMesa.length > 0 && (
                        <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col shadow-lg">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                                        <Store className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-extrabold text-lg">Mesa General</h3>
                                        <p className="text-slate-500 text-sm font-medium">Consumo sin asignar</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-3 mb-6">
                                {consumosMesa.map((prod, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 font-bold text-xs">
                                              {prod.cantidad}
                                            </div>
                                            <span className="text-slate-300 font-medium text-sm">{prod.nombre}</span>
                                        </div>
                                        <span className="text-slate-400 font-mono font-bold">${(prod.precio * prod.cantidad).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-end">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="text-white font-black text-2xl">${subtotalMesa.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Tarjetas de Clientes Individuales */}
                    {Array.from(clientesMap.values()).map(cliente => (
                        <div key={cliente.nombre} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 flex flex-col shadow-lg hover:border-emerald-500/50 transition-all group relative">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-colors">
                                        <UserCircle2 className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-extrabold text-lg truncate max-w-[150px]" title={cliente.nombre}>{cliente.nombre}</h3>
                                        <p className="text-slate-500 text-sm font-medium">{cliente.consumos.length} items</p>
                                    </div>
                                </div>
                                {/* BOTÓN 3 PUNTOS PARA ACCIONES FUTURAS */}
                                <button className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex-1 space-y-3 mb-6">
                                {cliente.consumos.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                       <p className="text-slate-600 text-sm italic font-medium">No tiene consumos</p>
                                    </div>
                                ) : (
                                    cliente.consumos.map((prod, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-950/50 border border-emerald-900/50 w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-xs">
                                                  {prod.cantidad}
                                                </div>
                                                <span className="text-slate-300 font-medium text-sm truncate max-w-[120px]" title={prod.nombre}>{prod.nombre}</span>
                                            </div>
                                            <span className="text-slate-400 font-mono font-bold">${(prod.precio * prod.cantidad).toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-end">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="text-emerald-400 font-black text-2xl">${cliente.subtotal.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}

                </div>

              </div>
            )}
          </div>

          {/* Gran Total Bottom Bar Flotante */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pointer-events-none">
             <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex justify-between items-center pointer-events-auto shadow-2xl">
                <div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Gran Total de la Mesa</p>
                   <p className="text-slate-500 text-xs font-medium">Suma de Mesa General + Cuentas Individuales</p>
                </div>
                <p className="text-4xl font-black text-white tracking-tight">${granTotal.toLocaleString()}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}