// src/pages/Admin/views/DocumentosManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Eye, RefreshCcw, X, Printer, Receipt,
  Building2, Loader2, ChevronLeft, ChevronRight, AlertCircle, Plus
} from 'lucide-react';
import { documentosService } from '../../../api/documentos.service';
import { empresasService } from '../../../api/empresas.service';
import toast from 'react-hot-toast';

export default function DocumentosManager({ fixedEmpresaId }: { fixedEmpresaId?: number }) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Paginación de Servidor
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [empresaId, setEmpresaId] = useState<string>(fixedEmpresaId?.toString() || '');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    if (!fixedEmpresaId) {
      empresasService.obtenerTodas().then(setEmpresas);
    }
  }, [fixedEmpresaId]);

  useEffect(() => {
    if (empresaId) cargarDocumentos();
  }, [empresaId, page]);

  // Búsqueda con delay para no saturar el servidor
  useEffect(() => {
    const timer = setTimeout(() => {
      if (empresaId) {
        setPage(0);
        cargarDocumentos();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filtroTexto]);

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const data = await documentosService.obtenerHistorial(Number(empresaId), page, pageSize, filtroTexto);
      setDocumentos(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      toast.error("Error de sincronización con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (id: number) => {
    setIsModalOpen(true);
    setLoadingModal(true);
    try {
      const data = await documentosService.obtenerPorId(id);
      setDocSeleccionado(data);
    } catch (error) {
      toast.error("Error al recuperar el documento");
      setIsModalOpen(false);
    } finally {
      setLoadingModal(false);
    }
  };

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case 'EMITIDO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'ANULADO': return 'bg-red-50 text-red-600 border-red-100';
      case 'APLICADO': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'PAGADO': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7" /> Libro de Documentos
        </h2>
        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mt-1 opacity-70">Auditoría Transaccional Centralizada</p>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-3 mb-6 items-end shrink-0">
        {!fixedEmpresaId && (
          <div className="w-full lg:w-64 space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Tenant</label>
            <select value={empresaId} onChange={(e) => { setEmpresaId(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white outline-none cursor-pointer">
              <option value="">Seleccionar Cliente...</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombreComercial}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 w-full space-y-1">
          <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Búsqueda rápida</label>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Consecutivo o nombre..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:bg-white outline-none"/>
          </div>
        </div>
        <button onClick={() => { setPage(0); cargarDocumentos(); }} disabled={!empresaId} className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-black disabled:opacity-30 transition-all">
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TABLA PAGINADA */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-black border-b border-zinc-100 bg-zinc-50/50">
                <th className="p-4 pl-6">ID / Consecutivo</th>
                <th className="p-4">Emisión</th>
                <th className="p-4">Tercero / Beneficiario</th>
                <th className="p-4 text-right">Total Facturado</th>
                <th className="p-4 text-right">Total Saldo</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-300" /></td></tr>
              ) : documentos.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-zinc-400 font-bold text-sm">No hay registros.</td></tr>
              ) : (
                documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="text-[10px] font-black text-zinc-400 block mb-0.5">#{doc.id}</span>
                      <span className="font-mono text-sm font-black text-zinc-800">{doc.consecutivo}</span>
                    </td>
                    <td className="p-4 text-[10px] font-bold text-zinc-500 uppercase">
                      {new Date(doc.fechaEmision).toLocaleDateString('es-CO', { day:'2-digit', month:'short' })}
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-black text-zinc-700">{doc.tercero?.nombreCompleto}</p>
                      <p className="text-[9px] font-bold text-zinc-400">NIT: {doc.tercero?.documento}</p>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-zinc-900 text-sm">
                      ${doc.totalDocumento?.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-zinc-500 text-sm">
                      ${doc.saldoDocumento?.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`mx-auto w-max px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${getStatusStyle(doc.estado)}`}>
                        {doc.estado}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button onClick={() => verDetalle(doc.id)} className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINADOR */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between px-6">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Total: <span className="text-zinc-900">{totalElements}</span> registros
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[10px] font-black text-zinc-900 uppercase">Pág {page + 1} / {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* VISOR DE FACTURA COMPACTO (AHORA CON SALDOS EN LOS DETALLES) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-zinc-200">
            {loadingModal || !docSeleccionado ? (
              <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-900" /></div>
            ) : (
              <>
                <div className="bg-black px-5 py-3 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{docSeleccionado.tipoDocumento?.nombre}</span>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center shrink-0 bg-zinc-50/50">
                  <div>
                    <h3 className="font-black text-zinc-900 text-base leading-none mb-1">{docSeleccionado.tercero?.nombreCompleto}</h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">NIT: {docSeleccionado.tercero?.documento}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-sm text-zinc-900">{docSeleccionado.consecutivo}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(docSeleccionado.fechaEmision).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* CUERPO DE CONCEPTOS (ACTUALIZADO CON SALDOS) */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3">Detalle Operativo</p>
                  <div className="space-y-2">
                    {docSeleccionado.detalles?.map((det: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs p-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-400 transition-all shadow-sm relative overflow-hidden">
                        
                        {/* Etiqueta visual si la línea ya fue pagada/cruzada con Notas */}
                        {det.saldo === 0 && (
                          <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-bl-lg">PAGADO</div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${det.naturaleza === 'SUMA' ? 'bg-zinc-100' : 'bg-red-50'}`}>
                             {det.naturaleza === 'SUMA' ? <Plus className="w-4 h-4 text-zinc-600"/> : <X className="w-4 h-4 text-red-500"/>}
                          </div>
                          <div>
                            <p className="font-black text-zinc-800">{det.concepto?.nombre}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">
                              {det.cantidad} UND x ${det.valorUnitario?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* BLOQUE DERECHO: TOTAL VS SALDO */}
                        <div className="text-right flex flex-col">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">
                            Orig: <span className={`font-mono font-black text-sm ${det.naturaleza === 'SUMA' ? 'text-zinc-900' : 'text-red-600'}`}>
                              ${det.valorTotal?.toLocaleString()}
                            </span>
                          </p>
                          <p className="text-[10px] font-black text-zinc-600 uppercase">
                            Saldo: <span className="font-mono text-xs">${det.saldo?.toLocaleString()}</span>
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Observaciones (Si las hay) */}
                  {docSeleccionado.observaciones && (
                     <div className="mt-6 pt-4 border-t border-zinc-200 border-dashed">
                        <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-widest mb-2">Justificación / Notas</p>
                        <p className="text-xs font-medium text-zinc-600 italic bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">{docSeleccionado.observaciones}</p>
                     </div>
                  )}
                </div>

                <div className="p-5 border-t border-zinc-100 bg-white shrink-0">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saldo Actual</span>
                        <span className="text-xs font-mono font-bold text-zinc-600">${docSeleccionado.saldoDocumento?.toLocaleString()}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-max ${getStatusStyle(docSeleccionado.estado)}`}>
                        {docSeleccionado.estado}
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Total Original</p>
                       <p className="text-3xl font-black text-zinc-900 tracking-tighter font-mono leading-none">${docSeleccionado.totalDocumento?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-[11px] font-black uppercase tracking-widest border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Cerrar</button>
                    <button className="flex-1 py-2 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-800 shadow-lg shadow-black/10 flex items-center justify-center gap-2">
                      <Printer className="w-3.5 h-3.5" /> Imprimir Copia
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}