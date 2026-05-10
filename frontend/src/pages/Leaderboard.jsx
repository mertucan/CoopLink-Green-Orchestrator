import { Trophy } from 'lucide-react'
import { useLeaderboard } from '../hooks/useStats'

export default function Leaderboard() {
  const { data: rows = [], isLoading, isError } = useLeaderboard()
  const podium = rows.slice(0, 3)
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Yeşil puan sıralaması</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {podium.map((coop, index) => (
          <section key={coop.id || coop.name} className={`panel p-5 ${index === 0 ? 'border-wheat bg-[#fffaf0]' : ''}`}>
            <Trophy className={index === 0 ? 'text-wheat' : 'text-leaf'} />
            <p className="mt-4 text-sm text-moss">#{index + 1}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{coop.name}</h2>
            <p className="text-sm text-moss">{coop.region}</p>
            <p className="mt-3 text-2xl font-semibold">{coop.green_score} puan</p>
          </section>
        ))}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#dfe8df] bg-mist text-moss">
            <tr>
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Kooperatif</th>
              <th className="px-4 py-3">Bölge</th>
              <th className="px-4 py-3">Takas</th>
              <th className="px-4 py-3">CO2</th>
              <th className="px-4 py-3">Puan</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-4 text-moss" colSpan="6">Sıralama yükleniyor...</td></tr>}
            {isError && <tr><td className="px-4 py-4 text-red-700" colSpan="6">Sıralama verileri alınamadı.</td></tr>}
            {rows.map((row, index) => (
              <tr key={row.id || row.name} className="border-b border-[#edf2ed]">
                <td className="px-4 py-3">#{index + 1}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.region}</td>
                <td className="px-4 py-3">{row.total_swaps || 0}</td>
                <td className="px-4 py-3">{row.carbon_saved_kg || 0} kg</td>
                <td className="px-4 py-3 font-semibold">{row.green_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
