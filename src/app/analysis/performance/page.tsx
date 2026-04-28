'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCar, FaExclamationTriangle, FaChartLine, FaRoad, FaTachometerAlt, FaGasPump, FaChevronRight, FaChevronLeft, FaCog, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { calculateOverallScore, calculateGearShiftingScore, calculateRPMControlScore, calculateDrivingStyleScore, calculateAbnormalConditionsScore, calculateFuelEfficiencyScore, NORMAL_RANGES, generateDriveId, saveDriveData, getDriveData, DriveData } from '../../../utils/performanceCalculations';
import { useSession } from 'next-auth/react';

// Tip tanımlamaları
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  className?: string;
  value?: number;
}

interface CategoryCardProps {
  title: string;
  score: number;
  icon: IconType;
  onClick: () => void;
}

type CategoryType = 'gearShifting' | 'rpmControl' | 'drivingStyle' | 'abnormalConditions' | 'fuelEfficiency';

interface CategoryScores {
  gearShifting: number;
  rpmControl: number;
  drivingStyle: number;
  abnormalConditions: number;
  fuelEfficiency: number;
}

interface CategoryDetailItem {
  title: string;
  value: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info'; // Explicitly define status type
}

interface CategoryDetails {
  title: string;
  icon: IconType;
  details: CategoryDetailItem[]; // Use the new interface for details array
  recommendations: string[];
}

// Dairesel progress bar için yardımcı fonksiyon
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, color = '#3b82f6', showValue = false, className = '', value }: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value || percentage) / 100 * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-500 transition-all duration-500 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ stroke: color }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showValue && <span className="text-2xl font-bold">{Math.round(value || percentage)}</span>}
      </div>
    </div>
  );
};

// Kategori kartı bileşeni
const CategoryCard = ({ title, score, icon: Icon, onClick }: CategoryCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-md p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <span className="text-sm font-medium text-gray-600">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-red-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </motion.div>
  );
};

