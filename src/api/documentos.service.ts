import api from './axios.config';

export const documentosService = {
  
  // 1. Ejecuta el motor en memoria y devuelve el recibo (Proforma)
  preliquidar: async (payload: any) => {
    const response = await api.post('/api/documentos/preliquidar', payload);
    return response.data;
  },

  // 2. Ejecuta el motor, guarda en BD y afecta cartera (Sello Oficial)
  liquidar: async (payload: any) => {
    const response = await api.post('/api/documentos/liquidar', payload);
    return response.data;
  },

  // 3. Consultas para reportes y tablas
  obtenerHistorial: async (empresaId: number) => {
    const response = await api.get(`/api/documentos/empresa/${empresaId}/historial`);
    return response.data;
  },

  obtenerCartera: async (empresaId: number) => {
    const response = await api.get(`/api/documentos/empresa/${empresaId}/cartera`);
    return response.data;
  },

  obtenerPorId: async (id: number) => {
    const response = await api.get(`/api/documentos/${id}`);
    return response.data;
  },

  // 4. Poderes de Administrador
  reliquidar: async (id: number) => {
    const response = await api.post(`/api/documentos/${id}/reliquidar`);
    return response.data;
  }
};