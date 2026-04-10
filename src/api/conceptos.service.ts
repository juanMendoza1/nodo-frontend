import api from './axios.config';

export const conceptosService = {
  obtenerTodos: async () => {
    const response = await api.get('/api/conceptos');
    return response.data;
  },
  obtenerDisponibles: async (empresaId: number, programaId: number) => {
    const response = await api.get('/api/conceptos/disponibles', {
      params: { empresaId, programaId }
    });
    return response.data;
  },
  crear: async (data: any) => {
    const response = await api.post('/api/conceptos', data);
    return response.data;
  },
  actualizar: async (id: number, data: any) => {
    const response = await api.put(`/api/conceptos/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/api/conceptos/${id}`);
    return response.data;
  }
};