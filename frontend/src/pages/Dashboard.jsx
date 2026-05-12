import { Boxes, HandCoins, Leaf, Utensils } from 'lucide-react'
import StatCard from '../components/StatCard'
import SwapCard from '../components/SwapCard'
import { useAuth } from '../hooks/useAuth'
import { useStats } from '../hooks/useStats'
import { useSwaps } from '../hooks/useSwaps'

export default function Dashboard({ goTo }) {
  const { isAdmin, user } = useAuth()
  const { data: stats, isLoading, isError } = useStats()
  const { data: swaps = [] } = useSwaps('pending')

  if (isLoading) return <div className="text-moss dark:text-slate-400 p-6">Panel yükleniyor...</div>
  if (isError) return <div className="text-red-500 dark:text-red-400 p-6">Panel verileri alınamadı.</div>

  return (
    <div className="flex flex-col gap-6 transition-colors duration-300">
      
      {/* 🌟 KARŞILAMA KARTI: Koyu Mod Eklendi */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#dfe8df] dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Kooperatif Yönetim Paneli</h1>
          <p className="text-moss dark:text-slate-400 text-sm mt-1">Hoş Geldiniz, {user?.name || 'Yetkili'}. Anlık operasyon özetiniz aşağıdadır.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => goTo('inventory')} className="focus:ring-2 focus:ring-leaf dark:focus:ring-emerald-500 rounded-xl bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-moss dark:text-slate-300 border border-[#dfe8df] dark:border-slate-700 shadow-sm hover:bg-gray-50 hover:dark:bg-slate-700 transition-colors">
            Stoklarım
          </button>
          {isAdmin && (
            <button onClick={() => goTo('operations')} className="focus:ring-2 focus:ring-leaf dark:focus:ring-emerald-500 rounded-xl bg-leaf dark:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-leaf/90 hover:dark:bg-emerald-500 transition-colors">
              AI Operasyon Başlat
            </button>
          )}
        </div>
      </div>

      {/* Tesis İstatistikleri (StatCard bileşenini zaten güncellemiştin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Tesis İçi Tasarruf" value={stats?.total_food_saved_kg ?? 120} unit="kg" icon={Boxes} />
         <StatCard title="Bölgesel Katkı" value={stats?.total_saved_meals ?? 340} icon={Utensils} />
         <StatCard title="Azaltılan Karbon" value={stats?.total_carbon_saved_kg ?? 45.2} unit="kg" icon={Leaf} />
         <StatCard title="Ekonomik Değer" value={(stats?.total_local_value_tl ?? 4500).toLocaleString() + " TL"} icon={HandCoins} />
      </div>

      {/* 🌟 BEKLEYEN TAKASLAR KUTUSU: Koyu Mod Eklendi */}
      <div className="bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ink dark:text-white">Acil Onay Bekleyen Takaslar</h2>
            <button onClick={() => goTo('swaps')} className="text-sm text-leaf dark:text-emerald-400 font-semibold hover:underline">Tümünü Gör</button>
         </div>
         <div className="space-y-4">
             {swaps.slice(0, 3).map((swap, i) => <SwapCard key={i} swap={swap} />)}
             {swaps.length === 0 && <p className="text-sm text-moss dark:text-slate-400 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-center">Şu an onay bekleyen takas işleminiz bulunmuyor.</p>}
         </div>
      </div>

    </div>
  )
}