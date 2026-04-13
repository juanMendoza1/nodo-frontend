import api from './axios.config';

export const permisosService = {
  obtenerTodos: async () => {
    const response = await api.get('/api/permisos');
    return response.data;
  },
  crear: async (data: any) => {
    const response = await api.post('/api/permisos', data);
    return response.data;
  },
  actualizar: async (id: number, data: any) => {
    const response = await api.put(`/api/permisos/${id}`, data);
    return response.data;
  },
  actualizarDependencias: async (id: number, dependenciasIds: number[]) => {
    const response = await api.put(`/api/permisos/${id}/dependencias`, dependenciasIds);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/api/permisos/${id}`);
    return response.data;
  }
};