// Kategori detayları için yardımcı fonksiyonlar
const getCategoryDetails = (category: CategoryType, data: DriveData): CategoryDetails => {
  switch (category) {
    case 'gearShifting':
      return {
        title: 'Vites Kullanımı Detayları',
        icon: FaCar,
        details: [
          {
            title: 'Debriyaj Kullanımı',
            value: `${data.gearShifting.clutchUsage.averageTime.toFixed(1)} saniye`,
            description: 'Ortalama debriyaj basma süresi',
            status: data.gearShifting.clutchUsage.averageTime > NORMAL_RANGES.clutchUsage.max ? 'warning' : 'success'
          },
          {
            title: 'Uzun Debriyaj Basmaları',
            value: `${data.gearShifting.clutchUsage.longPresses} kez`,
            description: '2 saniyeden uzun debriyaj basmaları',
            status: data.gearShifting.clutchUsage.longPresses > 0 ? 'warning' : 'success'
          },
          {
            title: 'Vites-Hız Uyumsuzluğu',
            value: `${data.gearShifting.gearSpeedMismatch.lowGearHighSpeed + data.gearShifting.gearSpeedMismatch.highGearLowSpeed} kez`,
            description: 'Toplam uyumsuzluk sayısı',
            status: (data.gearShifting.gearSpeedMismatch.lowGearHighSpeed + data.gearShifting.gearSpeedMismatch.highGearLowSpeed) > 0 ? 'warning' : 'success'
          },
          {
            title: 'Motor Stop',
            value: `${data.gearShifting.stalls} kez`,
            description: 'Toplam motor stop sayısı',
            status: data.gearShifting.stalls > 0 ? 'error' : 'success'
          }
        ],
        recommendations: [
          'Debriyajı daha hızlı bırakın',
          'Vites değişimlerini daha yumuşak yapın',
          'Motor devrine göre vites seçin',
          'Kalkışlarda debriyaj-gaz dengesini iyi ayarlayın'
        ]
      };

    case 'rpmControl':
      return {
        title: 'Devir Kontrolü Detayları',
        icon: FaTachometerAlt,
        details: [
          {
            title: 'Ortalama Devir',
            value: `${data.rpmControl.averageRPM} RPM`,
            description: 'Sürüş sırasındaki ortalama devir',
            status: data.rpmControl.averageRPM > NORMAL_RANGES.rpmRange.max ? 'warning' : 'success'
          },
          {
            title: 'Yüksek Devir',
            value: `${data.rpmControl.highRPM.count} kez (${data.rpmControl.highRPM.totalTime} sn)`,
            description: '3000+ RPM sayısı ve süresi',
            status: data.rpmControl.highRPM.count > 0 ? 'warning' : 'success'
          },
          {
            title: 'Düşük Devir',
            value: `${data.rpmControl.lowRPM.count} kez (${data.rpmControl.lowRPM.totalTime} sn)`,
            description: '1500- RPM sayısı ve süresi',
            status: data.rpmControl.lowRPM.count > 0 ? 'warning' : 'success'
          },
          {
            title: 'Devir Aralığı',
            value: `${data.rpmControl.rpmRange.min}-${data.rpmControl.rpmRange.max} RPM`,
            description: 'Minimum ve maksimum devir',
            status: 'info'
          }
        ],
        recommendations: [
          '2000-2500 RPM aralığında sürüş yapın',
          'Yüksek devirde uzun süre kalmayın',
          'Düşük devirde yüklenmeyin',
          'Vites değişimlerini zamanında yapın'
        ]
      };

    case 'drivingStyle':
      return {
        title: 'Sürüş Tarzı Detayları',
        icon: FaRoad,
        details: [
          {
            title: 'Gereksiz Manevralar',
            value: `${data.drivingStyle.unnecessaryManeuvers} kez`,
            description: 'Gereksiz şerit değişimi ve manevra',
            status: data.drivingStyle.unnecessaryManeuvers > 0 ? 'warning' : 'success'
          },
          {
            title: 'Teker Kilitleme',
            value: `${data.drivingStyle.wheelLock} kez`,
            description: 'Frenleme sırasında teker kilitleme',
            status: data.drivingStyle.wheelLock > 0 ? 'error' : 'success'
          },
          {
            title: 'Trafik Uyumu',
            value: `%${(data.drivingStyle.trafficCompliance.complianceRate * 100).toFixed(0)}`,
            description: 'Trafik kurallarına uyum oranı',
            status: data.drivingStyle.trafficCompliance.complianceRate < NORMAL_RANGES.trafficCompliance.min ? 'warning' : 'success'
          },
          {
            title: 'Trafik İhlalleri',
            value: `${data.drivingStyle.trafficCompliance.speedLimitExceed + data.drivingStyle.trafficCompliance.redLightViolation + data.drivingStyle.trafficCompliance.stopSignViolation} kez`,
            description: 'Toplam trafik ihlali sayısı',
            status: (data.drivingStyle.trafficCompliance.speedLimitExceed + data.drivingStyle.trafficCompliance.redLightViolation + data.drivingStyle.trafficCompliance.stopSignViolation) > 0 ? 'error' : 'success'
          }
        ],
        recommendations: [
          'Daha öngörülü sürüş yapın',
          'Trafik kurallarına tam uyum sağlayın',
          'Gereksiz manevralardan kaçının',
          'Frenlemeyi daha yumuşak yapın'
        ]
      };

    case 'abnormalConditions':
      return {
        title: 'Anormal Durumlar Detayları',
        icon: FaExclamationTriangle,
        details: [
          {
            title: 'El Freni Hatası',
            value: `${data.abnormalConditions.handbrakeMistake} kez`,
            description: 'El freni kullanım hataları',
            status: data.abnormalConditions.handbrakeMistake > 0 ? 'error' : 'success'
          },
          {
            title: 'Yanlış Vitesle Kalkış',
            value: `${data.abnormalConditions.wrongGearStart} kez`,
            description: 'Yanlış viteste kalkış denemeleri',
            status: data.abnormalConditions.wrongGearStart > 0 ? 'error' : 'success'
          },
          {
            title: 'Ani Frenleme',
            value: `${data.abnormalConditions.suddenBraking} kez`,
            description: 'Sert ve ani frenlemeler',
            status: data.abnormalConditions.suddenBraking > 0 ? 'warning' : 'success'
          },
          {
            title: 'Ani Hızlanma',
            value: `${data.abnormalConditions.suddenAcceleration} kez`,
            description: 'Sert ve ani hızlanmalar',
            status: data.abnormalConditions.suddenAcceleration > 0 ? 'warning' : 'success'
          }
        ],
        recommendations: [
          'El frenini doğru kullanın',
          'Kalkış öncesi vites kontrolü yapın',
          'Daha yumuşak hızlanın ve yavaşlayın',
          'Öngörülü sürüş yapın'
        ]
      };

    case 'fuelEfficiency':
      return {
        title: 'Yakıt Verimliliği Detayları',
        icon: FaGasPump,
        details: [
          {
            title: 'Ortalama Tüketim',
            value: `${data.fuelEfficiency.averageConsumption.toFixed(1)} L/100km`,
            description: '100 km başına yakıt tüketimi',
            status: data.fuelEfficiency.averageConsumption > NORMAL_RANGES.fuelConsumption.max ? 'warning' : 'success'
          },
          {
            title: 'Rölanti Süresi',
            value: `${data.fuelEfficiency.idleTime} saniye`,
            description: 'Toplam rölanti süresi',
            status: data.fuelEfficiency.idleTime > 60 ? 'warning' : 'success'
          },
          {
            title: 'Rölanti Oranı',
            value: `%${(data.fuelEfficiency.idlePercentage * 100).toFixed(0)}`,
            description: 'Toplam sürenin rölanti yüzdesi',
            status: data.fuelEfficiency.idlePercentage > NORMAL_RANGES.idlePercentage.max ? 'warning' : 'success'
          }
        ],
        recommendations: [
          'Gereksiz rölantide kalmayın',
          '2000-2500 RPM aralığında sürüş yapın',
          'Ani hızlanma ve yavaşlamalardan kaçının',
          'Lastik basınçlarını kontrol edin'
        ]
      };
  }
};

