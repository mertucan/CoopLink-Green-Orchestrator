import { ArrowRight, Bot, Boxes, Handshake, Leaf, MapPinned, Route, ShieldCheck, Sprout, Utensils } from 'lucide-react'

const impactItems = [
  { label: 'Gıda kaybı erken yakalanır', value: 'risk skoru', icon: ShieldCheck },
  { label: 'Kooperatifler eşleşir', value: 'akıllı takas', icon: Handshake },
  { label: 'Etki görünür olur', value: 'öğün + CO2 + TL', icon: Leaf }
]

const workflow = [
  { title: 'Stok sinyali', text: 'Riskli ürünler son kullanma ve miktara göre öne çıkar.', icon: Boxes },
  { title: 'AI karar izi', text: 'Mesaj, buton ve öneri akışları AI Logs üzerinde kalıcılaşır.', icon: Bot },
  { title: 'Rota etkisi', text: 'Bekleyen takaslar harita üzerinde operasyon rotasına dönüşür.', icon: Route }
]

export default function Home({ goTo }) {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-[#d7e4d8] bg-[#f8fbf7] shadow-[0_18px_44px_rgba(23,33,27,0.08)]">
        <div className="grid min-h-[520px] lg:grid-cols-[1fr_0.92fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-8 lg:px-10">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-[#cfe0d1] bg-white px-3 py-2 text-sm font-semibold text-leaf">
              <Sprout size={16} />
              Kooperatif ağ zekası
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              CoopLink gıda kaybını, takası ve lojistiği tek operasyon akışında birleştirir.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-moss">
              Green Orchestrator, kooperatiflerin stok fazlasını erken yakalar, en uygun takas eşleşmesini önerir ve kurtarılan sosyal, çevresel ve ekonomik değeri görünür hale getirir.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => goTo('operations')} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-leaf px-5 text-sm font-semibold text-white">
                Operasyona Başla
                <ArrowRight size={17} />
              </button>
              <button onClick={() => goTo('riskMap')} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfdccd] bg-white px-5 text-sm font-semibold text-moss">
                Haritayı Gör
                <MapPinned size={17} />
              </button>
            </div>
          </div>

          <div className="relative min-h-[420px] border-t border-[#dfe8df] bg-[#edf4ec] lg:border-l lg:border-t-0">
            <NetworkScene />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {impactItems.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label} className="panel p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#edf7ef] text-leaf">
                <Icon size={20} />
              </div>
              <p className="text-sm font-medium text-moss">{item.label}</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">{item.value}</h2>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="soft-panel p-6">
          <p className="text-sm font-semibold text-leaf">Neden farklı?</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Sadece stok tutmaz, kaybın olmadan önce karar üretir.</h2>
          <p className="mt-4 text-sm leading-6 text-moss">
            CoopLink her stok satırını operasyon sinyaline çevirir. Risk artınca takas önerisi, takas açılınca rota, işlem tamamlanınca kurtarılan değer ortaya çıkar.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <Metric value="112" label="öğün" />
            <Metric value="2.1 kg" label="CO2" />
            <Metric value="1.450 TL" label="yerel değer" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflow.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="panel p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#fff7e2] text-clay">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-moss">{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function NetworkScene() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(47,143,91,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(47,143,91,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute left-[10%] top-[15%] h-16 w-16 rounded-md border border-[#c6d8c8] bg-white shadow-sm" />
      <div className="absolute right-[13%] top-[20%] h-20 w-20 rounded-md border border-[#c6d8c8] bg-white shadow-sm" />
      <div className="absolute bottom-[19%] left-[18%] h-20 w-20 rounded-md border border-[#c6d8c8] bg-white shadow-sm" />
      <div className="absolute bottom-[15%] right-[22%] h-16 w-16 rounded-md border border-[#c6d8c8] bg-white shadow-sm" />
      <RouteLine className="left-[22%] top-[27%] w-[45%] rotate-[8deg]" />
      <RouteLine className="left-[24%] top-[56%] w-[48%] -rotate-[18deg]" />
      <RouteLine className="left-[38%] top-[40%] w-[33%] rotate-[52deg]" />
      <Node className="left-[13%] top-[18%]" title="İzmir" tone="leaf" icon={Boxes} />
      <Node className="right-[16%] top-[25%]" title="Antalya" tone="clay" icon={ShieldCheck} />
      <Node className="bottom-[24%] left-[21%]" title="Konya" tone="wheat" icon={Utensils} />
      <Node className="bottom-[20%] right-[25%]" title="Edirne" tone="leaf" icon={Handshake} />
      <div className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#cfe0d1] bg-white/92 p-4 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-leaf">Canlı ağ etkisi</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">80 kg domates kurtarılıyor</h3>
          </div>
          <span className="rounded-md bg-[#ffe8e2] px-2 py-1 text-xs font-semibold text-clay">Acil</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <MiniStat value="112" label="öğün" />
          <MiniStat value="2.1" label="kg CO2" />
          <MiniStat value="1.450" label="TL" />
        </div>
      </div>
    </div>
  )
}

function RouteLine({ className }) {
  return <div className={`absolute h-[3px] origin-left rounded-full bg-leaf/55 ${className}`} />
}

function Node({ className, title, tone, icon: Icon }) {
  const toneClass = {
    leaf: 'bg-leaf text-white',
    clay: 'bg-clay text-white',
    wheat: 'bg-wheat text-ink'
  }[tone]

  return (
    <div className={`absolute flex items-center gap-2 rounded-md border border-white bg-white px-3 py-2 shadow-lg ${className}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
        <Icon size={16} />
      </span>
      <span className="text-sm font-semibold text-ink">{title}</span>
    </div>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-md bg-[#f4f8f2] px-2 py-3">
      <p className="font-semibold text-ink">{value}</p>
      <p className="mt-1 text-moss">{label}</p>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-md border border-[#dfe8df] bg-white p-3">
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-moss">{label}</p>
    </div>
  )
}
