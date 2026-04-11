import api from './axios.config';

export const tiposDocumentosService = {
  obtenerTodos: async () => {
    const response = await api.get('/api/tipos-documentos');
    return response.data;
  },

  obtenerPorCodigo: async (codigo: string) => {
    const response = await api.get(`/api/tipos-documentos/${codigo}`);
    return response.data;
  }
};