import api from './axios.config';

export interface Tercero {
  id?: number;
  documento: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  telefono?: string;
  correo?: string;
}

export const tercerosService = {
  // Exclusivo para el SuperAdmin: trae absolutamente todos
  obtenerTodos: async (): Promise<Tercero[]> => {
    const response = await api.get<Tercero[]>('/api/terceros/admin/todos');
    return response.data;
  },

  // Crear un nuevo tercero
  crear: async (tercero: Partial<Tercero>, empresaId: number, usuarioId: number, esGlobal: boolean): Promise<Tercero> => {
    // Autogeneramos el nombre completo si no viene
    const dataToSend = {
      ...tercero,
      nombreCompleto: tercero.nombreCompleto || `${tercero.nombre} ${tercero.apellido}`.trim()
    };

    const response = await api.post<Tercero>('/api/terceros', dataToSend, {
      params: { empresaId, usuarioId, esGlobal }
    });
    return response.data;
  }
};