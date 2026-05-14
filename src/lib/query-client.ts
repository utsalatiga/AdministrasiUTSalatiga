import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 menit - data dianggap fresh
      gcTime: 10 * 60 * 1000, // 10 menit - cache disimpan lebih lama
      refetchOnWindowFocus: false, // Penting agar tidak loading saat pindah tab
      retry: 1, // Hanya retry 1 kali jika gagal
    },
  },
})
