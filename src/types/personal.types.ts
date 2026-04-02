export interface UsuarioSlot {
  id?: number;
  nombreCompleto: string; // El Backend lo devuelve como nombreCompleto, pero internamente es el Alias
  login: string;
  password?: string; // Lo usamos solo al crear/editar para mandar el PIN nuevo
  rolUsuario?: string;
  estado?: string; // 'ACTIVO' o 'INACTIVO' (o 'BLOQUEADO')
}