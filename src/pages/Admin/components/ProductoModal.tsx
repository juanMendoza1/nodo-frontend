import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { inventarioService } from '../../../api/inventario.service';
import type { Producto, UnidadParametro } from '../../../types/inventario.types';

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  productoInicial: Producto;
  categorias: UnidadParametro[];
  unidades: UnidadParametro[];
  onGuardadoExitoso: () => void;
}

export default function ProductoModal({ isOpen, onClose, empresaId, productoInicial, categorias, unidades, onGuardadoExitoso }: ProductoModalProps) {
  const [formData, setFormData] = useState<Producto>(productoInicial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(productoInicial);
  }, [productoInicial, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Id') || name.includes('precio') || name.includes('stock') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await inventarioService.guardarProducto(empresaId, formData);
      onGuardadoExitoso();
      onClose();
    } catch (error) {
      alert("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-extrabold text-gray-900 text-lg">
            {formData.id ? 'Editar Producto' : 'Registrar Producto'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">CÓDIGO / SKU</label>
              <div className="relative">
                <input required name="codigo" value={formData.codigo} onChange={handleInputChange} type="text" disabled className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-mono text-gray-600 cursor-not-allowed" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                  <Info className="w-4 h-4 text-gray-400" />
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-[10px] p-2 rounded-md shadow-lg z-10">
                    El código se genera automáticamente.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">NOMBRE COMERCIAL</label>
              <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow" placeholder="Ej: Cerveza Corona" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">CATEGORÍA</label>
              <select required name="categoriaId" value={formData.categoriaId || ''} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow">
                <option value="" disabled>Seleccione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">UNIDAD DE MEDIDA</label>
              <select required name="unidadMedidaId" value={formData.unidadMedidaId || ''} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow">
                <option value="" disabled>Seleccione...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">PRECIO DE COSTO</label>
              <input required name="precioCosto" value={formData.precioCosto || ''} onChange={handleInputChange} type="number" min="0" className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">PRECIO DE VENTA</label>
              <input required name="precioVenta" value={formData.precioVenta || ''} onChange={handleInputChange} type="number" min="0" className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">STOCK INICIAL</label>
              <input required name="stockActual" value={formData.stockActual || ''} onChange={handleInputChange} type="number" min="0" className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-shadow" />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}