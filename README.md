# DriveMetrics 🚗📊

**DriveMetrics**, sürüş verilerini gerçek zamanlı analiz ederek kullanıcıya bir **sürüş puanı (0–100)** ve bu puana dayalı **kişiselleştirilmiş sigorta teklifi** sunan bir web uygulamasıdır.

> Kullanıcı sensörü başlatır → Python backend puanı hesaplar → Sigorta sistemi anında fiyat üretir.

---

## 📋 Gereksinimler

Projeyi çalıştırmadan önce aşağıdaki araçların sisteminizde kurulu olduğundan emin olun:

| Araç | Minimum Sürüm | Kontrol Komutu |
|------|--------------|----------------|
| [Node.js](https://nodejs.org/) | 18.x | `node --version` |
| [Python](https://python.org/) | 3.10+ | `python --version` |
| [Git](https://git-scm.com/) | — | `git --version` |

---

## ⚡ Kurulum

### 1. Depoyu klonlayın

```bash
git clone https://github.com/zaimcanvayic/DriveMetrics-.git
cd DriveMetrics
```

### 2. Frontend bağımlılıklarını yükleyin

```bash
npm install
```

### 3. Prisma istemcisini oluşturun

```bash
npx prisma generate
```

### 4. Python backend bağımlılıklarını yükleyin

```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 🚀 Kullanım

DriveMetrics iki ayrı servis olarak çalışır. Her ikisini de **farklı terminal pencerelerinde** başlatın.

### Terminal 1 — Python API (port 8000)

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Başarılı çıktı:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Next.js Arayüzü (port 3000)

```bash
npm run dev
```

Başarılı çıktı:
```
✓ Ready in 3s
- Local: http://localhost:3000
```

Tarayıcınızda **[http://localhost:3000](http://localhost:3000)** adresini açın.

---

## 🗺️ Uygulama Akışı

```
1. /vehicle-info  → Araç bilgilerinizi seçin
2. /upload        → "Sensörü Başlat" ile sürüşü simüle edin (8 sn)
3. /analysis      → Sürüş özetini ve haritayı görüntüleyin
4. /analysis/performance → Kategori puanlarını ve sigorta teklifini görün
5. /sigortam      → Detaylı prim kırılımı ve tasarruf önerilerini inceleyin
```

---

## 🏗️ Proje Mimarisi

```
DriveMetrics/
├── src/
│   ├── app/
│   │   ├── upload/          # Sensör simülasyonu sayfası
│   │   ├── analysis/        # Sürüş özeti ve performans sayfaları
│   │   ├── sigortam/        # Sigorta teklifi sayfası
│   │   └── api/             # Next.js → Python proxy route'ları
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri
│   └── lib/                 # Auth ve Prisma yapılandırması
│
├── backend/
│   ├── main.py              # FastAPI uygulama ve endpoint'ler
│   ├── scorer.py            # Sürüş puan hesaplama motoru
│   ├── insurance.py         # Sigorta fiyatlandırma motoru
│   ├── models.py            # Pydantic veri modelleri
│   ├── database.py          # SQLite kayıt/okuma işlemleri
│   └── requirements.txt
│
└── prisma/
    └── schema.prisma        # Kullanıcı ve sürüş geçmişi şeması
```

**Teknoloji Yığını:**

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 13, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Veritabanı | SQLite (Prisma ORM + Python sqlite3) |
| Harita | Leaflet / React-Leaflet |

---

## 🎬 Kullanım Videosu

Bu video, **DriveMetrics** web sitesinin ilk versiyonunun nasıl çalıştığını ve temel özelliklerini gösterir.

https://github.com/user-attachments/assets/1af930ff-0112-4043-a17a-c53333a2a830

---

## 📖 API Dokümantasyonu

Python backend'inin tüm endpoint'leri, istek/yanıt örnekleri ve hata kodları için **[API.md](./API.md)** dosyasına bakın.

Ayrıca backend çalışırken **[http://localhost:8000/docs](http://localhost:8000/docs)** adresinden interaktif Swagger UI'a erişebilirsiniz.

---

## 🛠️ Katkıda Bulunmak

1. Depoyu **fork** edin
2. Yeni bir branch oluşturun: `git checkout -b ozellik/yeni-ozellik`
3. Değişikliklerinizi commit edin: `git commit -m "feat: yeni özellik eklendi"`
4. Branch'inizi push edin: `git push origin ozellik/yeni-ozellik`
5. **Pull Request** açın

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

## 📞 İletişim

Her türlü soru ve öneriniz için bir [GitHub Issue](https://github.com/zaimcanvayic/DriveMetrics-/issues) açın.
