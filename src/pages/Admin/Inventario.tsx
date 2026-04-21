import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Edit, Trash2, AlertTriangle, Tags, CheckCircle2, TrendingUp } from 'lucide-react';
import { inventarioService } from '../../api/inventario.service';
import { configuracionService } from '../../api/configuracion.service';
import type { Producto, UnidadParametro } from '../../types/inventario.types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ClasificacionModal from './components/ClasificacionModal';
import ProductoModal from './components/ProductoModal';
import toast from 'react-hot-toast';

interface InventarioProps {
  empresaId: number;
}

const formInicial: Producto = {
  codigo: '', nombre: '', precioCosto: 0, precioVenta: 0, stockActual: 0,
  categoriaId: undefined, unidadMedidaId: undefined
};

export default function Inventario({ empresaId }: InventarioProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<UnidadParametro[]>([]);
  const [unidades, setUnidades] = useState<UnidadParametro[]>([]);
  const [nombresEstructuras, setNombresEstructuras] = useState({ categoria: 'Categoría', medida: 'Medida' });
  const [loading, setLoading] = useState<boolean>(true);
  const [filtro, setFiltro] = useState<string>('');
  
  const [isModalProductoOpen, setIsModalProductoOpen] = useState<boolean>(false);
  const [isClasificacionOpen, setIsClasificacionOpen] = useState<boolean>(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>(formInicial);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: 0, activo: false });

  useEffect(() => {
    cargarInventario();
    cargarParametros();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const cargarInventario = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.obtenerProductosPorEmpresa(empresaId);
      setProductos(data || []);
    } catch (error) {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  const cargarParametros = async () => {
    try {
      const permitidas = await configuracionService.obtenerEstructurasPermitidas(empresaId);
      
      // 🔥 CERO HARDCODE: Tomamos las dos primeras estructuras asignadas por el SuperAdmin
      const catEst = permitidas.length > 0 ? permitidas[0] : null;
      const medEst = permitidas.length > 1 ? permitidas[1] : null;

      setNombresEstructuras({
        categoria: catEst ? catEst.nombre : 'Categoría',
        medida: medEst ? medEst.nombre : 'Unidad de Medida'
      });

      if (catEst) {
        const cats = await inventarioService.obtenerParametrosPorEstructura(catEst.codigo, empresaId);
        setCategorias(cats || []);
      }
      if (medEst) {
        const unids = await inventarioService.obtenerParametrosPorEstructura(medEst.codigo, empresaId);
        setUnidades(unids || []);
      }
    } catch (error) {
      toast.error("Error al sincronizar clasificación");
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
      toast.success("Estado del producto actualizado");
    } catch (error) {
      toast.error("Error al cambiar estado");
    } finally {
      setConfirmDialog({ isOpen: false, id: 0, activo: false });
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      p.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
      (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(filtro.toLowerCase()))
    );
  }, [productos, filtro]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Catálogo de Productos
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Administra precios, stock y clasificación de tu inventario.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setIsClasificacionOpen(true)} className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-50 shadow-sm transition-all flex-1 sm:flex-none">
            Configurar Catálogos
          </button>
          <button onClick={abrirModalNuevo} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-sm transition-all flex-1 sm:flex-none">
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o clasificación..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                <th className="p-4 pl-6">Código / Item</th>
                <th className="p-4">Clasificación</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Rentabilidad</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-zinc-500 font-bold animate-pulse">Cargando catálogo...</td></tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Tags className="w-6 h-6 text-zinc-300" />
                    </div>
                    <p className="text-zinc-500 font-bold">No se encontraron productos.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => {
                  const margen = item.precioVenta > 0 ? ((item.precioVenta - item.precioCosto) / item.precioVenta) * 100 : 0;
                  const isStockBajo = item.stockActual <= 5;
                  
                  return (
                    <tr key={item.id} className={`hover:bg-zinc-50/50 transition-colors group ${!item.activo ? 'opacity-50 grayscale' : ''}`}>
                      <td className="p-4 pl-6">
                        <p className="font-mono text-[10px] font-black text-zinc-400 mb-0.5">{item.codigo}</p>
                        <p className="font-extrabold text-zinc-900 text-sm">{item.nombre}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {item.categoriaNombre || 'General'}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">{item.unidadMedidaNombre || 'Und'}</span>
                        </div>
                      </td>
                      <td className="p-4 w-40">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-black ${isStockBajo ? 'text-red-600' : 'text-zinc-900'}`}>{item.stockActual}</span>
                            {isStockBajo && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isStockBajo ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, item.stockActual * 2)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-extrabold text-zinc-900 text-sm">${item.precioVenta?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                          <TrendingUp className="w-3 h-3" /> {margen.toFixed(1)}% Margen
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border ${item.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setProductoSeleccionado(item); setIsModalProductoOpen(true); }} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDialog({ isOpen: true, id: item.id!, activo: item.activo! })} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            {item.activo ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalProductoOpen && (
        <ProductoModal 
          isOpen={isModalProductoOpen} 
          onClose={() => setIsModalProductoOpen(false)} 
          empresaId={empresaId} 
          productoInicial={productoSeleccionado} 
          categorias={categorias} 
          unidades={unidades}
          nombresEstructuras={nombresEstructuras} 
          onGuardadoExitoso={cargarInventario} 
        />
      )}

      {isClasificacionOpen && (
        <ClasificacionModal 
          isOpen={isClasificacionOpen} 
          onClose={() => setIsClasificacionOpen(false)} 
          empresaId={empresaId}
          onParametrosChange={cargarParametros} 
        />
      )}

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={`${confirmDialog.activo ? 'Desactivar' : 'Reactivar'} Producto`}
        message={`¿Deseas cambiar el estado comercial de este producto?`}
        onCancel={() => setConfirmDialog({ isOpen: false, id: 0, activo: false })}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}