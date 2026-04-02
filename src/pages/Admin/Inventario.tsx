import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  AlertTriangle,
  Tags,
  Layers
} from 'lucide-react';
import { inventarioService } from '../../api/inventario.service';
import type { Producto } from '../../types/inventario.types';

interface InventarioProps {
  empresaId: number;
}

export default function Inventario({ empresaId }: InventarioProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarInventario();
  }, [empresaId]);

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const data = await inventarioService.obtenerProductosPorEmpresa(empresaId);
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar inventario", error);
      // Opcional: Si falla, podemos poner un MOCK DATA temporal para que veas el diseño
      // setProductos([{ id: 1, codigoBase: 'CER-001', nombre: 'Cerveza Corona', precioVenta: 8000, costo: 4000, stockActual: 5, stockMinimo: 10, claseNombre: 'BEBIDAS', estructuraNombre: 'CERVEZAS', unidadNombre: 'BOTELLA', activo: true }]);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.codigoBase.toLowerCase().includes(filtro.toLowerCase()) ||
    p.estructuraNombre?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Gestión de Inventario
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra tus productos, clases, estructuras y unidades de medida.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Layers className="w-4 h-4" /> Categorías
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 transition-all">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o estructura (Ej: Cerveza)"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
                <th className="p-4 pl-6">Código</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Clasificación</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-medium animate-pulse">
                    Cargando inventario...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Tags className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-bold">No se encontraron productos.</p>
                    <p className="text-gray-500 text-sm mt-1">Intenta con otro término de búsqueda o crea uno nuevo.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-gray-500">
                      {item.codigoBase}
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-gray-900">{item.nombre}</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">{item.unidadNombre}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 w-max">
                          {item.claseNombre}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {item.estructuraNombre}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold ${item.stockActual <= item.stockMinimo ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.stockActual}
                        </span>
                        {item.stockActual <= item.stockMinimo && (
                          <AlertTriangle className="w-4 h-4 text-red-500" title="Stock Crítico" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-gray-900">
                      ${item.precioVenta?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
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

    </div>
  );
}