import axiosInstance from './axios.config';

export interface CicloData {
  id?: number;
  nombre: string;
  frecuencia: string; // MENSUAL, BIMENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
  diaCorte: number;
  diasGracia: number;
  activo: boolean;
}

export interface PeriodoUpdateData {
  fechaInicio?: string;
  fechaFin?: string;
  fechaCorte?: string;
  fechaVencimientoPago?: string;
}

export const ciclosService = {
  // --- CRUD CICLOS ---
  obtenerTodos: async () => {
    const { data } = await axiosInstance.get('/api/ciclos-facturacion');
    return data;
  },
  crear: async (payload: CicloData) => {
    const { data } = await axiosInstance.post('/api/ciclos-facturacion', payload);
    return data;
  },
  actualizar: async (id: number, payload: CicloData) => {
    const { data } = await axiosInstance.put(`/api/ciclos-facturacion/${id}`, payload);
    return data;
  },

  // --- GESTIÓN DE PERIODOS ---
  obtenerPeriodos: async (cicloId: number) => {
    const { data } = await axiosInstance.get(`/api/ciclos-facturacion/${cicloId}/periodos`);
    return data;
  },
  proyectarAnio: async (cicloId: number, anio: number) => {
    const { data } = await axiosInstance.post(`/api/ciclos-facturacion/${cicloId}/proyectar/${anio}`);
    return data;
  },

  // --- MÁQUINA DE ESTADOS (Manejo de flujo) ---
  abrirPeriodo: async (periodoId: number) => {
    const { data } = await axiosInstance.put(`/api/ciclos-facturacion/periodos/${periodoId}/abrir`);
    return data;
  },
  procesarPeriodo: async (periodoId: number) => {
    const { data } = await axiosInstance.put(`/api/ciclos-facturacion/periodos/${periodoId}/procesar`);
    return data;
  },
  cerrarPeriodo: async (periodoId: number) => {
    const { data } = await axiosInstance.put(`/api/ciclos-facturacion/periodos/${periodoId}/cerrar`);
    return data;
  },
  
  // --- ACTUALIZACIÓN DE FECHAS (La Gabela) ---
  actualizarFechasPeriodo: async (periodoId: number, payload: PeriodoUpdateData) => {
    const { data } = await axiosInstance.put(`/api/periodos-facturacion/${periodoId}`, payload);
    return data;
  }
};