export interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
  categoriaId?: number;
  categoriaNombre?: string;
  unidadMedidaId?: number;
  unidadMedidaNombre?: string;
  activo?: boolean;
}

export interface UnidadParametro {
  id: number;
  codigo: string;
  nombre: string;
}

export interface DashboardStats {
  totalProductos: number;
  productosBajoStock: number;
  terminalesActivas: number;
  personalActivo: number;
}

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  cantidad: number;
  productoNombre: string;
  creador: string;
  referencia: string;
}