# CoopLink - Green Orchestrator Geliştirme Yol Haritası

## Faz 1 - Altyapı (Gün 1)
- [x] FastAPI + Supabase bağlantısı
- [x] 6 tablo oluşturma (schema.sql)
- [x] Kanal bağımsız assistant endpoint
- [x] Seed verisi (5 kooperatif, 20 ürün)
- [ ] Railway/Render deploy
- [x] Kontrol: Assistant endpoint'i Orchestrator'a mesaj iletecek şekilde hazırlandı

## Faz 2 - Orchestrator Agent (Gün 2)
- [x] Gemini 2.0 Flash entegrasyonu
- [x] Tool calling: 3 intent (query_stock, propose_swap, track_delivery)
- [x] Belirsiz metin çözme
- [x] Session state Supabase persist
- [x] Türkçe fallback mesajları
- [x] Kontrol: "10 kg elma var mı?" -> doğru intent test senaryosu yazıldı

## Faz 3 - Stok & Takas Ajanları (Gün 3)
- [x] Stok Ajansı: ağ geneli sorgu + risk skoru
- [x] Takas Ajansı: weighted scorer implementasyonu
- [x] Admin paneli takas onay/red aksiyonları
- [x] Onay akışı: swaps tablosu + carbon_log
- [x] Karbon bonusu: green_score güncellemesi için puan motoru
- [x] pytest: test_swap_algorithm.py (10 senaryo)
- [x] Kontrol: "80 kg domates var" -> takas önerisi intent testi yazıldı

## Faz 4 - Lojistik & Raporlama (Gün 4)
- [x] Lojistik Ajansı: nearest-neighbor rota
- [x] Karbon hesabı: C_tasarruf formülü
- [x] /stats endpoint
- [x] /stats/leaderboard endpoint
- [x] /cooperatives endpoint
- [x] /products endpoint
- [x] /ai-logs endpoint
- [x] React Dashboard: stat kartları + grafik
- [x] Frontend URL rotaları: /dashboard, /operations, /inventory, /swaps, /leaderboard
- [x] React Operations: admin operasyon merkezi
- [x] React AI Logs: Gemini/Orchestrator kararlarını görüntüleme
- [x] React Operations: AI senaryo kütüphanesi
- [x] React Inventory: stok tablosu + risk badge
- [x] React Inventory: arama, kategori filtresi, acil risk filtresi
- [x] React Swaps: onay/red UI
- [x] React Toast: takas önerisi, onay/red, puan ve karbon özetleri
- [x] React Leaderboard: puan sıralaması
- [ ] Kontrol: 2 uçtan uca akış çalışıyor, /stats gerçek sayılar döndürüyor

## Faz 5 - Dayanıklılık & Demo (Gün 5)
- [x] Retry/backoff mekanizmaları
- [x] Türkçe hata mesajları temel edge case'ler için
- [x] Gemini kota/rate limit durumunda yerel analiz fallback'i
- [ ] pytest suite tamamı yeşil
- [x] README rakip analizi dahil tamamlandı
- [x] .env.example eksiksiz
- [x] 3 demo senaryosu hazır
- [ ] Kontrol: uçtan uca 3 kez hatasız çalıştı

## Faz 6 - Ses Entegrasyonu (Faz 5 tamamlandıktan sonra)
- [ ] services/whisper_stt.py: Ses dosyası URL -> Whisper API -> metin + güven skoru
- [ ] Güven < 0.7 -> "Sizi doğru anladım mı?" Quick Reply döngüsü
- [ ] Kanal entegrasyonuna medya URL kontrolü ekle
- [ ] Async: anında "Analiz ediyorum..." yanıtı
- [ ] Kontrol: sesli mesaj -> doğru intent -> yanıt zinciri çalışıyor

## Faz 7 - Etki, Harita ve Operasyon Mantığı
- [x] Kurtarılan değer skoru: kg gıda, öğün, CO2 ve TL yerel değer hesabı
- [x] Simülasyon kayıp etkisi: ürün kurtarılmazsa kaybolacak öğün, TL ve CO2 etkisi
- [x] Risk haritası: Türkiye haritası, 81 il sınırı, tıklanabilir iller
- [x] Kooperatif illerini belirgin gösterme ve riskli stok yoğunlukları
- [x] Bekleyen takaslardan rota çizgisi üretme
- [x] Üst üste gelen rotalar için kavisli/ayrıştırılmış çizim
- [x] Rota kartlarında mesafe, skor, CO2, öğün/TL ve "neden çizildi?" açıklaması
- [x] Son kullanma tarihi geçmiş ürünleri stok ekranında ayrı işaretleme
- [x] Süresi geçmiş ürünler için takas önerisini backend seviyesinde engelleme
- [x] Süresi geçen ve miktarı pozitif kalan stokları otomatik imha edip kooperatife eksi yeşil puan yazma
- [x] Bekleyen takası olan stokları silmeden `Takas bekliyor` olarak işaretleme
- [x] Takas onaylanınca stok düşürme; reddedilince stok miktarını koruma
- [ ] İleride: ürün bazlı fiyatları DB kolonuna taşıma (`products.avg_price_tl_per_kg`)

