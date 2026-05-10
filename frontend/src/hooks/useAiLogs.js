import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAiLogs(limit = 25) {
  return useQuery({
    queryKey: ['ai-logs', limit],
    queryFn: async () => (await api.get('/ai-logs', { params: { limit } })).data.items || [],
    refetchInterval: 15000
  })
}

