"""
Sürüş Puan Motoru — DriveMetrics Python Backend

TypeScript'teki performanceCalculations.ts dosyasından Python'a çevrilmiştir.
Aynı ağırlıklar ve ceza puanları kullanılmaktadır.
"""
from models import DriveInput, DriveScore, CategoryScores

# ---------- Normal Aralıklar ----------
NORMAL_RANGES = {
    "clutchUsage": {"min": 0.5, "max": 1.5},       # saniye
    "rpmRange": {"min": 2000, "max": 2500},          # RPM
    "trafficCompliance": {"min": 0.8, "max": 1.0},  # uyum oranı
    "fuelConsumption": {"min": 5.0, "max": 7.0},    # L/100km
    "idlePercentage": {"min": 0.0, "max": 0.1},     # oran
}

# ---------- Ceza Puanları ----------
PENALTIES = {
    "clutchLongPress": 10,       # her uzun basma için
    "gearMismatch": 2,           # saniye başına
    "stall": 15,                 # her stop için
    "highRPM": 5,                # her 10 sayım için
    "lowRPM": 5,                 # her 10 sayım için
    "unnecessaryManeuver": 7,    # her manevra için
    "wheelLock": 20,             # her kilitleme için
    "trafficViolation": 10,      # her ihlal için
    "handbrakeMistake": 25,      # her hata için
    "wrongGearStart": 20,        # her hata için
    "suddenBraking": 15,         # her ani fren için
    "suddenAcceleration": 15,    # her ani hızlanma için
    "fuelConsumption": 5,        # her 0.5 L sapma için
    "idleTime": 8,               # her %10 için
}


def calculate_gear_shifting_score(data) -> float:
    """Vites kullanımı puanı hesapla (0-100)"""

    # Debriyaj kullanımı (40%)
    clutch_penalty = 0.0
    clutch_penalty += data.clutchUsage.longPresses * PENALTIES["clutchLongPress"]
    if data.clutchUsage.averageTime > NORMAL_RANGES["clutchUsage"]["max"]:
        clutch_penalty += (data.clutchUsage.averageTime - NORMAL_RANGES["clutchUsage"]["max"]) * 5
    clutch_score = max(0.0, 100.0 - clutch_penalty)

    # Vites-Hız uyumu (40%)
    mismatch_penalty = 0.0
    mismatch_penalty += data.gearSpeedMismatch.lowGearHighSpeed * PENALTIES["gearMismatch"]
    mismatch_penalty += data.gearSpeedMismatch.highGearLowSpeed * PENALTIES["gearMismatch"]
    mismatch_penalty += (data.gearSpeedMismatch.totalMismatchTime / 60) * PENALTIES["gearMismatch"]
    gear_speed_score = max(0.0, 100.0 - mismatch_penalty)

    # Stop sayısı (20%)
    stall_score = max(0.0, 100.0 - (data.stalls * PENALTIES["stall"]))

    return (clutch_score * 0.4) + (gear_speed_score * 0.4) + (stall_score * 0.2)


def calculate_rpm_control_score(data) -> float:
    """Devir kontrolü puanı hesapla (0-100)"""

    # Yüksek devir (50%)
    high_rpm_penalty = (data.highRPM.count * 5) + ((data.highRPM.totalTime / 60) * 3)

    # Düşük devir (50%)
    low_rpm_penalty = (data.lowRPM.count * 5) + ((data.lowRPM.totalTime / 60) * 3)

    return max(0.0, 100.0 - (high_rpm_penalty * 0.5) - (low_rpm_penalty * 0.5))