## Faz 8 - Telegram Operasyon Botu
- [x] CooBot butonlu menü: stoklar, riskli stoklar, bekleyen takaslar, AI analiz, stok ekleme
- [x] İlk açılışta tanıtım mesajı ve `Başla` butonu
- [x] Riskli stoklardan Telegram üzerinden takas önerisi oluşturma
- [x] Bekleyen takasları Telegram butonlarıyla onaylama/reddetme
- [x] Telegramdan stok ekleme: önce kooperatif seçimi, sonra `ürün miktar gün` formatı
- [x] Telegram mesajlarında `**kalın**` işaretlerini HTML biçimlendirmeye çevirme
- [x] Müşteriye iletilebilir kısa stok özeti üretme
- [x] Telegram mesajlarını ve buton aksiyonlarını AI Logs tablosuna kaydetme
- [x] Opsiyonel Telegram kullanıcı kısıtı: `TELEGRAM_ADMIN_ID`
- [ ] İleride: müşteriye doğrudan bildirim göndermek için müşteri Telegram chat id alanı

## Faz 9 - Sunum, Ana Sayfa ve UI Son Rötuşları
- [x] `/` rotasında CoopLink ana karşılama ve tanıtım sayfası
- [x] Navbar'a `Ana Sayfa` ve `Harita` erişimi
- [x] Logo tıklamasını ana sayfaya yönlendirme
- [x] CoopLink yaprak favicon'u
- [x] Toast mesajlarını sağ alta taşıma
- [x] AI Logs ekranında arama, kaynak ve intent filtreleri
- [x] Operasyon ekranında Kooperatif Performansı ve Son AI Kararları kartlarını aynı satıra alma
- [x] Operasyon sayfasında grafik ve alt metrik kartlarının hizasını iyileştirme

---

## Doğrulama Notları

- [x] Proje dosya yapısı oluşturuldu
- [x] Frontend package.json ve Vite/Tailwind config dosyaları temel syntax kontrolünden geçti
- [x] Frontend production build doğrudan Vite ile geçti
- [x] Supabase mock_data.sql demo verisi eklendi
- [x] Takas onayı sonrası stok miktarı düşürme eklendi
- [x] Süresi geçen stoklar için otomatik imha, negatif puan ve `carbon_log` kaydı eklendi
- [x] Duplicate pending takas önerisi engellendi
- [x] Leaderboard yalnızca onaylı takasları hesaplayacak şekilde düzeltildi
- [ ] Pytest çalıştırma: yerel ortamda Python komutu bulunamadığı için çalıştırılamadı
- [x] Frontend build: `node ./node_modules/vite/bin/vite.js build` ile geçti
- [ ] npm komutu: yerel global npm kurulumunda `npm-cli.js` eksik olduğu için doğrudan `npm run build` çalışmadı

---

## Demo Senaryoları

### Senaryo 1 - Müşteri Sorusu
1. Kullanıcı admin panelinden veya mesaj kanalından yazar: "Organik süt var mı?"
2. Orchestrator -> query_stock -> Stok Ajansı
3. Kendi kooperatifinde yok -> ağda ara -> Ege Tarım'da var
4. Yanıt: "Evet! Ege Tarım Kooperatifi'nden 5 lt organik süt temin edebiliriz. Yarın 10:00'da kapınızda. 1.4 kg CO2 tasarruf edildi."

### Senaryo 2 - Üretici İsraf Bildirimi
1. Üretici yazar: "Elimde 80 kg domates var, bozulacak"
2. Orchestrator -> propose_swap -> Swap Ajansı
3. Weighted scorer: Akdeniz Üreticileri en yüksek skor (0.87)
4. Yönetici panelinde öneri görünür: "80 kg domates için takas önerisi: Akdeniz Üreticileri. Skor: 0.87. Onayla / Reddet / Değiştir"
5. Onay -> swaps tablosu güncellendi -> +45 yeşil puan -> "Takas onaylandı, 2.1 kg CO2 tasarruf edildi."

### Senaryo 3 - Yönetici Raporu
1. GET /stats çağrısı veya Dashboard açılır
2. "Bu hafta: 320 kg gıda kurtarıldı, 4.2 kg CO2 tasarruf, 8 takas tamamlandı"
3. Leaderboard: "En yeşil kooperatif: Ege Tarım (285 puan)"
