import { Send } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function TelegramFab() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return null

  return (
    <a
      href="https://web.telegram.org/k/#@coobot2026_bot"
      target="_blank"
      rel="noreferrer"
      title="Telegram botunu aç"
      className="focus-ring fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/30 transition hover:-translate-y-0.5 hover:bg-[#1d8fca]"
    >
      <Send size={24} className="translate-x-[1px]" />
    </a>
  )
}
