import { Fragment, useMemo, useState } from 'react'
import RiskBadge from '../components/RiskBadge'
import SpoilageSimulator from '../components/SpoilageSimulator'
import { useToast } from '../components/ToastProvider'
import { useAssistantMessage } from '../hooks/useAssistant'
import { useCooperatives, useInventory, useProducts } from '../hooks/useInventory'
import { useProposeSwap } from '../hooks/useSwaps'

export default function Inventory({ goTo }) {
  const [coop, setCoop] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [riskOnly, setRiskOnly] = useState(false)
  const [notice, setNotice] = useState(null)
  const [proposingId, setProposingId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [simulatedItemId, setSimulatedItemId] = useState(null)
  const { data: items = [], isLoading, isError } = useInventory(coop)
  const { data: cooperatives = [] } = useCooperatives()
  const { data: products = [] } = useProducts()
  const proposeSwap = useProposeSwap()
  const assistantMessage = useAssistantMessage()
  const { showToast } = useToast()
  const categories = useMemo(() => [...new Set(products.map((item) => item.category).filter(Boolean))], [products])
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')
    return [...items]
      .filter((item) => !category || item.product_category === category)
      .filter((item) => !riskOnly || Number(item.risk_score) >= 0.7)
      .filter((item) => {
        if (!term) return true
        return `${item.product_name} ${item.cooperative_name} ${item.cooperative_region}`.toLocaleLowerCase('tr-TR').includes(term)
      })
      .sort((a, b) => {
        if (Boolean(a.is_expired) !== Boolean(b.is_expired)) return a.is_expired ? -1 : 1
        return Number(b.risk_score || 0) - Number(a.risk_score || 0)
      })
  }, [category, items, riskOnly, search])
  const handlePropose = (item) => {
    setNotice(null)
    setProposingId(item.id)
    proposeSwap.mutate(
      { inventoryId: item.id },
      {
        onSuccess: (result) => {
          const item = result.item
          const title = result.reused ? 'Mevcut öneri açıldı' : 'Takas önerisi oluşturuldu'
          const description = `${item.quantity_kg} kg ${item.product_name}, ${item.from_cooperative_name} -> ${item.to_cooperative_name}. Skor ${Number(item.match_score || 0).toFixed(2)}, tahmini ${Number(item.carbon_saved_kg || 0).toFixed(1)} kg CO2 tasarrufu.`
          setNotice(result.reused ? `${item.product_name} için mevcut bekleyen takas önerisi açıldı.` : `${item.product_name} için takas önerisi oluşturuldu. Stok onaylanana kadar listede bekleyen olarak kalır.`)
          showToast({ type: result.reused ? 'info' : 'success', title, description })
        },
        onError: (error) => {
          const description = error?.response?.data?.detail || 'Takas önerisi oluşturulamadı.'
          setNotice(description)
          showToast({ type: 'error', title: 'Takas önerisi başarısız', description })
        },
        onSettled: () => setProposingId(null)
      }
    )
  }
  const handleGeminiAnalyze = (item) => {
    setAnalyzingId(item.id)
    const message = `${item.cooperative_name} kooperatifinde ${item.quantity_kg} kg ${item.product_name} var. Risk skoru ${Number(item.risk_score || 0).toFixed(2)}. Bu ürün için stok sorgusu mu, takas önerisi mi yoksa teslimat takibi mi yapılmalı? Gerekirse takas öner.`
    assistantMessage.mutate(
      { message, channelId: `admin-panel:inventory:${item.id}` },
      {
        onSuccess: (result) => {
          showToast({
            type: 'success',
            title: 'Gemini analizi tamamlandı',
            description: result.response
          })
          setNotice(`${item.product_name} için Gemini/Orchestrator analizi AI Logları ekranına yazıldı.`)
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: 'Gemini analizi başarısız',
            description: error?.response?.data?.detail || 'Assistant endpoint çağrısı tamamlanamadı.'
          })
        },
        onSettled: () => setAnalyzingId(null)
      }
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-ink">Stok ve risk takibi</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-10 rounded-md border border-[#dfe8df] bg-white px-3 text-sm"
            placeholder="Ürün veya kooperatif ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="h-10 rounded-md border border-[#dfe8df] bg-white px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-md border border-[#dfe8df] bg-white px-3 text-sm" value={coop} onChange={(e) => setCoop(e.target.value)}>
            <option value="">Tüm kooperatifler</option>
            {cooperatives.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-moss">
        <input type="checkbox" checked={riskOnly} onChange={(event) => setRiskOnly(event.target.checked)} />
        Sadece acil riskli stokları göster
      </label>
      {notice && (
        <div className="panel flex flex-col justify-between gap-3 border-leaf bg-[#f1faf4] p-4 text-sm text-ink sm:flex-row sm:items-center">
          <span>{notice}</span>
          <button onClick={() => goTo('swaps')} className="rounded-md bg-leaf px-3 py-2 font-medium text-white">Takaslara Git</button>
        </div>
      )}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[19%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead className="border-b border-[#dfe8df] bg-mist text-moss">
            <tr>
              <th className="px-4 py-3">Kooperatif</th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Miktar</th>
              <th className="px-4 py-3">Son Kullanma</th>
              <th className="px-4 py-3 text-center">Risk</th>
              <th className="px-4 py-3 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-4 text-moss" colSpan="7">Stoklar yükleniyor...</td></tr>}
            {isError && <tr><td className="px-4 py-4 text-red-700" colSpan="7">Stok verileri alınamadı.</td></tr>}
            {rows.map((item, index) => (
              <Fragment key={item.id || index}>
                <tr className={`border-b border-[#edf2ed] ${simulatedItemId === item.id ? 'bg-[#f7fbf7]' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="truncate font-medium text-ink">{item.cooperative_name || item.cooperative_id}</div>
                    <div className="truncate text-xs text-moss">{item.cooperative_region}</div>
                  </td>
                  <td className="truncate px-4 py-3 font-medium">{item.product_name || item.product_id}</td>
                  <td className="truncate px-4 py-3">{item.product_category || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{item.quantity_kg} kg</td>
                  <td className="px-4 py-3">
                    <div className={item.is_expired ? 'font-semibold text-red-700' : ''}>
                      {item.expires_at ? new Date(item.expires_at).toLocaleDateString('tr-TR') : '-'}
                    </div>
                    {item.is_expired && <div className="mt-1 text-xs text-red-700">Takas yerine ayrı aksiyon</div>}
                    {!item.is_expired && item.has_pending_swap && <div className="mt-1 text-xs font-medium text-leaf">Takas bekliyor</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mx-auto w-28">
                      <RiskBadge value={item.risk_score} expired={item.is_expired} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[252px] justify-end gap-2">
                      <button
                        className="h-9 w-20 shrink-0 rounded-md bg-ink px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={analyzingId === item.id}
                        onClick={() => handleGeminiAnalyze(item)}
                      >
                        {analyzingId === item.id ? 'Analiz...' : 'Gemini'}
                      </button>
                      <button
                        className={`h-9 w-24 shrink-0 rounded-md border px-2 text-xs font-semibold leading-none ${simulatedItemId === item.id ? 'border-leaf bg-[#eef8f1] text-leaf' : 'border-[#cfdccf] bg-white text-ink'}`}
                        onClick={() => setSimulatedItemId(simulatedItemId === item.id ? null : item.id)}
                      >
                        {simulatedItemId === item.id ? 'Açık' : 'Simülasyon'}
                      </button>
                      {Number(item.risk_score) > 0.7 && !item.is_expired && !item.has_pending_swap && (
                      <button
                        className="h-9 w-20 shrink-0 rounded-md bg-clay px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={proposingId === item.id}
                        onClick={() => handlePropose(item)}
                      >
                        {proposingId === item.id ? '...' : 'Takas'}
                      </button>
                      )}
                      {(Number(item.risk_score) <= 0.7 || item.is_expired || item.has_pending_swap) && <span className="h-9 w-20 shrink-0" aria-hidden="true" />}
                    </div>
                  </td>
                </tr>
                {simulatedItemId === item.id && (
                  <tr className="border-b border-[#dfe8df] bg-[#f7fbf7]">
                    <td className="px-4 py-4" colSpan="7">
                      <SpoilageSimulator
                        item={item}
                        isProposing={proposingId === item.id}
                        onClose={() => setSimulatedItemId(null)}
                        onPropose={handlePropose}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!isLoading && !isError && rows.length === 0 && <tr><td className="px-4 py-4 text-moss" colSpan="7">Filtrelerle eşleşen kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
