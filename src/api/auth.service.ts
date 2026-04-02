// Archivo: src/api/auth.service.ts

import api from './axios.config';
import type { LoginResponse } from '../types/auth.types'; // <-- Esta es la línea clave

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
};