// Status ikonları için yardımcı fonksiyon
const getStatusIcon = (status: 'success' | 'warning' | 'error' | 'info') => {
  switch (status) {
    case 'success':
      return <FaCheckCircle className="text-green-500" />;
    case 'warning':
      return <FaExclamationTriangle className="text-yellow-500" />;
    case 'error':
      return <FaExclamationCircle className="text-red-500" />;
    case 'info':
      return <FaInfoCircle className="text-blue-500" />;
  }
};

// Renk fonksiyonları
const getScoreColor = (score: number): string => {
  if (score < 40) return '#ef4444'; // Kırmızı
  if (score < 70) return '#f59e0b'; // Turuncu
  return '#22c55e'; // Yeşil
};

const getCategoryColor = (score: number): string => {
  if (score < 40) return '#ef4444'; // Kırmızı
  if (score < 70) return '#f59e0b'; // Turuncu
  return '#22c55e'; // Yeşil
};

// Arka plan gradient renklerini skora göre belirleyen yardımcı fonksiyon
const getBackgroundGradient = (score: number): string => {
  if (score < 40) return 'bg-gradient-to-br from-red-100 via-orange-100 to-white';
  if (score < 70) return 'bg-gradient-to-br from-orange-100 via-yellow-100 to-white';
  return 'bg-gradient-to-br from-green-100 via-teal-100 to-white';
};

