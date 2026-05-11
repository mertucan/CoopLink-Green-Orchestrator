import { BarChart3, Bot, Boxes, Handshake, Home, Leaf, LogIn, LogOut, MapPinned, ShieldCheck, Trophy } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const items = [
  { id: 'home', label: 'Ana Sayfa', icon: Home, roles: ['public', 'cooperative', 'admin'] },
  { id: 'dashboard', label: 'Panel', icon: BarChart3, roles: ['cooperative', 'admin'] },
  { id: 'inventory', label: 'Stok', icon: Boxes, roles: ['cooperative', 'admin'] },
  { id: 'swaps', label: 'Takaslar', icon: Handshake, roles: ['cooperative', 'admin'] },
  { id: 'riskMap', label: 'Harita', icon: MapPinned, roles: ['public', 'cooperative', 'admin'] },
  { id: 'aiLogs', label: 'AI Logları', icon: Bot, roles: ['admin'] },
  { id: 'leaderboard', label: 'Sıralama', icon: Trophy, roles: ['public', 'cooperative', 'admin'] },
  { id: 'operations', label: 'Operasyon', icon: ShieldCheck, roles: ['admin'] }
]

export function visiblePagesForRole(role) {
  return items.filter((item) => item.roles.includes(role)).map((item) => item.id)
}

export default function Navbar({ active, onChange }) {
  const { user, role, logout } = useAuth()
  const visibleItems = items.filter((item) => item.roles.includes(role))
  return (
    <nav className="sticky top-0 z-40 border-b border-[#dfe8df]/80 bg-white/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button className="focus-ring flex shrink-0 items-center gap-3 rounded-md text-left" onClick={() => onChange('home')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-leaf text-white">
            <Leaf size={20} />
          </span>
          <span>
            <div className="text-xl font-semibold text-ink">CoopLink</div>
            <div className="text-xs font-medium text-leaf">Green Orchestrator</div>
            <div className="text-xs text-moss">Kooperatif ağ zekası</div>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-mist/80 p-1">
            {visibleItems.map((item) => {
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

        <div className="flex shrink-0 items-center gap-2">
          {user && (
            <span className="hidden max-w-[150px] truncate text-right text-xs text-moss lg:block">
              {user.name}
            </span>
          )}
          {user ? (
            <button
              title="Çıkış yap"
              onClick={() => {
                logout()
                onChange('home')
              }}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-md bg-mist text-moss"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              title="Giriş yap"
              onClick={() => onChange('login')}
              className="focus-ring flex h-9 items-center gap-2 rounded-md bg-leaf px-3 text-sm font-medium text-white"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Giriş</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
