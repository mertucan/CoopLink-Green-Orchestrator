import { AlertTriangle, ArrowRight, Leaf, MapPinned, Route, Truck } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip, Popup, useMap, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import turkeyProvinces from '../data/turkey-provinces.json'
import { useAuth } from '../hooks/useAuth'
import { useCooperatives, useInventory } from '../hooks/useInventory'
import { useSwaps } from '../hooks/useSwaps'

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

function markerCenter(coop) {
  return [Number(coop?.display_latitude ?? coop?.latitude), Number(coop?.display_longitude ?? coop?.longitude)]
}

function hasValidCoordinates(coop) {
  const [latitude, longitude] = markerCenter(coop)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function haversineKm(from, to) {
  const toRad = (value) => (value * Math.PI) / 180
  const [lat1, lon1] = markerCenter(from)
  const [lat2, lon2] = markerCenter(to)
  const deltaLat = toRad(lat2 - lat1)
  const deltaLon = toRad(lon2 - lon1)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function routeTone(score) {
  if (score >= 0.8) return { color: '#2f8f5b', label: 'Güçlü' }
  if (score >= 0.65) return { color: '#d99b28', label: 'İzle' }
  return { color: '#6f806f', label: 'Alternatif' }
}

function routeKey(route) {
  return [route.swap.from_cooperative_id, route.swap.to_cooperative_id].sort().join(':')
}

function buildRoutePositions(route) {
  const start = markerCenter(route.from)
  const end = markerCenter(route.to)
  if (!route.routeOffset) return [start, end]
  const midLat = (start[0] + end[0]) / 2
  const midLon = (start[1] + end[1]) / 2
  const deltaLat = end[0] - start[0]
  const deltaLon = end[1] - start[1]
  const length = Math.sqrt(deltaLat ** 2 + deltaLon ** 2) || 1
  return [
    start,
    [midLat + (-deltaLon / length) * 0.22 * route.routeOffset, midLon + (deltaLat / length) * 0.22 * route.routeOffset],
    end,
  ]
}

function buildDisplayCooperatives(cooperatives) {
  const groups = cooperatives.reduce((map, coop) => {
    const key = normalizeProvinceName(coop.region)
    map.set(key, [...(map.get(key) || []), coop])
    return map
  }, new Map())

  return [...groups.values()].flatMap((group) => {
    const sorted = [...group].sort((a, b) => String(a.name).localeCompare(String(b.name), 'tr'))
    return sorted.map((coop, index) => {
      if (!Number.isFinite(Number(coop.latitude)) || !Number.isFinite(Number(coop.longitude)) || sorted.length === 1) {
        return { ...coop, same_region_count: sorted.length, region_index: index }
      }
      const angle = (Math.PI * 2 * index) / sorted.length
      const spread = Math.min(0.1, 0.035 + sorted.length * 0.006)
      return {
        ...coop,
        same_region_count: sorted.length,
        region_index: index,
        display_latitude: Number(coop.latitude) + Math.sin(angle) * spread,
        display_longitude: Number(coop.longitude) + Math.cos(angle) * spread,
      }
    })
  })
}

function TurkeyFit() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds([[35.8, 25.6], [42.1, 44.8]])
  }, [map])
  return null
}

function StableMapSize({ trigger }) {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timer)
  }, [map, trigger])
  return null
}

