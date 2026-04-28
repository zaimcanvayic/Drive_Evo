"""
FastAPI Ana Uygulama — DriveMetrics Python Backend

Endpoints:
  GET  /health                    → Servis sağlığı
  POST /analyze                   → Sürüş verisi analiz et, puan döndür
  POST /insurance                 → Puan + araç bilgisi → sigorta teklifi
  GET  /score/{drive_id}          → Kaydedilmiş puanı getir
  GET  /history/{user_id}         → Kullanıcı sürüş geçmişi
  GET  /insurance/{drive_id}      → Kaydedilmiş sigorta teklifini getir
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import DriveInput, InsuranceRequest, DriveScore, InsuranceQuote
from scorer import score_drive
from insurance import calculate_insurance_quote
import database

# ---------- Uygulama başlangıcı ----------
app = FastAPI(
    title="DriveMetrics API",
    description="Sürüş verisi analizi ve sigorta fiyatlandırma servisi",
    version="1.0.0",
)

# CORS — Next.js dev server ile çalışması için
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı tablolarını başlat
@app.on_event("startup")
def startup():
    database.init_db()


# ---------- Endpoints ----------

@app.get("/health")
def health():
    return {"status": "ok", "service": "DriveMetrics API", "version": "1.0.0"}


@app.post("/analyze", response_model=DriveScore)
def analyze_drive(drive_input: DriveInput):
    """
    Sürüş verisini alır, puanı hesaplar ve SQLite'e kaydeder.
    driveId: isteğe bağlı; yoksa rastgele üretilir.
    """
    import uuid
    drive_id = drive_input.driveId or str(uuid.uuid4())

    result: DriveScore = score_drive(drive_input, drive_id)

    # Veritabanına kaydet
    try:
        database.save_drive_score(result, user_id=drive_input.userId)
    except Exception as e:
        # Kayıt başarısız olsa bile skoru döndür
        print(f"[WARN] DB kayıt hatası: {e}")

    return result


@app.post("/insurance", response_model=InsuranceQuote)
def get_insurance_quote(request: InsuranceRequest):
    """
    Sürüş puanı ve araç bilgisine göre sigorta teklifi hesaplar ve kaydeder.
    """
    quote: InsuranceQuote = calculate_insurance_quote(request)

    try:
        database.save_insurance_quote(quote, request.vehicleInfo, user_id=None)
    except Exception as e:
        print(f"[WARN] DB kayıt hatası: {e}")

    return quote


@app.get("/score/{drive_id}")
def get_score(drive_id: str):
    """Kaydedilmiş sürüş puanını getir"""
    result = database.get_drive_score(drive_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sürüş verisi bulunamadı")
    return result


@app.get("/history/{user_id}")
def get_history(user_id: str):
    """Kullanıcının sürüş geçmişini getir"""
    return database.get_user_history(user_id)


@app.get("/insurance/{drive_id}")
def get_insurance(drive_id: str):
    """Kaydedilmiş sigorta teklifini getir"""
    result = database.get_latest_insurance_quote(drive_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sigorta teklifi bulunamadı")
    return result


# ---------- Geliştirici başlatma ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
