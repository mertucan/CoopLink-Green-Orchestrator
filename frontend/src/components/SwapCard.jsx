import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from './ToastProvider'
import { useUpdateSwap } from '../hooks/useSwaps'

export default function SwapCard({ swap }) {
  const updateSwap = useUpdateSwap()
  const { showToast } = useToast()
  const [action, setAction] = useState(null)
  const pending = swap.status === 'pending'
  const handleUpdate = (status) => {
    setAction(status)
    updateSwap.mutate(
      { id: swap.id, status },
      {
        onSuccess: (result) => {
          const approved = result.status === 'approved'
          const item = result.item || swap
          const title = approved ? 'Takas onaylandı' : 'Takas reddedildi'
          const description = result.message || (
            approved
              ? `${item.from_cooperative_name || 'Kooperatif'} +${result.points_earned || 0} yeşil puan aldı.`
              : `${item.product_name || 'Ürün'} takası reddedildi.`
          )
          showToast({ type: approved ? 'success' : 'info', title, description })
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Takas güncellenemedi',
            description: error?.response?.data?.detail || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
          })
        },
        onSettled: () => setAction(null)
      }
    )
  }
  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{swap.quantity_kg} kg {swap.product_name || 'ürün'} takası</p>
          <p className="mt-1 text-sm text-moss">Kimden: {swap.from_cooperative_name || swap.from_cooperative_id}</p>
          <p className="text-sm text-moss">Kime: {swap.to_cooperative_name || swap.to_cooperative_id}</p>
        </div>
        <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-moss">{swap.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>Skor: <strong>{Number(swap.match_score || 0).toFixed(2)}</strong></div>
        <div>CO2: <strong>{Number(swap.carbon_saved_kg || 0).toFixed(1)} kg</strong></div>
      </div>
      {pending && (
        <div className="mt-4 flex gap-2">
          <button
            className="flex h-9 w-24 items-center justify-center gap-2 rounded-md bg-leaf px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action !== null}
            onClick={() => handleUpdate('approved')}
          >
            <Check size={16} /> {action === 'approved' ? '...' : 'Onayla'}
          </button>
          <button
            className="flex h-9 w-24 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action !== null}
            onClick={() => handleUpdate('rejected')}
          >
            <X size={16} /> {action === 'rejected' ? '...' : 'Reddet'}
          </button>
        </div>
      )}
    </article>
  )
}
