import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const styles = {
  success: {
    icon: CheckCircle2,
    className: 'border-leaf bg-[#f1faf4] text-ink'
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-800'
  },
  info: {
    icon: Info,
    className: 'border-[#dfe8df] bg-white text-ink'
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((toast) => {
    const id = crypto.randomUUID()
    const nextToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || 'Bilgi',
      description: toast.description || '',
      duration: toast.duration ?? 5200
    }
    setToasts((current) => [nextToast, ...current].slice(0, 4))
    window.setTimeout(() => removeToast(id), nextToast.duration)
    return id
  }, [removeToast])

  const value = useMemo(() => ({ showToast, removeToast }), [removeToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-32px))] flex-col gap-3">
        {toasts.map((toast) => {
          const config = styles[toast.type] || styles.info
          const Icon = config.icon
          return (
            <section key={toast.id} className={`panel border p-4 shadow-lg ${config.className}`}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 shrink-0" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description && <p className="mt-1 text-sm leading-5 text-moss">{toast.description}</p>}
                </div>
                <button title="Kapat" className="rounded p-1 hover:bg-black/5" onClick={() => removeToast(toast.id)}>
                  <X size={16} />
                </button>
              </div>
            </section>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast ToastProvider içinde kullanılmalı')
  }
  return context
}
