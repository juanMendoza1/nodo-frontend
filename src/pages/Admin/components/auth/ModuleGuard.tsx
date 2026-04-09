import React, { ReactNode } from 'react';
import { usePermissions } from '../../../../hooks/usePermissions';

interface ModuleGuardProps {
  module?: string;          // Módulo único (Ej: 'MOD_CAJA')
  modules?: string[];       // Múltiples módulos (Ej: ['MOD_CAJA', 'MOD_INVENTARIO'])
  requireAll?: boolean;     // Si es true, debe tener TODOS los de la lista 'modules'
  children: ReactNode;      // Lo que se va a renderizar si tiene permiso
  fallback?: ReactNode;     // Lo que se muestra si NO tiene permiso (Por defecto nada / null)
}

export default function ModuleGuard({
  module,
  modules,
  requireAll = false,
  children,
  fallback = null
}: ModuleGuardProps) {
  const { hasModule, hasAnyModule, hasAllModules } = usePermissions();

  let hasAccess = false;

  if (module) {
    hasAccess = hasModule(module);
  } else if (modules && modules.length > 0) {
    hasAccess = requireAll ? hasAllModules(modules) : hasAnyModule(modules);
  } else {
    // Si no se pasa ningún requerimiento, se asume acceso libre
    hasAccess = true; 
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}