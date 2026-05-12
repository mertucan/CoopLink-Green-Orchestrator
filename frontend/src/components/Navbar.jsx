import { useEffect, useState } from 'react';
import { Moon, Sun, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const items = [
  { id: 'home', label: 'Ana Sayfa', roles: ['cooperative', 'admin'] },
  { id: 'dashboard', label: 'Panel', roles: ['cooperative', 'admin'] },
  { id: 'inventory', label: 'Stok', roles: ['cooperative', 'admin'] },
  { id: 'swaps', label: 'Takaslar', roles: ['cooperative', 'admin'] },
  { id: 'riskMap', label: 'Harita', roles: ['cooperative', 'admin'] },
  { id: 'leaderboard', label: 'Sıralama', roles: ['cooperative', 'admin'] },
  { id: 'operations', label: 'Operasyon', roles: ['admin'] }
];

export const visiblePagesForRole = (role) => items.filter(i => i.roles.includes(role)).map(i => i.id);

export default function Navbar({ active, onChange }) {
  const { user, role, logout } = useAuth();
  const visibleItems = items.filter((item) => item.roles.includes(role));
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 🌟 KESİN ÇÖZÜM: Çıkış yapıp sayfayı Login'e yönlendiren fonksiyon
  const handleLogout = async () => {
    if (logout) {
      await logout(); // Önce backend/auth tarafındaki oturumu kapat
    }
    onChange('login'); // Sonra kullanıcıyı doğrudan Login sayfasına fırlat
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-[#dfe8df] dark:border-slate-800 p-4 flex justify-between items-center transition-colors duration-300">
      
      {/* Sol Kısım: Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange('home')}>
        <Leaf className="text-leaf dark:text-emerald-400" size={24} />
        <span className="font-bold text-ink dark:text-white text-xl">CoopLink</span>
      </div>

      {/* Orta Kısım: Menü Linkleri */}
      <div className="hidden md:flex gap-6">
         {visibleItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => onChange(item.id)}
              className={`text-sm font-semibold transition-colors ${active === item.id ? 'text-leaf dark:text-emerald-400' : 'text-moss dark:text-slate-300 hover:text-ink dark:hover:text-white'}`}
            >
              {item.label}
            </button>
         ))}
      </div>

      {/* Sağ Kısım: Eco-Mode ve Profil */}
      <div className="flex items-center gap-4">
        
        {/* Eco-Mode Butonu */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-moss dark:text-wheat hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
          title="Eco-Mode (Gece Modu)"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-xs font-bold hidden md:inline">Eco-Mode</span>
        </button>
        
        {/* Kullanıcı Çıkış */}
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-700 pl-4">
            <span className="text-sm font-medium text-ink dark:text-white">{user?.name || 'Kullanıcı'}</span>
            {/* 🌟 Butona yeni handleLogout fonksiyonumuzu bağladık */}
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" title="Çıkış Yap">
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </nav>
  );
}