import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get('/stats')).data,
    refetchInterval: 30000
  })
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await api.get('/stats/leaderboard')).data.items || []
  })
}

