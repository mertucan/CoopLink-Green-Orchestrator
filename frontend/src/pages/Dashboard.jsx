import { Boxes, HandCoins, Leaf, Utensils } from 'lucide-react'
import CarbonChart from '../components/CarbonChart'
import StatCard from '../components/StatCard'
import SwapCard from '../components/SwapCard'
import { useAuth } from '../hooks/useAuth'
import { useStats } from '../hooks/useStats'
import { useSwaps } from '../hooks/useSwaps'

export default function Dashboard({ goTo }) {
  const { isAdmin } = useAuth()
  const { data: stats, isLoading, isError } = useStats()
  const { data: swaps = [] } = useSwaps('pending')
  if (isLoading) return <div className="p-6 text-moss">Panel yükleniyor...</div>
  if (isError) return <div className="panel p-6 text-red-700">Panel verileri alınamadı.</div>
  return (
    <div className="space-y-6">
      <section className="soft-panel p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-leaf">Canlı özet</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Panel</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={() => goTo('operations')} className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">Operasyon</button>
            )}
            <button onClick={() => goTo('inventory')} className="focus-ring rounded-md bg-white px-4 py-2 text-sm font-medium text-moss shadow-sm">Stoklar</button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Gıda" value={stats?.total_food_saved_kg ?? 0} unit="kg" icon={Boxes} />
        <StatCard title="Öğün" value={formatNumber(stats?.total_saved_meals ?? 0)} icon={Utensils} />
        <StatCard title="CO2" value={stats?.total_carbon_saved_kg ?? 0} unit="kg" icon={Leaf} />
        <StatCard title="Değer" value={formatCurrencyCompact(stats?.total_local_value_tl ?? 0)} icon={HandCoins} />
      </div>

      <section className="panel p-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <ImpactMetric label="Hafta gıda" value={`${formatNumber(stats?.this_week?.food_saved_kg ?? 0)} kg`} />
          <ImpactMetric label="Hafta öğün" value={formatNumber(stats?.this_week?.saved_meals ?? 0)} />
          <ImpactMetric label="Hafta CO2" value={`${formatNumber(stats?.this_week?.carbon_saved_kg ?? 0)} kg`} />
          <ImpactMetric label="Hafta değer" value={formatCurrency(stats?.this_week?.local_value_tl ?? 0)} />
        </div>
      </section>

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR')
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`
}

function formatCurrencyCompact(value) {
  return Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value || 0)) + ' TL'
}

function ImpactMetric({ label, value }) {
  return (
    <div className="rounded-md border border-[#edf2ed] bg-[#fbfdfb] p-3">
      <p className="text-moss">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  )
}
