import { AlertTriangle, Clock, HandCoins, PackageCheck, TrendingDown, Utensils, X } from 'lucide-react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function calculateProjectedRisk(item, daysFromNow) {
  const quantity = Number(item.quantity_kg || 0)
  const spoilageRateDays = Number(item.product_spoilage_rate_days || 3)
  const currentRisk = clamp(Number(item.risk_score || 0), 0, 1)
  const expiresAt = item.expires_at ? new Date(item.expires_at) : null

  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || quantity <= 0 || spoilageRateDays <= 0) {
    return currentRisk
  }

  const now = new Date()
  const millisecondsLeft = expiresAt.getTime() - now.getTime()
  const hoursLeft = millisecondsLeft / 3600000 - daysFromNow * 24
  const shelfLifeHours = spoilageRateDays * 24
  const urgency = 1 - clamp(hoursLeft / shelfLifeHours, 0, 1)
  const quantityPressure = clamp(Math.log10(quantity + 1) / 2.2, 0.08, 1.15)
  const timeCurve = Math.pow(clamp(urgency, 0, 1), 1.45)
  const projectedRisk = currentRisk * 0.45 + timeCurve * 0.42 + quantityPressure * 0.13
  return clamp(projectedRisk, 0, 1)
}

function formatPercent(value) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })
}

function formatKg(value) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR', {
    maximumFractionDigits: 0
  })
}

function formatDuration(hours) {
  if (hours === null) return '-'
  if (hours < 24) return `${hours} saat`

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}g ${remainingHours}sa` : `${days} gün`
}

function getStatus(probability) {
  if (probability >= 70) return ['bg-leaf text-white', 'İyi pencere']
  if (probability >= 40) return ['bg-amber-500 text-white', 'Bugün aksiyon']
  return ['bg-clay text-white', 'Kritik']
}

export default function SpoilageSimulator({ item, onClose, onPropose, isProposing }) {
  if (!item) return null

  const projections = [0, 1, 2, 3].map((day) => {
    const risk = calculateProjectedRisk(item, day)
    const probability = clamp((1 - risk) * 100, 0, 100)
    return {
      day,
      label: day === 0 ? 'Bugün' : `${day}. gün`,
      probability,
      risk
    }
  })
  const bestProbability = projections[0]?.probability ?? 0
  const tomorrowLoss = Math.max(0, bestProbability - (projections[1]?.probability ?? bestProbability))
  const recoverableKg = Number(item.quantity_kg || 0) * (bestProbability / 100)
  const [statusClass, statusLabel] = getStatus(bestProbability)
  const expiresAt = item.expires_at ? new Date(item.expires_at) : null
  const hoursLeft = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3600000))
    : null
  const blockedActionText = item.is_expired
    ? 'Süresi geçen ürün için takas yerine ayrı aksiyon gerekli'
    : item.has_pending_swap
      ? 'Bu ürün için bekleyen takas var'
      : 'En yakın eşleşmeye takas önerisi aç'
  const canPropose = !item.is_expired && !item.has_pending_swap

  return (
    <section className="rounded-md border border-[#cfdccf] bg-white">
      <div className="grid gap-4 p-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-md bg-[#f4f8f4] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">Simülasyon</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{item.product_name || item.product_id}</h2>
              <p className="mt-1 text-xs text-moss">{item.quantity_kg} kg · {item.cooperative_name}</p>
            </div>
            <button
              className="grid h-8 w-8 place-items-center rounded-md border border-[#cfdccf] bg-white text-moss"
              onClick={onClose}
              title="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-[#dfe8df] bg-white p-3">
              <PackageCheck size={16} className="text-leaf" />
              <div className="mt-2 text-2xl font-semibold text-ink">%{formatPercent(bestProbability)}</div>
              <div className="text-xs text-moss">kurtarma</div>
            </div>
            <div className="rounded-md border border-[#dfe8df] bg-white p-3">
              <Clock size={16} className="text-ink" />
              <div className="mt-2 text-2xl font-semibold text-ink">{formatDuration(hoursLeft)}</div>
              <div className="text-xs text-moss">kalan</div>
            </div>
            <div className="rounded-md border border-[#dfe8df] bg-white p-3">
              <TrendingDown size={16} className="text-clay" />
              <div className="mt-2 text-2xl font-semibold text-ink">%{formatPercent(tomorrowLoss)}</div>
              <div className="text-xs text-moss">yarın kayıp</div>
            </div>
            <div className="rounded-md border border-[#dfe8df] bg-white p-3">
              <div className="text-xs text-moss">kg karşılığı</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{formatKg(recoverableKg)}</div>
              <div className="text-xs text-moss">kg</div>
            </div>
          </div>

          <div className={`mt-3 inline-flex rounded-md px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {projections.map((projection) => (
              <div key={projection.day} className="rounded-md border border-[#dfe8df] bg-[#fbfdfb] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-moss">{projection.label}</span>
                  <span className="text-sm font-semibold text-ink">%{formatPercent(projection.probability)}</span>
                </div>
                <div className="mt-3 flex h-28 items-end rounded-md bg-[#e8efe8] p-1">
                  <div
                    className={`w-full rounded ${projection.probability >= 70 ? 'bg-leaf' : projection.probability >= 40 ? 'bg-amber-500' : 'bg-clay'}`}
                    style={{ height: `${Math.max(projection.probability, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-md border border-[#dfe8df] bg-[#fbfdfb] p-3 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold text-ink">Önerilen aksiyon</div>
              <div className="text-xs text-moss">{blockedActionText}</div>
            </div>
            <button
              className="h-10 rounded-md bg-clay px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canPropose || isProposing}
              onClick={() => onPropose(item)}
            >
              {item.has_pending_swap ? 'Bekliyor' : isProposing ? 'Hazırlanıyor' : 'Takas yap'}
            </button>
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle size={17} />
              Kurtarılmazsa
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <LossMetric icon={Utensils} value={formatNumber(item.lost_meals_if_unrescued)} label="öğün kaybedilir" />
              <LossMetric icon={HandCoins} value={`${formatNumber(item.lost_local_value_tl_if_unrescued)} TL`} label="yerel değer boşa gider" />
              <LossMetric icon={TrendingDown} value={`${Number(item.potential_carbon_kg_if_unrescued || 0).toFixed(1)} kg`} label="CO2 etkisi oluşur" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LossMetric({ icon: Icon, value, label }) {
  return (
    <div className="rounded-md bg-white p-3">
      <Icon size={16} className="text-red-700" />
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
      <div className="text-xs text-moss">{label}</div>
    </div>
  )
}
