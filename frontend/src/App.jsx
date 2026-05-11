import { useEffect, useMemo, useState } from 'react'
import Navbar, { visiblePagesForRole } from './components/Navbar'
import TelegramFab from './components/TelegramFab'
import { ToastProvider } from './components/ToastProvider'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Dashboard from './pages/Dashboard'
import AiLogs from './pages/AiLogs'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Operations from './pages/Operations'
import Register from './pages/Register'
import RiskMap from './pages/RiskMap'
import Swaps from './pages/Swaps'

const routes = {
  '/': 'home',
  '/login': 'login',
  '/register': 'register',
  '/dashboard': 'dashboard',
  '/operations': 'operations',
  '/ai-logs': 'aiLogs',
  '/inventory': 'inventory',
  '/risk-map': 'riskMap',
  '/swaps': 'swaps',
  '/leaderboard': 'leaderboard'
}

const paths = Object.fromEntries(Object.entries(routes).map(([path, page]) => [page, path]))

function pageFromLocation() {
  return routes[window.location.pathname] || 'home'
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  )
}

function AppShell() {
  const [page, setPage] = useState(pageFromLocation)
  const { role, isChecking } = useAuth()

  useEffect(() => {
    const handlePopState = () => setPage(pageFromLocation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextPage) => {
    const nextPath = paths[nextPage] || '/'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setPage(nextPage)
  }

  useEffect(() => {
    if (page === 'login' || page === 'register') return
    const visiblePages = visiblePagesForRole(role)
    if (!visiblePages.includes(page)) {
      navigate('home')
    }
  }, [page, role])

  const pages = useMemo(() => ({
    home: <Home goTo={navigate} />,
    login: <Login goTo={navigate} onSuccess={() => navigate('dashboard')} />,
    register: <Register goTo={navigate} />,
    dashboard: <Dashboard goTo={navigate} />,
    operations: <Operations goTo={navigate} />,
    aiLogs: <AiLogs />,
    inventory: <Inventory goTo={navigate} />,
    riskMap: <RiskMap goTo={navigate} />,
    swaps: <Swaps />,
    leaderboard: <Leaderboard />
  }), [])

  if (isChecking) {
    return <div className="p-6 text-moss">Oturum kontrol ediliyor...</div>
  }

  return (
    <div className="min-h-screen">
      <Navbar active={page} onChange={navigate} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {pages[page] || pages.home}
      </main>
      <TelegramFab />
    </div>
  )
}
