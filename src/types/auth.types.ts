export interface LoginResponse {
  token: string;
  username: string;
  empresaId: number;
  terceroId: number;
  nombreEmpresa: string;
  roles: string[];
  permisos: string[];
  programas: string[];
  usuarioId: number;
}