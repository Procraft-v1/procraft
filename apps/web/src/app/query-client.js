import { QueryClient } from '@tanstack/react-query';

export function createWebQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
