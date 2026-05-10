import { Boxes, Handshake, Leaf, Users } from 'lucide-react'
import CarbonChart from '../components/CarbonChart'
import StatCard from '../components/StatCard'
import SwapCard from '../components/SwapCard'
import { useStats } from '../hooks/useStats'
import { useSwaps } from '../hooks/useSwaps'

export default function Dashboard({ goTo }) {
  const { data: stats, isLoading, isError } = useStats()
  const { data: swaps = [] } = useSwaps('pending')
  if (isLoading) return <div className="p-6 text-moss">Panel yükleniyor...</div>
  if (isError) return <div className="panel p-6 text-red-700">Panel verileri alınamadı. Backend servisinin çalıştığından emin olun.</div>
  return (
    <div className="space-y-6">
      <section className="soft-panel p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-leaf">Canlı ağ özeti</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Kooperatif Operasyon Paneli</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-moss">
              Stok riski, takas onayları, karbon etkisi ve yeşil puan performansı tek akışta izlenir.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => goTo('operations')} className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">Operasyon Merkezi</button>
            <button onClick={() => goTo('inventory')} className="focus-ring rounded-md bg-white px-4 py-2 text-sm font-medium text-moss shadow-sm">Riskli Stoklar</button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Kurtarılan Gıda" value={stats?.total_food_saved_kg ?? 0} unit="kg" icon={Boxes} />
        <StatCard title="CO2 Tasarrufu" value={stats?.total_carbon_saved_kg ?? 0} unit="kg" icon={Leaf} />
        <StatCard title="Toplam Takas" value={stats?.total_swaps ?? 0} icon={Handshake} />
        <StatCard title="Aktif Kooperatif" value={stats?.active_cooperatives ?? 0} icon={Users} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <CarbonChart data={stats?.weekly_carbon} />
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Bekleyen takaslar</h2>
            <button onClick={() => goTo('swaps')} className="rounded-md bg-mist px-3 py-2 text-sm font-medium text-moss">Detay</button>
          </div>
          {swaps.slice(0, 5).map((swap) => <SwapCard key={swap.id || `${swap.from_cooperative_id}-${swap.product_id}`} swap={swap} />)}
          {swaps.length === 0 && <div className="panel p-4 text-sm text-moss">Bekleyen takas yok.</div>}
        </section>
      </div>
    </div>
  )
}