export default function PerformancePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [overallScore, setOverallScore] = useState(0);
  const [overallScoreAnimated, setOverallScoreAnimated] = useState(0);
  const [categoryScores, setCategoryScores] = useState<CategoryScores>({
    gearShifting: 0,
    rpmControl: 0,
    drivingStyle: 0,
    abnormalConditions: 0,
    fuelEfficiency: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [driveData, setDriveData] = useState<DriveData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [insuranceResult, setInsuranceResult] = useState<any>(null);
  const driveId = searchParams.get('driveId');

  // Drive ID kontrolü ve veri yükleme
  useEffect(() => {
    if (!driveId) {
      router.replace('/upload');
    } else {
      const savedData = getDriveData(driveId);
      if (savedData) {
        setDriveData(savedData);
      } else {
        router.replace('/upload');
      }
      // Sigorta teklifini localStorage'dan oku
      const stored = localStorage.getItem('uploadCompletionData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.insuranceResult) setInsuranceResult(parsed.insuranceResult);
        } catch {}
      }
    }
  }, [searchParams, router]);

  // Puan hesaplama
  useEffect(() => {
    if (!driveData) return;

    // Kategori puanlarını hesapla
    const scores = {
      gearShifting: calculateGearShiftingScore(driveData.gearShifting),
      rpmControl: calculateRPMControlScore(driveData.rpmControl),
      drivingStyle: calculateDrivingStyleScore(driveData.drivingStyle),
      abnormalConditions: calculateAbnormalConditionsScore(driveData.abnormalConditions),
      fuelEfficiency: calculateFuelEfficiencyScore(driveData.fuelEfficiency)
    };

    setCategoryScores(scores);

    // Genel puanı hesapla
    const overall = calculateOverallScore(driveData);
    setOverallScore(overall);

    // Puanı localStorage'a kaydet
    if (driveId) {
      const rideData = {
        id: driveId,
        score: Math.round(overall),
        startTime: new Date().toISOString(),
        categoryScores: scores
      };
      localStorage.setItem(`ride_${driveId}`, JSON.stringify(rideData));
      console.log('Puan localStorage\'a kaydedildi:', rideData);
    }
  }, [driveData, driveId]);

  useEffect(() => {
    let start = 0;
    const end = overallScore;
    if (start === end) return; // Eğer hedef 0 ise animasyon yapma

    let current = overallScoreAnimated; // Animasyona mevcut değerden başla
    const increment = (end > start) ? 1 : -1;
    const duration = 1000; // ms
    
    // Adım zamanını dinamik olarak ayarla, 1'den küçük olmasın
    const diff = Math.abs(end - start);
    const stepTime = diff === 0 ? 1 : Math.max(1, Math.floor(duration / diff));

    const timer = setInterval(() => {
      current += increment;

      // Hedefe ulaştıysa veya geçtiyse durdur
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end; // Tam hedefe eşitle
        setOverallScoreAnimated(current);
        clearInterval(timer);
      } else {
        setOverallScoreAnimated(current);
      }
    }, stepTime);

    return () => clearInterval(timer); // Bileşen unmount olduğunda veya overallScore değiştiğinde temizle
  }, [overallScore]); // overallScore değiştiğinde yeniden çalıştır

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSaveAnalysis = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/user/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: overallScore,
        }),
      });

      if (!response.ok) {
        throw new Error('Analiz kaydedilemedi');
      }

      // Başarılı kayıt sonrası detaylı hasar analizi sayfasına yönlendir
      router.push(`/analysis/damage?driveId=${driveId}`);
    } catch (error) {
      setSaveError('Analiz kaydedilirken bir hata oluştu');
      console.error('Kaydetme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundGradient(overallScoreAnimated)}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Genel Sürüş Puanı</h2>
            <div className="relative">
              <CircularProgress
                value={overallScoreAnimated}
                percentage={overallScoreAnimated}
                size={200}
                strokeWidth={10}
                color={getScoreColor(overallScoreAnimated)}
                showValue={true}
                className="transform transition-all duration-500 ease-in-out"
              />
            </div>
            {driveId && (
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/analysis/damage?driveId=${driveId}`)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Detaylı Hasar Analizini Görüntüle
                </button>
              </div>
            )}
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div
              key="gearShifting"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCategory('gearShifting')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 mr-3">
                    <FaCar className="h-5 w-5 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Vites Kullanımı</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getCategoryColor(Math.round(categoryScores.gearShifting)) }}>
                    {Math.round(categoryScores.gearShifting)}
                  </div>
                  <div className="text-sm text-gray-500">puan</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${categoryScores.gearShifting}%`,
                    backgroundColor: getCategoryColor(Math.round(categoryScores.gearShifting)),
                  }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              key="rpmControl"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCategory('rpmControl')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 mr-3">
                    <FaTachometerAlt className="h-5 w-5 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Devir Kontrolü</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getCategoryColor(Math.round(categoryScores.rpmControl)) }}>
                    {Math.round(categoryScores.rpmControl)}
                  </div>
                  <div className="text-sm text-gray-500">puan</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${categoryScores.rpmControl}%`,
                    backgroundColor: getCategoryColor(Math.round(categoryScores.rpmControl)),
                  }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              key="drivingStyle"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCategory('drivingStyle')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 mr-3">
                    <FaRoad className="h-5 w-5 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Sürüş Tarzı</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getCategoryColor(Math.round(categoryScores.drivingStyle)) }}>
                    {Math.round(categoryScores.drivingStyle)}
                  </div>
                  <div className="text-sm text-gray-500">puan</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${categoryScores.drivingStyle}%`,
                    backgroundColor: getCategoryColor(Math.round(categoryScores.drivingStyle)),
                  }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              key="abnormalConditions"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCategory('abnormalConditions')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 mr-3">
                    <FaExclamationTriangle className="h-5 w-5 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Anormal Durumlar</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getCategoryColor(Math.round(categoryScores.abnormalConditions)) }}>
                    {Math.round(categoryScores.abnormalConditions)}
                  </div>
                  <div className="text-sm text-gray-500">puan</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${categoryScores.abnormalConditions}%`,
                    backgroundColor: getCategoryColor(Math.round(categoryScores.abnormalConditions)),
                  }}
                ></div>
              </div>
            </motion.div>
            <motion.div
              key="fuelEfficiency"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCategory('fuelEfficiency')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 mr-3">
                    <FaGasPump className="h-5 w-5 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Yakıt Verimliliği</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getCategoryColor(Math.round(categoryScores.fuelEfficiency)) }}>
                    {Math.round(categoryScores.fuelEfficiency)}
                  </div>
                  <div className="text-sm text-gray-500">puan</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${categoryScores.fuelEfficiency}%`,
                    backgroundColor: getCategoryColor(Math.round(categoryScores.fuelEfficiency)),
                  }}
                ></div>
              </div>
            </motion.div>
          </motion.div>

          {/* Sigorta Teklifi Bölümü */}
          {insuranceResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-lg"
            >
              <div className={`p-5 ${
                insuranceResult.riskLevel === 'Düşük' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                insuranceResult.riskLevel === 'Orta' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-red-500 to-red-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaShieldAlt className="h-7 w-7 text-white" />
                    <div>
                      <h3 className="text-white font-bold text-lg">Sigorta Teklifiniz</h3>
                      <p className="text-white/80 text-sm">Sürüş puanınıza göre hesaplandı</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-3xl font-extrabold">
                      {insuranceResult.annualPremium?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                    </div>
                    <div className="text-white/80 text-sm">yıllık prim</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5">
                <p className="text-gray-700 text-sm mb-4">{insuranceResult.discountMessage}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Aylık Prim</div>
                    <div className="font-bold text-gray-900 text-lg">
                      {insuranceResult.monthlyPremium?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Risk Seviyesi</div>
                    <div className={`font-bold text-lg ${
                      insuranceResult.riskLevel === 'Düşük' ? 'text-green-600' :
                      insuranceResult.riskLevel === 'Orta' ? 'text-yellow-600' : 'text-red-600'
                    }`}>{insuranceResult.riskLevel}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">İndirim/Artış</div>
                    <div className={`font-bold text-lg ${
                      (insuranceResult.breakdown?.scoreDiscount || 0) < 0 ? 'text-green-600' :
                      (insuranceResult.breakdown?.scoreDiscount || 0) === 0 ? 'text-gray-600' : 'text-red-600'
                    }`}>
                      {(insuranceResult.breakdown?.scoreDiscount || 0) > 0 ? '+' : ''}
                      {insuranceResult.breakdown?.scoreDiscount}%
                    </div>
                  </div>
                </div>
                <a
                  href={`/sigortam?driveId=${driveId}`}
                  className="block w-full text-center py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Detaylı Sigorta Teklifini Görüntüle →
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Kategori Detay Modalı */}
      {selectedCategory && driveData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {/* Modal İçeriği */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const details = getCategoryDetails(selectedCategory, driveData);
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <details.icon className="h-6 w-6 text-red-500" />
                      <h3 className="text-xl font-bold text-gray-800">{details.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Detay Kartları */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {details.details.map((detail, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">{detail.title}</h4>
                          {getStatusIcon(detail.status)}
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{detail.value}</p>
                        <p className="text-sm text-gray-500">{detail.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Öneriler */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">İyileştirme Önerileri</h4>
                    <ul className="space-y-2">
                      {details.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <FaCog className="h-5 w-5 text-red-500 mt-0.5" />
                          <span className="text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}

      {saveError && (
        <div className="mt-4 text-red-500 text-center bg-red-50 p-3 rounded-md">
          {saveError}
        </div>
      )}
    </div>
  );
} 