def calculate_driving_style_score(data) -> float:
    """Sürüş tarzı puanı hesapla (0-100)"""
    score = 100.0

    # Gereksiz manevralar (40%)
    score -= data.unnecessaryManeuvers * PENALTIES["unnecessaryManeuver"]

    # Teker kilitleme (30%)
    score -= data.wheelLock * PENALTIES["wheelLock"]

    # Trafik uyumu (30%)
    tc = data.trafficCompliance
    traffic_penalty = 0.0
    traffic_penalty += tc.speedLimitExceed * PENALTIES["trafficViolation"]
    traffic_penalty += tc.redLightViolation * PENALTIES["trafficViolation"]
    traffic_penalty += tc.stopSignViolation * PENALTIES["trafficViolation"]
    if tc.complianceRate < NORMAL_RANGES["trafficCompliance"]["min"]:
        traffic_penalty += (NORMAL_RANGES["trafficCompliance"]["min"] - tc.complianceRate) * 100
    score -= traffic_penalty

    return max(0.0, score)


def calculate_abnormal_conditions_score(data) -> float:
    """Anormal durumlar puanı hesapla (0-100)"""
    score = 100.0
    score -= data.handbrakeMistake * PENALTIES["handbrakeMistake"]
    score -= data.wrongGearStart * PENALTIES["wrongGearStart"]
    score -= data.suddenBraking * PENALTIES["suddenBraking"]
    score -= data.suddenAcceleration * PENALTIES["suddenAcceleration"]
    return max(0.0, score)


def calculate_fuel_efficiency_score(data) -> float:
    """Yakıt verimliliği puanı hesapla (0-100)"""
    score = 100.0

    # Ortalama tüketim (60%)
    if data.averageConsumption > NORMAL_RANGES["fuelConsumption"]["max"]:
        excess = (data.averageConsumption - NORMAL_RANGES["fuelConsumption"]["max"]) / 0.5
        score -= excess * PENALTIES["fuelConsumption"]

    # Rölanti süresi (40%)
    if data.idlePercentage > NORMAL_RANGES["idlePercentage"]["max"]:
        excess = (data.idlePercentage - NORMAL_RANGES["idlePercentage"]["max"]) / 0.1
        score -= excess * PENALTIES["idleTime"]

    return max(0.0, score)


def calculate_overall_score(category_scores: CategoryScores) -> float:
    """Genel ağırlıklı puan hesapla (0-100)"""
    return (
        category_scores.gearShifting * 0.25 +
        category_scores.rpmControl * 0.20 +
        category_scores.drivingStyle * 0.20 +
        category_scores.abnormalConditions * 0.15 +
        category_scores.fuelEfficiency * 0.20
    )


def get_risk_level(score: float) -> tuple[str, str]:
    """Puana göre risk seviyesi ve açıklaması döndür"""
    if score >= 85:
        return "Düşük", "Mükemmel sürüş alışkanlıkları! Düşük riskli sürücü profili."
    elif score >= 70:
        return "Düşük-Orta", "İyi sürüş alışkanlıkları. Küçük iyileştirmelerle mükemmele ulaşabilirsiniz."
    elif score >= 55:
        return "Orta", "Ortalama sürüş alışkanlıkları. Bazı alanlarda iyileştirme önerilir."
    elif score >= 40:
        return "Yüksek", "Sürüş alışkanlıklarınız riskli. Dikkat gerektiren alanlar mevcut."
    else:
        return "Çok Yüksek", "Sürüş alışkanlıklarınız yüksek risk içeriyor. Acil iyileştirme gerekli."


def score_drive(drive_input: DriveInput, drive_id: str) -> DriveScore:
    """Sürüş verisini analiz ederek puan hesapla"""
    cat_scores = CategoryScores(
        gearShifting=round(calculate_gear_shifting_score(drive_input.gearShifting), 2),
        rpmControl=round(calculate_rpm_control_score(drive_input.rpmControl), 2),
        drivingStyle=round(calculate_driving_style_score(drive_input.drivingStyle), 2),
        abnormalConditions=round(calculate_abnormal_conditions_score(drive_input.abnormalConditions), 2),
        fuelEfficiency=round(calculate_fuel_efficiency_score(drive_input.fuelEfficiency), 2),
    )

    overall = round(calculate_overall_score(cat_scores), 2)
    risk_level, risk_label = get_risk_level(overall)

    return DriveScore(
        driveId=drive_id,
        overallScore=overall,
        categoryScores=cat_scores,
        riskLevel=risk_level,
        riskLabel=risk_label,
    )
