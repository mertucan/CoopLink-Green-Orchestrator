import { ChevronDown, Eye, EyeOff, Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { turkeyProvinces } from '../data/turkeyProvinces'
import { useAuth } from '../hooks/useAuth'

export default function Register({ goTo }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  const [regionOpen, setRegionOpen] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredProvinces = useMemo(() => {
    const term = regionSearch.trim().toLocaleLowerCase('tr-TR')
    if (!term) return turkeyProvinces
    return turkeyProvinces.filter((province) => province.toLocaleLowerCase('tr-TR').includes(term))
  }, [regionSearch])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!region) {
      setError('Lütfen bir il seçin.')
      return
    }
    if (!/^5\d{9}$/.test(contactPhone)) {
      setError('Telefon numarası 5 ile başlayan 10 haneli bir Türkiye cep numarası olmalı.')
      return
    }
    setIsSubmitting(true)
    try {
      await register({ name, region, contactPhone, password })
      goTo('login')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Kayıt oluşturulamadı.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-md border border-[#dfe8df] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold text-leaf">Yeni kooperatif</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Kooperatif kaydı oluştur</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-ink">
          Kooperatif ismi
          <input
            className="mt-1 h-11 w-full rounded-md border border-[#dfe8df] px-3 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <div className="relative">
          <label className="block text-sm font-medium text-ink">Bölge</label>
          <button
            type="button"
            onClick={() => setRegionOpen((value) => !value)}
            className="focus-ring mt-1 flex h-11 w-full items-center justify-between rounded-md border border-[#dfe8df] bg-white px-3 text-left text-sm"
          >
            <span className={region ? 'text-ink' : 'text-moss'}>{region || 'İl seçin'}</span>
            <ChevronDown size={18} className="text-moss" />
          </button>
          {regionOpen && (
            <div className="absolute left-0 right-0 top-[72px] z-50 rounded-md border border-[#dfe8df] bg-white p-2 shadow-lg">
              <div className="flex items-center gap-2 rounded-md border border-[#dfe8df] px-3">
                <Search size={17} className="text-moss" />
                <input
                  className="h-10 min-w-0 flex-1 text-sm outline-none"
                  placeholder="İl ara"
                  value={regionSearch}
                  onChange={(event) => setRegionSearch(event.target.value)}
                  autoFocus
                />
              </div>
              <div className="mt-2 max-h-52 overflow-y-auto">
                {filteredProvinces.map((province) => (
                  <button
                    key={province}
                    type="button"
                    onClick={() => {
                      setRegion(province)
                      setRegionSearch('')
                      setRegionOpen(false)
                    }}
                    className={`w-full rounded px-3 py-2 text-left text-sm ${region === province ? 'bg-leaf text-white' : 'text-ink hover:bg-mist'}`}
                  >
                    {province}
                  </button>
                ))}
                {filteredProvinces.length === 0 && (
                  <div className="px-3 py-2 text-sm text-moss">Eşleşen il bulunamadı.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <label className="block text-sm font-medium text-ink">
          Telefon
          <div className="mt-1 flex overflow-hidden rounded-md border border-[#dfe8df] bg-white">
            <span className="flex h-11 items-center border-r border-[#dfe8df] bg-mist px-3 text-sm font-semibold text-moss">+90</span>
            <input
              className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
              inputMode="numeric"
              maxLength={10}
              placeholder="5321119999"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
              pattern="5[0-9]{9}"
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
              minLength={6}
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="focus-ring flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-leaf px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            <UserPlus size={18} />
            {isSubmitting ? 'Kayıt oluşturuluyor...' : 'Kayıt ol'}
          </button>
          <button
            type="button"
            onClick={() => goTo('login')}
            className="focus-ring h-11 rounded-md bg-mist px-4 text-sm font-semibold text-moss"
          >
            Giriş yap
          </button>
        </div>
      </form>
    </section>
  )
}
