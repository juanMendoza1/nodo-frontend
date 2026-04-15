// src/api/suscripciones.service.ts
import api from './axios.config';

export interface SuscripcionData {
  id?: number;
  empresa?: { id: number; nombreComercial?: string };
  programa?: { id: number; nombre?: string; codigo?: string };
  cicloFacturacion?: { id: number; nombre?: string };
  maxDispositivos: number;
  dispositivosActivos?: number;
  fechaVencimiento?: string | null;
  activo: boolean;
}

export const suscripcionesService = {
  obtenerTodas: async () => {
    const response = await api.get('/api/suscripciones');
    return response.data;
  },
  crear: async (data: any) => {
    const response = await api.post('/api/suscripciones', data);
    return response.data;
  },
  actualizar: async (id: number, data: any) => {
    const response = await api.put(`/api/suscripciones/${id}`, data);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/api/suscripciones/${id}`);
    return response.data;
  }
};