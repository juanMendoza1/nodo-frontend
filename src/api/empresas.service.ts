import axiosInstance from './axios.config';

// 1. Interfaz actualizada alineada con el nuevo Backend (Spring Boot)
export interface EmpresaData {
  id?: number;
  nombreComercial: string; // Antes razonSocial
  activo: boolean;         // Antes estado string
  // Relaciones necesarias para la creación/edición
  tercero?: { id: number }; 
  giroNegocio?: { id: number };
}

// 2. Funciones exportadas (Mantenemos tus nombres originales para no romper nada)
export const getEmpresas = async () => {
  const response = await axiosInstance.get('/api/empresas');
  return response.data;
};

export const createEmpresa = async (data: EmpresaData) => {
  const response = await axiosInstance.post('/api/empresas', data);
  return response.data;
};

// 3. Nuevas funciones necesarias para el CRUD completo del Admin
export const updateEmpresa = async (id: number, data: EmpresaData) => {
  const response = await axiosInstance.put(`/api/empresas/${id}`, data);
  return response.data;
};

export const deleteEmpresa = async (id: number) => {
  const response = await axiosInstance.delete(`/api/empresas/${id}`);
  return response.data;
};

export const getEmpresasPorPropietario = async (terceroId: number) => {
  const response = await axiosInstance.get(`/api/empresas/propietario/${terceroId}`);
  return response.data;
};

export const empresasService = {
  obtenerTodas: getEmpresas,
  obtenerPorPropietario: getEmpresasPorPropietario,
  crear: createEmpresa,
  actualizar: updateEmpresa,
  eliminar: deleteEmpresa
};