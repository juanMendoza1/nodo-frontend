import React, { useState, useEffect } from 'react';
import { useWebSockets } from '../../../hooks/useWebSockets'; // El hook que definimos antes
import { LayoutGrid, Info, Clock, Beer, Disc } from 'lucide-react';

interface MesaEstado {
    idMesa: number;
    consumoTotal: number;
    dueloActivo: boolean;
    ultimaActividad: number;
    items: any[];
}

const LiveTableMonitor = ({ empresaId }: { empresaId: number }) => {
    // Estado maestro: Un mapa de ID de Mesa -> Datos de la mesa
    const [mesas, setMesas] = useState<Record<number, MesaEstado>>({});
    const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaEstado | null>(null);

    const eventoIncoming = useWebSockets(empresaId, 'monitor-operativo');

    useEffect(() => {
        if (!eventoIncoming) return;

        const { tipo, data, fecha } = eventoIncoming;
        const mesaId = data.idMesa;

        if (!mesaId) return;

        setMesas(prev => {
            const mesaActual = prev[mesaId] || {
                idMesa: mesaId,
                consumoTotal: 0,
                dueloActivo: false,
                ultimaActividad: Date.now(),
                items: []
            };

            // Lógica de actualización según el tipo de evento
            let nuevoConsumo = mesaActual.consumoTotal;
            let duelo = mesaActual.dueloActivo;

            if (tipo === 'PEDIDO_DIRECTO') nuevoConsumo += (data.precio * data.cantidad);
            if (tipo === 'MESA_ABIERTA') duelo = true;
            if (tipo === 'DUELO_FINALIZADO_ESTADISTICO') duelo = false;

            return {
                ...prev,
                [mesaId]: {
                    ...mesaActual,
                    consumoTotal: nuevoConsumo,
                    dueloActivo: duelo,
                    ultimaActividad: fecha,
                    items: [eventoIncoming, ...mesaActual.items].slice(0, 20) // Guardamos últimos 20 eventos
                }
            };
        });
    }, [eventoIncoming]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LayoutGrid className="text-blue-500" /> Monitor Operativo de Mesas
            </h2>

            {/* Grid de Mesas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(mesas).map(mesa => (
                    <div 
                        key={mesa.idMesa}
                        onClick={() => setMesaSeleccionada(mesa)}
                        className={`cursor-pointer transition-all hover:scale-105 p-4 rounded-2xl border ${
                            mesa.dueloActivo 
                                ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                : 'bg-slate-900 border-slate-800'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-2xl font-black text-white">MESA #{mesa.idMesa}</span>
                            {mesa.dueloActivo && (
                                <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Beer size={14} /> Consumo: <span className="text-emerald-400 font-bold">${mesa.consumoTotal.toLocaleString()}</span>
                            </p>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <Clock size={14} /> Última act: {new Date(mesa.ultimaActividad).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Detalle (El Resumen que pediste) */}
            {mesaSeleccionada && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Detalle Mesa #{mesaSeleccionada.idMesa}</h3>
                                <p className="text-slate-400 text-sm">Historial operativo de la sesión actual</p>
                            </div>
                            <button 
                                onClick={() => setMesaSeleccionada(null)}
                                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {mesaSeleccionada.items.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start border-l-2 border-slate-700 pl-4 py-2">
                                    <div className="bg-slate-800 p-2 rounded-lg">
                                        {item.tipo.includes('BOLA') ? <Disc size={16} className="text-amber-400" /> : <Info size={16} className="text-blue-400" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{item.tipo.replace(/_/g, ' ')}</p>
                                        <p className="text-slate-500 text-xs">{JSON.stringify(item.data)}</p>
                                    </div>
                                    <span className="ml-auto text-slate-600 text-[10px]">
                                        {new Date(item.fecha).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveTableMonitor;