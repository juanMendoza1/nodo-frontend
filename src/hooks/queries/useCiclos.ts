import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ciclosService } from '../../api/ciclos.service';
import type { CicloData, PeriodoUpdateData } from '../../api/ciclos.service';
import toast from 'react-hot-toast';

export const CICLOS_KEYS = {
  all: ['ciclos'] as const,
  periodos: (cicloId: number) => ['ciclos', cicloId, 'periodos'] as const,
};

// 1. Hook para obtener Ciclos
export const useCiclos = () => {
  return useQuery({
    queryKey: CICLOS_KEYS.all,
    queryFn: ciclosService.obtenerTodos,
  });
};

// 2. Hook para mutar (Crear/Editar) Ciclos
export const useMutateCiclo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number | null; payload: CicloData }) => {
      return id ? ciclosService.actualizar(id, payload) : ciclosService.crear(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CICLOS_KEYS.all });
      toast.success('¡Ciclo guardado exitosamente!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al guardar el ciclo')
  });
};

// 3. Hook para obtener Periodos de un Ciclo
export const usePeriodos = (cicloId: number | null) => {
  return useQuery({
    queryKey: CICLOS_KEYS.periodos(cicloId!),
    queryFn: () => ciclosService.obtenerPeriodos(cicloId!),
    enabled: !!cicloId, // Solo se ejecuta si hay un ciclo seleccionado
  });
};

// 4. Hook Genérico para Acciones de Periodos (Abrir, Procesar, Cerrar, Proyectar, Editar Fechas)
export const useAccionPeriodo = (cicloId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accion, periodoId, anio, payload }: { accion: string, periodoId?: number, anio?: number, payload?: PeriodoUpdateData }) => {
      switch (accion) {
        case 'PROYECTAR': return ciclosService.proyectarAnio(cicloId, anio!);
        case 'ABRIR': return ciclosService.abrirPeriodo(periodoId!);
        case 'PROCESAR': return ciclosService.procesarPeriodo(periodoId!);
        case 'CERRAR': return ciclosService.cerrarPeriodo(periodoId!);
        case 'EDITAR_FECHAS': return ciclosService.actualizarFechasPeriodo(periodoId!, payload!);
        default: throw new Error('Acción no soportada');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CICLOS_KEYS.periodos(cicloId) });
      if (variables.accion !== 'EDITAR_FECHAS') {
        toast.success(data.mensaje || 'Acción ejecutada correctamente');
      } else {
        toast.success('Fechas del periodo actualizadas.');
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al ejecutar la acción')
  });
};