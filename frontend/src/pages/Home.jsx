import React from 'react';
import { Boxes, HandCoins, Leaf, Utensils, Sparkles, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import { useStats, useLeaderboard } from '../hooks/useStats';
import { useSwaps } from '../hooks/useSwaps';
import StatCard from '../components/StatCard';
import SwapCard from '../components/SwapCard';

// 🌟 Yardımcı Fonksiyonlar
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
  const podium = rows.slice(0, 3);

  return (
    <div className="space-y-12 pb-20">
      
      {/* 🥇 Katman 1: Vizyon (Merkezi Hero Section) */}
      <section className="relative overflow-hidden bg-[#f8faf8] rounded-3xl p-12 lg:py-24 border border-[#edf2ed] text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-leaf/10 text-leaf text-sm font-semibold">
            <Sparkles size={16} /> Kooperatif Ağı Zekası
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-ink leading-tight">
            Stok riskini <span className="text-leaf">takasa</span> dönüştür.
          </h1>
          <p className="text-xl text-moss leading-relaxed">
            CoopLink, fazla stoğu erken yakalar ve doğru kooperatifle otonom olarak eşleştirir.
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => goTo('operations')} className="bg-leaf text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl hover:shadow-leaf/20 transition-all text-lg">
              Operasyon <ArrowRight size={20} />
            </button>
            <button onClick={() => goTo('inventory')} className="bg-white text-ink border border-[#dfe8df] px-10 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm text-lg">
              Stok Yönetimi
            </button>
          </div>
        </div>
        {/* Arka plan süslemesi */}
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(#2ecc71_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </section>

      {/* 📊 Katman 2: Canlı Etki (İstatistikler) */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Gıda Tasarrufu" value={stats?.total_food_saved_kg ?? 610} unit="kg" icon={Boxes} />
        <StatCard title="Kurtarılan Öğün" value={stats?.total_saved_meals ?? 854} icon={Utensils} />
        <StatCard title="CO2 Tasarrufu" value={stats?.total_carbon_saved_kg ?? 109.59} unit="kg" icon={Leaf} />
        <StatCard title="Yerel Değer" value={(stats?.total_local_value_tl ?? 13015).toLocaleString() + " TL"} icon={HandCoins} />
      </div>

      {/* 🧠 Katman 3: Yapay Zeka ve Güven Ekosistemi */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border border-emerald-100 p-10 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100 text-emerald-600">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-emerald-900 tracking-tight">Gemini Güven Ağı Analizi</h2>
            <p className="text-emerald-700/70 font-medium">AI tarafından kooperatifler arası bağlar analiz edildi</p>
          </div>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Top Üreticiler Listesi */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest px-1">En Güvenilir Ortaklar</h3>
            {podium.map((coop, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100">
                <span className="font-bold text-ink text-sm">#{i+1} {coop.name}</span>
                <span className="text-[12px]">{renderTrustStars(coop.trust_score || 80)}</span>
              </div>
            ))}
          </div>
          
          {/* AI Analiz Özetleri */}
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl border border-emerald-50 shadow-sm space-y-3">
              <h4 className="font-bold text-ink flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                Ege Tarım Analizi
              </h4>
              <p className="text-sm text-moss italic leading-relaxed">"Son 5 takasta %100 zamanında teslimat ile en güvenilir partner."</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-emerald-50 shadow-sm space-y-3">
              <h4 className="font-bold text-ink flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                Akdeniz Üreticileri Analizi
              </h4>
              <p className="text-sm text-moss italic leading-relaxed">"Bölgesel takaslarda yüksek yeşil puan. Güven grafiği yükseliş trendinde."</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏆 Katman 4: Sıralama ve Bekleyen İşlemler */}
      <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-ink tracking-tight">Yeşil Puan Sıralaması</h2>
            <div className="panel overflow-hidden border border-[#dfe8df] rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-moss font-semibold">
                  <tr>
                    <th className="px-6 py-4">Kooperatif</th>
                    <th className="px-6 py-4">Bölge</th>
                    <th className="px-6 py-4 text-right">Yeşil Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ed]">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 font-bold text-ink">{row.name}</td>
                      <td className="px-6 py-5 text-moss">{row.region}</td>
                      <td className="px-6 py-5 text-right font-extrabold text-leaf">{row.green_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
         
         <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink tracking-tight">Acil Takaslar</h2>
            <div className="space-y-4">
               {swaps.length > 0 ? swaps.slice(0, 3).map((swap, i) => <SwapCard key={i} swap={swap} />) : 
                <div className="p-8 bg-white border border-[#dfe8df] rounded-2xl text-center shadow-sm">
                  <p className="text-sm text-moss italic">Bekleyen otonom takas bulunmuyor.</p>
                </div>}
            </div>
         </div>
      </div>
    </div>
  );
}
