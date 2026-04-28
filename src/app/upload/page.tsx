'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaPlay, FaStop, FaChartLine, FaCar, FaRoad, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { generateDriveId, saveDriveData, DriveData } from '../utils/performanceCalculations';
import { generateDrivingConditions } from '../utils/drivingConditions';

// Define type for the generated drive data structure
interface GeneratedDriveData {
    distance: number;
    driveDuration: { minutes: number; seconds: number };
    tripType: string;
}

// Tip tanımlamaları
interface UploadCompletionData {
    driveStartTime: string;
    generatedDriveData: DriveData;
    driveId: string;
    drivingConditions: {
        roadCondition: string;
        weatherCondition: string;
        trafficDensity: string;
    };
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const simulationStartTime = useRef<number>(0);
  const totalSimulationTime = 8000; // Fixed 8 seconds for the visual simulation
  // State to track the time displayed in the 'Simülasyon süresi' counter
  const [displayedDriveTime, setDisplayedDriveTime] = useState({ minutes: 0, seconds: 0 });
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  // State to hold the generated realistic drive data
  const [generatedRealisticDriveData, setGeneratedRealisticDriveData] = useState<GeneratedDriveData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Read selected vehicle from localStorage on component mount
  useEffect(() => {
    const storedVehicle = localStorage.getItem('selectedVehicle');
    if (storedVehicle) {
      setSelectedVehicle(JSON.parse(storedVehicle));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Simülasyon sürüş verisi üretici (Python backend'e gönderilecek formatta)
  const generateSimulatedDriveData = () => ({
    gearShifting: {
      clutchUsage: {
        averageTime: Math.random() * 2 + 0.5,
        totalTime: Math.floor(Math.random() * 100) + 50,
        longPresses: Math.floor(Math.random() * 5),
      },
      gearSpeedMismatch: {
        lowGearHighSpeed: Math.floor(Math.random() * 5),
        highGearLowSpeed: Math.floor(Math.random() * 5),
        totalMismatchTime: Math.floor(Math.random() * 300),
      },
      stalls: Math.floor(Math.random() * 3),
    },
    rpmControl: {
      averageRPM: Math.floor(Math.random() * 2000) + 1500,
      highRPM: { count: Math.floor(Math.random() * 10), totalTime: Math.floor(Math.random() * 100) },
      lowRPM:  { count: Math.floor(Math.random() * 8),  totalTime: Math.floor(Math.random() * 80) },
      rpmRange: { min: Math.floor(Math.random() * 1000) + 1000, max: Math.floor(Math.random() * 2000) + 2000 },
    },
    drivingStyle: {
      unnecessaryManeuvers: Math.floor(Math.random() * 5),
      wheelLock: Math.floor(Math.random() * 3),
      trafficCompliance: {
        speedLimitExceed: Math.floor(Math.random() * 4),
        redLightViolation: Math.floor(Math.random() * 2),
        stopSignViolation: Math.floor(Math.random() * 2),
        complianceRate: Math.random() * 0.2 + 0.8,
      },
    },
    abnormalConditions: {
      handbrakeMistake: Math.floor(Math.random() * 2),
      wrongGearStart: Math.floor(Math.random() * 3),
      suddenBraking: Math.floor(Math.random() * 5),
      suddenAcceleration: Math.floor(Math.random() * 5),
    },
    fuelEfficiency: {
      averageConsumption: Math.random() * 5 + 5,
      idleTime: Math.floor(Math.random() * 200) + 50,
      idlePercentage: Math.random() * 0.15 + 0.05,
    },
  });

  // Python backend'e sürüş verisini gönderip puan + sigorta teklifi al
  const analyzeWithBackend = async (rawDriveData: ReturnType<typeof generateSimulatedDriveData>, driveId: string) => {
    try {
      // 1) Sürüş analizi
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rawDriveData, driveId }),
      });
      if (!analyzeRes.ok) throw new Error('Analiz servisi yanıt vermedi');
      const scoreResult = await analyzeRes.json();

      // 2) Sigorta teklifi
      const vehicle = selectedVehicle as any;
      const currentYear = new Date().getFullYear();
      const vehicleYear = vehicle?.year ? parseInt(vehicle.year) : currentYear - 5;
      const insuranceRes = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveId,
          overallScore: scoreResult.overallScore,
          vehicleInfo: {
            brand: vehicle?.brand || 'Bilinmiyor',
            model: vehicle?.model || 'Bilinmiyor',
            year: vehicleYear,
            fuelType: vehicle?.fuelType || 'Benzin',
            annualKm: 15000,
          },
        }),
      });
      if (!insuranceRes.ok) throw new Error('Sigorta servisi yanıt vermedi');
      const insuranceResult = await insuranceRes.json();

      return { scoreResult, insuranceResult };
    } catch (err) {
      console.error('[analyzeWithBackend]', err);
      toast.error('Python backend bağlantı hatası! Backend çalışıyor mu?');
      return null;
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    const rawDriveData = generateSimulatedDriveData();
    const realisticData = generateRealisticDriveData(); // mesafe + süre verisi (analiz sayfası için)
    const newDriveId = generateDriveId();
    saveDriveData(newDriveId, rawDriveData as any);

    const conditions = generateDrivingConditions();
    const backendResult = await analyzeWithBackend(rawDriveData, newDriveId);

    const uploadCompletionData = {
      driveStartTime: new Date().toISOString(),
      generatedDriveData: realisticData,   // ✅ distance/driveDuration/tripType
      driveId: newDriveId,
      drivingConditions: conditions,
      scoreResult: backendResult?.scoreResult || null,
      insuranceResult: backendResult?.insuranceResult || null,
    };
    localStorage.setItem('uploadCompletionData', JSON.stringify(uploadCompletionData));

    setUploadComplete(true);
    setIsUploading(false);
    setTimeout(() => { router.push('/analysis'); }, 1500);
  };

  // Rastgele mesafe ve süre üreten fonksiyon (Upload sayfasına geri taşındı ve güncellendi)
  const generateRealisticDriveData = (): GeneratedDriveData => {
    let distance = 0;
    let durationInSeconds = 0;
    let type = '';

    const rand = Math.random() * 100;

    if (rand < 5) { // %5: 5 metre - 1 km arası çok kısa mesafe
      distance = Math.random() * (1 - 0.005) + 0.005; // 0.005 km = 5 metre
      type = 'Çok Kısa Mesafe';
    } else if (rand < 75) { // %70: 1 km - 10 km arası kısa/normal mesafe
        distance = Math.random() * (10 - 1) + 1;
        if (distance < 3) type = 'Kısa Mesafe';
        else type = 'Normal Mesafe';
    } else if (rand < 90) { // %15: 10 km - 100 km arası orta/uzun mesafe
        distance = Math.random() * (100 - 10) + 10;
        if (distance < 50) type = 'Orta Mesafe';
        else type = 'Uzun Mesafe';
    } else if (rand < 95) { // %5: 100 km - 500 km arası daha uzun mesafe
        distance = Math.random() * (500 - 100) + 100;
        type = 'Çok Uzun Mesafe';
    } else { // Kalan %5: 500 km - 1500 km arası en uzun mesafe
        distance = Math.random() * (1500 - 500) + 500;
        type = 'Ekstra Uzun Mesafe';
    }

    // Süreyi mesafeye göre tutarlı üret (Ortalama hız mesafeye göre değişir, koşullar Analysis sayfasında üretilecek)
    let averageSpeedKmh = 60; // Default average speed (simplified without conditions here)

    if (distance < 1) averageSpeedKmh = Math.random() * (30 - 5) + 5;
    else if (distance < 10) averageSpeedKmh = Math.random() * (70 - 30) + 30;
    else if (distance < 100) averageSpeedKmh = Math.random() * (100 - 60) + 60;
    else averageSpeedKmh = Math.random() * (120 - 80) + 80;

    const durationHours = distance / averageSpeedKmh;
    durationInSeconds = durationHours * 3600;

    // Minimum süre belirleyebiliriz
    if (distance < 1) durationInSeconds = Math.max(durationInSeconds, 30); // Çok kısa mesafeler için min 30 saniye
    else if (distance < 10) durationInSeconds = Math.max(durationInSeconds, 60); // Kısa/Normal mesafeler için min 60 saniye
    else durationInSeconds = Math.max(durationInSeconds, 120); // Diğerleri için min 2 dakika

    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    return { distance, driveDuration: { minutes, seconds }, tripType: type };
  };

  const startSimulation = () => {
    if (!selectedVehicle) {
      toast.error('Lütfen önce bir araç seçin');
      return;
    }

    // Generate the realistic drive data before starting the simulation
    const realisticData = generateRealisticDriveData();
    setGeneratedRealisticDriveData(realisticData);

    setIsSimulating(true);
    setShowAnimation(true);
    setSimulationProgress(0);
    setDisplayedDriveTime({ minutes: 0, seconds: 0 }); // Reset displayed time
    simulationStartTime.current = Date.now();

    const totalRealisticDurationSeconds = realisticData.driveDuration.minutes * 60 + realisticData.driveDuration.seconds;

    const interval = setInterval(() => {
      const elapsedSimulationTime = Date.now() - simulationStartTime.current;
      const progress = Math.min((elapsedSimulationTime / totalSimulationTime) * 100, 100);
      setSimulationProgress(progress);

      // Calculate the displayed drive time by scaling the realistic duration
      const displayedTimeInSeconds = Math.floor((progress / 100) * totalRealisticDurationSeconds);
      const displayedMinutes = Math.floor(displayedTimeInSeconds / 60);
      const displayedSeconds = displayedTimeInSeconds % 60;
      setDisplayedDriveTime({ minutes: displayedMinutes, seconds: displayedSeconds });

      if (progress >= 100) {
        clearInterval(interval);

        const newDriveId = generateDriveId();
        const rawSim = generateSimulatedDriveData();
        saveDriveData(newDriveId, rawSim as any);

        const conditions = generateDrivingConditions();

        // Backend'e gönder (async, ama interval içinde olduğundan fire-and-forget + then)
        analyzeWithBackend(rawSim, newDriveId).then((backendResult) => {
          const uploadCompletionData = {
            driveStartTime: new Date().toISOString(),
            generatedDriveData: realisticData,
            driveId: newDriveId,
            drivingConditions: conditions,
            scoreResult: backendResult?.scoreResult || null,
            insuranceResult: backendResult?.insuranceResult || null,
          };
          localStorage.setItem('uploadCompletionData', JSON.stringify(uploadCompletionData));
          setIsSimulating(false);
          setShowAnimation(false);
          router.push('/analysis');
        });
      }
    }, 50); // Update every 50ms
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setShowAnimation(false);
    // If simulation is stopped, clear the generated data so Analysis page doesn't show incomplete info
    setGeneratedRealisticDriveData(null);
    localStorage.removeItem('uploadCompletionData');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sürüş Analizi</h1>
          <p className="text-lg text-gray-600">
            Sürüş verilerinizi yükleyin ve yapay zeka destekli analiz sistemimiz ile performansınızı ölçün.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Veri Yükleme</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                // Handle file drop
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.json"
              />
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Dosyanızı sürükleyin veya seçmek için tıklayın
              </p>
              <p className="mt-1 text-xs text-gray-500">
                CSV veya JSON formatında sürüş verileri
              </p>
            </div>
          </motion.div>

          {/* Simulation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sürüş Analiz Kaydını Başlat</h2>
              <div className="flex items-center space-x-2">
                <span className={`h-3 w-3 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-sm text-gray-600">{isSimulating ? 'Kayıt Yapılıyor' : 'Hazır'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sanal Sürüş Simülasyonu</span>
                <button
                  onClick={startSimulation}
                  disabled={isSimulating || !selectedVehicle} // Disable if no vehicle selected
                  className={`px-4 py-2 rounded-md text-white ${
                    isSimulating || !selectedVehicle
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isSimulating ? (
                    <span className="flex items-center">
                      <FaStop className="mr-2" /> Durdur
                    </span>
                  ) : (
                     <span className="flex items-center">
                       <FaPlay className="mr-2" /> Sensörü Başlat
                     </span>
                   )}
                </button>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                      {isSimulating ? 'SİMÜLASYON ÇALIŞIYOR' : 'Hazır'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-red-600">
                      {Math.round(simulationProgress)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                  <motion.div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${simulationProgress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
                {isSimulating && generatedRealisticDriveData && (
                   <p className="text-sm text-gray-600 text-center">
                     Simülasyon süresi: {displayedDriveTime.minutes} dakika {displayedDriveTime.seconds} saniye (Toplam: {generatedRealisticDriveData.driveDuration.minutes} dakika {generatedRealisticDriveData.driveDuration.seconds} saniye)
                   </p>
                )}
                 {!isSimulating && !generatedRealisticDriveData && selectedVehicle && (
                     <p className="text-sm text-gray-600 text-center">
                         Analiz başlatmak için 'Sensörü Başlat' butonuna tıklayın.
                     </p>
                 )}
                  {!isSimulating && !selectedVehicle && (
                     <p className="text-sm text-gray-600 text-center text-red-500">
                        Lütfen analiz başlatmak için önce bir araç seçin.
                     </p>
                  )}
              </div>
            </div>

            {/* Animation Section */}
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg"
                >
                  <div className="flex items-center justify-center space-x-6">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-red-500"
                    >
                      <FaCar size={24} />
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-red-400"
                    >
                      <FaChartLine size={24} />
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="text-red-500"
                    >
                      <FaRoad size={24} />
                    </motion.div>
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-800">Sürüş Analizi Yapılıyor</h3>
                    <p className="text-sm text-gray-600 mt-1">Sensör verileri toplanıyor ve analiz ediliyor...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 