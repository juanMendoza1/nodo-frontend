// src/api/documentos.service.ts
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

  liquidarLote: async (payload: any) => {
    const { data } = await api.post('/api/documentos/liquidar-lote', payload);
    return data;
  },

  // 3. Consultas para reportes y tablas (AHORA SOPORTA FILTROS Y PAGINACIÓN)
  obtenerHistorial: async (empresaId: number, page: number = 0, size: number = 10) => {
    const response = await api.get(`/api/documentos/empresa/${empresaId}/historial`, {
      params: { page, size }
    });
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
  },

  // ==========================================
  // 🔥 NUEVOS MÉTODOS PARA NOTAS CONTABLES
  // ==========================================
  
  // Busca una factura específica por consecutivo para usarla como padre
  buscarPadrePorConsecutivo: async (empresaId: number, consecutivo: string) => {
    const response = await api.get(`/api/documentos/empresa/${empresaId}/buscar-padre`, {
      params: { consecutivo }
    });
    return response.data;
  },

  // Emite la Nota Contable (NC/ND) afectando los saldos
  emitirNota: async (payload: any) => {
    const response = await api.post('/api/documentos/emitir-nota', payload);
    return response.data;
  }
};