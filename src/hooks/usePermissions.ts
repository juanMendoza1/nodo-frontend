import { useMemo } from 'react';

export const usePermissions = () => {
  // Usamos useMemo para no recalcular esto en cada renderizado innecesariamente
  return useMemo(() => {
    const usuarioString = localStorage.getItem('usuario');
    const usuarioData = usuarioString ? JSON.parse(usuarioString) : null;

    const permisos: string[] = usuarioData?.permisos || [];
    const roles: string[] = usuarioData?.roles || [];
    
    const isSuperAdmin = roles.includes('SUPER') || roles.includes('ROLE_SUPER');

    // Valida si tiene un módulo específico
    const hasModule = (moduleCode: string) => {
      if (isSuperAdmin) return true; // El SuperAdmin es Dios, lo ve todo
      return permisos.includes(moduleCode);
    };

    // Valida si tiene AL MENOS UNO de una lista de módulos
    const hasAnyModule = (moduleCodes: string[]) => {
      if (isSuperAdmin) return true;
      return moduleCodes.some(code => permisos.includes(code));
    };

    // Valida si tiene TODOS los módulos de una lista
    const hasAllModules = (moduleCodes: string[]) => {
      if (isSuperAdmin) return true;
      return moduleCodes.every(code => permisos.includes(code));
    };

    return {
      usuarioData,
      permisos,
      roles,
      isSuperAdmin,
      hasModule,
      hasAnyModule,
      hasAllModules
    };
  }, []);
};