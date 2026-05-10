import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAssistantMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ message, channelId = 'admin-panel' }) => (
      await api.post('/assistant/message', { message, channel_id: channelId })
    ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] })
      queryClient.invalidateQueries({ queryKey: ['swaps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}

