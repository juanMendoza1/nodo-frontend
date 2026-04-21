import React, { useState, useEffect } from 'react';
import { X, Box, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { inventarioService } from '../../../api/inventario.service';
import type { Producto, UnidadParametro } from '../../../types/inventario.types';
import { SearchableSelect } from './FacturacionUtils';
import toast from 'react-hot-toast';

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  productoInicial: Producto;
  categorias: UnidadParametro[];
  unidades: UnidadParametro[];
  nombresEstructuras: { categoria: string, medida: string };
  onGuardadoExitoso: () => void;
}

export default function ProductoModal({ isOpen, onClose, empresaId, productoInicial, categorias, unidades, nombresEstructuras, onGuardadoExitoso }: ProductoModalProps) {
  const [formData, setFormData] = useState<Producto>(productoInicial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setFormData(productoInicial);
  }, [productoInicial, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Id') || name.includes('precio') || name.includes('stock') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación estricta para asegurar que lleguen los IDs correctos a la BD
    if (!formData.categoriaId && categorias.length > 0) {
        toast.error(`Debe seleccionar una opción en ${nombresEstructuras.categoria}`);
        return;
    }
    if (!formData.unidadMedidaId && unidades.length > 0) {
        toast.error(`Debe seleccionar una opción en ${nombresEstructuras.medida}`);
        return;
    }

    setSaving(true);
    toast.promise(
        inventarioService.guardarProducto(empresaId, formData),
        {
            loading: 'Procesando producto...',
            success: () => {
                onGuardadoExitoso();
                onClose();
                return 'Producto guardado en el catálogo';
            },
            error: 'Error al registrar el producto'
        }
    ).finally(() => setSaving(false));
  };

  const margenGanancia = formData.precioVenta > 0 && formData.precioCosto > 0
    ? ((formData.precioVenta - formData.precioCosto) / formData.precioVenta) * 100 
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3 className="font-black text-zinc-900 text-lg flex items-center gap-2">
            <Box className="w-5 h-5 text-black" />
            {formData.id ? 'Ficha de Producto' : 'Registro de Inventario'}
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* BLOQUE 1: IDENTIFICACIÓN */}
          <div className="mb-6">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2">1. Identificación y Clasificación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Nombre Comercial *</label>
                <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:border-black transition-all" placeholder="Ej: Cerveza Corona 330ml" />
              </div>
              
              <div className="relative">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">{nombresEstructuras.categoria} *</label>
                {categorias.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-bold">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     <span>Ve a "Configurar Catálogos" y crea registros primero.</span>
                  </div>
                ) : (
                  <SearchableSelect 
                    value={formData.categoriaId || ''} 
                    options={categorias} 
                    onChange={(val) => setFormData({ ...formData, categoriaId: Number(val) })}
                    placeholder={`Buscar en ${nombresEstructuras.categoria}...`}
                  />
                )}
              </div>

              <div className="relative">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">{nombresEstructuras.medida} {unidades.length > 0 ? '*' : ''}</label>
                {unidades.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500 font-bold">
                     <span>No obligatorio (No asignado en plan)</span>
                  </div>
                ) : (
                  <SearchableSelect 
                    value={formData.unidadMedidaId || ''} 
                    options={unidades} 
                    onChange={(val) => setFormData({ ...formData, unidadMedidaId: Number(val) })}
                    placeholder={`Buscar en ${nombresEstructuras.medida}...`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* BLOQUE 2: FINANCIERO */}
          <div className="mb-6">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2">2. Costos y Rentabilidad</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Precio Costo</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required name="precioCosto" value={formData.precioCosto || ''} onChange={handleInputChange} type="number" min="0" className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-black transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Precio Venta Público</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required name="precioVenta" value={formData.precioVenta || ''} onChange={handleInputChange} type="number" min="0" className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-black text-blue-600 focus:bg-white focus:outline-none focus:border-blue-600 transition-all" />
                </div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-3 flex flex-col justify-center relative overflow-hidden">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest relative z-10">Margen</p>
                 <p className={`text-lg font-black font-mono relative z-10 flex items-center gap-1 ${margenGanancia > 30 ? 'text-emerald-400' : margenGanancia > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {margenGanancia.toFixed(1)}% <TrendingUp className="w-4 h-4 opacity-50" />
                 </p>
                 <TrendingUp className="w-16 h-16 text-white/5 absolute -right-2 -bottom-2" />
              </div>
            </div>
          </div>

          {/* BLOQUE 3: STOCK */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2">3. Control de Inventario</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center justify-between">
                  <span>Stock / Existencia inicial</span>
                </label>
                <input required name="stockActual" value={formData.stockActual || ''} onChange={handleInputChange} type="number" min="0" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-base font-black focus:bg-white focus:outline-none focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">SKU Interno</label>
                <input readOnly value={formData.codigo} className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-400 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-zinc-600 font-bold text-sm bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || categorias.length === 0} className="px-8 py-2.5 bg-black text-white font-bold text-sm rounded-xl hover:bg-zinc-800 shadow-md transition-all disabled:opacity-50">
              {saving ? 'Procesando...' : 'Confirmar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}