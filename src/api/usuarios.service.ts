import api from './axios.config';

export interface UsuarioData {
  id?: number;
  login: string;
  password?: string; // Opcional al actualizar si no queremos cambiarla
  estado: string;    // Manejará el Enum (ACTIVO, INACTIVO, BLOQUEADO)
  tercero?: { id: number };
  empresa?: { id: number };
  rolId?: number;
}

export const usuariosService = {
  obtenerTodos: async () => {
    const response = await api.get('/api/usuarios');
    return response.data;
  },
  crear: async (data: UsuarioData) => {
    const response = await api.post('/api/usuarios', data);
    return response.data;
  },
  actualizar: async (id: number, data: UsuarioData) => {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/api/usuarios/${id}`);
    return response.data;
  }
};