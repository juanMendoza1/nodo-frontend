import api from './axios.config';
import type { LoginResponse } from '../types/auth.types'; 

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
  
  switchContext: async (empresaId: number): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(`/auth/switch-context/${empresaId}`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
};