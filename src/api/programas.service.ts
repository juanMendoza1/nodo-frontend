import api from './axios.config';

export interface ProgramaData {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  activo: boolean;
  dominioOperativo?: string;
  permisosIds?: number[]; 
  permisosCodigos?: string[];
  estructurasIds?: number[];
  estructurasCodigos?: string[];
}

export const programasService = {
  obtenerTodos: async () => {
    const response = await api.get('/api/programas');
    return response.data;
  },
  crear: async (data: ProgramaData) => {
    const response = await api.post('/api/programas', data);
    return response.data;
  },
  actualizar: async (id: number, data: ProgramaData) => {
    const response = await api.put(`/api/programas/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/api/programas/${id}`);
    return response.data;
  }
};