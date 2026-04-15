import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasService, type EmpresaData } from '../../api/empresas.service';
import toast from 'react-hot-toast';

// Llaves de caché (Para invalidarlas después de crear/editar)
export const EMPRESAS_KEYS = {
  all: ['empresas'] as const,
  detail: (id: number) => ['empresas', id] as const,
};

// 1. Hook para LEER datos (GET)
export const useEmpresas = () => {
  return useQuery({
    queryKey: EMPRESAS_KEYS.all,
    queryFn: async () => {
      const data = await empresasService.obtenerTodas();
      return data || [];
    }
  });
};

// 2. Hook para MODIFICAR datos (POST / PUT)
export const useMutateEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: number | null; payload: EmpresaData }) => {
      if (id) {
        return empresasService.actualizar(id, payload);
      }
      return empresasService.crear(payload);
    },
    onSuccess: (data, variables) => {
      // Magia pura: Invalidamos la caché y React Query hace el fetch de la nueva lista solito
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.all });
      toast.success(variables.id ? '¡Comercio actualizado!' : '¡Comercio registrado con éxito!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al guardar la empresa");
    }
  });
};

// 3. Hook para ELIMINAR datos (DELETE)
export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => empresasService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEYS.all });
      toast.success('Comercio eliminado correctamente');
    },
    onError: () => {
      toast.error('No se puede eliminar porque la empresa tiene historial asociado.');
    }
  });
};