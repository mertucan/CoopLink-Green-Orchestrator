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
    <div className="space-y-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* 🌟 BAŞLIK: Karanlık Modda Beyaz Yapıldı */}
        <h1 className="text-2xl font-bold text-ink dark:text-white transition-colors">
          {isCooperative ? 'Size önerilen takaslar' : 'Takas yönetimi'}
        </h1>
        
        {/* 🌟 SEKMELER (TABS): Beyaz kutu slate tonlarına çevrildi */}
        <div className="inline-flex rounded-lg border border-[#dfe8df] dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-sm transition-colors duration-300">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatus(id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                status === id 
                  ? 'bg-leaf dark:bg-emerald-600 text-white shadow' 
                  : 'text-moss dark:text-slate-400 hover:text-ink hover:dark:text-white hover:bg-gray-50 hover:dark:bg-slate-700/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="p-8 text-center text-moss dark:text-slate-400 bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl">Takaslar yükleniyor...</div>}
      {isError && <div className="p-8 text-center text-red-500 dark:text-red-400 bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl">Takas verileri alınamadı.</div>}

      {/* TAKAS KARTLARI (Grid Yapısı) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {swaps.map((swap) => (
          <SwapCard key={swap.id || `${swap.from_cooperative_id}-${swap.to_cooperative_id}`} swap={swap} />
        ))}
      </div>

      {/* 🌟 BOŞ DURUM: Devasa beyaz kutu karartıldı */}
      {!isLoading && !isError && swaps.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300">
          <p className="text-moss dark:text-slate-400">Bu durumda takas yok.</p>
        </div>
      )}
    </div>
  )
}