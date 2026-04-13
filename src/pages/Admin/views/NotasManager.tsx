// src/pages/Admin/views/NotasManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, FileSpreadsheet, ArrowLeft, CheckCircle2, 
  Loader2, Save, Minus, Plus, Receipt, Building2, AlertCircle
} from 'lucide-react';
import { documentosService } from '../../../api/documentos.service';
import { empresasService } from '../../../api/empresas.service';
import toast from 'react-hot-toast';

export default function NotasManager({ fixedEmpresaId }: { fixedEmpresaId?: number }) {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState(fixedEmpresaId?.toString() || '');
  const [consecutivoBusqueda, setConsecutivoBusqueda] = useState('');
  
  const [padre, setPadre] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [tipoNota, setTipoNota] = useState<'NC' | 'ND'>('NC');
  const [ajustes, setAjustes] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (!fixedEmpresaId) {
      empresasService.obtenerTodas().then(setEmpresas);
    }
  }, [fixedEmpresaId]);

  const buscarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !consecutivoBusqueda) return;
    setLoading(true);
    try {
      const data = await documentosService.buscarPadrePorConsecutivo(Number(empresaId), consecutivoBusqueda);
      setPadre(data);
      setAjustes({});
      setObservaciones('');
      toast.success("Factura localizada");
    } catch (e: any) {
      toast.error("Documento no encontrado o inaccesible");
    } finally {
      setLoading(false);
    }
  };

  const handleAjuste = (detalleId: number, valor: number) => {
    setAjustes(prev => ({ ...prev, [detalleId]: valor }));
  };

  const calcularTotalNota = () => {
    return Object.values(ajustes).reduce((acc, curr) => acc + curr, 0);
  };

  const enviarNota = async () => {
    setProcesando(true);
    const lineas = Object.entries(ajustes)
      .filter(([_, valor]) => valor > 0)
      .map(([id, valor]) => ({
        documentoDetallePadreId: Number(id),
        valorAjuste: valor
      }));

    if (lineas.length === 0) {
      toast.error("Ingrese al menos un valor de ajuste");
      setProcesando(false);
      return;
    }

    const payload = {
      empresaId: Number(empresaId),
      documentoPadreId: padre.id,
      tipoNota,
      observaciones,
      detalles: lineas
    };

    try {
      const res = await documentosService.emitirNota(payload);
      toast.success(`Nota ${tipoNota} sellada: ${res.consecutivo}`);
      setPadre(null);
      setConsecutivoBusqueda('');
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Falla en la afectación contable");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-black" /> Ajustes y Notas
        </h2>
        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mt-1 opacity-70">
          Afectación de saldos sobre facturas selladas
        </p>
      </div>

      {!padre ? (
        <div className="bg-white border border-zinc-200 rounded-[32px] p-8 lg:p-12 shadow-sm max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-zinc-400" /></div>
             <h3 className="text-xl font-black text-zinc-900">Localizar Factura Origen</h3>
          </div>
          <form onSubmit={buscarFactura} className="space-y-5">
            {!fixedEmpresaId && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Comercio</label>
                <select required value={empresaId} onChange={e => setEmpresaId(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:bg-white outline-none">
                  <option value="">Seleccionar empresa...</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombreComercial}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Consecutivo de Factura</label>
              <input required type="text" placeholder="Ej: FV-000001" value={consecutivoBusqueda} onChange={e => setConsecutivoBusqueda(e.target.value.toUpperCase().trim())} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-lg font-mono font-black text-center focus:bg-white outline-none"/>
            </div>
            <button type="submit" disabled={loading || !empresaId || !consecutivoBusqueda} className="w-full py-4 bg-black text-white font-black rounded-2xl hover:bg-zinc-800 transition-all shadow-xl flex justify-center items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Buscar Documento
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 animate-in slide-in-from-right duration-300">
          
          {/* PANEL PADRE (3 COLUMNAS) */}
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-[32px] p-5 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <button onClick={() => setPadre(null)} className="flex w-max items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-black transition-colors mb-5 shrink-0">
              <ArrowLeft className="w-3 h-3"/> Cambiar Factura
            </button>

            <div className="bg-zinc-900 rounded-2xl p-4 text-white mb-5 relative overflow-hidden shrink-0">
               <div className="relative z-10">
                 <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Origen</p>
                 <h3 className="text-xl font-black font-mono mt-1">{padre.consecutivo}</h3>
                 <p className="text-[11px] font-bold text-zinc-300 mt-2 truncate">{padre.tercero?.nombreCompleto}</p>
               </div>
               <Receipt className="absolute -right-4 -bottom-4 w-16 h-16 text-white/5" />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
               <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest sticky top-0 bg-white pb-2 z-10">Saldos Originales</p>
               {padre.detalles?.map((det: any) => (
                 <div key={det.id} className="p-2 bg-zinc-50 border border-zinc-100 rounded-xl relative overflow-hidden">
                    <p className="text-[10px] font-black text-zinc-800 pr-8 truncate">{det.concepto?.nombre}</p>
                    <div className="flex justify-between items-center mt-1">
                       <span className="text-[9px] font-bold text-zinc-400 uppercase">Saldo:</span>
                       <span className="font-mono text-[10px] font-black text-zinc-900">${det.saldo?.toLocaleString()}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 shrink-0">
               <div className="flex justify-between items-center text-zinc-500 mb-1.5">
                 <span className="text-[9px] font-black uppercase">Saldo Global Actual</span>
                 <span className="font-mono font-bold text-sm">${padre.saldoDocumento?.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black uppercase text-zinc-900">Total Factura</span>
                 <span className="text-lg font-black text-zinc-900">${padre.totalDocumento?.toLocaleString()}</span>
               </div>
            </div>
          </div>

          {/* PANEL AJUSTES (9 COLUMNAS) */}
          <div className="lg:col-span-9 bg-zinc-50/50 border border-zinc-200 rounded-[32px] p-6 lg:p-8 shadow-inner flex flex-col min-h-0 overflow-hidden">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
               <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
                  <button onClick={() => setTipoNota('NC')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tipoNota === 'NC' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50'}`}>Nota Crédito (-)</button>
                  <button onClick={() => setTipoNota('ND')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tipoNota === 'ND' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50'}`}>Nota Débito (+)</button>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-zinc-400">Ajuste Consolidado</p>
                  <p className={`text-4xl font-black font-mono leading-none ${tipoNota === 'NC' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {tipoNota === 'NC' ? '-' : '+'}${calcularTotalNota().toLocaleString()}
                  </p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
               {padre.detalles?.map((det: any) => {
                 const limiteMaximo = tipoNota === 'NC' ? det.saldo : 999999999;
                 const isDisabled = tipoNota === 'NC' && det.saldo === 0;

                 return (
                 <div key={det.id} className={`bg-white px-4 py-3 rounded-xl border ${isDisabled ? 'opacity-40' : 'border-zinc-200 hover:border-zinc-400'} flex items-center gap-6 transition-all`}>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-black text-zinc-900 truncate">{det.concepto?.nombre}</p>
                       <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                          {tipoNota === 'NC' ? `Disponible: $${det.saldo.toLocaleString()}` : `Base: $${det.valorTotal.toLocaleString()}`}
                       </p>
                    </div>
                    <div className="w-48 relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                       <input type="number" min="0" max={limiteMaximo} disabled={isDisabled} value={ajustes[det.id] || ''} onChange={e => { let val = Number(e.target.value); if (val > limiteMaximo) val = limiteMaximo; handleAjuste(det.id, val); }} placeholder="0" className="w-full pl-7 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-black font-mono focus:bg-white outline-none"/>
                    </div>
                 </div>
               )})}
            </div>

            <div className="shrink-0 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Justificación del ajuste *</label>
                  <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs font-medium focus:ring-1 focus:ring-black outline-none transition-all resize-none shadow-sm" placeholder="Indique el motivo..."/>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setPadre(null)} className="px-8 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-black uppercase text-[10px] bg-white">Cancelar</button>
                  <button onClick={enviarNota} disabled={procesando || calcularTotalNota() <= 0 || !observaciones.trim()} className="flex-1 py-3 bg-black text-white font-black rounded-xl hover:bg-zinc-800 transition-all flex justify-center items-center gap-3 disabled:opacity-30 text-sm uppercase tracking-widest">
                    {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sellar Nota Oficial
                  </button>
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}