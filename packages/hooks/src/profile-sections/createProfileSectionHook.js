import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

function splitOptions(options = {}) {
  if ('query' in options || 'create' in options || 'update' in options || 'remove' in options || 'delete' in options) {
    return {
      query: options.query,
      create: options.create,
      update: options.update,
      remove: options.remove ?? options.delete,
    };
  }

  return { query: options };
}

function callSuccess(options, args) {
  options?.onSuccess?.(...args);
}

export function createProfileSectionHook({ queryKey, dataKey, service }) {
  return function useProfileSection(options) {
    const queryClient = useQueryClient();
    const hookOptions = splitOptions(options);

    const invalidateList = () => queryClient.invalidateQueries({ queryKey });

    const listQuery = useQuery({
      queryKey,
      queryFn: () => service.getAll().then((res) => res.data),
      ...hookOptions.query,
    });

    const createMutation = useMutation({
      ...hookOptions.create,
      mutationFn: (data) => service.create(data).then((res) => res.data),
      onSuccess: (...args) => {
        invalidateList();
        callSuccess(hookOptions.create, args);
      },
    });

    const updateMutation = useMutation({
      ...hookOptions.update,
      mutationFn: ({ id, data }) => service.update(id, data).then((res) => res.data),
      onSuccess: (...args) => {
        invalidateList();
        callSuccess(hookOptions.update, args);
      },
    });

    const deleteMutation = useMutation({
      ...hookOptions.remove,
      mutationFn: (id) => service.remove(id).then((res) => res.data),
      onSuccess: (...args) => {
        invalidateList();
        callSuccess(hookOptions.remove, args);
      },
    });

    return {
      [dataKey]: listQuery.data ?? [],
      listQuery,
      createMutation,
      updateMutation,
      deleteMutation,
      isLoading: listQuery.isLoading,
      create: (data) => createMutation.mutateAsync(data),
      update: (id, data) => updateMutation.mutateAsync({ id, data }),
      remove: (id) => deleteMutation.mutateAsync(id),
      ...listQuery,
    };
  };
}
