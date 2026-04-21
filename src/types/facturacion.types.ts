// src/types/facturacion.types.ts

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza?: 'SUMA' | 'RESTA' | 'S' | 'R';
}

// 🔥 Renombramos "Concepto" a "ConceptoFacturacion" para evitar colisiones 
// con otras partes de la app y coincidir con LiquidacionesMaster.tsx
export interface ConceptoFacturacion {
  id: number;
  codigo: string;
  nombre: string;
  tipoCalculo: 'ESTATICO' | 'DINAMICO' | 'FORMULA';
  naturaleza: 'SUMA' | 'RESTA' | 'S' | 'R';
  valorFijo?: number;
  formula?: string;
  esRecaudable: boolean;
}

export interface LiquidacionPlantilla {
  id: number;
  codigo: string;
  nombre: string;
  programa?: { id: number; nombre: string; codigo: string };
  tipoDocumentoGenerado?: TipoDocumento;
}

export interface ConceptoRelacionadoItem {
  conceptoId: number;
  conceptoNombre: string;
  codigo: string;
  ordenCalculo: number;
}

export interface NovedadFacturacion {
  codigo: string;
  nombre: string;
  valor: number;
  tipo: 'S' | 'R';
}

export interface CicloFacturacion {
  id: number;
  nombre: string;
  frecuencia: string;
}

export interface PeriodoFacturacion {
  id: number;
  anioOrigen: number;
  mesOrigen: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'EN_ESPERA' | 'ABIERTO' | 'LIQUIDANDO' | 'CERRADO';
}

export interface SuscripcionFacturacion {
  id: number;
  empresa: { 
    id: number; 
    nombreComercial: string; 
    tercero: { id: number; documento: string } 
  };
  programa: { id: number; nombre: string; codigo: string };
  cicloFacturacion: CicloFacturacion;
  liquidacion?: LiquidacionPlantilla;
  dispositivosActivos: number;
}