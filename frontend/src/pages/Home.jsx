import React from 'react';
import { Boxes, HandCoins, Leaf, Utensils, Sparkles, ShieldCheck, Trophy, User } from 'lucide-react';
import { useStats, useLeaderboard } from '../hooks/useStats';
import { useSwaps } from '../hooks/useSwaps';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import SwapCard from '../components/SwapCard';

// --- Yardımcı Fonksiyonlar ---
const renderTrustStars = (score) => {
  if (score >= 80) return "⭐⭐⭐⭐⭐";
  if (score >= 60) return "⭐⭐⭐⭐";
  if (score >= 40) return "⭐⭐⭐";
  if (score >= 20) return "⭐⭐";
  return "⭐";
};

export default function Home({ goTo }) {
  const { data: stats } = useStats();
  const { data: rows = [] } = useLeaderboard();
  const { data: swaps = [] } = useSwaps('pending');
  const { role, user } = useAuth();

  const podium = rows.slice(0, 3);

  // Gemini Mock Data
  const trustInsights = [
    { name: "Ege Tarım Kooperatifi", stars: "⭐⭐⭐⭐⭐", desc: "Son 5 takasta %100 zamanında teslimat ile en güvenilir partner." },
    { name: "Akdeniz Üreticileri", stars: "⭐⭐⭐⭐", desc: "Bölgesel takaslarda yüksek yeşil puan. Güven grafiği yükseliş trendinde." }
  ];

  return (
    // 🌟 EN DIŞ KAPSAYICI: Karanlık modda metinleri varsayılan olarak beyazımsı yapar
    <div className="flex flex-col gap-8 pb-10 transition-colors duration-300 dark:text-slate-200">
      
      {/* 🥇 Katman 1: Vizyon (Hero Section) */}
      <section className="text-center max-w-3xl mx-auto mt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-leaf/10 dark:bg-leaf/20 text-leaf dark:text-emerald-400 text-sm font-semibold mb-4">
          <Sparkles size={16} /> Kooperatif Ağı Zekası
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-ink dark:text-white leading-tight mb-4">
          Stok riskini <span className="text-leaf dark:text-emerald-400">takasa</span> dönüştür.
        </h1>
        <p className="text-moss dark:text-slate-400 text-lg mb-8">
          CoopLink, fazla stoğu erken yakalar ve doğru kooperatifle otonom olarak eşleştirir.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => goTo('operations')} className="bg-leaf text-white px-6 py-3 rounded-xl font-semibold hover:bg-leaf/90 transition-all">
            Operasyon
          </button>
        </div>
      </section>

      {/* 👤 Katman 1.5: HESABIM (Kullanıcı Profil Özeti) */}
      <section className="max-w-7xl mx-auto w-full">
        {/* 🌟 KART ARKA PLANI: dark:bg-slate-900 ve dark:border-slate-800 eklendi */}
        <div className="bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-leaf/10 dark:bg-leaf/20 text-leaf dark:text-emerald-400 rounded-full flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink dark:text-white">Hoş Geldin, {user?.name || 'Yeşil Kooperatif'}</h2>
              <p className="text-sm text-moss dark:text-slate-400 font-medium">Yetki: <span className="text-leaf dark:text-emerald-400 uppercase">{role || 'Kooperatif'}</span></p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xs text-moss dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Benim Yeşil Puanım</p>
              <p className="text-2xl font-bold text-ink dark:text-white flex items-center justify-center gap-1">
                <Leaf size={20} className="text-leaf dark:text-emerald-400" /> 1.250
              </p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-slate-700"></div>
            <div>
              <p className="text-xs text-moss dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Güvenilirlik (AI)</p>
              <p className="text-xl mt-1">{renderTrustStars(90)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Katman 2: Canlı Etki (İstatistikler) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Not: StatCard bileşeninin içindeki beyaz arka planların da dark:bg-slate-900 olarak güncellenmesi gerekir */}
        <StatCard title="Gıda Tasarrufu" value={stats?.total_food_saved_kg ?? 610} unit="kg" icon={Boxes} />
        <StatCard title="Kurtarılan Öğün" value={stats?.total_saved_meals ?? 854} icon={Utensils} />
        <StatCard title="CO2 Tasarrufu" value={stats?.total_carbon_saved_kg ?? 109.59} unit="kg" icon={Leaf} />
        <StatCard title="Yerel Değer" value={(stats?.total_local_value_tl ?? 13000).toLocaleString() + " TL"} icon={HandCoins} />
      </section>

      {/* 🧠 Katman 3: Yapay Zeka ve Güven Ekosistemi */}
      <section className="bg-gradient-to-br from-emerald-50 to-[#fffaf0] dark:from-slate-900 dark:to-slate-800 border border-[#dfe8df] dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-leaf dark:text-emerald-400" size={24} />
          <h2 className="text-xl font-bold text-ink dark:text-white">Gemini Güven Ağı Analizi</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <h3 className="text-sm font-semibold text-moss dark:text-slate-400 uppercase tracking-wider mb-4">Top Üreticiler</h3>
            <div className="space-y-3">
              {podium.map((coop, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className={index === 0 ? "text-wheat" : "text-leaf dark:text-emerald-400"} size={20} />
                    <span className="font-semibold text-ink dark:text-white">{coop.name}</span>
                  </div>
                  <span>{renderTrustStars(coop.trust_score || 80)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {trustInsights.map((insight, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 transition-colors duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-leaf dark:text-emerald-400" size={18} />
                    <h4 className="font-semibold text-ink dark:text-white">{insight.name}</h4>
                  </div>
                  <span className="text-sm">{insight.stars}</span>
                </div>
                <p className="text-sm text-moss dark:text-slate-400 italic">"{insight.desc}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⚙️ Katman 4: Operasyon ve Detaylar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white">Yeşil Puan Sıralaması</h2>
              <button onClick={() => goTo('leaderboard')} className="text-sm text-leaf dark:text-emerald-400 font-semibold">Tümünü Gör</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="text-moss dark:text-slate-400 border-b border-gray-100 dark:border-slate-700">
                   <th className="pb-3 font-semibold">Kooperatif</th>
                   <th className="pb-3 font-semibold">Bölge</th>
                   <th className="pb-3 font-semibold">Yeşil Puan</th>
                 </tr>
               </thead>
               <tbody>
                 {rows.slice(0, 5).map((row, i) => (
                   <tr key={i} className="border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                     <td className="py-3 text-ink dark:text-white font-medium">{row.name}</td>
                     <td className="py-3 text-moss dark:text-slate-400">{row.region}</td>
                     <td className="py-3 text-leaf dark:text-emerald-400 font-bold">{row.green_score}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#dfe8df] dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300">
          <h2 className="text-xl font-bold text-ink dark:text-white mb-6">Acil Takaslar</h2>
          <div className="space-y-4">
             {/* Not: SwapCard bileşeninin içindeki beyaz arka planların da güncellenmesi gerekir */}
             {swaps.slice(0, 3).map((swap, i) => <SwapCard key={i} swap={swap} />)}
             {swaps.length === 0 && <p className="text-sm text-moss dark:text-slate-400">Bekleyen takas bulunmuyor.</p>}
          </div>
        </div>
      </section>

    </div>
  );
}