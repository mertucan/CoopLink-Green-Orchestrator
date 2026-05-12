import { Trophy } from 'lucide-react'
import { useLeaderboard } from '../hooks/useStats'

// 🌟 GÜVEN PUANINI YILDIZA ÇEVİREN FONKSİYON
const renderTrustStars = (score) => {
  if (score >= 80) return "⭐⭐⭐⭐⭐";
  if (score >= 60) return "⭐⭐⭐⭐";
  if (score >= 40) return "⭐⭐⭐";
  if (score >= 20) return "⭐⭐";
  return "⭐";
};

export default function Leaderboard() {
  const { data: rows = [], isLoading, isError } = useLeaderboard()
  const podium = rows.slice(0, 3)
  
  return (
    <div className="space-y-5 transition-colors duration-300">
      {/* 🌟 BAŞLIK: Karanlık modda beyaz olacak şekilde ayarlandı */}
      <h1 className="text-2xl font-semibold text-ink dark:text-white transition-colors duration-300">Yeşil puan sıralaması</h1>
      
      {/* --- KÜRSÜ (İLK 3 KOOPERATİF) --- */}
      <div className="grid gap-4 md:grid-cols-3">
        {podium.map((coop, index) => (
          <section key={coop.id || coop.name} className={`panel p-5 transition-colors duration-300 border ${index === 0 ? 'border-wheat bg-[#fffaf0] dark:bg-slate-800 dark:border-wheat/50' : 'bg-white dark:bg-slate-900 border-[#dfe8df] dark:border-slate-800'}`}>
            <Trophy className={index === 0 ? 'text-wheat dark:text-yellow-400' : 'text-leaf dark:text-emerald-400'} />
            <p className="mt-4 text-sm text-moss dark:text-slate-400">#{index + 1}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink dark:text-white">{coop.name}</h2>
            <p className="text-sm text-moss dark:text-slate-400">{coop.region}</p>
            <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">{coop.green_score} puan</p>
            <p className="mt-1 text-sm font-medium text-yellow-600 dark:text-yellow-500">
               Güven: {renderTrustStars(coop.trust_score || 50)}
            </p>
          </section>
        ))}
      </div>

      {/* --- SIRALAMA TABLOSU --- */}
      {/* 🌟 TABLO KAPSAYICISI: Göz yoran beyazlık slate tonlarıyla yumuşatıldı */}
      <div className="panel overflow-x-auto bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#dfe8df] dark:border-slate-700 bg-mist dark:bg-slate-800/80 text-moss dark:text-slate-300 transition-colors duration-300">
            <tr>
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Kooperatif</th>
              <th className="px-4 py-3">Bölge</th>
              <th className="px-4 py-3">Takas</th>
              <th className="px-4 py-3">CO2</th>
              <th className="px-4 py-3">Puan</th>
              <th className="px-4 py-3">Güven Seviyesi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-4 text-moss dark:text-slate-400" colSpan="7">Sıralama yükleniyor...</td></tr>}
            {isError && <tr><td className="px-4 py-4 text-red-700 dark:text-red-400" colSpan="7">Sıralama verileri alınamadı.</td></tr>}
            {rows.map((row, index) => (
              <tr key={row.id || row.name} className="border-b border-[#edf2ed] dark:border-slate-700/50 hover:bg-gray-50 hover:dark:bg-slate-800/30 transition-colors duration-200 text-ink dark:text-slate-300">
                <td className="px-4 py-3">#{index + 1}</td>
                <td className="px-4 py-3 font-medium dark:text-white">{row.name}</td>
                <td className="px-4 py-3">{row.region}</td>
                <td className="px-4 py-3">{row.total_swaps || 0}</td>
                <td className="px-4 py-3">{row.carbon_saved_kg || 0} kg</td>
                <td className="px-4 py-3 font-semibold text-green-700 dark:text-emerald-400">{row.green_score}</td>
                <td className="px-4 py-3 text-lg drop-shadow-sm">
                  {renderTrustStars(row.trust_score || 50)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}