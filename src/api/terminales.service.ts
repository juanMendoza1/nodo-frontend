import api from './axios.config';
import type { Terminal } from '../types/terminales.types';

export const terminalesService = {
  obtenerTerminales: async (empresaId: number): Promise<Terminal[]> => {
    // Esto ya funcionará en cuanto agregues el endpoint en Java
    const response = await api.get<Terminal[]>(`/api/terminales/empresa/${empresaId}`);
    return response.data;
  },

  generarQrActivacion: async (empresaId: number, programaCod: string): Promise<string> => {
    // Mandamos el JSON exacto que tu backend pide en el @RequestBody Map<String, Object> payload
    const response = await api.post('/api/terminales/generar-qr', {
      empresaId: empresaId,
      programaCod: programaCod
    });
    // Tu backend devuelve un JSON con { "tokenRegistro": "...", "mensaje": "..." }
    return response.data.tokenRegistro; 
  }
};