import { useState } from 'react'
import SwapCard from '../components/SwapCard'
import { useAuth } from '../hooks/useAuth'
import { useSwaps } from '../hooks/useSwaps'

const tabs = [
  ['pending', 'Bekleyen'],
  ['approved', 'Onaylanan'],
  ['rejected', 'Reddedilen']
]

export default function Swaps() {
  const { isCooperative } = useAuth()
  const [status, setStatus] = useState('pending')
  const { data: swaps = [], isLoading, isError } = useSwaps(status)
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-ink">{isCooperative ? 'Size önerilen takaslar' : 'Takas yönetimi'}</h1>
        <div className="flex rounded-md border border-[#dfe8df] bg-white p-1">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setStatus(id)} className={`rounded px-3 py-2 text-sm ${status === id ? 'bg-leaf text-white' : 'text-moss'}`}>{label}</button>
          ))}
        </div>
      </div>
      {isLoading && <div className="panel p-4 text-moss">Takaslar yükleniyor...</div>}
      {isError && <div className="panel p-4 text-red-700">Takas verileri alınamadı.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {swaps.map((swap) => <SwapCard key={swap.id || `${swap.from_cooperative_id}-${swap.to_cooperative_id}`} swap={swap} />)}
      </div>
      {!isLoading && !isError && swaps.length === 0 && <div className="panel p-4 text-moss">Bu durumda takas yok.</div>}
    </div>
  )
}
