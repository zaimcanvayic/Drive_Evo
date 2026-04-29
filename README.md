# Drive Evo 🚗📊

**Drive Evo**, sürüş verilerini gerçek zamanlı analiz ederek kullanıcıya bir **sürüş puanı (0–100)** sunan ve daha güvenli, verimli bir sürüş için **yapay zeka destekli kişiselleştirilmiş tavsiyeler** üreten yenilikçi bir web uygulamasıdır.

> Kullanıcı sensörü başlatır → Python backend veriyi analiz edip puanı hesaplar → Sürücüye anında performans raporu ve iyileştirme önerileri sunulur.

--

## 📋 Gereksinimler

Projeyi çalıştırmadan önce aşağıdaki araçların sisteminizde kurulu olduğundan emin olun. 

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
cd Drive Evo
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

Drive Evo iki ayrı servis olarak çalışır. Her ikisini de **farklı terminal pencerelerinde** başlatın.

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
1. /vehicle-info         → Araç bilgilerinizi seçin
2. /upload               → "Sensörü Başlat" ile sürüşü simüle edin
3. /analysis             → Sürüş özetini ve haritadaki rotanızı görüntüleyin
4. /analysis/performance → Hız, vites kullanımı, devir kontrolü gibi verilerin detaylı performans analizini inceleyin ve iyileştirme tavsiyeleri alın
```

---

## 🏗️ Proje Mimarisi

```
Drive Evo/
├── src/
│   ├── app/
│   │   ├── upload/          # Sensör veri simülasyonu
│   │   ├── analysis/        # Sürüş özeti, harita ve performans analiz raporu
│   │   └── api/             # Next.js → Python API proxy route'ları
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri
│   └── lib/                 # Auth ve veritabanı (Prisma) yapılandırması
│
├── backend/
│   ├── main.py              # FastAPI ana uygulaması ve endpoint'ler
│   ├── scorer.py            # Sürüş puanı hesaplama ve analiz motoru
│   ├── models.py            # Pydantic veri doğrulama modelleri
│   ├── database.py          # Veritabanı kayıt/okuma işlemleri
│   └── requirements.txt
│
└── prisma/
    └── schema.prisma        # Kullanıcı ve sürüş geçmişi veritabanı şeması
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

Bu video, **Drive Evo** web sitesinin çalışmasını ve temel analiz özelliklerini göstermektedir.

https://github.com/user-attachments/assets/1af930ff-0112-4043-a17a-c53333a2a830

---

## 📖 API Dokümantasyonu

Python backend servisinin tüm endpoint'leri, analiz detayları ve hata kodları için **[API.md](./API.md)** dosyasına göz atabilirsiniz.

Ayrıca backend çalışırken **[http://localhost:8000/docs](http://localhost:8000/docs)** adresinden interaktif Swagger UI'a (otomatik API dokümanına) erişebilirsiniz.

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
