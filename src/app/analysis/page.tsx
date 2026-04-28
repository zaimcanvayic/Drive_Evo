'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCar, FaExclamationTriangle, FaChartLine, FaRoad, FaTachometerAlt, FaGasPump, FaChevronRight, FaChevronLeft, FaCog, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaUser, FaClock, FaCloudRain, FaSun, FaCloud, FaSnowflake, FaWind, FaTrafficLight, FaMapMarkerAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DrivingConditions } from '../utils/drivingConditions';

// Import Leaflet and React-Leaflet components
// import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// Import leaflet-geometryutil
// import 'leaflet-geometryutil'; // Import the plugin

// Fix marker icon issue with Leaflet (Revised)
// import L from 'leaflet';
// import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define custom icons for start and end markers
// const greenIcon = new L.Icon({...});
// const redIcon = new L.Icon({...});

// Merge default options (still needed for other default markers if any)
// L.Icon.Default.mergeOptions({...});

// Define bounds for random coordinate generation (Rough bounds for Turkey)
const TURKEY_BOUNDS = {
    south: 35.5,
    west: 25.5,
    north: 42.0,
    east: 44.8,
};

// Helper function to generate random coordinates within bounds
const generateRandomCoordinate = (bounds: typeof TURKEY_BOUNDS) => {
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    return [lat, lng] as [number, number];
};

// Component to update map view to fit bounds
// function FitBounds({ positions }: { positions: [number, number][] }) { /* ... */ }

// Import AnalysisMap component dynamically
import dynamic from 'next/dynamic';

const AnalysisMap = dynamic(() => import('../../components/AnalysisMap'), { ssr: false });

// Define types for the data coming from localStorage
interface VehicleInfo {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  image: string | null;
}

interface UploadCompletionData {
  driveStartTime: string; // ISO string
  simulatedDurationSeconds: number; // The 8 seconds from upload, not used for Analysis display duration
  generatedDriveData: GeneratedDriveAnalysisData | null;
  driveId: string | null;
  drivingConditions: DrivingConditions | null;
}

