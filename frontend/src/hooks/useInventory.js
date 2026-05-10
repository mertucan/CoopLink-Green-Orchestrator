import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useInventory(cooperativeId) {
  return useQuery({
    queryKey: ['inventory', cooperativeId],
    queryFn: async () => (await api.get('/inventory', { params: { cooperative_id: cooperativeId || undefined } })).data.items || []
  })
}

export function useCooperatives() {
  return useQuery({
    queryKey: ['cooperatives'],
    queryFn: async () => (await api.get('/cooperatives')).data.items || []
  })
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data.items || []
  })
}
