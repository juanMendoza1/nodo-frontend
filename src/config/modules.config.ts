import { 
  LayoutDashboard, Utensils, Store, Calculator, Users, Tablet, Receipt, Settings, FileText 
} from 'lucide-react';

export interface ModuleConfig {
  code: string; label: string; path: string; icon: any;
}

export const MODULES_DICTIONARY: Record<string, ModuleConfig> = {
  MOD_DASHBOARD: { code: 'MOD_DASHBOARD', label: 'Panel Principal', path: '', icon: LayoutDashboard },
  MOD_INVENTARIO: { code: 'MOD_INVENTARIO', label: 'Inventario', path: 'inventario', icon: Store },
  MOD_CAJA: { code: 'MOD_CAJA', label: 'Caja Operativa', path: 'caja', icon: Calculator },
  MOD_MESAS: { code: 'MOD_MESAS', label: 'Mesas y Salón', path: 'mesas', icon: Utensils },
  MOD_PERSONAL: { code: 'MOD_PERSONAL', label: 'Personal y Slots', path: 'personal', icon: Users },
  MOD_TABLETS: { code: 'MOD_TABLETS', label: 'Dispositivos QR', path: 'terminales', icon: Tablet },
  // 🔥 IMPORTANTE: Cambié MOD_FACTURACION por MOD_LIQUID_SLOT para que coincida con tu Back
  MOD_LIQUID_SLOT: { code: 'MOD_LIQUID_SLOT', label: 'Liquidaciones', path: 'liquidaciones', icon: Receipt }
};

export const SHARED_ADMIN_MENU = [
  { label: 'Mi Comercio', path: 'ajustes', icon: Settings }
];