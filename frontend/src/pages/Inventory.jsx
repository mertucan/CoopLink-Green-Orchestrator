import { Fragment, useMemo, useState } from 'react'
import RiskBadge from '../components/RiskBadge'
import SpoilageSimulator from '../components/SpoilageSimulator'
import { useToast } from '../components/ToastProvider'
import { useAssistantMessage } from '../hooks/useAssistant'
import { useAuth } from '../hooks/useAuth'
import { useCooperatives, useInventory, useProducts } from '../hooks/useInventory'
import { useProposeSwap } from '../hooks/useSwaps'

export default function Inventory({ goTo }) {
  const { user, isAdmin, isCooperative } = useAuth()
  const [coop, setCoop] = useState('')
  const [stockScope, setStockScope] = useState('mine')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [riskOnly, setRiskOnly] = useState(false)
  const [notice, setNotice] = useState(null)
  const [proposingId, setProposingId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [simulatedItemId, setSimulatedItemId] = useState(null)
  const { data: items = [], isLoading, isError } = useInventory(isAdmin ? coop : '')
  const { data: cooperatives = [] } = useCooperatives()
  const { data: products = [] } = useProducts()
  const proposeSwap = useProposeSwap()
  const assistantMessage = useAssistantMessage()
  const { showToast } = useToast()
  
  const categories = useMemo(() => [...new Set(products.map((item) => item.category).filter(Boolean))], [products])
  
  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')
    return [...items]
      .filter((item) => {
        if (!isCooperative) return true
        if (stockScope === 'mine') return item.cooperative_id === user?.id
        return item.cooperative_id !== user?.id
      })
      .filter((item) => !category || item.product_category === category)
      .filter((item) => !riskOnly || (!item.is_disposed && Number(item.risk_score) >= 0.7))
      .filter((item) => {
        if (!term) return true
        return `${item.product_name} ${item.cooperative_name} ${item.cooperative_region}`.toLocaleLowerCase('tr-TR').includes(term)
      })
      .sort((a, b) => {
        if (Boolean(a.is_disposed) !== Boolean(b.is_disposed)) return a.is_disposed ? 1 : -1
        if (Boolean(a.is_expired) !== Boolean(b.is_expired)) return a.is_expired ? -1 : 1
        return Number(b.risk_score || 0) - Number(a.risk_score || 0)
      })
  }, [category, isCooperative, items, riskOnly, search, stockScope, user?.id])

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
        {/* 🌟 BAŞLIK: dark:text-white eklendi */}
        <h1 className="text-2xl font-semibold text-ink dark:text-white transition-colors duration-300">Stok ve risk takibi</h1>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* 🌟 INPUT & SELECT: Koyu mod stilleri eklendi */}
          <input
            className="h-10 rounded-md border border-[#dfe8df] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm dark:text-white dark:placeholder-slate-400 transition-colors duration-300"
            placeholder="Ürün veya kooperatif ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="h-10 rounded-md border border-[#dfe8df] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm dark:text-white transition-colors duration-300" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {isAdmin && (
            <select className="h-10 rounded-md border border-[#dfe8df] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm dark:text-white transition-colors duration-300" value={coop} onChange={(e) => setCoop(e.target.value)}>
              <option value="">Tüm kooperatifler</option>
              {cooperatives.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {isCooperative && (
        <div className="inline-flex rounded-md border border-[#dfe8df] dark:border-slate-700 bg-white dark:bg-slate-800 p-1 transition-colors duration-300">
          {[
            ['mine', 'Kendi stoklarım'],
            ['others', 'Diğer kooperatifler']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStockScope(id)}
              className={`rounded px-3 py-2 text-sm transition-colors duration-300 ${stockScope === id ? 'bg-leaf dark:bg-emerald-600 text-white' : 'text-moss dark:text-slate-300 hover:dark:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-moss dark:text-slate-300 transition-colors duration-300">
        <input type="checkbox" checked={riskOnly} onChange={(event) => setRiskOnly(event.target.checked)} className="dark:accent-emerald-500" />
        Sadece acil riskli stokları göster
      </label>

      {notice && (
        <div className="panel flex flex-col justify-between gap-3 border-leaf dark:border-emerald-600 bg-[#f1faf4] dark:bg-emerald-900/20 p-4 text-sm text-ink dark:text-slate-200 sm:flex-row sm:items-center transition-colors duration-300">
          <span>{notice}</span>
          <button onClick={() => goTo('swaps')} className="rounded-md bg-leaf dark:bg-emerald-600 px-3 py-2 font-medium text-white transition-colors">Takaslara Git</button>
        </div>
      )}

      {/* 🌟 TABLO KAPSAYICISI: bg-slate-900 ve koyu border eklendi */}
      <div className="panel overflow-x-auto bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 transition-colors duration-300 rounded-2xl shadow-sm">
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
          {/* 🌟 TABLO BAŞLIĞI */}
          <thead className="border-b border-[#dfe8df] dark:border-slate-700 bg-mist dark:bg-slate-800/80 text-moss dark:text-slate-300 transition-colors duration-300">
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
            {isLoading && <tr><td className="px-4 py-4 text-moss dark:text-slate-400" colSpan="7">Stoklar yükleniyor...</td></tr>}
            {isError && <tr><td className="px-4 py-4 text-red-700 dark:text-red-400" colSpan="7">Stok verileri alınamadı.</td></tr>}
            {rows.map((item, index) => (
              <Fragment key={item.id || index}>
                {/* 🌟 TABLO SATIRLARI */}
                <tr className={`border-b border-[#edf2ed] dark:border-slate-700/50 transition-colors duration-200 ${simulatedItemId === item.id ? 'bg-[#f7fbf7] dark:bg-slate-800/50' : 'hover:dark:bg-slate-800/30'}`}>
                  <td className="px-4 py-3">
                    <div className="truncate font-medium text-ink dark:text-white">{item.cooperative_name || item.cooperative_id}</div>
                    <div className="truncate text-xs text-moss dark:text-slate-400">{item.cooperative_region}</div>
                  </td>
                  <td className="truncate px-4 py-3 font-medium dark:text-slate-200">{item.product_name || item.product_id}</td>
                  <td className="truncate px-4 py-3 dark:text-slate-300">{item.product_category || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 dark:text-slate-300">{item.quantity_kg} kg</td>
                  <td className="px-4 py-3">
                    <div className={item.is_expired ? 'font-semibold text-red-700 dark:text-red-400' : 'dark:text-slate-300'}>
                      {item.expires_at ? new Date(item.expires_at).toLocaleDateString('tr-TR') : '-'}
                    </div>
                    {item.is_disposed && (
                      <div className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                        İmha edildi{item.disposal_penalty_points ? ` · -${item.disposal_penalty_points} puan` : ''}
                      </div>
                    )}
                    {!item.is_disposed && item.is_expired && <div className="mt-1 text-xs text-red-700 dark:text-red-400">Takas yerine ayrı aksiyon</div>}
                    {!item.is_expired && item.has_pending_swap && <div className="mt-1 text-xs font-medium text-leaf dark:text-emerald-400">Takas bekliyor</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mx-auto w-28">
                      <RiskBadge value={item.risk_score} expired={item.is_expired} disposed={item.is_disposed} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[252px] justify-end gap-2">
                      {/* 🌟 BUTONLAR: Gece modunda parlamaması için renkleri kısıldı */}
                      <button
                        className="h-9 w-20 shrink-0 rounded-md bg-ink dark:bg-slate-700 px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                        disabled={analyzingId === item.id || (isCooperative && item.cooperative_id !== user?.id)}
                        onClick={() => handleGeminiAnalyze(item)}
                      >
                        {analyzingId === item.id ? 'Analiz...' : 'Gemini'}
                      </button>
                      <button
                        className={`h-9 w-24 shrink-0 rounded-md border px-2 text-xs font-semibold leading-none transition-colors ${simulatedItemId === item.id ? 'border-leaf dark:border-emerald-500 bg-[#eef8f1] dark:bg-emerald-900/30 text-leaf dark:text-emerald-400' : 'border-[#cfdccf] dark:border-slate-600 bg-white dark:bg-slate-800 text-ink dark:text-slate-200 hover:dark:bg-slate-700'}`}
                        onClick={() => setSimulatedItemId(simulatedItemId === item.id ? null : item.id)}
                      >
                        {simulatedItemId === item.id ? 'Açık' : 'Simülasyon'}
                      </button>
                      {Number(item.risk_score) > 0.7 && !item.is_expired && !item.is_disposed && !item.has_pending_swap && (isAdmin || item.cooperative_id === user?.id) && (
                      <button
                        className="h-9 w-20 shrink-0 rounded-md bg-clay dark:bg-orange-600 px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                        disabled={proposingId === item.id}
                        onClick={() => handlePropose(item)}
                      >
                        {proposingId === item.id ? '...' : 'Takas'}
                      </button>
                      )}
                      {(Number(item.risk_score) <= 0.7 || item.is_expired || item.is_disposed || item.has_pending_swap) && <span className="h-9 w-20 shrink-0" aria-hidden="true" />}
                    </div>
                  </td>
                </tr>
                {/* 🌟 SİMÜLASYON SATIRI */}
                {simulatedItemId === item.id && (
                  <tr className="border-b border-[#dfe8df] dark:border-slate-700 bg-[#f7fbf7] dark:bg-slate-800/40 transition-colors">
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
            {!isLoading && !isError && rows.length === 0 && <tr><td className="px-4 py-4 text-moss dark:text-slate-400" colSpan="7">Filtrelerle eşleşen kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}