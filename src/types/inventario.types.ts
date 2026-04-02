export interface Producto {
  id: number;
  codigoBase: string;
  nombre: string;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
  
  // Relaciones (Asumiendo que tu DTO devuelve los nombres)
  claseNombre: string;      // Ej: BEBIDAS
  estructuraNombre: string; // Ej: CERVEZAS
  unidadNombre: string;     // Ej: UNIDAD / BOTELLA
  
  activo: boolean;
}