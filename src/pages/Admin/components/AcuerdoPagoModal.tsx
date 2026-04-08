import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Percent, CircleDollarSign } from 'lucide-react';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import toast from 'react-hot-toast';

interface AcuerdoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: number | null;
  slotNombre: string;
  onGuardadoExitoso: () => void;
}

export default function AcuerdoPagoModal({ isOpen, onClose, slotId, slotNombre, onGuardadoExitoso }: AcuerdoPagoModalProps) {
  const [formData, setFormData] = useState({
    tipoAcuerdo: 'COMISION_VENTAS',
    valorFijoDia: 0,
    porcentajeComision: 10
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ tipoAcuerdo: 'COMISION_VENTAS', valorFijoDia: 0, porcentajeComision: 10 });
    }
  }, [isOpen]);

  if (!isOpen || !slotId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      usuarioSlot: { id: slotId },
      tipoAcuerdo: formData.tipoAcuerdo,
      valorFijoDia: ['FIJO_POR_DIA', 'MIXTO'].includes(formData.tipoAcuerdo) ? Number(formData.valorFijoDia) : 0,
      porcentajeComision: ['COMISION_VENTAS', 'MIXTO'].includes(formData.tipoAcuerdo) ? Number(formData.porcentajeComision) : 0,
    };

    setSaving(true);
    
    toast.promise(
      liquidacionesService.guardarAcuerdo(payload),
      {
        loading: 'Guardando nuevo contrato...',
        success: () => {
          onGuardadoExitoso();
          onClose();
          return 'Contrato VIGENTE generado con éxito';
        },
        error: (err) => err.response?.data?.error || 'Error al guardar el contrato.'
      }
    ).finally(() => setSaving(false));
  };

  const showFijo = ['FIJO_POR_DIA', 'MIXTO'].includes(formData.tipoAcuerdo);
  const showComision = ['COMISION_VENTAS', 'MIXTO'].includes(formData.tipoAcuerdo);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-black" /> Nuevo Contrato
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-1">Crea las condiciones de pago para <strong className="text-zinc-800">{slotNombre}</strong>.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Modelo de Liquidación</label>
              <select 
                value={formData.tipoAcuerdo}
                onChange={(e) => setFormData({...formData, tipoAcuerdo: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer transition-all"
              >
                <option value="COMISION_VENTAS">Porcentaje de Comisión sobre Ventas</option>
                <option value="FIJO_POR_DIA">Pago Fijo por Día (Turno)</option>
                <option value="MIXTO">Modelo Mixto (Fijo + Comisión)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {showComision && (
                <div className={`space-y-1.5 ${!showFijo ? 'col-span-2' : ''} animate-in fade-in`}>
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">% Comisión</label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input required type="number" min="0" max="100" step="0.1" value={formData.porcentajeComision} onChange={(e) => setFormData({...formData, porcentajeComision: Number(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"/>
                  </div>
                </div>
              )}

              {showFijo && (
                <div className={`space-y-1.5 ${!showComision ? 'col-span-2' : ''} animate-in fade-in`}>
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Fijo por Día ($)</label>
                  <div className="relative">
                    <CircleDollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input required type="number" min="0" value={formData.valorFijoDia} onChange={(e) => setFormData({...formData, valorFijoDia: Number(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"/>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl mt-4">
               <p className="text-[11px] text-zinc-600 font-medium text-center">
                 Este contrato será marcado como <strong>VIGENTE</strong> automáticamente y el sistema generará un número de Radicado único.
               </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-zinc-600 font-bold text-sm border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" /> {saving ? 'Guardando...' : 'Crear Contrato'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}