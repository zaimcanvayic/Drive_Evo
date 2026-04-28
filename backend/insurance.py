"""
Sigorta Fiyatlandırma Motoru — Drive Evo Python Backend

Sürüş puanı ve araç bilgisine göre dinamik sigorta primi hesaplar.
"""
from datetime import date
from models import InsuranceRequest, InsuranceQuote, PremiumBreakdown

# Temel yıllık prim (TL) — 2024 ortalama kasko tahmini
BASE_PREMIUM = 18_000.0


def _vehicle_age_factor(year: int) -> float:
    """Araç yaşına göre risk çarpanı. Her yıl %3 artış."""
    current_year = date.today().year
    age = max(0, current_year - year)
    return 1.0 + (age * 0.03)


def _mileage_factor(annual_km: int) -> float:
    """Yıllık km'ye göre risk çarpanı. Her 10.000 km için %2 artış."""
    extra_km = max(0, annual_km - 10_000)
    return 1.0 + (extra_km / 10_000) * 0.02


def _score_factor_and_message(score: float) -> tuple[float, float, str]:
    """
    Sürüş puanına göre (indirim/artış) çarpan, yüzde ve açıklama mesajı döndür.
    Returns: (factor, discount_pct, message)
    discount_pct: negatif = indirim, pozitif = artış (yüzde olarak)
    """
    if score >= 90:
        return 0.70, -30.0, "🏆 Mükemmel sürücü! %30 prim indirimi kazandınız."
    elif score >= 80:
        return 0.80, -20.0, "⭐ Çok iyi sürücü profili. %20 prim indirimi uygulandı."
    elif score >= 70:
        return 0.90, -10.0, "✅ İyi sürücü profili. %10 prim indirimi uygulandı."
    elif score >= 60:
        return 1.00, 0.0, "🔵 Ortalama sürücü profili. Standart prim uygulandı."
    elif score >= 50:
        return 1.10, +10.0, "⚠️ Ortalama altı sürüş. %10 prim artışı uygulandı."
    elif score >= 35:
        return 1.25, +25.0, "🟠 Riskli sürüş alışkanlıkları. %25 prim artışı uygulandı."
    else:
        return 1.50, +50.0, "🔴 Yüksek riskli sürüş. %50 prim artışı uygulandı. Lütfen sürüş alışkanlıklarınızı gözden geçirin."


def _risk_level(score: float) -> str:
    if score >= 70:
        return "Düşük"
    elif score >= 50:
        return "Orta"
    else:
        return "Yüksek"


def calculate_insurance_quote(request: InsuranceRequest) -> InsuranceQuote:
    """Sürüş puanı ve araç bilgisine göre sigorta teklifi hesapla."""
    vi = request.vehicleInfo
    score = request.overallScore

    age_factor = round(_vehicle_age_factor(vi.year), 4)
    km_factor = round(_mileage_factor(vi.annualKm), 4)
    score_factor, discount_pct, message = _score_factor_and_message(score)
    score_factor = round(score_factor, 4)

    final_premium = round(BASE_PREMIUM * age_factor * km_factor * score_factor, 2)
    monthly_premium = round(final_premium / 12, 2)

    breakdown = PremiumBreakdown(
        basePremium=BASE_PREMIUM,
        vehicleAgeFactor=age_factor,
        mileageFactor=km_factor,
        scoreFactor=score_factor,
        scoreDiscount=discount_pct,
        finalPremium=final_premium,
    )

    return InsuranceQuote(
        driveId=request.driveId,
        overallScore=score,
        riskLevel=_risk_level(score),
        annualPremium=final_premium,
        monthlyPremium=monthly_premium,
        breakdown=breakdown,
        discountMessage=message,
        validDays=30,
    )
