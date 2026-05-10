import { Bot, CheckCircle2, RotateCcw } from 'lucide-react'
import { useAiLogs } from '../hooks/useAiLogs'

export default function AiLogs() {
  const { data: logs = [], isLoading, isError, refetch } = useAiLogs(50)

  return (
    <div className="space-y-5">
      <div className="soft-panel flex flex-col justify-between gap-3 p-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-leaf">Gemini ve Orchestrator kayıtları</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">AI Logları</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-moss">
            Kullanıcı mesajı, seçilen intent, kullanılan model, fallback durumu ve final yanıt bu ekranda izlenir.
          </p>
        </div>
        <button onClick={() => refetch()} className="focus-ring flex h-10 items-center gap-2 rounded-md bg-leaf px-3 text-sm font-medium text-white">
          <RotateCcw size={16} /> Yenile
        </button>
      </div>

      {isLoading && <div className="panel p-4 text-moss">AI logları yükleniyor...</div>}
      {isError && <div className="panel p-4 text-red-700">AI logları alınamadı.</div>}

      <div className="space-y-3">
        {logs.map((log) => <AiLogCard key={log.id} log={log} />)}
      </div>

      {!isLoading && !isError && logs.length === 0 && (
        <div className="panel p-4 text-moss">Henüz AI log kaydı yok. Assistant endpoint'i veya Orchestrator çağrısı sonrası burada görünecek.</div>
      )}
    </div>
  )
}

function AiLogCard({ log }) {
  const metadata = log.metadata || {}
  return (
    <article className="panel p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mist text-leaf">
            <Bot size={19} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-ink">{log.detected_intent}</h2>
              <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-moss">{log.model_name}</span>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${log.used_gemini ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                {log.used_gemini ? 'Gemini' : 'Fallback'}
              </span>
            </div>
            <p className="mt-2 text-sm text-moss">Mesaj: <span className="text-ink">{log.user_message}</span></p>
            <p className="mt-1 text-sm text-moss">Yanıt: <span className="text-ink">{log.final_response}</span></p>
          </div>
        </div>
        <div className="text-sm text-moss lg:text-right">
          <p>{log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}</p>
          <p className="mt-1">{log.channel_id || 'Demo kanal'}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <Detail label="Seçilen araç" value={log.selected_tool} />
        <Detail label="Gemini cevabı" value={log.gemini_response || 'Yok'} />
        <Detail label="Ürün / miktar" value={`${metadata.product || '-'} / ${metadata.quantity_kg || '-'} kg`} />
      </div>
      {log.prompt && (
        <div className="mt-3 rounded-md bg-mist p-3 text-xs leading-5 text-moss">
          <CheckCircle2 className="mr-1 inline text-leaf" size={14} />
          Prompt: {log.prompt}
        </div>
      )}
    </article>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-md border border-[#edf2ed] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-moss">{label}</p>
      <p className="mt-1 font-medium text-ink">{value}</p>
    </div>
  )
}
