import React, { useState, useEffect } from 'react';
import { 
  X, FileText, CheckCircle2, Percent, CircleDollarSign, 
  Calendar, AlignLeft, Clock 
} from 'lucide-react';
import { liquidacionesService } from '../../../api/liquidaciones.service';
import toast from 'react-hot-toast';

interface AcuerdoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: number | null;
  slotNombre: string;
  acuerdoAEditar?: any; 
  onGuardadoExitoso: () => void;
  readOnly?: boolean; // Permite abrir el modal en modo "Solo lectura" para el historial
}

export default function AcuerdoPagoModal({ 
  isOpen, 
  onClose, 
  slotId, 
  slotNombre, 
  acuerdoAEditar, 
  onGuardadoExitoso, 
  readOnly = false 
}: AcuerdoPagoModalProps) {
  
  const [formData, setFormData] = useState({
    tipoAcuerdo: 'COMISION_VENTAS',
    valorFijoDia: 0,
    porcentajeComision: 10,
    fechaInicio: '',
    fechaFin: '',
    frecuenciaPago: 'SEMANAL',
    observaciones: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (acuerdoAEditar) {
        // MODO EDICIÓN O LECTURA
        setFormData({
          tipoAcuerdo: acuerdoAEditar.tipoAcuerdo,
          valorFijoDia: acuerdoAEditar.valorFijoDia || 0,
          porcentajeComision: acuerdoAEditar.porcentajeComision || 0,
          fechaInicio: acuerdoAEditar.fechaInicio || '',
          fechaFin: acuerdoAEditar.fechaFin || '',
          frecuenciaPago: acuerdoAEditar.frecuenciaPago || 'SEMANAL',
          observaciones: acuerdoAEditar.observaciones || ''
        });
      } else {
        // MODO CREACIÓN
        const hoy = new Date().toISOString().split('T')[0];
        setFormData({ 
          tipoAcuerdo: 'COMISION_VENTAS', 
          valorFijoDia: 0, 
          porcentajeComision: 10,
          fechaInicio: hoy,
          fechaFin: '',
          frecuenciaPago: 'SEMANAL',
          observaciones: ''
        });
      }
    }
  }, [isOpen, acuerdoAEditar]);

  if (!isOpen || !slotId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
      toast.error("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    const payload = {
      usuarioSlot: { id: slotId },
      tipoAcuerdo: formData.tipoAcuerdo,
      valorFijoDia: ['FIJO_POR_DIA', 'MIXTO'].includes(formData.tipoAcuerdo) ? Number(formData.valorFijoDia) : 0,
      porcentajeComision: ['COMISION_VENTAS', 'MIXTO'].includes(formData.tipoAcuerdo) ? Number(formData.porcentajeComision) : 0,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin || null,
      frecuenciaPago: formData.frecuenciaPago,
      observaciones: formData.observaciones
    };

    setSaving(true);
    
    // Elegimos crear o actualizar dependiendo si nos pasaron un acuerdo a editar
    const requestPromise = acuerdoAEditar 
      ? liquidacionesService.actualizarAcuerdo(acuerdoAEditar.id, payload)
      : liquidacionesService.guardarAcuerdo(payload);

    toast.promise(
      requestPromise,
      {
        loading: acuerdoAEditar ? 'Actualizando...' : 'Firmando contrato...',
        success: () => {
          onGuardadoExitoso();
          onClose();
          return acuerdoAEditar ? 'Contrato actualizado con éxito' : 'Contrato formalizado con éxito';
        },
        error: (err) => err.response?.data?.error || 'Error al procesar el contrato.'
      }
    ).finally(() => setSaving(false));
  };

  const showFijo = ['FIJO_POR_DIA', 'MIXTO'].includes(formData.tipoAcuerdo);
  const showComision = ['COMISION_VENTAS', 'MIXTO'].includes(formData.tipoAcuerdo);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        
        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h3 className="font-black text-zinc-900 text-xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-black" /> 
              {readOnly ? 'Detalles del Contrato' : (acuerdoAEditar ? 'Editar Contrato' : 'Formalizar Contrato')}
            </h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">
              {readOnly ? 'Visualizando reglas de liquidación históricas para ' : 'Establece las reglas de juego y vigencia para '}
              <strong className="text-zinc-800">{slotNombre}</strong>.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          
          {/* 🔥 FIELDSET PARA BLOQUEAR TODO SI ES READONLY */}
          <fieldset disabled={readOnly} className="border-none p-0 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* COLUMNA 1: CONDICIONES ECONÓMICAS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                   <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                   <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">Modelo Económico</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Tipo de Liquidación *</label>
                  <select 
                    value={formData.tipoAcuerdo}
                    onChange={(e) => setFormData({...formData, tipoAcuerdo: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer transition-all disabled:opacity-70"
                  >
                    <option value="COMISION_VENTAS">Porcentaje de Comisión sobre Ventas</option>
                    <option value="FIJO_POR_DIA">Pago Fijo por Día (Turno)</option>
                    <option value="MIXTO">Modelo Mixto (Fijo + Comisión)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {showComision && (
                    <div className={`space-y-1.5 ${!showFijo ? 'col-span-2' : ''} animate-in fade-in`}>
                      <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">% Comisión *</label>
                      <div className="relative">
                        <Percent className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input required type="number" min="0" max="100" step="0.1" value={formData.porcentajeComision} onChange={(e) => setFormData({...formData, porcentajeComision: Number(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"/>
                      </div>
                    </div>
                  )}

                  {showFijo && (
                    <div className={`space-y-1.5 ${!showComision ? 'col-span-2' : ''} animate-in fade-in`}>
                      <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Fijo por Día ($) *</label>
                      <div className="relative">
                        <CircleDollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input required type="number" min="0" value={formData.valorFijoDia} onChange={(e) => setFormData({...formData, valorFijoDia: Number(e.target.value)})} className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"/>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" /> Frecuencia de Pago *
                  </label>
                  <select 
                    value={formData.frecuenciaPago}
                    onChange={(e) => setFormData({...formData, frecuenciaPago: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-1 focus:ring-black focus:border-black cursor-pointer transition-all disabled:opacity-70"
                  >
                    <option value="DIARIA">Diaria (Al final del turno)</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="MENSUAL">Mensual</option>
                  </select>
                </div>
              </div>

              {/* COLUMNA 2: VIGENCIA Y NOTAS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                   <Calendar className="w-4 h-4 text-blue-600" />
                   <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">Vigencia y Detalles</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Fecha Inicio *</label>
                    <input required type="date" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} className="w-full px-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"/>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Fin (Auto: 1 año)</label>
                    <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} className="w-full px-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-1 focus:ring-black focus:border-black transition-all disabled:bg-zinc-50 disabled:text-zinc-500"/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-zinc-400" /> Observaciones y Cláusulas
                  </label>
                  <textarea 
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Ej: Se descontará el valor de los productos o cristalería rota durante el turno..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all resize-none disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* AVISO LEGAL: Oculto en modo lectura */}
            {!readOnly && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl mt-6 flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                   Al firmar este contrato, se generará un número de Radicado único. Este será el único contrato <strong>VIGENTE</strong> para el operario y el sistema lo utilizará para calcular todas sus liquidaciones de nómina automáticamente.
                 </p>
              </div>
            )}
          </fieldset>

          <div className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 text-zinc-600 font-bold text-sm border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors">
              {readOnly ? 'Cerrar Detalles' : 'Cancelar'}
            </button>
            
            {!readOnly && (
              <button type="submit" disabled={saving} className="px-8 py-3 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? 'Guardando...' : (acuerdoAEditar ? 'Actualizar Contrato' : 'Firmar y Activar Contrato')}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}