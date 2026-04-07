import api from './axios.config';

export interface Tercero {
  id?: number;
  documento: string;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  telefono?: string;
  correo?: string;
}

export const tercerosService = {
  // Para el SuperAdmin
  obtenerTodosAdmin: async () => {
    const response = await api.get('/api/terceros/admin/todos');
    return response.data;
  },
  
  // Para los negocios (Admin normales)
  obtenerVisibles: async (empresaId: number) => {
    const response = await api.get(`/api/terceros/visibles/${empresaId}`);
    return response.data;
  },
  
  // Crear enviando los query params que exige el backend
  crear: async (tercero: Tercero, empresaId: number, usuarioId: number, esGlobal: boolean) => {
    const response = await api.post('/api/terceros', tercero, {
      params: { empresaId, usuarioId, esGlobal }
    });
    return response.data;
  },

  actualizar: async (id: number, tercero: Tercero) => {
    const response = await api.put(`/api/terceros/${id}`, tercero);
    return response.data;
  },

  eliminar: async (id: number) => {
    const response = await api.delete(`/api/terceros/${id}`);
    return response.data;
  }
};