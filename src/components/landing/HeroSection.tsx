'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaCar, FaChartLine, FaRoad } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const rotatingTexts = [
  "Arabanızı ne kadar iyi kullanıyorsunuz!",
  "Sanayiye bayram mı ettiriyorsunuz?",
  "Sürüşünüzü İleriye Taşıyın: Aracınızı Daha Verimli, Güvenli ve Uzun Ömürlü Kullanın!",
  "Sanayi yemeğinden sıkıldınız mı?",
  "Vites Geçişlerinizden Lastik Basıncınıza Kadar Her Detayı İnceliyoruz: Daha Ekonomik ve Güvenli Sürüş İçin Hazır mısınız?",
  "Elazığ yollarında bile sürüşünüzü iyileştiriyoruz!",
  "Sürüş Alışkanlıklarınızı Analiz Ediyoruz: Hem Yakıt Tasarrufu Sağlayın Hem Aracınızın Ömrünü Uzatın!",
  "Yolculuklarınızda Fark Yaratın: Verimli Sürüş Teknikleri ile Daha Az Yıpranma, Daha Yüksek Performans!",
  "Her Vites Geçişi, Her Fren Mesafesi Önemlidir: Aracınızı Daha Uzun Süre Sağlıklı Kullanmak İçin İpuçları ve Analizler.",
  "Sürüşünüzü Optimize Edin: Aracınızın Performansını Zirveye Taşıyın ve Maliyetlerinizi Azaltın!",
  "Usta: Abinize bir yemek söyleyin mi dedi?",
  "Daha Güvenli ve Verimli Sürüş İçin Her Detayı Analiz Ediyoruz: Hem Size Hem Aracınıza Yarar Sağlayın!",
  "Sürüşünüzü Akıllıca Yapın: Küçük Değişikliklerle Büyük Farklar Yaratın – Hem Cebinize Hem Aracınıza!",
  "Sürüş Alışkanlıklarınız Aracınızın Ömrünü Belirler: Daha İyi Bir Sürüşle Her Yolculukta Kazanabilirsiniz!",
  "Aracınızı Daha Uzun Süre Sorunsuz Kullanın: Sürüş Alışkanlıklarınızı İnceliyoruz ve İyileştirmeniz İçin Yollar Sunuyoruz!",
  "Motoru bağırtanlardan mısınız",
  "Arabayı sattırmayan yokuşlar mı var?",
  "Kırmızı ışıkta son saniye geçenlerden misiniz?",
  "Vites geçişleriniz bazen arabanızı ağlatıyor mu?",
  "Lastik yakmadan duramıyor musunuz? :)"
];

export default function HeroSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const handleStartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      router.push('/auth/login');
    } else {
      router.push('/vehicle-info');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-red-50 to-white flex items-center justify-center">
      {/* Video background covering the entire section */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/car-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="lg:flex lg:items-center lg:justify-between">
          {/* Left side content (text and buttons) - Keep original styles */}
          <div className="lg:w-1/2 lg:pr-8 text-center lg:text-left mb-12 lg:mb-0">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
            >
              <span className="block xl:inline">Sürüşünüzü</span>{' '
              }<span className="block text-red-600 xl:inline">Analiz Edin</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 text-base text-white sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
            >
              Manuel vitesli araçlar için geliştirilmiş yapay zeka destekli sürüş analiz sistemi.
              Performansınızı ölçün, gelişin.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
            >
              <div className="rounded-md shadow">
                <button
                  onClick={handleStartClick}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 md:py-4 md:text-lg md:px-10"
                >
                  Hemen Başla
                </button>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <Link
                  href="#features"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 md:py-4 md:text-lg md:px-10"
                >
                  Daha Fazla Bilgi
                </Link>
              </div>
            </motion.div>
          </div>
          {/* Right side with rotating text */}
          <div className="lg:w-1/2 lg:pl-8 flex items-center justify-center">
            <div className="text-center lg:text-left max-w-md">
              <AnimatePresence mode="wait">
                <motion.p
                  key={index} // Metin değiştiğinde animasyonu tetikler
                  initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="mt-3 text-xl text-yellow-300 sm:mt-5 sm:text-2xl md:mt-5 md:text-3xl font-bold font-sans"
                >
                  {rotatingTexts[index]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 