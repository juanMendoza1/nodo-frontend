import React, { useState, useMemo } from 'react';
import { 
  RefreshCcw, Calendar, CalendarDays, Edit2, Play, Lock, 
  CalendarClock, Plus, X, CheckCircle2, Loader2, 
  Search, Filter, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCiclos, useMutateCiclo, usePeriodos, useAccionPeriodo } from '../../../hooks/queries/useCiclos';

export default function CiclosManager() {
  const [selectedCiclo, setSelectedCiclo] = useState<any>(null);
  const [searchCiclo, setSearchCiclo] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  const [cicloFormData, setCicloFormData] = useState<any>({});
  const [editingCicloId, setEditingCicloId] = useState<number | null>(null);

  const [isProyectarModalOpen, setIsProyectarModalOpen] = useState(false);
  const [anioProyectar, setAnioProyectar] = useState(new Date().getFullYear().toString());

  const { data: ciclos = [], isLoading: loadingCiclos } = useCiclos();
  const { data: periodos = [], isLoading: loadingPeriodos } = usePeriodos(selectedCiclo?.id);
  const mutateCiclo = useMutateCiclo();
  const accionPeriodo = useAccionPeriodo(selectedCiclo?.id);

  const filteredCiclos = useMemo(() => ciclos.filter((c: any) => c.nombre.toLowerCase().includes(searchCiclo.toLowerCase())), [ciclos, searchCiclo]);
  const availableYears = useMemo(() => {
    const years = new Set(periodos.map((p: any) => p.anioOrigen));
    years.add(Number(new Date().getFullYear())); 
    return Array.from(years).sort((a: any, b: any) => b - a); 
  }, [periodos]);
  const filteredPeriodos = useMemo(() => periodos.filter((p: any) => p.anioOrigen.toString() === selectedYear), [periodos, selectedYear]);

  const handleOpenCicloModal = (ciclo?: any) => {
    if (ciclo) {
      setEditingCicloId(ciclo.id);
      setCicloFormData({ nombre: ciclo.nombre, frecuencia: ciclo.frecuencia, diaCorte: ciclo.diaCorte, diasGracia: ciclo.diasGracia, activo: ciclo.activo });
    } else {
      setEditingCicloId(null);
      setCicloFormData({ nombre: '', frecuencia: 'MENSUAL', diaCorte: 30, diasGracia: 5, activo: true });
    }
    setIsCicloModalOpen(true);
  };

  const handleSaveCiclo = (e: React.FormEvent) => {
    e.preventDefault();
    mutateCiclo.mutate({ id: editingCicloId, payload: cicloFormData }, { onSuccess: () => setIsCicloModalOpen(false) });
  };

  // 🔥 ELIMINAMOS LA LÓGICA DE LIQUIDAR AQUÍ
  const handleAccionEstado = (accion: string, periodoId: number) => {
    const mensajes: any = {
      'ABRIR': '¿Estás seguro de ABRIR este periodo? Quedará habilitado para que el módulo de Facturación SaaS pueda cobrarlo.',
      'CERRAR': '¿Estás seguro de CERRAR el periodo? Asegúrate de haber facturado primero en el módulo SaaS. Esta acción bloqueará el mes para siempre.'
    };

    toast((t) => (
      <div className="flex flex-col gap-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-zinc-900">Confirmar Acción</h4>
            <p className="text-sm text-zinc-600 mt-1 font-medium leading-tight">{mensajes[accion]}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-zinc-100">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold rounded-lg text-xs transition-colors">Cancelar</button>
          <button onClick={() => { toast.dismiss(t.id); accionPeriodo.mutate({ accion, periodoId }); }} className="px-4 py-2 bg-black text-white hover:bg-zinc-800 font-bold rounded-lg text-xs transition-colors shadow-md">Sí, Continuar</button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-center', style: { maxWidth: '400px', padding: '16px', borderRadius: '16px' }});
  };

  const handleConfirmarProyeccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (anioProyectar && !isNaN(Number(anioProyectar))) {
      accionPeriodo.mutate({ accion: 'PROYECTAR', anio: Number(anioProyectar) });
      setSelectedYear(anioProyectar); 
      setIsProyectarModalOpen(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_ESPERA': return <span className="px-2 py-1 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold tracking-widest border border-zinc-200"><CalendarClock className="inline w-3 h-3 mr-1"/> EN ESPERA</span>;
      case 'ABIERTO': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold tracking-widest border border-emerald-200"><Play className="inline w-3 h-3 mr-1"/> ABIERTO</span>;
      case 'CERRADO': return <span className="px-2 py-1 bg-black text-white rounded text-[10px] font-bold tracking-widest"><Lock className="inline w-3 h-3 mr-1"/> CERRADO</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3 uppercase"><RefreshCcw className="w-8 h-8 text-black" /> Calendario de Ciclos</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Administra la apertura y cierre de los bloques de tiempo para habilitar la facturación.</p>
        </div>
        <button onClick={() => handleOpenCicloModal()} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Nuevo Ciclo
        </button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <div className="w-1/3 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50 shrink-0">
            <h3 className="font-black text-zinc-800 flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-zinc-500" /> Ciclos Activos</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar ciclo..." value={searchCiclo} onChange={(e) => setSearchCiclo(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-black transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loadingCiclos ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400"/></div> : filteredCiclos.map((c: any) => (
                <div key={c.id} onClick={() => setSelectedCiclo(c)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCiclo?.id === c.id ? 'border-black bg-zinc-50 shadow-sm ring-1 ring-black' : 'border-zinc-200 hover:border-zinc-400 bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900">{c.nombre}</h4>
                      <p className="text-xs text-zinc-500 font-medium mt-1">Corte: Día {c.diaCorte} | Gracia: {c.diasGracia} días</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenCicloModal(c); }} className="p-1.5 text-zinc-400 hover:text-black bg-white rounded-lg border border-zinc-200 shadow-sm"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] font-black uppercase tracking-widest">Frecuencia: {c.frecuencia}</span>
                </div>
            ))}
          </div>
        </div>

        <div className="w-2/3 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
          {!selectedCiclo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400"><CalendarDays className="w-16 h-16 mb-4 opacity-20" /><p className="font-medium">Selecciona un ciclo para ver sus periodos.</p></div>
          ) : (
            <>
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                <h3 className="font-black text-zinc-900 flex items-center gap-2">Periodos de {selectedCiclo.nombre}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                    <Filter className="w-3.5 h-3.5 text-zinc-400" />
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer">
                      {availableYears.map((year: any) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  <button onClick={() => { setAnioProyectar(new Date().getFullYear().toString()); setIsProyectarModalOpen(true); }} disabled={accionPeriodo.isPending} className="text-xs font-bold bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-black hover:text-black transition-all flex items-center gap-2 shadow-sm">
                    <CalendarDays className="w-3.5 h-3.5"/> Proyectar Nuevo Año
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 relative">
                {accionPeriodo.isPending && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}
                {loadingPeriodos ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400"/></div> : filteredPeriodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-10 text-zinc-400">
                    <CalendarClock className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No hay periodos proyectados para el año {selectedYear}.</p>
                    <button onClick={() => setIsProyectarModalOpen(true)} className="mt-4 text-xs font-bold text-black underline">Proyectar el {selectedYear} ahora</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPeriodos.map((p: any) => (
                      <div key={p.id} className="border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-lg text-zinc-900">{p.anioOrigen} - Mes {p.mesOrigen.toString().padStart(2, '0')}</span>
                            {getEstadoBadge(p.estado)}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                            <p className="text-[11px] text-zinc-500 font-medium"><span className="font-bold text-zinc-700">Inicio:</span> {p.fechaInicio}</p>
                            <p className="text-[11px] text-zinc-500 font-medium"><span className="font-bold text-zinc-700">Fin:</span> {p.fechaFin}</p>
                            <p className="text-[11px] text-zinc-500 font-medium mt-1"><span className="font-bold text-amber-600">Corte Factura:</span> {new Date(p.fechaCorte).toLocaleString()}</p>
                            <p className="text-[11px] text-zinc-500 font-medium mt-1"><span className="font-bold text-red-500">Límite Pago:</span> {p.fechaVencimientoPago}</p>
                          </div>
                        </div>
                        {/* 🔥 SOLO ABRIR O CERRAR */}
                        <div className="flex sm:flex-col justify-end gap-2 border-t sm:border-t-0 sm:border-l border-zinc-100 pt-3 sm:pt-0 sm:pl-4 shrink-0 w-36">
                          {p.estado === 'EN_ESPERA' && <button onClick={() => handleAccionEstado('ABRIR', p.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors w-full">Abrir Periodo</button>}
                          {p.estado === 'ABIERTO' && <button onClick={() => handleAccionEstado('CERRADO', p.id)} className="px-4 py-2 bg-black text-white hover:bg-zinc-800 rounded-lg text-xs font-bold transition-colors w-full flex items-center justify-center gap-1"><Lock className="w-3.5 h-3.5"/> Sellar Mes</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALES: OMITÍ EL CÓDIGO DEL MODAL PARA NO ALARGAR, ES EXACTAMENTE EL MISMO QUE TENÍAS */}
      {/* ... (Mantén tu código de isCicloModalOpen y isProyectarModalOpen aquí) ... */}
    </div>
  );
}