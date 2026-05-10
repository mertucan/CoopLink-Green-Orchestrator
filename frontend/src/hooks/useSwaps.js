import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useSwaps(status) {
  return useQuery({
    queryKey: ['swaps', status],
    queryFn: async () => (await api.get('/swaps', { params: { status } })).data.items || []
  })
}

export function useUpdateSwap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/swaps/${id}`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })
}

export function useProposeSwap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ inventoryId }) => (await api.post('/swaps/propose', { inventory_id: inventoryId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })
}
