// src/types/mesas.types.ts

export interface MesaDTO {
  id: number;
  idMesaLocal: number;
  nombre: string;
  estado: 'DISPONIBLE' | 'ABIERTO' | 'OCUPADA';
  tipoJuego?: string;
  tarifaTiempo?: number;
  reglaDuelo?: string;
  fechaApertura?: number;
  usuarioActual?: { alias: string; login: string }; 
}