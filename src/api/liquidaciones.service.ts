// src/api/liquidaciones.service.ts
import api from './axios.config';

export const liquidacionesService = {
  // 1. Configurar contrato
  guardarAcuerdo: async (acuerdoData: any) => {
    const response = await api.post('/api/liquidaciones/acuerdo', acuerdoData);
    return response.data;
  },

  // 2. Registrar Bonos o Descuentos
  registrarNovedad: async (novedadData: any) => {
    const response = await api.post('/api/liquidaciones/novedad', novedadData);
    return response.data;
  },

  // 3. Previsualizar el borrador
  previsualizar: async (empresaId: number, slotId: number, fechaInicio: string, fechaFin: string) => {
    const response = await api.get('/api/liquidaciones/previsualizar', {
      params: { empresaId, slotId, fechaInicio, fechaFin }
    });
    return response.data;
  },

  obtenerAcuerdo: async (slotId: number) => {
    const response = await api.get(`/api/liquidaciones/acuerdo/${slotId}`);
    return response.data;
  },

  obtenerResumenVentas: async (slotId: number, fechaInicio: string, fechaFin: string) => {
    const response = await api.get('/api/liquidaciones/ventas-resumen', {
      params: { slotId, fechaInicio, fechaFin }
    });
    return response.data;
  },

  finalizarAcuerdo: async (acuerdoId: number) => {
    const response = await api.put(`/api/liquidaciones/acuerdo/${acuerdoId}/finalizar`);
    return response.data;
  },

  // 4. Generar pago oficial
  generarPago: async (empresaId: number, slotId: number, fechaInicio: string, fechaFin: string, adminId: number) => {
    const response = await api.post('/api/liquidaciones/generar', null, {
      params: { empresaId, slotId, fechaInicio, fechaFin, adminId }
    });
    return response.data;
  }
};