// Analiz parametreleri ve ağırlıkları
const ANALYSIS_PARAMETERS = {
  gearShifting: {
    weight: 0.25,
    name: 'Vites Kullanımı',
    icon: FaCar,
    subParameters: {
      clutchUsage: {
        weight: 0.4,
        name: 'Debriyaj Kullanımı',
        normalRange: { min: 0.5, max: 1.5 }, // saniye
        penalty: 10 // saniye başına puan düşüşü
      },
      gearSpeedMismatch: {
        weight: 0.4,
        name: 'Vites-Hız Uyumsuzluğu',
        speedRanges: [
          { min: 0, max: 20, gear: 1 },
          { min: 20, max: 40, gear: 2 },
          { min: 40, max: 60, gear: 3 },
          { min: 60, max: 80, gear: 4 },
          { min: 80, max: Infinity, gear: 5 }
        ],
        penalty: 2 // saniye başına puan düşüşü
      },
      stallCount: {
        weight: 0.2,
        name: 'Stop Sayısı',
        normalRange: { min: 0, max: 1 }, // seyahat başına
        penalty: 15 // her stop için puan düşüşü
      }
    }
  },
  rpmControl: {
    weight: 0.2,
    name: 'Devir Kontrolü',
    icon: FaTachometerAlt,
    subParameters: {
      highRpmDuration: {
        weight: 0.5,
        name: 'Yüksek Devir Süresi',
        normalRange: { min: 2000, max: 2500 }, // RPM
        penalty: 5 // her 100 RPM sapma için puan düşüşü
      },
      lowRpmDuration: {
        weight: 0.5,
        name: 'Düşük Devir Süresi',
        normalRange: { min: 2000, max: 2500 }, // RPM
        penalty: 5 // her 100 RPM sapma için puan düşüşü
      }
    }
  },
  drivingStyle: {
    weight: 0.2,
    name: 'Sürüş Tarzı',
    icon: FaRoad,
    subParameters: {
      unnecessaryManeuvers: {
        weight: 0.4,
        name: 'Gereksiz Manevralar',
        normalRange: { min: 0, max: 2 }, // seyahat başına
        penalty: 7 // her manevra için puan düşüşü
      },
      wheelLock: {
        weight: 0.3,
        name: 'Teker Kilitleme',
        normalRange: { min: 0, max: 0 }, // olmaması gerekiyor
        penalty: 20 // her kilitleme için puan düşüşü
      },
      trafficCompliance: {
        weight: 0.3,
        name: 'Trafik Uyumu',
        normalRange: { min: 0.8, max: 1 }, // uyum oranı
        penalty: 10 // her %10 sapma için puan düşüşü
      }
    }
  },
  abnormalConditions: {
    weight: 0.15,
    name: 'Anormal Durumlar',
    icon: FaExclamationTriangle,
    subParameters: {
      handbrakeMistake: {
        weight: 0.3,
        name: 'El Freni Hatası',
        normalRange: { min: 0, max: 0 }, // olmaması gerekiyor
        penalty: 25 // her hata için puan düşüşü
      },
      wrongGearStart: {
        weight: 0.2,
        name: 'Yanlış Vitesle Kalkış',
        normalRange: { min: 0, max: 0 }, // olmaması gerekiyor
        penalty: 20 // her hata için puan düşüşü
      },
      suddenBraking: {
        weight: 0.25,
        name: 'Ani Frenleme',
        normalRange: { min: 0, max: 1 }, // seyahat başına
        penalty: 15 // her ani fren için puan düşüşü
      },
      suddenAcceleration: {
        weight: 0.25,
        name: 'Ani Hızlanma',
        normalRange: { min: 0, max: 1 }, // seyahat başına
        penalty: 15 // her ani hızlanma için puan düşüşü
      }
    }
  },
  fuelEfficiency: {
    weight: 0.2,
    name: 'Yakıt Verimliliği',
    icon: FaGasPump,
    subParameters: {
      averageConsumption: {
        weight: 0.6,
        name: 'Ortalama Tüketim',
        normalRange: { min: 5, max: 7 }, // L/100km
        penalty: 5 // her 0.5 L sapma için puan düşüşü
      },
      idleTime: {
        weight: 0.4,
        name: 'Rölanti Süresi',
        normalRange: { min: 0, max: 0.1 }, // toplam sürenin yüzdesi
        penalty: 8 // her %10 için puan düşüşü
      }
    }
  }
};

// Define type for Generated Drive Analysis Data
interface GeneratedDriveAnalysisData {
    distance: number;
    driveDuration: { minutes: number; seconds: number };
    tripType: string;
    driveStartTime: Date; // This will be derived from uploadCompletionData
}

