import { AlertTriangle, ArrowRight, Bell, Brain, ClipboardList, FileText, HandCoins, LineChart, MessageSquare, Sparkles, Truck, Utensils } from 'lucide-react'
import CarbonChart from '../components/CarbonChart'
import RiskBadge from '../components/RiskBadge'
import SwapCard from '../components/SwapCard'
import StatCard from '../components/StatCard'
import { useAiLogs } from '../hooks/useAiLogs'
import { useInventory } from '../hooks/useInventory'
import { useLeaderboard, useStats } from '../hooks/useStats'
import { useSwaps } from '../hooks/useSwaps'

export default function Operations({ goTo }) {
  const { data: stats } = useStats()
  const { data: inventory = [] } = useInventory('')
  const { data: pendingSwaps = [] } = useSwaps('pending')
  const { data: leaderboard = [] } = useLeaderboard()
  const { data: aiLogs = [] } = useAiLogs(5)

  const urgentInventory = [...inventory]
    .filter((item) => Number(item.risk_score) >= 0.7 && Number(item.quantity_kg) > 0)
    .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0))
    .slice(0, 6)

  const waitingKg = pendingSwaps.reduce((sum, swap) => sum + Number(swap.quantity_kg || 0), 0)

  return (
    <div className="space-y-6">
      <div className="soft-panel flex flex-col justify-between gap-3 p-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-leaf">Admin görünümü</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Operasyon Merkezi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-moss">
            Riskli stokları, bekleyen takasları, karbon etkisini ve yeşil puan dağılımını tek ekrandan takip edin.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => goTo('inventory')} className="focus-ring rounded-md bg-white px-3 py-2 text-sm font-medium text-moss shadow-sm">Stokları Aç</button>
          <button onClick={() => goTo('swaps')} className="focus-ring rounded-md bg-leaf px-3 py-2 text-sm font-medium text-white">Takasları Yönet</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Bekleyen Tedarik" value={waitingKg.toFixed(0)} unit="kg" icon={ClipboardList} />
        <StatCard title="Acil Stok" value={urgentInventory.length} icon={AlertTriangle} />
        <StatCard title="Kurtarılan Öğün" value={formatNumber(stats?.total_saved_meals ?? 0)} icon={Utensils} />
        <StatCard title="Yerel Değer" value={formatCurrencyCompact(stats?.total_local_value_tl ?? 0)} icon={HandCoins} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Acil Stok Kuyruğu</h2>
              <p className="text-sm text-moss">Risk skoru 0.70 üstü olan ürünler</p>
            </div>
            <button onClick={() => goTo('inventory')} className="rounded-md bg-mist px-3 py-2 text-sm font-medium text-moss">Detay</button>
          </div>
          <div className="space-y-3">
            {urgentInventory.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-md border border-[#edf2ed] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-medium text-ink">{item.product_name}</p>
                  <p className="text-sm text-moss">{item.cooperative_name} · {item.quantity_kg} kg · {new Date(item.expires_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <RiskBadge value={item.risk_score} />
                <button onClick={() => goTo('inventory')} className="rounded-md bg-clay px-3 py-2 text-sm font-medium text-white">Öneri Aç</button>
              </div>
            ))}
            {urgentInventory.length === 0 && <p className="text-sm text-moss">Acil riskli stok yok.</p>}
          </div>
        </section>

        <section className="panel p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink">Öneri Motoru Nasıl Çalışır?</h2>
            <p className="text-sm text-moss">Takas önerisi dört sinyalden oluşan skorla üretilir.</p>
          </div>
          <div className="space-y-3 text-sm">
            <Rule label="Talep uyumu" value="40%" text="Ürün ve miktar uyumu." />
            <Rule label="Mesafe etkisi" value="20%" text="Yakın eşleşmeler öne çıkar." />
            <Rule label="Aciliyet" value="30%" text="Yüksek riskli ürünler önceliklidir." />
            <Rule label="Karbon etkisi" value="10%" text="CO2 tasarrufu skora eklenir." />
          </div>
          <div className="mt-5 rounded-md bg-mist p-3 text-sm text-moss">
            Öneri akışı: stok <ArrowRight className="inline" size={14} /> eşleşme <ArrowRight className="inline" size={14} /> skor <ArrowRight className="inline" size={14} /> takas.
          </div>
        </section>
      </div>

      <section className="panel p-4">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-semibold text-ink">AI Senaryo Kütüphanesi</h2>
            <p className="text-sm text-moss">Uygulanabilir yapay zeka akışları</p>
          </div>
          <span className="rounded-md bg-mist px-3 py-2 text-xs font-semibold text-moss">6 senaryo</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {aiScenarios.map((scenario) => {
            const Icon = scenario.icon
            return (
              <article key={scenario.title} className="rounded-md border border-[#edf2ed] bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mist text-leaf">
                    <Icon size={19} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{scenario.title}</h3>
                      <span className="rounded bg-[#f4f7f3] px-2 py-0.5 text-xs font-semibold text-moss">{scenario.phase}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-moss">{scenario.text}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section className="panel min-w-0 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Bekleyen Onaylar</h2>
            <p className="text-sm text-moss">Onaylanınca stok ve puan güncellenir.</p>
            </div>
            <button onClick={() => goTo('swaps')} className="rounded-md bg-mist px-3 py-2 text-sm font-medium text-moss">Tümü</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            {pendingSwaps.slice(0, 3).map((swap) => <SwapCard key={swap.id} swap={swap} />)}
          </div>
          {pendingSwaps.length === 0 && <div className="panel p-4 text-sm text-moss">Bekleyen onay yok.</div>}
        </section>

        <div className="min-w-0">
          <CarbonChart data={stats?.weekly_carbon} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel w-full min-w-0 p-4">
          <h2 className="text-lg font-semibold text-ink">Kooperatif Performansı</h2>
          <div className="mt-4 space-y-3">
            {leaderboard.slice(0, 4).map((coop, index) => (
              <div key={coop.id} className="flex items-center justify-between border-b border-[#edf2ed] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-ink">#{index + 1} {coop.name}</p>
                  <p className="text-sm text-moss">{coop.region} · {coop.total_swaps || 0} onaylı takas</p>
                </div>
                <span className="rounded-md bg-mist px-2 py-1 text-sm font-semibold text-moss">{coop.green_score} puan</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel w-full min-w-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Son AI Kararları</h2>
              <p className="text-sm text-moss">Gemini/fallback kararları</p>
            </div>
            <button onClick={() => goTo('aiLogs')} className="rounded-md bg-mist px-3 py-2 text-sm font-medium text-moss">Loglar</button>
          </div>
          <div className="mt-4 space-y-3">
            {aiLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-[#edf2ed] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{log.detected_intent}</p>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${log.used_gemini ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {log.used_gemini ? 'Gemini' : 'Fallback'}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-moss">{log.user_message}</p>
              </div>
            ))}
            {aiLogs.length === 0 && <p className="text-sm text-moss">Henüz AI log kaydı yok.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

const aiScenarios = [
  {
    title: 'İsraf erken uyarı',
    phase: 'Hemen',
    icon: Bell,
    text: 'Riskli stokları yöneticinin önüne düşürür.'
  },
  {
    title: 'Doğal dil asistanı',
    phase: 'Hemen',
    icon: MessageSquare,
    text: 'Mesajları stok, takas veya teslimat niyetine ayırır.'
  },
  {
    title: 'Akıllı takas',
    phase: 'Hemen',
    icon: Brain,
    text: 'En uygun kooperatif eşleşmesini önerir.'
  },
  {
    title: 'Rota planlama',
    phase: 'Faz 2',
    icon: Truck,
    text: 'Teslimatları ortak rotaya alır.'
  },
  {
    title: 'Haftalık özet',
    phase: 'Faz 2',
    icon: FileText,
    text: 'Kurtarılan değeri ve önerileri raporlar.'
  },
  {
    title: 'Talep tahmini',
    phase: 'Faz 3',
    icon: LineChart,
    text: 'Ürün talebini bölgeye göre tahmin eder.'
  }
]

function Rule({ label, value, text }) {
  return (
    <div className="rounded-md border border-[#edf2ed] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Sparkles size={16} className="text-leaf" />
          {label}
        </div>
        <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-moss">{value}</span>
      </div>
      <p className="mt-2 text-moss">{text}</p>
    </div>
  )
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR')
}

function formatCurrencyCompact(value) {
  return Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value || 0)) + ' TL'
}
