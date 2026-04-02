export interface LoginResponse {
  token: string;
  username: string;
  empresaId: number;
  nombreEmpresa: string;
  roles: string[];
  permisos: string[];
  programas: string[];
}