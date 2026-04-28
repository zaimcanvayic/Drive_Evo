'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDriveData, DriveData, calculateRPMControlScore, calculateFuelEfficiencyScore } from '@/app/utils/performanceCalculations';
import { calculateDamageScores, DamageScores } from '@/app/utils/damageCalculations';
import { motion, AnimatePresence } from 'framer-motion';

// Hava durumu emojileri
const weatherEmojis = {
  'Güneşli': '☀️',
  'Bulutlu': '☁️',
  'Yağmurlu': '🌧️',
  'Karlı': '❄️',
  'Sisli': '🌫️',
  'Rüzgarlı': '💨'
};

// Yol durumu emojileri
const roadEmojis = {
  'Kuru Asfalt': '🛣️',
  'Islak Asfalt': '🌊',
  'Toprak Yol': '🏔️',
  'Buzlu/Karlı': '🧊'
};

// Vites kullanımı emojileri
const gearEmojis = {
  'gear': '⚙️',
  'steering': '🚗',
  'pedal': '🦶',
  'speed': '💨'
};

// Yakıt emojileri
const fuelEmojis = {
  'fuel': '⛽',
  'gas': '🛢️',
  'eco': '🌱',
  'money': '💰'
};

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

export default function FinalScreenPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [driveData, setDriveData] = useState<DriveData | null>(null);
  const [damageScores, setDamageScores] = useState<DamageScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFirstMessage, setShowFirstMessage] = useState(false);
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [showThirdMessage, setShowThirdMessage] = useState(false);
  const [showFourthMessage, setShowFourthMessage] = useState(false);
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [trafficDensity, setTrafficDensity] = useState<string>('normal');
  const [roadCondition, setRoadCondition] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [rpmScore, setRpmScore] = useState<number>(0);
  const [fuelScore, setFuelScore] = useState<number>(0);
  const [showScoreEvaluation, setShowScoreEvaluation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Emoji animasyonu için state
  const [emojiPosition, setEmojiPosition] = useState(0);
  const [gearEmojiPosition, setGearEmojiPosition] = useState(0);
  const [fuelEmojiPosition, setFuelEmojiPosition] = useState(0);

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (showFirstMessage) {
      setShowFirstMessage(false);
      setTimeout(() => {
        setShowSecondMessage(true);
        setIsTransitioning(false);
      }, 2000);
    } else if (showSecondMessage) {
      setShowSecondMessage(false);
      setTimeout(() => {
        setShowThirdMessage(true);
        setIsTransitioning(false);
      }, 2000);
    } else if (showThirdMessage) {
      setShowThirdMessage(false);
      setTimeout(() => {
        setShowFourthMessage(true);
        setIsTransitioning(false);
      }, 2000);
    } else if (showFourthMessage) {
      setShowFourthMessage(false);
      setTimeout(() => {
        setShowFinalScreen(true);
        setIsTransitioning(false);
      }, 2000);
    }
  };

  // Emoji animasyonunu başlat
  useEffect(() => {
    if (showSecondMessage) {
      const interval = setInterval(() => {
        setEmojiPosition(prev => (prev + 1) % 100);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [showSecondMessage]);

  // Devir kontrolü puanını hesapla
  useEffect(() => {
    if (driveData) {
      const score = calculateRPMControlScore(driveData.rpmControl);
      setRpmScore(score);
    }
  }, [driveData]);

  // Yakıt verimliliği puanını hesapla
  useEffect(() => {
    if (driveData) {
      const score = calculateFuelEfficiencyScore(driveData.fuelEfficiency);
      setFuelScore(score);
    }
  }, [driveData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const driveId = searchParams.get('driveId');
        
        if (!driveId) {
          router.replace('/upload');
          return;
        }

        const uploadCompletionData = localStorage.getItem('uploadCompletionData');
        if (uploadCompletionData) {
          const { drivingConditions } = JSON.parse(uploadCompletionData) as UploadCompletionData;
          setTrafficDensity(drivingConditions.trafficDensity);
          setRoadCondition(drivingConditions.roadCondition);
          setWeatherCondition(drivingConditions.weatherCondition);
        }

        const savedData = getDriveData(driveId);
        if (savedData) {
          setDriveData(savedData);
          const calculatedDamage = calculateDamageScores(savedData);
          setDamageScores(calculatedDamage);
          setLoading(false);
          
          // İlk mesajı göster
          setTimeout(() => {
            setShowFirstMessage(true);
          }, 1000);
        } else {
          setError('Sürüş verisi bulunamadı');
          setLoading(false);
        }
      } catch (error) {
        setError('Veri yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, router]);

  // Üçüncü mesaj için değerlendirme metnini belirle
  const getScoreEvaluation = () => {
    if (rpmScore < 50) {
      return { text: "kötüydü", color: "text-red-500" };
    } else if (rpmScore < 70) {
      return { text: "geliştirilebilir", color: "text-yellow-500" };
    } else if (rpmScore < 80) {
      return { text: "fena değil", color: "text-yellow-500" };
    } else {
      return { text: "iyiydi", color: "text-green-500" };
    }
  };

  // Vites emoji animasyonunu başlat
  useEffect(() => {
    if (showThirdMessage) {
      const interval = setInterval(() => {
        setGearEmojiPosition(prev => (prev + 1) % 100);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [showThirdMessage]);

  // Yakıt değerlendirmesi için yardımcı fonksiyon
  const getFuelEvaluation = () => {
    if (fuelScore < 50) {
      return { text: "kötüydü", color: "text-red-500" };
    } else if (fuelScore < 70) {
      return { text: "geliştirilebilir", color: "text-yellow-500" };
    } else if (fuelScore < 80) {
      return { text: "fena değil", color: "text-yellow-500" };
    } else {
      return { text: "iyiydi", color: "text-green-500" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Veriler yükleniyor...</p>
      </div>
    );
  }

  if (!driveData || !damageScores) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {showFirstMessage && (
          <motion.div
            key="first"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 flex items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-white text-2xl font-medium text-center px-4"
            >
              Bu sürüşte, <span className="text-red-500">{trafficDensity}</span> yoğunluktaki trafikle yola çıktınız...
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleNext}
              disabled={isTransitioning}
              className={`absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {showSecondMessage && (
          <motion.div
            key="second"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-white text-2xl font-medium text-center px-4 mb-8"
            >
              <span className="text-red-500">{roadCondition}</span> ve <span className="text-red-500">{weatherCondition}</span> hava sizi hiç zorlamadı...
            </motion.p>

            {/* Emoji animasyonu */}
            <div className="relative w-64 h-16 overflow-hidden">
              <motion.div
                className="absolute whitespace-nowrap"
                animate={{ x: -emojiPosition * 10 }}
                transition={{ duration: 0.5, ease: "linear" }}
              >
                <span className="text-4xl mx-4">{roadEmojis[roadCondition as keyof typeof roadEmojis]}</span>
                <span className="text-4xl mx-4">{weatherEmojis[weatherCondition as keyof typeof weatherEmojis]}</span>
                <span className="text-4xl mx-4">{roadEmojis[roadCondition as keyof typeof roadEmojis]}</span>
                <span className="text-4xl mx-4">{weatherEmojis[weatherCondition as keyof typeof weatherEmojis]}</span>
                <span className="text-4xl mx-4">{roadEmojis[roadCondition as keyof typeof roadEmojis]}</span>
                <span className="text-4xl mx-4">{weatherEmojis[weatherCondition as keyof typeof weatherEmojis]}</span>
              </motion.div>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleNext}
              disabled={isTransitioning}
              className={`absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {showThirdMessage && (
          <motion.div
            key="third"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-white text-2xl font-medium text-center px-4"
            >
              Vites kullanımın <span className="text-red-500">{rpmScore.toFixed(0)}</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 1 }}
              className={`text-2xl font-medium text-center px-4 mt-4 ${getScoreEvaluation().color}`}
            >
              {getScoreEvaluation().text}
            </motion.p>

            {/* Vites emoji animasyonu */}
            <div className="relative w-64 h-16 overflow-hidden mt-8">
              <motion.div
                className="absolute whitespace-nowrap"
                animate={{ x: -gearEmojiPosition * 10 }}
                transition={{ duration: 0.5, ease: "linear" }}
              >
                <span className="text-4xl mx-4">{gearEmojis.gear}</span>
                <span className="text-4xl mx-4">{gearEmojis.steering}</span>
                <span className="text-4xl mx-4">{gearEmojis.pedal}</span>
                <span className="text-4xl mx-4">{gearEmojis.speed}</span>
                <span className="text-4xl mx-4">{gearEmojis.gear}</span>
                <span className="text-4xl mx-4">{gearEmojis.steering}</span>
                <span className="text-4xl mx-4">{gearEmojis.pedal}</span>
                <span className="text-4xl mx-4">{gearEmojis.speed}</span>
              </motion.div>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleNext}
              disabled={isTransitioning}
              className={`absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {showFourthMessage && (
          <motion.div
            key="fourth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-white text-2xl font-medium text-center px-4"
            >
              Yakıt kullanımın <span className="text-red-500">{fuelScore.toFixed(0)}</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, delay: 1 }}
              className={`text-2xl font-medium text-center px-4 mt-4 ${getFuelEvaluation().color}`}
            >
              {getFuelEvaluation().text}
            </motion.p>

            {/* Yakıt emoji animasyonu */}
            <div className="relative w-64 h-16 overflow-hidden mt-8">
              <motion.div
                className="absolute whitespace-nowrap"
                animate={{ x: -fuelEmojiPosition * 10 }}
                transition={{ duration: 0.5, ease: "linear" }}
              >
                <span className="text-4xl mx-4">{fuelEmojis.fuel}</span>
                <span className="text-4xl mx-4">{fuelEmojis.gas}</span>
                <span className="text-4xl mx-4">{fuelEmojis.eco}</span>
                <span className="text-4xl mx-4">{fuelEmojis.money}</span>
                <span className="text-4xl mx-4">{fuelEmojis.fuel}</span>
                <span className="text-4xl mx-4">{fuelEmojis.gas}</span>
                <span className="text-4xl mx-4">{fuelEmojis.eco}</span>
                <span className="text-4xl mx-4">{fuelEmojis.money}</span>
              </motion.div>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleNext}
              disabled={isTransitioning}
              className={`absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {showFinalScreen && (
          <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-center"
            >
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 mb-8">
                Drive Evo
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="text-gray-400 text-xl mb-12"
              >
                Sürüşünüz analiz edildi
              </motion.p>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('http://localhost:3000')}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Ana Sayfaya Dön
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 