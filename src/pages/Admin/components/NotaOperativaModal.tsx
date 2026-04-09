import React, { useState, useEffect } from 'react';
import { X, Receipt, ArrowDownRight, ArrowUpRight, CheckCircle2, DollarSign, AlignLeft } from 'lucide-react';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import toast from 'react-hot-toast';

interface NotaOperativaModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: number | null;
  slotNombre: string;
  empresaId: number;
  acuerdoId: number | null;
  onGuardadoExitoso: () => void;
}

export default function NotaOperativaModal({ isOpen, onClose, slotId, slotNombre, empresaId, onGuardadoExitoso }: NotaOperativaModalProps) {
  // Por defecto iniciamos con una Nota Débito (Anticipo)
  const [tipoNota, setTipoNota] = useState<'DEBITO' | 'CREDITO'>('DEBITO');
  
  const [formData, setFormData] = useState({
    subTipo: 'ANTICIPO',
    valor: '',
    descripcion: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTipoNota('DEBITO');
      setFormData({ subTipo: 'ANTICIPO', valor: '', descripcion: '' });
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen || !slotId) return null;

  const handleTipoNotaChange = (tipo: 'DEBITO' | 'CREDITO') => {
    setTipoNota(tipo);
    setFormData({
      ...formData,
      subTipo: tipo === 'DEBITO' ? 'ANTICIPO' : 'BONO'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acuerdoId) {
      toast.error('No hay un contrato activo para asignar esta nota.');
      return;
    }
    
    if (!formData.valor || Number(formData.valor) <= 0) {
      toast.error('El valor de la nota debe ser mayor a 0');
      return;
    }

    const payload = {
      empresa: { id: empresaId },
      usuarioSlot: { id: slotId },
      tipoNovedad: formData.subTipo,
      valor: Number(formData.valor),
      descripcion: formData.descripcion,
      aplicada: false 
    };

    setSaving(true);
    
    try {
      await liquidacionesService.registrarNovedad(acuerdoId, payload);
      toast.success(`Nota ${tipoNota === 'DEBITO' ? 'Débito' : 'Crédito'} registrada con éxito`);
      onGuardadoExitoso();
      onClose(); 
    } catch (err: any) {
      console.error("Error completo al guardar nota:", err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error al registrar la nota en el servidor.');
    } finally {
      // 🔥 FINALLY ASEGURA QUE PASE LO QUE PASE (Éxito o Error), EL BOTÓN SE DESBLOQUEA
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-black" /> Emitir Nota Contable
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Ajuste al próximo pago de <strong className="text-zinc-800">{slotNombre}</strong>.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-zinc-50/50 border-b border-zinc-100">
          <div className="flex bg-zinc-200/70 p-1 rounded-xl">
            <button 
              onClick={() => handleTipoNotaChange('DEBITO')} 
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tipoNota === 'DEBITO' ? 'bg-white text-red-600 shadow-sm border border-red-100' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <ArrowDownRight className="w-4 h-4" /> Nota Débito (-)
            </button>
            <button 
              onClick={() => handleTipoNotaChange('CREDITO')} 
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tipoNota === 'CREDITO' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <ArrowUpRight className="w-4 h-4" /> Nota Crédito (+)
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Clasificación *</label>
            <select 
              value={formData.subTipo}
              onChange={(e) => setFormData({...formData, subTipo: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer transition-all"
            >
              {tipoNota === 'DEBITO' ? (
                <>
                  <option value="ANTICIPO">Adelanto / Anticipo de Nómina</option>
                  <option value="DESCUENTO">Descuento (Daños, faltantes, etc)</option>
                </>
              ) : (
                <>
                  <option value="BONO">Bono de Productividad / Meta</option>
                  <option value="PROPINA_EXTRA">Propina Extraordinaria</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Monto ($) *</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input required type="number" min="1" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-lg font-black text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all" placeholder="0"/>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-zinc-400" /> Concepto / Justificación *
            </label>
            <textarea 
              required
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder={tipoNota === 'DEBITO' ? "Ej: Anticipo solicitado para pasajes..." : "Ej: Bono por cumplimiento de ventas fin de semana..."}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all resize-none"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="px-5 py-3 text-zinc-600 font-bold text-sm border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className={`px-6 py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${tipoNota === 'DEBITO' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <CheckCircle2 className="w-4 h-4" /> {saving ? 'Procesando...' : 'Emitir Documento'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}