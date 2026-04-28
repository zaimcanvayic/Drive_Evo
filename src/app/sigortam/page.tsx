'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  FaShieldAlt, FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaCarSide, FaTachometerAlt, FaCalendarAlt, FaRoad,
  FaArrowLeft, FaFileDownload
} from 'react-icons/fa';

interface InsuranceData {
  driveId: string;
  overallScore: number;
  riskLevel: string;
  annualPremium: number;
  monthlyPremium: number;
  discountMessage: string;
  validDays: number;
  breakdown: {
    basePremium: number;
    vehicleAgeFactor: number;
    mileageFactor: number;
    scoreFactor: number;
    scoreDiscount: number;
    finalPremium: number;
  };
}

interface VehicleInfo {
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  image: string | null;
}

const getRiskConfig = (level: string) => {
  switch (level) {
    case 'Düşük':
      return { gradient: 'from-emerald-400 to-green-600', badge: 'bg-green-100 text-green-700', icon: FaCheckCircle, iconColor: 'text-green-500' };
    case 'Orta':
      return { gradient: 'from-yellow-400 to-orange-500', badge: 'bg-yellow-100 text-yellow-700', icon: FaInfoCircle, iconColor: 'text-yellow-500' };
    default:
      return { gradient: 'from-red-500 to-rose-700', badge: 'bg-red-100 text-red-700', icon: FaTimesCircle, iconColor: 'text-red-500' };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export default function SigortamPage() {
  const searchParams = useSearchParams();
  const driveId = searchParams.get('driveId');

  const [insurance, setInsurance] = useState<InsuranceData | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('uploadCompletionData');
    if (!stored) { setNotFound(true); return; }

    try {
      const parsed = JSON.parse(stored);
      if (parsed.insuranceResult) {
        setInsurance(parsed.insuranceResult);
      } else {
        setNotFound(true);
      }
      if (parsed.scoreResult) setScore(parsed.scoreResult.overallScore);
    } catch {
      setNotFound(true);
    }

    const storedVehicle = localStorage.getItem('selectedVehicle');
    if (storedVehicle) {
      try { setVehicle(JSON.parse(storedVehicle)); } catch {}
    }
  }, []);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <FaShieldAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sigorta teklifi bulunamadı</h2>
          <p className="text-gray-500 mb-6">Önce bir sürüş analizi yapmanız gerekiyor.</p>
          <a href="/upload" className="inline-block px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
            Analiz Başlat
          </a>
        </div>
      </div>
    );
  }

  if (!insurance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  const config = getRiskConfig(insurance.riskLevel);
  const RiskIcon = config.icon;
  const discountValue = Math.abs(insurance.breakdown?.scoreDiscount || 0);
  const isDiscount = (insurance.breakdown?.scoreDiscount || 0) < 0;
  const isNeutral = (insurance.breakdown?.scoreDiscount || 0) === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4">

        {/* Geri butonu */}
        <a href={driveId ? `/analysis/performance?driveId=${driveId}` : '/upload'}
          className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <FaArrowLeft className="h-4 w-4" />
          <span>Sürüş Analizine Dön</span>
        </a>

        {/* Ana Kart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.gradient} p-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full p-3">
                  <FaShieldAlt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-2xl font-extrabold">Sigorta Teklifiniz</h1>
                  <p className="text-white/80 text-sm mt-0.5">Sürüş performansınıza göre kişisel fiyatlandırma</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Yıllık Prim</div>
                <div className="text-white text-4xl font-black">
                  {insurance.annualPremium.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* Mesaj Banner */}
            <div className={`rounded-xl p-4 ${config.badge} flex items-start space-x-3`}>
              <RiskIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
              <p className="text-sm font-medium">{insurance.discountMessage}</p>
            </div>

            {/* Özet Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Aylık Prim', value: `${insurance.monthlyPremium.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`, sub: '/ay' },
                { label: 'Risk Seviyesi', value: insurance.riskLevel, sub: 'risk profili' },
                { label: 'Sürüş Puanı', value: score !== null ? `${Math.round(score)}/100` : '-', sub: 'genel puan' },
                { label: 'Geçerlilik', value: `${insurance.validDays} gün`, sub: 'teklif süresi' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="bg-gray-50 rounded-2xl p-4 text-center"
                >
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className={`text-xl font-black ${i === 2 && score !== null ? getScoreColor(score) : 'text-gray-900'}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-400">{item.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Araç Bilgisi */}
            {vehicle && (
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Araç Bilgisi</h3>
                <div className="flex items-center space-x-4">
                  {vehicle.image && (
                    <img src={vehicle.image} alt="Araç" className="h-20 object-contain rounded-lg" />
                  )}
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {[
                      { icon: FaCarSide, label: 'Marka/Model', value: `${vehicle.brand} ${vehicle.model}` },
                      { icon: FaCalendarAlt, label: 'Model Yılı', value: vehicle.year },
                      { icon: FaTachometerAlt, label: 'Yakıt Tipi', value: vehicle.fuelType },
                      { icon: FaRoad, label: 'Tahmini Yıllık Km', value: '15.000 km' },
                    ].map(({ icon: Icon, label, value }, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-red-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">{label}</div>
                          <div className="text-sm font-semibold text-gray-800">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prim Detayı */}
            <div className="rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Prim Hesap Detayı</h3>
              <div className="space-y-3">
                {[
                  { label: 'Temel Prim', value: `${insurance.breakdown.basePremium.toLocaleString('tr-TR')} ₺`, color: 'text-gray-800' },
                  { label: `Araç Yaşı Çarpanı`, value: `×${insurance.breakdown.vehicleAgeFactor.toFixed(2)}`, color: 'text-gray-700' },
                  { label: `Yıllık Km Çarpanı`, value: `×${insurance.breakdown.mileageFactor.toFixed(2)}`, color: 'text-gray-700' },
                  {
                    label: isDiscount
                      ? `Sürüş Puanı İndirimi (%${discountValue})`
                      : isNeutral
                        ? 'Sürüş Puanı (Standart)'
                        : `Sürüş Puanı Artışı (+%${discountValue})`,
                    value: `×${insurance.breakdown.scoreFactor.toFixed(2)}`,
                    color: isDiscount ? 'text-green-600' : isNeutral ? 'text-gray-700' : 'text-red-600',
                  },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                  <span className="font-bold text-gray-800">Yıllık Toplam Prim</span>
                  <span className="text-xl font-black text-red-600">
                    {insurance.annualPremium.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* Nasıl İyileştirebilirsiniz */}
            <div className="rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 p-5 border border-red-100">
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">💡 Primini Düşürmenin Yolu</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2"><span className="text-red-400 font-bold">•</span><span>Ani frenlemelerden ve hızlanmalardan kaçının — en büyük prim artışı bu davranışlardan kaynaklanıyor.</span></li>
                <li className="flex items-start space-x-2"><span className="text-red-400 font-bold">•</span><span>Vites-hız uyumunu iyileştirin, motor devirini 2000-2500 RPM bandında tutun.</span></li>
                <li className="flex items-start space-x-2"><span className="text-red-400 font-bold">•</span><span>Trafik kurallarına tam uyum sağlayın; her ihlal puanınızı düşürüyor.</span></li>
                <li className="flex items-start space-x-2"><span className="text-red-400 font-bold">•</span><span>Gereksiz rölantide kalmayın, yakıt verimliliğinizi artırın.</span></li>
              </ul>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center space-x-2 py-4 border-2 border-red-200 text-red-600 rounded-2xl font-semibold hover:bg-red-50 transition-colors"
              >
                <FaFileDownload className="h-4 w-4" />
                <span>Teklifi Kaydet / Yazdır</span>
              </button>
              <a
                href="/upload"
                className="flex-1 flex items-center justify-center py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-colors"
              >
                Yeni Sürüş Analizi Yap
              </a>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
