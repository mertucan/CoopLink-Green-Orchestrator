# CoopLink - Green Orchestrator

CoopLink - Green Orchestrator, tarım ve gıda kooperatiflerini tek tek yönetmek yerine onları ortak bir ağ zekası gibi çalıştıran yapay zeka tabanlı bir ekosistemdir. FastAPI, Supabase, Gemini ve React paneli üzerinden stok görünürlüğü, takas önerisi, rota optimizasyonu ve yeşil puan takibi sağlar.

## Problem

- Türkiye'de her yıl yaklaşık 23 milyon ton gıda israf ediliyor; üretilen gıdanın yaklaşık yüzde 35'i sofraya ulaşmadan kayboluyor veya çöpe gidiyor. Kaynak: [Anadolu Ajansı, 16 Ekim 2024](https://www.aa.com.tr/tr/gundem/turkiyede-her-yil-ortalama-23-milyon-ton-gida-israf-ediliyor/3363619)
- UNEP Food Waste Index Report 2024'e göre dünyada 2022 yılında 1.05 milyar ton gıda atığı oluştu; bu kişi başına yıllık 132 kg anlamına geliyor. Kaynak: [UNEP Food Waste Index Report 2024](https://www.unep.org/resources/publication/food-waste-index-report-2024)
- Gıda kaybı ve atığı, tüketilmeyen gıdaya bağlı sera gazı emisyonlarının önemli bir kısmını oluşturuyor; UNEP 2021 raporu gıda israfının küresel sera gazı emisyonlarının yaklaşık yüzde 8-10'u ile ilişkili olduğunu belirtiyor. Kaynak: [UNEP Food Waste Index Report 2021](https://www.unep.org/resources/report/unep-food-waste-index-report-2021)

## Çözüm

CoopLink - Green Orchestrator, kooperatiflerin stok, talep ve teslimat bilgisini tek ağda birleştirir:

1. Stok sorgusu: "10 kg elma var mı?" mesajı ağ genelinde aranır.
2. İsraf önleme: "Elimde 80 kg domates var, bozulacak" mesajı risk skoru ve takas önerisi üretir.
3. Lojistik optimizasyonu: Yakın kooperatifler için ortak teslimat rotası ve CO2 tasarrufu hesaplanır.

## Kullanıcı Arayüzü ve Operasyonel Modüller

Sistemin tüm katmanları, kooperatif yöneticileri için sade ve veri odaklı bir deneyim sunmak üzere tasarlanmıştır.

### Ana Sayfa
<img width="2940" height="1846" alt="Ekran Resmi 2026-05-13 21 00 34" src="https://github.com/user-attachments/assets/5d8a9b7d-1fff-45db-93e8-c21e5a428292" />

### Stok ve Risk Takibi
<img width="2940" height="1846" alt="Ekran Resmi 2026-05-13 21 01 30" src="https://github.com/user-attachments/assets/a5c6c23c-4adf-420c-b8b0-c1cc469ccf5b" />

### Risk Haritası
<img width="2940" height="1846" alt="Ekran Resmi 2026-05-13 21 01 16" src="https://github.com/user-attachments/assets/db6bf630-b0fd-4607-a252-7526c74c518d" />

### Yeşil Puan Sıralaması
<img width="2940" height="1846" alt="Ekran Resmi 2026-05-13 21 00 48" src="https://github.com/user-attachments/assets/455e55a4-6939-4d1e-ad61-6240d25e5f45" />

## AI Senaryoları

- İsraf erken uyarı: Son kullanma tarihi, miktar ve risk skoruna göre acil stokları öne çıkarır.
- Doğal dil mesaj asistanı: Stok sorgusu, takas önerisi, teslimat durumu ve rapor isteklerini ayırır.
- Akıllı takas eşleştirme: Talep uyumu, mesafe, aciliyet ve karbon etkisini skorlayarak öneri üretir.
- Rota ve araç planlama: Komşu teslimatları birleştirip CO2 tasarrufunu hesaplar.
- Haftalık yönetici özeti: Kurtarılan gıda, karbon, puan ve aksiyon önerilerini Türkçe raporlar.
- Talep tahmini: Bölge, sezon ve geçmiş takaslardan ürün ihtiyacını öngörür.

## Rakip Analizi

| Çözüm | Güçlü Yan | Eksik Yan | CoopLink Farkı |
| --- | --- | --- | --- |
| Klasik ERP | Stok takibi güçlü | Küçük kooperatif için pahalı ve ağır | Sade admin paneli, düşük bariyerli kullanım |
| Marketplace | Talep yaratır | İsraf riski ve rota zekası yok | Ağ içi takas ve karbon puanı |
| Lojistik yazılımları | Rota optimizasyonu | Ürün bozulma riskini bilmez | Stok riski + rota + takas birlikte |
| Manuel mesaj grupları | Kullanımı kolay | Veri kalıcı ve raporlanabilir değil | Mesaj ve stok bilgisini yapısal veriye çevirir |

## Mimari Şema

```mermaid
flowchart LR
  U["Admin Panel / Mesaj Kanalı"] --> O["Gemini Orchestrator"]
  O --> S["Stok Ajansı"]
  O --> W["Takas Ajansı"]
  O --> L["Lojistik Ajansı"]
  S --> DB["Supabase PostgreSQL"]
  W --> DB
  L --> DB
  DB --> API["FastAPI REST"]
  API --> UI["React Dashboard"]
```

## Tech Stack

Backend:
- FastAPI, Uvicorn
- Supabase PostgreSQL
- Güncel Gemini modelleri için orchestrator katmanı
- Gemini kotası dolarsa yerel analiz fallback'i
- Telegram CooBot operasyon menüsü
- Son kullanma tarihi geçen stokları otomatik imha eden ve kooperatife yeşil puan cezası yazan stok yaşam döngüsü servisi
- Pytest ve pytest-asyncio

Frontend:
- React 18 + Vite
- TailwindCSS
- React Query
- Recharts
- Leaflet ve React Leaflet
- Axios

## Kurulum

Bu bölüm projeyi kendi bilgisayarında açmak isteyen kişiler içindir. Proje iki parçadan oluşur:

- Backend: FastAPI API servisi
- Frontend: React admin paneli

İkisini aynı anda çalıştırmak için genelde iki ayrı terminal açılır.

### Gerekenler

Bilgisayarda şunlar kurulu olmalı:

- Python 3.11 veya üzeri
- Node.js 18 veya üzeri
- npm
- Supabase hesabı isteğe bağlıdır; `.env` doldurulmazsa proje demo fallback verisiyle de çalışabilir.

Kontrol etmek için:

```bash
python --version
node --version
npm --version
```

Windows'ta `python` çalışmazsa şunu dene:

```bash
py --version
```

### 1. Proje klasörüne gir

Eğer repo klonlanacaksa:

```bash
git clone <repo-url>
cd YZTA-Hackathon
```

Zaten klasör bilgisayardaysa doğrudan proje dizinine gir:

```powershell
cd C:\Users\mertu\OneDrive\Masaüstü\YZTA-Hackathon
```

### 2. Ortam değişkenlerini hazırla

```bash
cp .env.example .env
```

Windows PowerShell için:

```powershell
copy .env.example .env
```

Demo modda çalıştıracaksan `.env` içindeki Supabase ve Gemini alanlarını boş/placeholder bırakabilirsin. Gerçek Supabase ve Gemini kullanacaksan ilgili anahtarları doldur.

### 3. Supabase kullanacaksan SQL dosyalarını çalıştır

Supabase SQL Editor içinde önce şemayı çalıştır:

```bash
backend/app/db/schema.sql
```

Sonra demo veriyi eklemek için:

```bash
backend/app/db/mock_data.sql
```

Daha önce eski şemayı çalıştırdıysan ve kolon isimleri farklıysa şu migration dosyasını da bir kez çalıştır:

```bash
backend/app/db/remove_twilio_migration.sql
```

Süresi geçen stokların imha durumunu ve puan cezasını kaydetmek için şu migration dosyasını da bir kez çalıştır:

```bash
backend/app/db/expired_inventory_migration.sql
```

Supabase kullanmıyorsan bu adımı atlayabilirsin.

### 4. Backend'i çalıştır

Birinci terminalde:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Windows'ta `python` çalışmıyorsa:

```powershell
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend açılınca şu adresler çalışır:

- API: http://localhost:8000
- Swagger dokümantasyonu: http://localhost:8000/docs
- Sağlık kontrolü: http://localhost:8000/health

### 5. Frontend'i çalıştır

İkinci terminalde:

```bash
cd frontend
npm install
npm run dev
```

Frontend açılınca:

- Ana sayfa: http://localhost:5173
- Admin panel: http://localhost:5173/dashboard
- Operasyon merkezi: http://localhost:5173/operations
- Stok ekranı: http://localhost:5173/inventory
- Risk haritası: http://localhost:5173/risk-map
- Takas ekranı: http://localhost:5173/swaps
- AI logları: http://localhost:5173/ai-logs
- Leaderboard: http://localhost:5173/leaderboard

### 6. Telegram botunu çalıştır

`.env` içine `TELEGRAM_BOT_TOKEN` değerini ekle. Botu sadece belirli kullanıcıların kullanmasını istiyorsan `TELEGRAM_ADMIN_ID` alanına Telegram kullanıcı id'lerini virgülle ayırarak yazabilirsin. Stok ekleme butonu önce kooperatif seçtirir, sonra `ürün miktar gün` formatıyla stoku seçilen kooperatife ekler. AI analiz için varsayılan model `GEMINI_MODEL=gemini-3.1-flash-lite` değeridir.

```powershell
cd backend
.\.venv\Scripts\activate
python -m app.services.telegram_service
```

CooBot üzerinden `/start` veya `/menu` yazınca önce tanıtım mesajı ve `Başla` butonu görünür. `Başla` sonrasında operasyon menüsü açılır. Butonlarla stok listesi, riskli stok takas önerisi, bekleyen takas onay/red, AI analiz, stok ekleme ve müşteri özeti üretilebilir. Telegram mesajları ve buton aksiyonları AI Logs ekranına `telegram:<chat_id>` kanalıyla kaydedilir.

AI analiz butonu Gemini'den yanıt alamazsa, örneğin kota veya rate limit hatasında, kullanıcıya ham hata metni göstermek yerine stok verilerinden yerel analiz üretir.

### Stok imha kuralı

Sistem stok, takas, istatistik veya Telegram stok ekranına erişildiğinde son kullanma tarihi geçmiş ve miktarı pozitif olan kayıtları otomatik imha eder. İmha edilen stokta:

- `quantity_kg` değeri 0'a düşer.
- `disposal_status=disposed`, `disposed_at`, `disposed_quantity_kg` ve `disposal_penalty_points` alanları yazılır.
- Kooperatifin `green_score` değerinden ceza puanı düşülür.
- `carbon_log` tablosuna `event_type=disposal` ve negatif `points_earned` kaydı atılır.

Varsayılan ceza 10 kg başına 1 puandır ve tek imhada 50 puanla sınırlıdır:

```env
DISPOSAL_PENALTY_PER_10KG=1
DISPOSAL_MAX_PENALTY=50
```

### 7. Hızlı test

Backend çalışırken Orchestrator'a test mesajı göndermek için:

```powershell
Invoke-WebRequest -Method POST `
  -Uri http://localhost:8000/assistant/message `
  -ContentType "application/json" `
  -Body '{"channel_id":"local-test","message":"10 kg elma var mı?"}'
```

Yanıt geldikten sonra AI logları ekranını aç:

```text
http://localhost:5173/ai-logs
```

### Sık karşılaşılan sorunlar

- `python is not recognized`: Python kurulu değildir veya PATH'e eklenmemiştir. Windows'ta `py` komutunu dene.
- `npm is not recognized`: Node.js kurulmamıştır.
- Frontend veri çekemiyor: Backend'in `http://localhost:8000` üzerinde çalıştığını kontrol et.
- Supabase hatası alıyorsan: `.env` değerlerini kontrol et veya demo fallback modu için Supabase alanlarını placeholder bırak.
- Gemini 429/kota hatası: Google AI Studio projesinde billing veya aktif kota olmayabilir. Bot ve panel bu durumda yerel analiz fallback'i ile çalışmaya devam eder.

## API Dokümantasyonu

| Endpoint | Metot | Açıklama |
| --- | --- | --- |
| `/health` | GET | Servis ve Supabase bağlantı durumu |
| `/assistant/message` | POST | Orchestrator'a kanal bağımsız mesaj gönderir |
| `/cooperatives` | GET | Kooperatif listesini döner |
| `/products` | GET | Ürün listesini döner |
| `/ai-logs` | GET | Gemini/Orchestrator karar loglarını döner |
| `/inventory` | GET | Kooperatif bazlı veya ağ geneli stok listesi |
| `/inventory` | POST | Yeni envanter kaydı ve risk skoru hesabı |
| `/swaps` | GET | Duruma göre takas listesi |
| `/swaps/{id}` | PATCH | Takas onay/red güncellemesi |
| `/stats` | GET | Gıda, karbon, takas ve kooperatif özetleri |
| `/stats/leaderboard` | GET | Yeşil puana göre kooperatif sıralaması |
| `/docs` | GET | Otomatik OpenAPI dokümantasyonu |

## Operasyon Mantığı

### Stok, Takas ve Son Kullanma Akışı

- Bir stok için takas önerisi oluşturulduğunda ürün stok listesinden hemen düşmez. Stok satırı listede kalır ve `Takas bekliyor` olarak işaretlenir.
- Aynı kooperatif ve ürün için açık bir bekleyen takas varsa yeni kopya öneri oluşturulmaz; mevcut öneri yeniden kullanılır.
- Takas reddedilirse stokta herhangi bir düşüm yapılmaz; ürün stokta kalmaya devam eder.
- Takas onaylanırsa ilgili ürün miktarı stoktan düşülür, karbon logu yazılır ve yeşil puan güncellenir.
- Son kullanma tarihi geçmiş ürünler takasa önerilemez. Bu ürünler stok ekranında `Süresi geçti` olarak görünür ve ayrı operasyon aksiyonu gerektirir.

### Kurtarılan Değer Skoru

Onaylanan takaslarda sistem yalnızca karbonu değil, sosyal ve ekonomik etkiyi de hesaplar:

```text
80 kg domates, 112 öğün, 2.1 kg CO2 ve 1.450 TL yerel değer kurtarıldı.
```

Bu değerler mevcut `swaps`, `products` ve `inventory` verilerinden hesaplanır. Demo modunda ürün/kategori bazlı yaklaşık TL/kg değerleri backend içindeki etki motorundan gelir; ileride bu değerler `products.avg_price_tl_per_kg` gibi bir veritabanı kolonuna taşınabilir.

### Risk Haritası ve Rota Mantığı

`/risk-map` sayfası Supabase verilerini kullanır:

- Risk noktaları `inventory` tablosundaki stoklardan gelir.
- İl ve kooperatif konumları `cooperatives.latitude` ve `cooperatives.longitude` alanlarından gelir.
- Rota çizgileri `swaps` tablosunda `status = pending` olan bekleyen takaslardan üretilir.
- Her rota `from_cooperative_id -> to_cooperative_id` akışını gösterir.
- Rota çizgisi gerçek karayolu navigasyonu değil, önerilen takas/lojistik bağlantısını gösteren operasyon çizgisidir.
- Aynı iki kooperatif arasında birden fazla rota varsa çizgiler hafif kavislenerek üst üste binmeleri azaltılır.
- 81 il sınırı yerel GeoJSON dosyasıyla çizilir; her il tıklanabilir ve kooperatif olan iller daha belirgin gösterilir.

## Frontend Rotaları

| Rota | Ekran |
| --- | --- |
| `/` | CoopLink ana karşılama ve tanıtım sayfası |
| `/dashboard` | Ana yönetim paneli |
| `/operations` | Admin operasyon merkezi |
| `/ai-logs` | Gemini ve Orchestrator karar logları |
| `/inventory` | Stok ve risk takibi |
| `/risk-map` | Türkiye risk ısı haritası ve takas rotaları |
| `/swaps` | Takas onay/red yönetimi |
| `/leaderboard` | Yeşil puan sıralaması |

## Gemini Buton Kullanımı

Stok ekranındaki `Gemini Analiz` butonu, seçili stok satırını doğal dil mesajına çevirip `/assistant/message` endpoint'ine gönderir. Backend bu mesajı Orchestrator'a iletir. `.env` içinde geçerli `GEMINI_API_KEY` varsa Gemini intent seçiminde devreye girer; sonuç sağ altta toast mesajı olarak görünür ve `/ai-logs` ekranına kaydedilir.

AI Logs ekranında kayıtlar mesaj/yanıt/model metnine göre aranabilir; Gemini kullanılanlar, fallback kayıtları, Telegram kayıtları ve intent tipleri ayrı filtrelenebilir.

Örnek üretilen mesaj:

```text
Ege Tarım Kooperatifi kooperatifinde 80 kg domates var. Risk skoru 1.00. Bu ürün için stok sorgusu mu, takas önerisi mi yoksa teslimat takibi mi yapılmalı? Gerekirse takas öner.
```

## Demo Senaryoları

### 1. Müşteri Sorusu
1. Kullanıcı admin panelinden veya mesaj kanalından yazar: "Organik süt var mı?"
2. Orchestrator intent'i `query_stock` olarak belirler.
3. Stok Ajansı ağdaki uygun stoğu arar.
4. Yanıt: "Ağda 1 uygun stok kaydı bulundu."

### 2. Üretici İsraf Bildirimi
1. Kullanıcı yazar: "Elimde 80 kg domates var, bozulacak"
2. Orchestrator intent'i `propose_swap` olarak belirler.
3. Swap Ajansı weighted scorer ile en iyi eşleşmeyi üretir.
4. Yanıt: "Takas önerisi... Skor: 0.87. Onayla / Reddet / Değiştir"

### 3. Yönetici Raporu
1. Dashboard veya `/stats` açılır.
2. Toplam kurtarılan gıda, CO2 tasarrufu, bekleyen takas ve aktif kooperatif sayısı görülür.
3. Leaderboard ekranında yeşil puan sıralaması izlenir.

## Katkı

Geliştirme adımları için [ROADMAP.md](./ROADMAP.md) dosyasını takip edin. Faz 1-5 demo için zorunlu çekirdeği, Faz 6 ise ses entegrasyonunu kapsar.
