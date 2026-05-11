import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login({ goTo, onSuccess }) {
  const { login } = useAuth()
  const [contactPhone, setContactPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const user = await login({ contactPhone, password })
      onSuccess?.(user)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Giriş bilgileri kontrol edilemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-md border border-[#dfe8df] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold text-leaf">Yetkili giriş</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Kooperatif veya admin hesabı</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-ink">
          Telefon
          <div className="mt-1 flex overflow-hidden rounded-md border border-[#dfe8df] bg-white">
            <span className="flex h-11 items-center border-r border-[#dfe8df] bg-mist px-3 text-sm font-semibold text-moss">+90</span>
            <input
              className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
              inputMode="numeric"
              placeholder="5321110001"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>
        </label>
        <label className="block text-sm font-medium text-ink">
          Şifre
          <div className="mt-1 flex overflow-hidden rounded-md border border-[#dfe8df] bg-white">
            <input
              className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              onClick={() => setShowPassword((value) => !value)}
              className="focus-ring flex h-11 w-11 items-center justify-center text-moss"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button
          className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <LogIn size={18} />
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>
        <button
          type="button"
          onClick={() => goTo('register')}
          className="h-10 w-full rounded-md bg-mist text-sm font-semibold text-moss"
        >
          Yeni kooperatif kaydı oluştur
        </button>
      </form>
    </section>
  )
}
