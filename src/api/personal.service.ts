import api from './axios.config';
import type { UsuarioSlot } from '../types/personal.types';

export const personalService = {
  obtenerSlotsPorEmpresa: async (empresaId: number): Promise<UsuarioSlot[]> => {
    // 👇 Fíjate que le agregamos /api al principio de la ruta 👇
    const response = await api.get<UsuarioSlot[]>(`/api/usuarios/empresa/${empresaId}`);
    return response.data;
  },

  crearSlot: async (empresaId: number, data: Partial<UsuarioSlot>) => {
    console.log("Falta crear endpoint POST en backend", data);
  },
  
  desbloquearSlot: async (slotId: number) => {
    console.log("Falta crear endpoint de desbloqueo en backend", slotId);
  }
};