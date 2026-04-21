import api from './axios.config';

export const configuracionService = {
  // Servicio dinámico puro para Clases, Estructuras y Unidades
  obtenerTodos: async (entidad: string) => {
    const response = await api.get(`/api/${entidad}`);
    return response.data;
  },
  
  crear: async (entidad: string, data: any) => {
    const response = await api.post(`/api/${entidad}`, data);
    return response.data;
  },

  actualizar: async (entidad: string, id: number, data: any) => {
    const response = await api.put(`/api/${entidad}/${id}`, data);
    return response.data;
  },

  eliminar: async (entidad: string, id: number) => {
    const response = await api.delete(`/api/${entidad}/${id}`);
    return response.data;
  },
  obtenerEstructurasPermitidas: async (empresaId: number) => {
    try {
      const response = await api.get(`/api/estructuras/empresa/${empresaId}/permitidas`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estructuras permitidas:", error);
      return [];
    }
  }
};