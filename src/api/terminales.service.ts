import api from './axios.config';
import type { Terminal } from '../types/terminales.types';

export const terminalesService = {
  obtenerTerminales: async (empresaId: number): Promise<Terminal[]> => {
    const response = await api.get<Terminal[]>(`/api/terminales/empresa/${empresaId}`);
    return response.data;
  },

  generarQrActivacion: async (empresaId: number, programaCod: string): Promise<string> => {
    const response = await api.post('/api/terminales/generar-qr', {
      empresaId: empresaId,
      programaCod: programaCod
    });
    return response.data.tokenRegistro; 
  },

  // 🔥 NUEVO: Obtener los cupos de la suscripción
  obtenerCupos: async (empresaId: number, programaCod: string) => {
    const response = await api.get('/api/terminales/cupos-disponibles', {
      params: { empresaId, programaCod }
    });
    return response.data; // Devuelve: { maxDispositivos, dispositivosActivos, disponibles }
  }
};