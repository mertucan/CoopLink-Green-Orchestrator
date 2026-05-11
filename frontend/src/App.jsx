import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/ToastProvider'
import Dashboard from './pages/Dashboard'
import AiLogs from './pages/AiLogs'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import Leaderboard from './pages/Leaderboard'
import Operations from './pages/Operations'
import RiskMap from './pages/RiskMap'
import Swaps from './pages/Swaps'

const routes = {
  '/': 'home',
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
  const [page, setPage] = useState(pageFromLocation)

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

  const pages = useMemo(() => ({
    home: <Home goTo={navigate} />,
    dashboard: <Dashboard goTo={navigate} />,
    operations: <Operations goTo={navigate} />,
    aiLogs: <AiLogs />,
    inventory: <Inventory goTo={navigate} />,
    riskMap: <RiskMap goTo={navigate} />,
    swaps: <Swaps />,
    leaderboard: <Leaderboard />
  }), [])

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Navbar active={page} onChange={navigate} />
        <main className="mx-auto max-w-7xl px-4 py-6">
          {pages[page]}
        </main>
      </div>
    </ToastProvider>
  )
}
