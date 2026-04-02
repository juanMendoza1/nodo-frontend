export interface Terminal {
  id: number;
  codigo: string;        // Ej: TAB-001
  nombre: string;        // Ej: Tablet Barra Principal
  estado: 'ACTIVA' | 'INACTIVA' | 'PENDIENTE';
  macAddress?: string;
  ultimaConexion?: string;
}

export interface QrResponse {
  terminalId: number;
  qrBase64: string;      // El backend nos enviaría la imagen en Base64
  pinManual: string;     // PIN de 6 dígitos por si la cámara de la tablet falla
  expiracion: string;
}