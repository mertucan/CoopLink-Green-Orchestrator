import { AlertTriangle, ArrowRight, Leaf, MapPinned, Route, Truck } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useCooperatives, useInventory } from '../hooks/useInventory'
import { useSwaps } from '../hooks/useSwaps'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip, Popup, useMap, GeoJSON } from 'react-leaflet'
import turkeyProvinces from '../data/turkey-provinces.json'

function riskColor(risk) {
  if (risk >= 0.7) return '#c46f44'
  if (risk >= 0.4) return '#d99b28'
  return '#2f8f5b'
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
}

function normalizeProvinceName(value = '') {
  return String(value)
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('afyonkarahisar', 'afyon')
}

function haversineKm(from, to) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const lat1 = Number(from.latitude)
  const lat2 = Number(to.latitude)
  const deltaLat = toRad(lat2 - lat1)
  const deltaLon = toRad(Number(to.longitude) - Number(from.longitude))
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function routeTone(score) {
  if (score >= 0.8) return { color: '#2f8f5b', label: 'Güçlü rota' }
  if (score >= 0.65) return { color: '#d99b28', label: 'İzlenmeli' }
  return { color: '#6f806f', label: 'Alternatif' }
}

function routeKey(route) {
  return [route.swap.from_cooperative_id, route.swap.to_cooperative_id].sort().join(':')
}

function buildRoutePositions(route) {
  const start = [Number(route.from.latitude), Number(route.from.longitude)]
  const end = [Number(route.to.latitude), Number(route.to.longitude)]
  if (!route.routeOffset) return [start, end]

  const midLat = (start[0] + end[0]) / 2
  const midLon = (start[1] + end[1]) / 2
  const deltaLat = end[0] - start[0]
  const deltaLon = end[1] - start[1]
  const length = Math.sqrt(deltaLat ** 2 + deltaLon ** 2) || 1
  const normalLat = -deltaLon / length
  const normalLon = deltaLat / length
  const curveStrength = 0.22 * route.routeOffset
  return [
    start,
    [midLat + normalLat * curveStrength, midLon + normalLon * curveStrength],
    end,
  ]
}

// Haritayı Türkiye'ye odaklayan yardımcı bileşen
function TurkeyFit() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds([
      [35.8, 25.6],
      [42.1, 44.8],
    ])
  }, [map])
  return null
}

function StableMapSize({ trigger }) {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [map, trigger])
  return null
}