export default function RiskMap({ goTo }) {
  const { user, isCooperative } = useAuth()
  const { data: inventory = [] } = useInventory('')
  const { data: cooperatives = [] } = useCooperatives()
  const { data: pendingSwaps = [] } = useSwaps('pending')

  const displayCooperatives = useMemo(() => buildDisplayCooperatives(cooperatives), [cooperatives])
  const cooperativeMap = useMemo(() => new Map(displayCooperatives.map((coop) => [coop.id, coop])), [displayCooperatives])

  const riskyItems = useMemo(
    () => inventory
      .filter((item) => !isCooperative || item.cooperative_id === user?.id)
      .filter((item) => Number(item.risk_score || 0) >= 0.4 && Number(item.quantity_kg || 0) > 0),
    [inventory, isCooperative, user?.id]
  )
  const urgentItems = riskyItems.filter((item) => Number(item.risk_score || 0) >= 0.7)

  const pendingRoutes = pendingSwaps
    .map((swap) => ({ swap, from: cooperativeMap.get(swap.from_cooperative_id), to: cooperativeMap.get(swap.to_cooperative_id) }))
    .filter((route) => hasValidCoordinates(route.from) && hasValidCoordinates(route.to))

  const suggestedRoutes = riskyItems
    .map((item) => {
      const source = cooperativeMap.get(item.cooperative_id)
      if (!hasValidCoordinates(source)) return null
      const nearest = displayCooperatives
        .filter((coop) => coop.id !== item.cooperative_id)
        .filter(hasValidCoordinates)
        .map((coop) => ({ coop, distanceKm: haversineKm(source, coop) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0]
      if (!nearest) return null
      const risk = Number(item.risk_score || 0)
      const matchScore = Math.min(0.95, Math.max(0.58, 0.62 + risk * 0.25 - nearest.distanceKm / 1800))
      return {
        from: source,
        to: nearest.coop,
        suggested: true,
        swap: {
          id: `suggested-${item.id}`,
          from_cooperative_id: source.id,
          to_cooperative_id: nearest.coop.id,
          product_name: item.product_name,
          quantity_kg: item.quantity_kg,
          match_score: matchScore,
          carbon_saved_kg: Math.max(0.4, nearest.distanceKm * 0.018),
        },
      }
    })
    .filter(Boolean)

  const mapRoutes = pendingRoutes.length > 0 ? pendingRoutes : suggestedRoutes.slice(0, 6)

  const routeBucketCounts = mapRoutes.reduce((map, route) => {
    const key = routeKey(route)
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())
  const routeBucketSeen = new Map()
  const routeInsights = mapRoutes.map((route) => {
    const key = routeKey(route)
    const seen = routeBucketSeen.get(key) || 0
    routeBucketSeen.set(key, seen + 1)
    const total = routeBucketCounts.get(key) || 1
    const routeOffset = total > 1 ? seen - (total - 1) / 2 : 0
    const score = Number(route.swap.match_score || 0)
    return {
      ...route,
      score,
      tone: routeTone(score),
      distanceKm: haversineKm(route.from, route.to),
      carbon: Number(route.swap.carbon_saved_kg || 0),
      routeOffset,
      suggested: route.suggested,
    }
  })

  const demandCooperativeIds = new Set(routeInsights.map((route) => route.to.id))
  const totalLossMeals = urgentItems.reduce((sum, item) => sum + Number(item.lost_meals_if_unrescued || 0), 0)
  const totalLossValue = urgentItems.reduce((sum, item) => sum + Number(item.lost_local_value_tl_if_unrescued || 0), 0)

  const provinceStats = useMemo(() => {
    const stats = new Map()
    displayCooperatives.forEach((coop) => {
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
      ;[normalizeProvinceName(route.from.region), normalizeProvinceName(route.to.region)].forEach((key) => {
        const current = stats.get(key) || { cooperatives: [], risks: [], pendingRoutes: 0, maxRisk: 0 }
        current.pendingRoutes += 1
        stats.set(key, current)
      })
    })
    return stats
  }, [displayCooperatives, riskyItems, routeInsights])

  const provinceClusters = useMemo(
    () => [...provinceStats.entries()]
      .map(([key, stats]) => ({ key, ...stats }))
      .filter((stats) => stats.cooperatives.length > 1 && hasValidCoordinates(stats.cooperatives[0]))
      .map((stats) => ({
        ...stats,
        center: markerCenter(stats.cooperatives[0]),
        urgentCount: stats.risks.filter((item) => Number(item.risk_score || 0) >= 0.7).length,
      })),
    [provinceStats]
  )

  const getProvinceStyle = (feature) => {
    const stats = provinceStats.get(normalizeProvinceName(feature.properties?.name))
    const coopCount = stats?.cooperatives.length || 0
    const maxRisk = Number(stats?.maxRisk || 0)
    const fillColor = maxRisk >= 0.7 ? '#c46f44' : maxRisk >= 0.4 ? '#d99b28' : coopCount > 1 ? '#1f7a66' : coopCount ? '#2f8f5b' : '#eef5ee'
    return {
      color: coopCount > 1 ? '#0f4f43' : coopCount ? '#17211b' : '#90a390',
      weight: coopCount > 1 ? 3.2 : coopCount ? 2.4 : 1.25,
      fillColor,
      fillOpacity: maxRisk >= 0.4 ? 0.28 : coopCount ? 0.2 : 0.1,
      opacity: 0.95,
    }
  }

  const handleProvince = (feature, layer) => {
    const name = feature.properties?.name || 'İl'
    const stats = provinceStats.get(normalizeProvinceName(name))
    const coopNames = stats?.cooperatives.map((coop) => coop.name).join('<br/>') || 'Kooperatif yok'
    layer.bindTooltip(`${name}${stats?.cooperatives.length > 1 ? ` · ${stats.cooperatives.length}` : ''}`, { sticky: true })
    layer.bindPopup(`<strong>${name}</strong><br/>${coopNames}<br/>Riskli stok: ${stats?.risks.length || 0}`)
    layer.on({
      mouseover: () => layer.setStyle({ weight: 3.6, fillOpacity: 0.4 }),
      mouseout: () => layer.setStyle(getProvinceStyle(feature)),
    })
  }

  return (
    <div className="space-y-6">
      <section className="soft-panel flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-leaf">Harita</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Risk Haritası</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-moss">Risk, rota ve talep noktaları.</p>
        </div>
        <button onClick={() => goTo('inventory')} className="focus-ring rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">
          Stoklara Git
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MapMetric icon={AlertTriangle} title="Acil Nokta" value={urgentItems.length} tone="text-clay" />
        <MapMetric icon={Truck} title="Rota" value={routeInsights.length} tone="text-ink" />
        <MapMetric icon={Leaf} title="Öğün" value={formatNumber(totalLossMeals)} tone="text-leaf" />
        <MapMetric icon={Route} title="Değer" value={`${formatNumber(totalLossValue)} TL`} tone="text-clay" />
      </div>

      <section className="panel overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative h-[540px] min-h-0 overflow-hidden lg:h-[620px]">
            <MapContainer center={[39.1, 35.5]} zoom={6} attributionControl={false} scrollWheelZoom style={{ height: '100%', width: '100%', zIndex: 0 }} className="z-0">
              <TurkeyFit />
              <StableMapSize trigger={`${inventory.length}-${pendingSwaps.length}-${cooperatives.length}`} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap katkıcıları" maxZoom={18} />
              <GeoJSON key={`${displayCooperatives.length}-${riskyItems.length}-${routeInsights.length}`} data={turkeyProvinces} style={getProvinceStyle} onEachFeature={handleProvince} />

              {provinceClusters.map((cluster) => (
                <CircleMarker key={`cluster-${cluster.key}`} center={cluster.center} radius={15 + Math.min(cluster.cooperatives.length * 2, 10)} pathOptions={{ fillColor: cluster.urgentCount ? '#c46f44' : '#1f7a66', color: '#ffffff', weight: 3, fillOpacity: 0.82 }}>
                  <Tooltip direction="top" offset={[0, -12]}>{cluster.cooperatives[0].region} · {cluster.cooperatives.length} kooperatif</Tooltip>
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <strong>{cluster.cooperatives[0].region}</strong>
                      <div style={{ marginTop: 6, color: '#6f806f', fontSize: 12 }}>Aynı ilde çoklu kayıt.</div>
                      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                        {cluster.cooperatives.map((coop) => <div key={coop.id} style={{ fontSize: 12 }}><strong>{coop.name}</strong></div>)}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12 }}>Riskli stok: {cluster.risks.length}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {routeInsights.map((route) => (
                <Polyline key={route.swap.id} positions={buildRoutePositions(route)} pathOptions={{ color: route.tone.color, weight: 2 + route.score * 3, dashArray: '8 7', opacity: 0.85 }}>
                  <Popup>
                    <strong>{route.swap.product_name || 'Ürün'}</strong> · {route.swap.quantity_kg} kg<br />
                    <span style={{ fontSize: 12 }}>{route.from.region} → {route.to.region}</span>
                    {route.suggested && <><br /><span style={{ fontSize: 12 }}>Öneri rota</span></>}
                  </Popup>
                </Polyline>
              ))}

              {riskyItems.map((item) => {
                const coop = cooperativeMap.get(item.cooperative_id)
                if (!hasValidCoordinates(coop)) return null
                const risk = Number(item.risk_score || 0)
                return <Circle key={`halo-${item.id}`} center={markerCenter(coop)} radius={22000 + Math.min(Number(item.quantity_kg || 0) * 18, 42000)} pathOptions={{ color: riskColor(risk), fillColor: riskColor(risk), fillOpacity: 0.13, weight: 0 }} />
              })}

              {displayCooperatives.map((coop) => {
                if (!hasValidCoordinates(coop)) return null
                const isDemand = demandCooperativeIds.has(coop.id)
                const hasSameRegion = coop.same_region_count > 1
                const coopRisks = riskyItems.filter((item) => item.cooperative_id === coop.id)
                const urgentRisk = coopRisks.some((item) => Number(item.risk_score || 0) >= 0.7)
                return (
                  <CircleMarker key={`coop-${coop.id}`} center={markerCenter(coop)} radius={urgentRisk ? 9 : isDemand ? 8 : hasSameRegion ? 7 : 5} pathOptions={{ fillColor: urgentRisk ? '#c46f44' : isDemand ? '#2f8f5b' : hasSameRegion ? '#1f7a66' : '#8fa08f', color: hasSameRegion ? '#ffffff' : isDemand ? '#1c6640' : '#6f806f', weight: hasSameRegion ? 2.4 : 1.5, fillOpacity: urgentRisk || isDemand ? 0.95 : 0.72 }}>
                    <Tooltip direction="top" offset={[0, -8]}>{coop.name} · {coop.region}</Tooltip>
                    <Popup>
                      <div style={{ minWidth: 190 }}>
                        <strong>{coop.name}</strong>
                        <div style={{ color: '#6f806f', fontSize: 12, marginTop: 2 }}>{coop.region}</div>
                        {hasSameRegion && <div style={{ marginTop: 6, color: '#6f806f', fontSize: 12 }}>Bu ilde {coop.same_region_count} kooperatif var.</div>}
                        <div style={{ marginTop: 8, fontSize: 12 }}><strong>Riskli stok</strong>: {coopRisks.length}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}

              {riskyItems.map((item) => {
                const coop = cooperativeMap.get(item.cooperative_id)
                if (!hasValidCoordinates(coop)) return null
                const risk = Number(item.risk_score || 0)
                return (
                  <CircleMarker key={`risk-${item.id}`} center={markerCenter(coop)} radius={9 + Math.min(Number(item.quantity_kg || 0) / 45, 13)} pathOptions={{ fillColor: riskColor(risk), color: '#fff', weight: 1.5, fillOpacity: 0.9 }}>
                    <Tooltip direction="top" offset={[0, -10]}>{Math.round(risk * 100)}</Tooltip>
                    <Popup>
                      <strong>{item.product_name}</strong><br />
                      <span style={{ fontSize: 12 }}>{coop.name} · {item.quantity_kg} kg</span><br />
                      <span style={{ fontSize: 12 }}>Risk {Math.round(risk * 100)}</span>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[999] flex flex-wrap gap-2 rounded-md border border-[#dfe8df] bg-white/92 p-2 text-xs font-medium text-moss shadow-sm">
              <LegendDot color="#c46f44" label="Acil" />
              <LegendDot color="#d99b28" label="Orta" />
              <LegendDot color="#2f8f5b" label="Hedef" />
              <LegendDot color="#1f7a66" label="Çoklu il" />
            </div>
          </div>

          <aside className="max-h-none overflow-y-auto border-t border-[#dfe8df] bg-white p-4 xl:max-h-[620px] xl:border-l xl:border-t-0">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned className="text-leaf" size={20} />
              <h2 className="text-lg font-semibold text-ink">Acil riskler</h2>
            </div>
            <div className="space-y-3">
              {urgentItems.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-md border border-[#edf2ed] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{item.product_name}</p>
                      <p className="text-sm text-moss">{item.cooperative_name} · {item.quantity_kg} kg</p>
                    </div>
                    <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{Number(item.risk_score || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {urgentItems.length === 0 && <p className="text-sm text-moss">Acil stok yok.</p>}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Rotalar</h3>
              <div className="mt-3 space-y-2">
                {routeInsights.slice(0, 4).map((route) => (
                  <div key={route.swap.id} className="rounded-md border border-[#edf2ed] bg-[#f7faf7] p-3 text-sm text-moss">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">{route.swap.product_name || 'Ürün'} · {route.swap.quantity_kg} kg</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span>{route.from.region}</span>
                          <ArrowRight size={14} />
                          <span>{route.to.region}</span>
                        </div>
                      </div>
                      <span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: route.tone.color, backgroundColor: `${route.tone.color}18` }}>
                        {route.suggested ? 'Öneri' : route.tone.label}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <RouteMetric label="Mesafe" value={`${route.distanceKm.toFixed(0)} km`} />
                      <RouteMetric label="Skor" value={route.score.toFixed(2)} />
                      <RouteMetric label="CO2" value={`${route.carbon.toFixed(1)} kg`} />
                    </div>
                  </div>
                ))}
                {routeInsights.length === 0 && <p className="text-sm text-moss">Rota yok.</p>}
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