export default function AnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [generatedDriveData, setGeneratedDriveData] = useState<GeneratedDriveAnalysisData | null>(null);
  const [generatedDrivingConditions, setGeneratedDrivingConditions] = useState<DrivingConditions | null>(null);
  const [driveId, setDriveId] = useState<string | null>(null);
  const [driveStartTimeStr, setDriveStartTimeStr] = useState<string | null>(null);

  // State for the initial start position (end position calculated in AnalysisMap)
  const [initialMapPosition, setInitialMapPosition] = useState<[number, number] | null>(null);

  // Örnek analiz verisi (gerçek uygulamada API'den gelecek)
  const mockAnalysisData = {
    overallScore: 85,
    details: {
      gearShifting: {
        score: 88,
        feedback: [
          { type: 'warning', message: 'Debriyaja gereksiz basma süren: 2.3 saniye (Vites geçişlerinde çok hızlı çekiyorsun, bu debriyaj balatasına zarar verebilir)' },
          { type: 'error', message: '3. viteste 25 km/s hızda 45 saniye sürüş yapıldı (Motor zorlanıyor)' },
          { type: 'info', message: 'Toplam stop sayısı: 1' }
        ]
      },
      rpmControl: {
        score: 82,
        feedback: [
          { type: 'warning', message: '3 kez 3000+ devirde sürüş tespit edildi' },
          { type: 'error', message: '2. viteste 1500 devirde uzun süre sürüş yapıldı' }
        ]
      },
      drivingStyle: {
        score: 90,
        feedback: [
          { type: 'success', message: 'Trafik kurallarına uyum mükemmel' },
          { type: 'info', message: '2 gereksiz manevra tespit edildi' }
        ]
      },
      abnormalConditions: {
        score: 95,
        feedback: [
          { type: 'success', message: 'Anormal durum tespit edilmedi' }
        ]
      },
      fuelEfficiency: {
        score: 87,
        feedback: [
          { type: 'warning', message: 'Ortalama yakıt tüketimi: 7.2 L/100km' },
          { type: 'info', message: 'Rölanti süresi: %8' }
        ]
      }
    }
  };

  // Rastgele mesafe ve süre üreten fonksiyon
  const generateDriveData = (uploadStartTime: Date, conditions: DrivingConditions): GeneratedDriveAnalysisData => {
    let distance = 0;
    let type = '';

    const rand = Math.random() * 100;

    if (rand < 5) { // %5: 5 metre - 1 km arası
      distance = Math.random() * (1 - 0.005) + 0.005; // 0.005 km = 5 metre
      type = 'Çok Kısa Mesafe';
    } else if (rand < 75) { // %70: 1 km - 3 km arası
      distance = Math.random() * (3 - 1) + 1;
      type = 'Kısa Mesafe';
    } else if (rand < 85) { // %10: 3 km - 10 km arası
      distance = Math.random() * (10 - 3) + 3;
      type = 'Orta Mesafe';
    } else if (rand < 90) { // %5: 1000 km - 1500 km arası
      distance = Math.random() * (1500 - 1000) + 1000;
      type = 'Uzun Mesafe';
    } else { // Kalan %10: 5m - 1500km arası rastgele
      distance = Math.random() * (1500 - 0.005) + 0.005;
      if (distance < 1) type = 'Çok Kısa Mesafe';
      else if (distance < 10) type = 'Kısa Mesafe';
      else if (distance < 100) type = 'Normal Mesafe';
      else type = 'Çok Uzun Mesafe';
    }

    // Süreyi mesafeye göre tutarlı üret (Ortalama hız mesafeye ve koşullara göre değişir)
    let averageSpeedKmh = 60; // Default average speed

    if (distance < 1) averageSpeedKmh = Math.random() * (30 - 5) + 5; // Çok kısa: 5-30 km/s
    else if (distance < 10) averageSpeedKmh = Math.random() * (70 - 30) + 30; // Kısa/Normal: 30-70 km/s
    else if (distance < 100) averageSpeedKmh = Math.random() * (100 - 60) + 60; // Orta/Uzun: 60-100 km/s
    else averageSpeedKmh = Math.random() * (120 - 80) + 80; // Çok Uzun/Ekstra Uzun: 80-120 km/s

    // Add traffic/road condition influence on speed
    if (conditions.roadCondition === 'Toprak Yol') averageSpeedKmh *= 0.5; // %50 hız düşüşü
    if (conditions.roadCondition === 'Buzlu/Karlı') averageSpeedKmh *= 0.3; // %70 hız düşüşü
    if (conditions.trafficDensity === 'Yoğun' || conditions.trafficDensity === 'Çok Yoğun') averageSpeedKmh *= 0.6; // %40 hız düşüşü
    if (conditions.weatherCondition === 'Sisli' || conditions.weatherCondition === 'Yağmurlu') averageSpeedKmh *= 0.8; // %20 hız düşüşü
    if (conditions.weatherCondition === 'Karlı') averageSpeedKmh *= 0.4; // %60 hız düşüşü
    if (conditions.weatherCondition === 'Rüzgarlı') averageSpeedKmh *= 0.9; // %10 hız düşüşü

    const durationHours = distance / averageSpeedKmh;
    let durationInSeconds = durationHours * 3600;

    // Minimum süre belirleyebiliriz
    if (distance < 1) durationInSeconds = Math.max(durationInSeconds, 30); // Çok kısa mesafeler için min 30 saniye
    else if (distance < 10) durationInSeconds = Math.max(durationInSeconds, 60); // Kısa/Normal mesafeler için min 60 saniye
    else durationInSeconds = Math.max(durationInSeconds, 120); // Diğerleri için min 2 dakika

    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    return { distance, driveDuration: { minutes, seconds }, tripType: type, driveStartTime: uploadStartTime };
  };

  // Rastgele sürüş koşulları üreten fonksiyon
  const generateDrivingConditions = (): DrivingConditions => {
    const roadConditions = ['Kuru Asfalt', 'Islak Asfalt', 'Toprak Yol', 'Buzlu/Karlı'];
    const weatherConditions = ['Güneşli', 'Bulutlu', 'Yağmurlu', 'Karlı', 'Sisli', 'Rüzgarlı'];
    const trafficDensities = ['Çok Az', 'Az', 'Orta', 'Yoğun', 'Çok Yoğun'];

    const randomRoad = roadConditions[Math.floor(Math.random() * roadConditions.length)];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const randomTraffic = trafficDensities[Math.floor(Math.random() * trafficDensities.length)];

    return {
      roadCondition: randomRoad,
      weatherCondition: randomWeather,
      trafficDensity: randomTraffic,
    };
  };

  // Sayfa yüklendiğinde localStorage'dan bilgileri oku, veri üret ve harita başlangıç pozisyonunu belirle
  useEffect(() => {
    const storedVehicle = localStorage.getItem('selectedVehicle');
    if (storedVehicle) {
      setVehicleInfo(JSON.parse(storedVehicle) as VehicleInfo);
    }

    const uploadCompletionData = localStorage.getItem('uploadCompletionData');
    if (uploadCompletionData) {
        const { driveStartTime, generatedDriveData: uploadedGeneratedData, driveId: uploadedDriveId, drivingConditions: uploadedDrivingConditions } = JSON.parse(uploadCompletionData) as UploadCompletionData;

        // Sürüş başlangıç zamanını ayrı sakla
        setDriveStartTimeStr(driveStartTime);

        // Use uploaded data if available, otherwise generate new data
        if (uploadedGeneratedData && uploadedDrivingConditions) {
            setGeneratedDriveData(uploadedGeneratedData);
            setGeneratedDrivingConditions(uploadedDrivingConditions);
        } else {
            // Generate driving conditions
            const conditions = generateDrivingConditions();
            setGeneratedDrivingConditions(conditions);

            // Generate drive data based on conditions and start time
            const driveData = generateDriveData(new Date(driveStartTime), conditions);
            setGeneratedDriveData(driveData);

            // Save the generated data to localStorage
            const updatedUploadCompletionData = {
                driveStartTime,
                generatedDriveData: driveData,
                drivingConditions: conditions,
                driveId: uploadedDriveId
            };
            localStorage.setItem('uploadCompletionData', JSON.stringify(updatedUploadCompletionData));
        }

        // Set the driveId from localStorage
        setDriveId(uploadedDriveId);

        // --- Generate initial map position ---
        const startPos = generateRandomCoordinate(TURKEY_BOUNDS);
        setInitialMapPosition(startPos);
        // -----------------------------------
    }
  }, []); // Empty dependency array

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, Object.keys(mockAnalysisData.details).length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper function to format duration
  const formatDuration = (duration: { minutes: number; seconds: number } | undefined) => {
    if (!duration) return 'N/A';
    return `${duration.minutes} dakika ${duration.seconds} saniye`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Kullanıcı Bilgisi - Placeholder until login is implemented */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <FaUser className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">KullanıcıAdı</h2>
                <p className="text-sm text-gray-500">Sürüş Analizi</p>
              </div>
            </div>
          </div>

          {/* Araç Bilgisi - Dynamically loaded from localStorage */}
          {vehicleInfo && (
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="relative w-96 h-72 flex-shrink-0">
                  <img
                    src={vehicleInfo.image || '/images/placeholder-car.png'}
                    alt={`${vehicleInfo.brand || ''} ${vehicleInfo.model || ''}`.trim() || 'Seçilen Araç'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <FaCar className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-800">{vehicleInfo.brand} {vehicleInfo.model}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Model Yılı: {vehicleInfo.year}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sürüş Detayları ve Koşulları - Combined in a 2-column grid */}
          {(generatedDriveData || generatedDrivingConditions) && (
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sürüş Özeti ve Koşulları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Başlangıç Zamanı */}
                    {generatedDriveData && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FaClock className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sürüş Başlangıcı</p>
                                <p className="text-base font-medium text-gray-800">
                                {driveStartTimeStr && (() => {
                                  try {
                                    return format(new Date(driveStartTimeStr), "d MMMM yyyy HH:mm", { locale: tr });
                                  } catch { return driveStartTimeStr; }
                                })()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Yol Durumu */}
                     {generatedDrivingConditions && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FaRoad className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Yol Durumu</p>
                                <p className="text-base font-medium text-gray-800">{generatedDrivingConditions.roadCondition}</p>
                            </div>
                        </div>
                    )}

                    {/* Sürüş Süresi */}
                    {generatedDriveData && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FaClock className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sürüş Süresi</p>
                                <p className="text-base font-medium text-gray-800">
                                    {formatDuration(generatedDriveData.driveDuration)}
                                </p>
                            </div>
                        </div>
                    )}

                     {/* Hava Durumu */}
                     {generatedDrivingConditions && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                             <div className="p-2 bg-red-100 rounded-full">
                                {generatedDrivingConditions.weatherCondition === 'Güneşli' && <FaSun className="h-5 w-5 text-red-500" />}
                                {generatedDrivingConditions.weatherCondition === 'Bulutlu' && <FaCloud className="h-5 w-5 text-red-500" />}
                                {generatedDrivingConditions.weatherCondition === 'Yağmurlu' && <FaCloudRain className="h-5 w-5 text-red-500" />}
                                {generatedDrivingConditions.weatherCondition === 'Karlı' && <FaSnowflake className="h-5 w-5 text-red-500" />}
                                {generatedDrivingConditions.weatherCondition === 'Sisli' && <FaCloud className="h-5 w-5 text-red-500" />}
                                {generatedDrivingConditions.weatherCondition === 'Rüzgarlı' && <FaWind className="h-5 w-5 text-red-500" />}
                             </div>
                            <div>
                                <p className="text-sm text-gray-500">Hava Durumu</p>
                                <p className="text-base font-medium text-gray-800">{generatedDrivingConditions.weatherCondition}</p>
                            </div>
                        </div>
                    )}

                    {/* Kat Edilen Mesafe ve Türü */}
                    {generatedDriveData && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FaRoad className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kat Edilen Mesafe</p>
                                <p className="text-base font-medium text-gray-800">
                                    {generatedDriveData.distance.toFixed(generatedDriveData.distance >= 10 ? 0 : 2)} km
                                    <span className="ml-2 text-sm font-normal text-gray-600">({generatedDriveData.tripType})</span>
                                </p>
                            </div>
                        </div>
                    )}

                     {/* Trafik Yoğunluğu */}
                    {generatedDrivingConditions && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full">
                                <FaTrafficLight className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Trafik Yoğunluğu</p>
                                <p className="text-base font-medium text-gray-800">{generatedDrivingConditions.trafficDensity}</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
          )}

          {/* Harita Şeması - React-Leaflet Entegrasyonu */}
          {(generatedDriveData || generatedDrivingConditions) && initialMapPosition && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
             >
                 {/* Render the dynamically imported map component, pass initial position and drive data */}
                 <AnalysisMap initialPosition={initialMapPosition} generatedDriveData={generatedDriveData} />
             </motion.div>
          )}

          {/* Analizi Görüntüle Butonu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 border-t border-gray-100"
          >
            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (driveId) {
                    window.location.href = `/analysis/performance?driveId=${driveId}`;
                  } else {
                    // Optionally, handle the case where driveId is not available
                    console.error('Drive ID not found!');
                    // Or redirect to upload page if no drive data is loaded
                    // window.location.href = '/upload';
                  }
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <FaChartLine className="h-5 w-5" />
                <span>Analizi Görüntüle</span>
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
} 