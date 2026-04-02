// Archivo: src/types/personal.types.ts

export interface UsuarioSlot {
  id: number;
  nombreCompleto: string; // En el backend este es el 'alias' (Ej: MESERO ALEJO)
  login: string;          // Ej: M1_ALEJO
  passwordHash: string;
  rolUsuario: string;     // Ej: OPERATIVO
  
  // Estos los agregaremos al backend después, pero los preparamos en el front
  bloqueado?: boolean; 
  intentosFallidos?: number;
}