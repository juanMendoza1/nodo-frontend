import api from './axios.config';
import type { UsuarioSlot } from '../types/personal.types';

export const personalService = {
  obtenerSlotsPorEmpresa: async (empresaId: number): Promise<UsuarioSlot[]> => {
    const response = await api.get<UsuarioSlot[]>(`/api/usuarios/empresa/${empresaId}`);
    // Tu backend devuelve un UsuarioSlotDTO. Verificamos que tenga estado, si no, asumimos ACTIVO por defecto para la UI
    return response.data;
  },

  guardarSlot: async (empresaId: number, slot: UsuarioSlot): Promise<void> => {
    // Mapeamos 'nombreCompleto' a 'alias' para que el backend lo entienda
    const payload = {
      id: slot.id,
      alias: slot.nombreCompleto, 
      login: slot.login,
      password: slot.password
    };
    await api.post(`/api/usuarios/empresa/${empresaId}/slots`, payload);
  },

  cambiarEstadoSlot: async (slotId: number): Promise<void> => {
    await api.put(`/api/usuarios/slots/${slotId}/estado`);
  }
};