export default function RiskMap({ goTo }) {
  const { data: inventory = [] } = useInventory('')
  const { data: cooperatives = [] } = useCooperatives()
  const { data: pendingSwaps = [] } = useSwaps('pending')

  const cooperativeMap = useMemo(
    () => new Map(cooperatives.map((coop) => [coop.id, coop])),
    [cooperatives]
  )

  const riskyItems = useMemo(
    () => inventory.filter((item) => Number(item.risk_score || 0) >= 0.4 && Number(item.quantity_kg || 0) > 0),
    [inventory]
  )

  const urgentItems = riskyItems.filter((item) => Number(item.risk_score || 0) >= 0.7)

  const pendingRoutes = pendingSwaps
    .map((swap) => ({
      swap,
      from: cooperativeMap.get(swap.from_cooperative_id),
      to: cooperativeMap.get(swap.to_cooperative_id),
    }))
    .filter((route) => route.from?.latitude && route.to?.latitude)

  const routeBucketCounts = pendingRoutes.reduce((map, route) => {
    const key = routeKey(route)
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())
  const routeBucketSeen = new Map()
  const routeInsights = pendingRoutes.map((route) => {
    const key = routeKey(route)
    const seen = routeBucketSeen.get(key) || 0
    routeBucketSeen.set(key, seen + 1)
    const total = routeBucketCounts.get(key) || 1
    const routeOffset = total > 1 ? seen - (total - 1) / 2 : 0
    const sourceRisk = inventory.find(
      (item) =>
        item.cooperative_id === route.swap.from_cooperative_id &&
        item.product_id === route.swap.product_id &&
        Number(item.quantity_kg || 0) > 0
    )
    const distanceKm = haversineKm(route.from, route.to)
    const score = Number(route.swap.match_score || 0)
    const tone = routeTone(score)
    const risk = Number(sourceRisk?.risk_score || 0)
    const meals = Number(route.swap.saved_meals || sourceRisk?.lost_meals_if_unrescued || 0)
    const value = Number(route.swap.local_value_tl || sourceRisk?.lost_local_value_tl_if_unrescued || 0)
    const carbon = Number(route.swap.carbon_saved_kg || 0)
    return {
      ...route,
      sourceRisk,
      distanceKm,
      score,
      tone,
      risk,
      meals,
      value,
      carbon,
      routeOffset,
      reason: [
        `${route.from.region} tarafında ${route.swap.quantity_kg} kg ${route.swap.product_name || 'ürün'} için bekleyen takas var.`,
        risk >= 0.7 ? `Stok acil riskte: risk skoru ${risk.toFixed(2)}.` : `Stok izleme eşiğinde: risk skoru ${risk.toFixed(2)}.`,
        `${route.to.region} hedefi, mevcut takas önerisinde alıcı kooperatif olarak seçildi.`,
      ],
    }
  })

  const demandCooperativeIds = new Set(routeInsights.map((route) => route.to.id))
  const totalLossMeals = urgentItems.reduce((sum, item) => sum + Number(item.lost_meals_if_unrescued || 0), 0)
  const totalLossValue = urgentItems.reduce(
    (sum, item) => sum + Number(item.lost_local_value_tl_if_unrescued || 0),
    0
  )
  const provinceStats = useMemo(() => {
    const stats = new Map()
    cooperatives.forEach((coop) => {
      const key = normalizeProvinceName(coop.region)
      const current = stats.get(key) || { cooperatives: [], risks: [], pendingRoutes: 0, maxRisk: 0 }
      current.cooperatives.push(coop)
      stats.set(key, current)
    })
    riskyItems.forEach((item) => {
      const key = normalizeProvinceName(item.cooperative_region)
      const current = stats.get(key) || { cooperatives: [], risks: [], pendingRoutes: 0, maxRisk: 0 }
      current.risks.push(item)
      current.maxRisk = Math.max(current.maxRisk, Number(item.risk_score || 0))
      stats.set(key, current)
    })
    routeInsights.forEach((route) => {
      const fromKey = normalizeProvinceName(route.from.region)
      const toKey = normalizeProvinceName(route.to.region)
      ;[fromKey, toKey].forEach((key) => {
        const current = stats.get(key) || { cooperatives: [], risks: [], pendingRoutes: 0, maxRisk: 0 }
        current.pendingRoutes += 1
        stats.set(key, current)
      })
    })
    return stats
  }, [cooperatives, riskyItems, routeInsights])

  const provinceLayerKey = useMemo(
    () => `${cooperatives.length}-${riskyItems.length}-${routeInsights.length}`,
    [cooperatives.length, riskyItems.length, routeInsights.length]
  )

  const getProvinceStyle = (feature) => {
    const key = normalizeProvinceName(feature.properties?.name)
    const stats = provinceStats.get(key)
    const hasCoop = Boolean(stats?.cooperatives.length)
    const maxRisk = Number(stats?.maxRisk || 0)
    const fillColor = maxRisk >= 0.7 ? '#c46f44' : maxRisk >= 0.4 ? '#d99b28' : hasCoop ? '#2f8f5b' : '#eef5ee'
    return {
      color: hasCoop ? '#17211b' : '#90a390',
      weight: hasCoop ? 2.4 : 1.25,
      fillColor,
      fillOpacity: maxRisk >= 0.4 ? 0.28 : hasCoop ? 0.2 : 0.1,
      opacity: 0.95,
    }
  }

  const handleProvince = (feature, layer) => {
    const name = feature.properties?.name || 'İl'
    const stats = provinceStats.get(normalizeProvinceName(name))
    const coopNames = stats?.cooperatives.map((coop) => coop.name).join('<br/>') || 'Kooperatif yok'
    const urgentCount = stats?.risks.filter((item) => Number(item.risk_score || 0) >= 0.7).length || 0
    const riskCount = stats?.risks.length || 0
    const meals = stats?.risks.reduce((sum, item) => sum + Number(item.lost_meals_if_unrescued || 0), 0) || 0
    const value = stats?.risks.reduce((sum, item) => sum + Number(item.lost_local_value_tl_if_unrescued || 0), 0) || 0
    layer.bindTooltip(name, { sticky: true })
    layer.bindPopup(
      `<strong>${name}</strong><br/>
      <span>Kooperatif:</span><br/>${coopNames}<br/>
      <span>Riskli stok: ${riskCount}</span><br/>
      <span>Acil stok: ${urgentCount}</span><br/>
      <span>Riskteki etki: ${formatNumber(meals)} öğün · ${formatNumber(value)} TL</span>`
    )
    layer.on({
      mouseover: () => layer.setStyle({ weight: 3.2, fillOpacity: 0.38 }),
      mouseout: () => layer.setStyle(getProvinceStyle(feature)),
    })
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <section className="soft-panel flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-leaf">Canlı risk görünümü</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Türkiye Risk Isı Haritası</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-moss">
            Riskli stokları, talep noktalarını ve önerilen takas rotalarını Türkiye üzerinde takip edin.
          </p>
        </div>
        <button
          onClick={() => goTo('inventory')}
          className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white"
        >
          Stoklara Git
        </button>
      </section>

      {/* Metrik kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <MapMetric icon={AlertTriangle} title="Acil Nokta" value={urgentItems.length} tone="text-clay" />
        <MapMetric icon={Truck} title="Bekleyen Rota" value={pendingRoutes.length} tone="text-ink" />
        <MapMetric icon={Leaf} title="Riskteki Öğün" value={formatNumber(totalLossMeals)} tone="text-leaf" />
        <MapMetric
          icon={Route}
          title="Riskteki Değer"
          value={`${formatNumber(totalLossValue)} TL`}
          tone="text-clay"
        />
      </div>

      {/* Harita + Sidebar */}
      <section className="panel overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Harita alanı */}
          <div className="relative h-[540px] min-h-0 overflow-hidden lg:h-[620px]">
            <MapContainer
              center={[39.1, 35.5]}
              zoom={6}
              attributionControl={false}
              scrollWheelZoom
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              className="z-0"
            >
              <TurkeyFit />
              <StableMapSize trigger={`${inventory.length}-${pendingSwaps.length}-${cooperatives.length}`} />

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap katkıcıları"
                maxZoom={18}
              />

              <GeoJSON
                key={provinceLayerKey}
                data={turkeyProvinces}
                style={getProvinceStyle}
                onEachFeature={handleProvince}
              />

              {/* Takas rotaları (kesik çizgili) */}
              {routeInsights.map((route) => (
                <Polyline
                  key={route.swap.id}
                  positions={buildRoutePositions(route)}
                  pathOptions={{
                    color: route.tone.color,
                    weight: 2 + route.score * 3,
                    dashArray: '8 7',
                    opacity: 0.85,
                  }}
                >
                  <Popup>
                    <strong>{route.swap.product_name || 'Ürün'}</strong> · {route.swap.quantity_kg} kg
                    <br />
                    <span style={{ fontSize: 12 }}>
                      {route.from.region} → {route.to.region}
                    </span>
                  </Popup>
                </Polyline>
              ))}

              {/* Risk ısı halesi (büyük yarı şeffaf daire) */}
              {riskyItems.map((item) => {
                const coop = cooperativeMap.get(item.cooperative_id)
                if (!coop?.latitude || !coop?.longitude) return null
                const risk = Number(item.risk_score || 0)
                const radiusMeters = 25000 + Math.min(Number(item.quantity_kg || 0) * 25, 50000)
                return (
                  <Circle
                    key={`halo-${item.id}`}
                    center={[Number(coop.latitude), Number(coop.longitude)]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: riskColor(risk),
                      fillColor: riskColor(risk),
                      fillOpacity: 0.15,
                      weight: 0,
                    }}
                  />
                )
              })}

              {/* Kooperatif noktaları */}
              {cooperatives.map((coop) => {
                if (!coop.latitude || !coop.longitude) return null
                const isDemand = demandCooperativeIds.has(coop.id)
                return (
                  <CircleMarker
                    key={`coop-${coop.id}`}
                    center={[Number(coop.latitude), Number(coop.longitude)]}
                    radius={isDemand ? 8 : 5}
                    pathOptions={{
                      fillColor: isDemand ? '#2f8f5b' : '#8fa08f',
                      color: isDemand ? '#1c6640' : '#6f806f',
                      weight: 1.5,
                      fillOpacity: isDemand ? 0.95 : 0.65,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]}>
                      {coop.region}
                    </Tooltip>
                  </CircleMarker>
                )
              })}

              {/* Risk marker'ları (tıklanabilir, popup'lı) */}
              {riskyItems.map((item) => {
                const coop = cooperativeMap.get(item.cooperative_id)
                if (!coop?.latitude || !coop?.longitude) return null
                const risk = Number(item.risk_score || 0)
                const radius = 10 + Math.min(Number(item.quantity_kg || 0) / 40, 14)
                return (
                  <CircleMarker
                    key={`risk-${item.id}`}
                    center={[Number(coop.latitude), Number(coop.longitude)]}
                    radius={radius}
                    pathOptions={{
                      fillColor: riskColor(risk),
                      color: '#fff',
                      weight: 1.5,
                      fillOpacity: 0.92,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -radius]} permanent={false}>
                      {Math.round(risk * 100)}
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: 170 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{item.product_name}</p>
                        <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
                          {coop.region} · {item.quantity_kg} kg
                        </p>
                        <span
                          style={{
                            background: `${riskColor(risk)}22`,
                            color: riskColor(risk),
                            padding: '2px 8px',
                            borderRadius: 99,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Risk {Math.round(risk * 100)}
                        </span>
                        <div style={{ marginTop: 8, fontSize: 11, color: '#555' }}>
                          {formatNumber(item.lost_meals_if_unrescued)} öğün ·{' '}
                          {formatNumber(item.lost_local_value_tl_if_unrescued)} TL
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>

            {/* Lejant */}
            <div className="absolute bottom-4 left-4 z-[999] flex flex-wrap gap-2 rounded-md border border-[#dfe8df] bg-white/92 p-2 text-xs font-medium text-moss shadow-sm">
              <LegendDot color="#c46f44" label="Acil stok" />
              <LegendDot color="#d99b28" label="Orta risk" />
              <LegendDot color="#2f8f5b" label="Talep / hedef" />
              <span className="rounded bg-[#eef5ee] px-2 py-1">Siyah sınır: kooperatif ili</span>
              <span className="rounded bg-[#eef5ee] px-2 py-1">Çizgi kalınlığı: eşleşme skoru</span>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="max-h-none overflow-y-auto border-t border-[#dfe8df] bg-white p-4 xl:max-h-[620px] xl:border-l xl:border-t-0">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned className="text-leaf" size={20} />
              <h2 className="text-lg font-semibold text-ink">Öne çıkan riskler</h2>
            </div>

            <div className="space-y-3">
              {urgentItems.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-md border border-[#edf2ed] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.product_name}</p>
                      <p className="text-sm text-moss">
                        {item.cooperative_name} · {item.quantity_kg} kg
                      </p>
                    </div>
                    <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      {Number(item.risk_score || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-moss">
                    <span>{formatNumber(item.lost_meals_if_unrescued)} öğün</span>
                    <span>{formatNumber(item.lost_local_value_tl_if_unrescued)} TL</span>
                  </div>
                </div>
              ))}
              {urgentItems.length === 0 && <p className="text-sm text-moss">Acil riskli stok yok.</p>}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Bekleyen rotalar</h3>
              <div className="mt-3 rounded-md border border-[#edf2ed] bg-[#fbfdfb] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-moss">Rotalar nasıl belirleniyor?</div>
                <p className="mt-2 text-xs leading-5 text-moss">
                  Haritadaki çizgiler Supabase'deki bekleyen takaslardan gelir. Her rota, riskli stoğun bulunduğu kooperatiften
                  önerilen alıcı kooperatife çizilir; mesafe, eşleşme skoru, CO2 ve kurtarılan değer bilgisiyle açıklanır.
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {routeInsights.slice(0, 4).map((route) => (
                  <div key={route.swap.id} className="rounded-md border border-[#edf2ed] bg-[#f7faf7] p-3 text-sm text-moss">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">
                          {route.swap.product_name || 'Ürün'} · {route.swap.quantity_kg} kg
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span>{route.from.region}</span>
                          <ArrowRight size={14} />
                          <span>{route.to.region}</span>
                        </div>
                      </div>
                      <span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: route.tone.color, backgroundColor: `${route.tone.color}18` }}>
                        {route.tone.label}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <RouteMetric label="Mesafe" value={`${route.distanceKm.toFixed(0)} km`} />
                      <RouteMetric label="Skor" value={route.score.toFixed(2)} />
                      <RouteMetric label="CO2" value={`${route.carbon.toFixed(1)} kg`} />
                    </div>

                    <div className="mt-3 rounded-md bg-white p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-moss">Neden çizildi?</div>
                      <ul className="space-y-1">
                        {route.reason.map((text) => (
                          <li key={text} className="flex gap-2 text-xs leading-5 text-moss">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: route.tone.color }} />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-moss">
                      <span>{formatNumber(route.meals)} öğün korunabilir</span>
                      <span>{formatNumber(route.value)} TL değer</span>
                    </div>
                  </div>
                ))}
                {routeInsights.length === 0 && <p className="text-sm text-moss">Bekleyen rota yok.</p>}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function MapMetric({ icon: Icon, title, value, tone }) {
  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-moss">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <Icon className={tone} size={23} />
      </div>
    </section>
  )
}

function RouteMetric({ label, value }) {
  return (
    <div className="rounded-md bg-white p-2">
      <div className="text-[11px] text-moss">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-[#f7faf7] px-2 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
