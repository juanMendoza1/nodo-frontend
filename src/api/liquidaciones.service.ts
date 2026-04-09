// src/api/liquidaciones.service.ts
import api from './axios.config';

export const liquidacionesService = {
  // 1. Configurar contrato
  guardarAcuerdo: async (acuerdoData: any) => {
    const response = await api.post('/api/liquidaciones/acuerdo', acuerdoData);
    return response.data;
  },

  actualizarAcuerdo: async (id: number, acuerdoData: any) => {
    const response = await api.put(`/api/liquidaciones/acuerdo/${id}`, acuerdoData);
    return response.data;
  },

  registrarNovedad: async (acuerdoId: number, novedadData: any) => {
    const response = await api.post(`/api/liquidaciones/novedad/acuerdo/${acuerdoId}`, novedadData);
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
  },

  obtenerHistorialAcuerdos: async (slotId: number) => {
    // Nota: Crearemos este endpoint en el backend luego
    const response = await api.get(`/api/liquidaciones/acuerdos/historial/${slotId}`);
    return response.data;
  },

  eliminarAcuerdo: async (acuerdoId: number) => {
    const response = await api.delete(`/api/liquidaciones/acuerdo/${acuerdoId}`);
    return response.data;
  },
  obtenerHistorialPagos: async (slotId: number) => {
    const response = await api.get(`/api/liquidaciones/pagos/historial/${slotId}`);
    return response.data;
  },
  obtenerNovedadesPendientes: async (acuerdoId: number) => {
    const response = await api.get(`/api/liquidaciones/novedades/pendientes/acuerdo/${acuerdoId}`);
    return response.data;
  },
};