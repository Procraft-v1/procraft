import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTemplates, selectTemplate } from '@procraft/services';

export const TEMPLATES_KEY = ['templates', 'list'];
export const PROFILE_ME_KEY = ['profile', 'me'];

export function useTemplates(options) {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: () => getTemplates().then((res) => res.data),
    ...options,
  });
}

export function useSelectTemplate(options) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (templateId) => selectTemplate(templateId).then((res) => res.data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_ME_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
