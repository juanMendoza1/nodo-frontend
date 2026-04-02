import React, { useState, useEffect } from 'react';
import { Package, Search, Edit, Trash2, AlertTriangle, Tags, CheckCircle2 } from 'lucide-react';
import { inventarioService } from '../../api/inventario.service';
import type { Producto, UnidadParametro } from '../../types/inventario.types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ParametrosModal from './components/ParametrosModal';
import ProductoModal from './components/ProductoModal';

interface InventarioProps {
  empresaId: number;
}

const formInicial: Producto = {
  codigo: '', nombre: '', precioCosto: 0, precioVenta: 0, stockActual: 0,
  categoriaId: undefined, unidadMedidaId: undefined
};

export default function Inventario({ empresaId }: InventarioProps) {
  // Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<UnidadParametro[]>([]);
  const [unidades, setUnidades] = useState<UnidadParametro[]>([]);
  
  // UI
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  // Modales
  const [isModalProductoOpen, setIsModalProductoOpen] = useState(false);
  const [isParametrosOpen, setIsParametrosOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>(formInicial);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, activo: false });

  useEffect(() => {
    cargarInventario();
    cargarParametros();
  }, [empresaId]);

  const cargarInventario = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.obtenerProductosPorEmpresa(empresaId);
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar inventario", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarParametros = async () => {
    try {
      const [cats, unids] = await Promise.all([
        inventarioService.obtenerParametrosPorEstructura('CAT_PROD'),
        inventarioService.obtenerParametrosPorEstructura('UNI_MED')
      ]);
      setCategorias(cats);
      setUnidades(unids);
    } catch (error) {
      console.error("Error cargando parámetros", error);
    }
  };

  const abrirModalNuevo = () => {
    const prefijo = 'PROD-';
    const numero = productos.length > 0 ? productos.length + 1 : 1;
    setProductoSeleccionado({ ...formInicial, codigo: `${prefijo}${numero.toString().padStart(4, '0')}` });
    setIsModalProductoOpen(true);
  };

  const confirmarCambioEstado = async () => {
    try {
      await inventarioService.cambiarEstadoProducto(confirmDialog.id);
      cargarInventario();
      setConfirmDialog({ isOpen: false, id: 0, activo: false });
    } catch (error) {
      alert("Error al cambiar estado");
      setConfirmDialog({ isOpen: false, id: 0, activo: false });
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(filtro.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Catálogo de Productos
          </h2>
          <p className="text-sm text-gray-500 mt-1">Administra precios, stock y categorías de tu inventario.</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setIsParametrosOpen(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all">
            Configurar Parámetros
          </button>
          <button onClick={abrirModalNuevo} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all">
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o categoría..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
                <th className="p-4 pl-6">Código</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium animate-pulse">Cargando inventario...</td></tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Tags className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-bold">No se encontraron productos.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group ${!item.activo ? 'opacity-50 grayscale' : ''}`}>
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-gray-500">{item.codigo}</td>
                    <td className="p-4">
                      <p className="font-extrabold text-gray-900">{item.nombre}</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">{item.unidadMedidaNombre || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                        {item.categoriaNombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold ${item.stockActual <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{item.stockActual}</span>
                        {item.stockActual <= 5 && item.activo && <AlertTriangle className="w-4 h-4 text-red-500" title="Stock Crítico" />}
                      </div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-gray-900">${item.precioVenta?.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setProductoSeleccionado(item); setIsModalProductoOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDialog({ isOpen: true, id: item.id!, activo: item.activo! })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          {item.activo ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Componentes Refactorizados */}
      <ProductoModal 
        isOpen={isModalProductoOpen} 
        onClose={() => setIsModalProductoOpen(false)} 
        empresaId={empresaId} 
        productoInicial={productoSeleccionado} 
        categorias={categorias} 
        unidades={unidades} 
        onGuardadoExitoso={cargarInventario} 
      />

      <ParametrosModal 
        isOpen={isParametrosOpen} 
        onClose={() => setIsParametrosOpen(false)} 
        categorias={categorias} 
        unidades={unidades} 
        onParametrosChange={cargarParametros} 
      />

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={`${confirmDialog.activo ? 'Desactivar' : 'Reactivar'} Producto`}
        message={`¿Estás seguro que deseas cambiar el estado de este producto?`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, activo: false })}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}