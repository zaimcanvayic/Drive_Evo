"""
Pydantic veri modelleri — DriveMetrics Python Backend
"""
from pydantic import BaseModel, Field
from typing import Optional


# ---------- Giriş Modelleri ----------

class ClutchUsage(BaseModel):
    averageTime: float = 0.0   # saniye
    totalTime: float = 0.0
    longPresses: int = 0

class GearSpeedMismatch(BaseModel):
    lowGearHighSpeed: float = 0.0
    highGearLowSpeed: float = 0.0
    totalMismatchTime: float = 0.0

class GearShifting(BaseModel):
    clutchUsage: ClutchUsage
    gearSpeedMismatch: GearSpeedMismatch
    stalls: int = 0

class RPMRange(BaseModel):
    min: float = 0.0
    max: float = 0.0

class RPMEvent(BaseModel):
    count: int = 0
    totalTime: float = 0.0

class RPMControl(BaseModel):
    averageRPM: float = 2000.0
    highRPM: RPMEvent
    lowRPM: RPMEvent
    rpmRange: RPMRange

class TrafficCompliance(BaseModel):
    speedLimitExceed: int = 0
    redLightViolation: int = 0
    stopSignViolation: int = 0
    complianceRate: float = 1.0

class DrivingStyle(BaseModel):
    unnecessaryManeuvers: int = 0
    wheelLock: int = 0
    trafficCompliance: TrafficCompliance

class AbnormalConditions(BaseModel):
    handbrakeMistake: int = 0
    wrongGearStart: int = 0
    suddenBraking: int = 0
    suddenAcceleration: int = 0

class FuelEfficiency(BaseModel):
    averageConsumption: float = 6.0   # L/100km
    idleTime: float = 0.0              # saniye
    idlePercentage: float = 0.0        # 0-1 arası oran

class DriveInput(BaseModel):
    """Kullanıcının simülasyonundan gelen ham sürüş verisi"""
    gearShifting: GearShifting
    rpmControl: RPMControl
    drivingStyle: DrivingStyle
    abnormalConditions: AbnormalConditions
    fuelEfficiency: FuelEfficiency

    # Opsiyonel metadata
    userId: Optional[str] = None
    driveId: Optional[str] = None


# ---------- Çıkış Modelleri ----------

class CategoryScores(BaseModel):
    gearShifting: float
    rpmControl: float
    drivingStyle: float
    abnormalConditions: float
    fuelEfficiency: float

class DriveScore(BaseModel):
    """Hesaplanan sürüş puan sonucu"""
    driveId: str
    overallScore: float                 # 0-100
    categoryScores: CategoryScores
    riskLevel: str                      # "Düşük" | "Orta" | "Yüksek"
    riskLabel: str                      # Kullanıcı dostu risk açıklaması


# ---------- Sigorta Modelleri ----------

class VehicleInfo(BaseModel):
    brand: str = "Bilinmiyor"
    model: str = "Bilinmiyor"
    year: int = 2015
    fuelType: str = "Benzin"
    annualKm: int = 15000               # Yıllık tahmini km

class InsuranceRequest(BaseModel):
    driveId: str
    overallScore: float
    vehicleInfo: VehicleInfo

class PremiumBreakdown(BaseModel):
    basePremium: float                  # Temel prim (TL)
    vehicleAgeFactor: float             # Araç yaşı çarpanı
    mileageFactor: float                # Km çarpanı
    scoreFactor: float                  # Puan çarpanı
    scoreDiscount: float                # İndirim/artış yüzdesi (negatif = indirim)
    finalPremium: float                 # Nihai prim (TL)

class InsuranceQuote(BaseModel):
    driveId: str
    overallScore: float
    riskLevel: str
    annualPremium: float                # Yıllık prim (TL)
    monthlyPremium: float               # Aylık prim (TL)
    breakdown: PremiumBreakdown
    discountMessage: str                # İndirim/artış gerekçesi
    validDays: int = 30                 # Teklifin geçerlilik süresi (gün)
