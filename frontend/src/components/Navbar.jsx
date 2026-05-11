import { BarChart3, Bot, Boxes, Handshake, Home, Leaf, MapPinned, ShieldCheck, Trophy } from 'lucide-react'

const items = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'dashboard', label: 'Panel', icon: BarChart3 },
  { id: 'inventory', label: 'Stok', icon: Boxes },
  { id: 'swaps', label: 'Takaslar', icon: Handshake },
  { id: 'riskMap', label: 'Harita', icon: MapPinned },
  { id: 'aiLogs', label: 'AI Logları', icon: Bot },
  { id: 'leaderboard', label: 'Sıralama', icon: Trophy },
  { id: 'operations', label: 'Operasyon', icon: ShieldCheck }
]

export default function Navbar({ active, onChange }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-[#dfe8df]/80 bg-white/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button className="focus-ring flex items-center gap-3 rounded-md text-left" onClick={() => onChange('home')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-leaf text-white">
            <Leaf size={20} />
          </span>
          <span>
            <div className="text-xl font-semibold text-ink">CoopLink</div>
            <div className="text-xs font-medium text-leaf">Green Orchestrator</div>
            <div className="text-xs text-moss">Kooperatif ağ zekası</div>
          </span>
        </button>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-mist/80 p-1">
          {items.map((item) => {
            const Icon = item.icon
            const selected = active === item.id
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => onChange(item.id)}
                className={`focus-ring flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition ${selected ? 'bg-white text-ink shadow-sm' : 'text-moss hover:bg-white/70'}`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
