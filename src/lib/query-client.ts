import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 detik - data dianggap fresh
      gcTime: 5 * 60 * 1000, // 5 menit - cache disimpan
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
