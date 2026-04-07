import api from './axios.config';
import type { DashboardStats, Movimiento, Producto, UnidadParametro } from '../types/inventario.types';

export const inventarioService = {
  obtenerProductosPorEmpresa: async (empresaId: number): Promise<Producto[]> => {
    const response = await api.get<Producto[]>(`/api/productos/empresa/${empresaId}`);
    return response.data;
  },
  
  guardarParametro: async (parametro: { id?: number, codigo: string, nombre: string, estructuraCodigo: string, empresaId: number }): Promise<void> => {
    await api.post('/api/unidades', parametro);
  },

  eliminarParametro: async (id: number): Promise<void> => {
    await api.delete(`/api/unidades/${id}`);
  },

  guardarProducto: async (empresaId: number, producto: Producto): Promise<Producto> => {
    const response = await api.post<Producto>(`/api/productos/empresa/${empresaId}`, producto);
    return response.data;
  },

  cambiarEstadoProducto: async (productoId: number): Promise<void> => {
    await api.put(`/api/productos/${productoId}/estado`);
  },

  obtenerParametrosPorEstructura: async (codigoEstructura: string, empresaId: number): Promise<UnidadParametro[]> => {
    const response = await api.get<UnidadParametro[]>(`/api/unidades/estructura/${codigoEstructura}/empresa/${empresaId}`);
    return response.data;
  },

  obtenerDashboardStats: async (empresaId: number): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>(`/api/inventario/dashboard/${empresaId}`);
    return response.data;
  },

  obtenerHistorialAuditoria: async (empresaId: number): Promise<Movimiento[]> => {
    const response = await api.get<Movimiento[]>(`/api/inventario/historial/${empresaId}`);
    return response.data;
  }
};