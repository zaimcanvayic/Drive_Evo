# Drive Evo API Dokümantasyonu

**Base URL:** `http://localhost:8000`  
**Format:** JSON  
**Versiyon:** 1.0.0

> **Sözleşme Notu:** Bu dokümandaki her endpoint bir girdi/çıktı sözleşmesidir. İstek ve yanıt yapıları değiştiğinde bu dosya da güncellenir.

İnteraktif Swagger UI için: **[http://localhost:8000/docs](http://localhost:8000/docs)**  
OpenAPI şeması için: **[http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)**

---

## İçindekiler

1. [Servis Durumu](#1-servis-durumu)
2. [Sürüş Analizi](#2-sürüş-analizi)
3. [Sigorta Teklifi](#3-sigorta-teklifi)
4. [Kayıtlı Puan Sorgulama](#4-kayıtlı-puan-sorgulama)
5. [Sigorta Geçmişi](#5-sigorta-geçmişi)
6. [Kullanıcı Geçmişi](#6-kullanıcı-geçmişi)
7. [Veri Modelleri](#7-veri-modelleri)
8. [Hata Kodları](#8-hata-kodları)
9. [Puanlama Algoritması](#9-puanlama-algoritması)

---

## 1. Servis Durumu

Backend'in ayakta olup olmadığını kontrol eder.

### `GET /health`

**İstek:** Parametre gerekmez.

**Yanıt — 200 OK**

```json
{
  "status": "ok",
  "service": "Drive Evo API",
  "version": "1.0.0"
}
```

**Örnek Kullanım (curl):**

```bash
curl http://localhost:8000/health
```

---

## 2. Sürüş Analizi

Simülasyondan veya sensörden gelen ham sürüş verisini alır, beş kategoride puanlar ve genel skoru döndürür. Sonucu SQLite'e kaydeder.

### `POST /analyze`

**İstek Headers:**

```
Content-Type: application/json
```

**İstek Body:**

```json
{
  "driveId": "abc123",
  "userId": "user_42",
  "gearShifting": {
    "clutchUsage": {
      "averageTime": 1.2,
      "totalTime": 90,
      "longPresses": 2
    },
    "gearSpeedMismatch": {
      "lowGearHighSpeed": 1,
      "highGearLowSpeed": 3,
      "totalMismatchTime": 45.0
    },
    "stalls": 0
  },
  "rpmControl": {
    "averageRPM": 2300,
    "highRPM": { "count": 4, "totalTime": 30 },
    "lowRPM":  { "count": 2, "totalTime": 15 },
    "rpmRange": { "min": 1400, "max": 3800 }
  },
  "drivingStyle": {
    "unnecessaryManeuvers": 1,
    "wheelLock": 0,
    "trafficCompliance": {
      "speedLimitExceed": 0,
      "redLightViolation": 0,
      "stopSignViolation": 0,
      "complianceRate": 0.97
    }
  },
  "abnormalConditions": {
    "handbrakeMistake": 0,
    "wrongGearStart": 0,
    "suddenBraking": 1,
    "suddenAcceleration": 1
  },
  "fuelEfficiency": {
    "averageConsumption": 6.8,
    "idleTime": 120,
    "idlePercentage": 0.09
  }
}
```

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `driveId` | string | Hayır | Sürüş kimliği; verilmezse otomatik UUID oluşturulur |
| `userId` | string | Hayır | Kullanıcı kimliği (geçmiş sorguları için) |
| `gearShifting` | object | **Evet** | Vites kullanım verileri |
| `rpmControl` | object | **Evet** | Motor devir verileri |
| `drivingStyle` | object | **Evet** | Sürüş tarzı verileri |
| `abnormalConditions` | object | **Evet** | Anormal durum sayaçları |
| `fuelEfficiency` | object | **Evet** | Yakıt tüketimi verileri |

**Yanıt — 200 OK**

```json
{
  "driveId": "abc123",
  "overallScore": 82.45,
  "categoryScores": {
    "gearShifting": 88.00,
    "rpmControl": 79.50,
    "drivingStyle": 86.00,
    "abnormalConditions": 70.00,
    "fuelEfficiency": 100.00
  },
  "riskLevel": "Düşük-Orta",
  "riskLabel": "İyi sürüş alışkanlıkları. Küçük iyileştirmelerle mükemmele ulaşabilirsiniz."
}
```

| Alan | Tip | Açıklama |
|------|-----|----------|
| `overallScore` | float | Genel sürüş puanı (0–100) |
| `categoryScores` | object | 5 kategorinin ayrı puanları (0–100) |
| `riskLevel` | string | `Düşük` / `Düşük-Orta` / `Orta` / `Yüksek` / `Çok Yüksek` |
| `riskLabel` | string | Kullanıcıya gösterilen açıklama |

**Örnek Kullanım (curl):**

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "driveId": "test-001",
    "gearShifting": {"clutchUsage": {"averageTime": 1.0, "totalTime": 60, "longPresses": 0}, "gearSpeedMismatch": {"lowGearHighSpeed": 0, "highGearLowSpeed": 0, "totalMismatchTime": 0}, "stalls": 0},
    "rpmControl": {"averageRPM": 2200, "highRPM": {"count": 2, "totalTime": 10}, "lowRPM": {"count": 1, "totalTime": 5}, "rpmRange": {"min": 1500, "max": 3000}},
    "drivingStyle": {"unnecessaryManeuvers": 0, "wheelLock": 0, "trafficCompliance": {"speedLimitExceed": 0, "redLightViolation": 0, "stopSignViolation": 0, "complianceRate": 1.0}},
    "abnormalConditions": {"handbrakeMistake": 0, "wrongGearStart": 0, "suddenBraking": 0, "suddenAcceleration": 0},
    "fuelEfficiency": {"averageConsumption": 6.0, "idleTime": 60, "idlePercentage": 0.07}
  }'
```

---

## 3. Sigorta Teklifi

Sürüş puanı ve araç bilgisine göre kişiselleştirilmiş yıllık sigorta primini hesaplar. Sonucu SQLite'e kaydeder.

### `POST /insurance`

**İstek Body:**

```json
{
  "driveId": "abc123",
  "overallScore": 82.45,
  "vehicleInfo": {
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "fuelType": "Benzin",
    "annualKm": 18000
  }
}
```

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `driveId` | string | **Evet** | `/analyze` endpoint'inden alınan ID |
| `overallScore` | float | **Evet** | 0–100 arası sürüş puanı |
| `vehicleInfo.year` | integer | **Evet** | Aracın model yılı (örn. `2019`) |
| `vehicleInfo.annualKm` | integer | Hayır | Tahmini yıllık km (varsayılan: `15000`) |

**Yanıt — 200 OK**

```json
{
  "driveId": "abc123",
  "overallScore": 82.45,
  "riskLevel": "Düşük",
  "annualPremium": 16344.00,
  "monthlyPremium": 1362.00,
  "breakdown": {
    "basePremium": 18000.00,
    "vehicleAgeFactor": 1.21,
    "mileageFactor": 1.016,
    "scoreFactor": 0.80,
    "scoreDiscount": -20.0,
    "finalPremium": 16344.00
  },
  "discountMessage": "⭐ Çok iyi sürücü profili. %20 prim indirimi uygulandı.",
  "validDays": 30
}
```

| Alan | Tip | Açıklama |
|------|-----|----------|
| `annualPremium` | float | Yıllık ödenecek prim (TL) |
| `monthlyPremium` | float | Aylık ödenecek prim (TL) |
| `breakdown.scoreDiscount` | float | Negatif = indirim, pozitif = artış (yüzde) |
| `breakdown.scoreFactor` | float | Puan çarpanı (örn. `0.80` = %20 indirim) |
| `validDays` | integer | Teklifin geçerli olduğu gün sayısı |

**Örnek Kullanım (curl):**

```bash
curl -X POST http://localhost:8000/insurance \
  -H "Content-Type: application/json" \
  -d '{
    "driveId": "abc123",
    "overallScore": 82.45,
    "vehicleInfo": {
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2019,
      "fuelType": "Benzin",
      "annualKm": 18000
    }
  }'
```

---

## 4. Kayıtlı Puan Sorgulama

Daha önce analiz edilmiş ve kaydedilmiş bir sürüşün puanını getirir.

### `GET /score/{drive_id}`

**URL Parametresi:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `drive_id` | string | Sürüş kimliği |

**Yanıt — 200 OK**

```json
{
  "id": 1,
  "drive_id": "abc123",
  "user_id": "user_42",
  "overall_score": 82.45,
  "category_scores": {
    "gearShifting": 88.0,
    "rpmControl": 79.5,
    "drivingStyle": 86.0,
    "abnormalConditions": 70.0,
    "fuelEfficiency": 100.0
  },
  "risk_level": "Düşük-Orta",
  "risk_label": "İyi sürüş alışkanlıkları.",
  "created_at": "2024-12-01T14:30:00.123456"
}
```

**Yanıt — 404 Not Found**

```json
{
  "detail": "Sürüş verisi bulunamadı"
}
```

**Örnek Kullanım (curl):**

```bash
curl http://localhost:8000/score/abc123
```

---

## 5. Sigorta Geçmişi

Bir sürüş ID'sine ait en son sigorta teklifini getirir.

### `GET /insurance/{drive_id}`

**URL Parametresi:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `drive_id` | string | Sürüş kimliği |

**Yanıt — 200 OK**

```json
{
  "id": 1,
  "drive_id": "abc123",
  "overall_score": 82.45,
  "risk_level": "Düşük",
  "annual_premium": 16344.00,
  "monthly_premium": 1362.00,
  "breakdown": {
    "basePremium": 18000.0,
    "vehicleAgeFactor": 1.21,
    "mileageFactor": 1.016,
    "scoreFactor": 0.80,
    "scoreDiscount": -20.0,
    "finalPremium": 16344.00
  },
  "discount_message": "⭐ Çok iyi sürücü profili. %20 prim indirimi uygulandı.",
  "vehicle_info": {
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "fuelType": "Benzin",
    "annualKm": 18000
  },
  "created_at": "2024-12-01T14:31:00.456789"
}
```

**Yanıt — 404 Not Found**

```json
{
  "detail": "Sigorta teklifi bulunamadı"
}
```

**Örnek Kullanım (curl):**

```bash
curl http://localhost:8000/insurance/abc123
```

---

## 6. Kullanıcı Geçmişi

Bir kullanıcının son 50 sürüşünü tarihe göre sıralı getirir.

### `GET /history/{user_id}`

**URL Parametresi:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `user_id` | string | Kullanıcı kimliği |

**Yanıt — 200 OK**

```json
[
  {
    "id": 3,
    "drive_id": "xyz789",
    "user_id": "user_42",
    "overall_score": 91.0,
    "risk_level": "Düşük",
    "created_at": "2024-12-02T09:15:00"
  },
  {
    "id": 1,
    "drive_id": "abc123",
    "user_id": "user_42",
    "overall_score": 82.45,
    "risk_level": "Düşük-Orta",
    "created_at": "2024-12-01T14:30:00"
  }
]
```

**Kullanıcı bulunamazsa:** Boş dizi `[]` döner (404 hatası atmaz).

**Örnek Kullanım (curl):**

```bash
curl http://localhost:8000/history/user_42
```

---

## 7. Veri Modelleri

### `ClutchUsage`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `averageTime` | float | Ortalama debriyaj basma süresi (saniye) |
| `totalTime` | float | Toplam debriyaj basma süresi (saniye) |
| `longPresses` | integer | 2 saniyeden uzun debriyaj basma sayısı |

### `GearSpeedMismatch`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `lowGearHighSpeed` | float | Düşük viteste yüksek hız ihlal sayısı |
| `highGearLowSpeed` | float | Yüksek viteste düşük hız ihlal sayısı |
| `totalMismatchTime` | float | Toplam uyumsuzluk süresi (saniye) |

### `RPMControl`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `averageRPM` | float | Sürüş boyunca ortalama devir |
| `highRPM.count` | integer | 3000+ RPM olay sayısı |
| `highRPM.totalTime` | float | 3000+ RPM toplam süresi (saniye) |
| `lowRPM.count` | integer | 1500- RPM olay sayısı |
| `lowRPM.totalTime` | float | 1500- RPM toplam süresi (saniye) |

### `TrafficCompliance`

| Alan | Tip | Açıklama |
|------|-----|----------|
| `speedLimitExceed` | integer | Hız limiti aşım sayısı |
| `redLightViolation` | integer | Kırmızı ışık ihlal sayısı |
| `stopSignViolation` | integer | Dur işareti ihlal sayısı |
| `complianceRate` | float | Genel uyum oranı (0.0–1.0) |

### `VehicleInfo`

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| `brand` | string | `"Bilinmiyor"` | Araç markası |
| `model` | string | `"Bilinmiyor"` | Araç modeli |
| `year` | integer | `2015` | Model yılı |
| `fuelType` | string | `"Benzin"` | Yakıt tipi |
| `annualKm` | integer | `15000` | Tahmini yıllık km |

---

## 8. Hata Kodları

| HTTP Kodu | Durum | Açıklama |
|-----------|-------|----------|
| `200 OK` | Başarılı | İstek işlendi ve yanıt döndürüldü |
| `404 Not Found` | Bulunamadı | Belirtilen `drive_id` veya `user_id` veritabanında yok |
| `422 Unprocessable Entity` | Doğrulama Hatası | Gönderilen JSON eksik veya yanlış tipte alan içeriyor |
| `500 Internal Server Error` | Sunucu Hatası | Beklenmeyen hata; backend log'larını kontrol edin |
| `503 Service Unavailable` | Servis Kapalı | Backend çalışmıyor; `python -m uvicorn main:app` ile başlatın |

**422 Hatası Örneği:**

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "gearShifting"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

---

## 9. Puanlama Algoritması

### Kategori Ağırlıkları

```
Genel Puan = 
  Vites Kullanımı      × 0.25  (25%)
  Devir Kontrolü       × 0.20  (20%)
  Sürüş Tarzı          × 0.20  (20%)
  Anormal Durumlar     × 0.15  (15%)
  Yakıt Verimliliği    × 0.20  (20%)
```

### Sigorta Prim Hesaplama

```
Temel Prim = 18.000 ₺

Araç Yaşı Çarpanı  = 1 + (araç_yaşı × 0.03)       → Her yıl +%3
Km Çarpanı         = 1 + ((yıllık_km - 10000) / 10000 × 0.02)  → Her 10k km için +%2

Puan Çarpanı:
  90–100 puan  → 0.70  (%30 indirim)
  80–89  puan  → 0.80  (%20 indirim)
  70–79  puan  → 0.90  (%10 indirim)
  60–69  puan  → 1.00  (standart prim)
  50–59  puan  → 1.10  (%10 artış)
  35–49  puan  → 1.25  (%25 artış)
  0–34   puan  → 1.50  (%50 artış)

Nihai Prim = Temel Prim × Araç Yaşı × Km × Puan Çarpanı
```

### Risk Seviyeleri

| Puan Aralığı | Risk Seviyesi |
|-------------|---------------|
| 85–100 | Düşük |
| 70–84 | Düşük-Orta |
| 55–69 | Orta |
| 40–54 | Yüksek |
| 0–39 | Çok Yüksek |
