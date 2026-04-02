import api from './axios.config';
import type { Producto } from '../types/inventario.types';

export const inventarioService = {
  // Ajusta esta ruta si tu endpoint en Spring Boot se llama diferente
  obtenerProductosPorEmpresa: async (empresaId: number): Promise<Producto[]> => {
    const response = await api.get<Producto[]>(`/api/productos/empresa/${empresaId}`);
    return response.data;
  }
};