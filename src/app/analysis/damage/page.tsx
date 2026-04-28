'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDriveData, DriveData } from '@/app/utils/performanceCalculations';
import { calculateDamageScores, DamageScores } from '@/app/utils/damageCalculations';
import CarSkeleton from '@/app/components/CarSkeleton';

export default function DamageAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [driveData, setDriveData] = useState<DriveData | null>(null);
  const [damageScores, setDamageScores] = useState<DamageScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const driveId = searchParams.get('driveId');
        
        if (!driveId) {
          router.replace('/upload');
          return;
        }

        const savedData = getDriveData(driveId);
        if (savedData) {
          setDriveData(savedData);
          const calculatedDamage = calculateDamageScores(savedData);
          setDamageScores(calculatedDamage);
          setLoading(false);
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

  const displayScore = (score: number) => Math.max(0, score - 17);

  const getDamageStatus = (score: number) => {
    if (score >= 80) return { text: 'İyi', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { text: 'Orta', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Kritik', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Hasar Analizi</h1>
          <p className="text-gray-600">Sürüş ID: {searchParams.get('driveId')}</p>
        </div>

        {/* Araç İskelet Modeli */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Araç Durumu Görselleştirmesi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Araç parçalarının üzerine gelerek detaylı hasar bilgilerini görüntüleyebilirsiniz.
          </p>
          <CarSkeleton damageScores={damageScores} />
        </div>

        {/* Detaylı Hasar Raporu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Motor Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Motor Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-blue-600" 
                    style={{ width: `${displayScore(damageScores.engine)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Motor Sağlığı: {displayScore(damageScores.engine)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.engine)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.engine)).color}`}>
                  {getDamageStatus(displayScore(damageScores.engine)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Şanzıman Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Şanzıman Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-green-600" 
                    style={{ width: `${displayScore(damageScores.transmission)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Şanzıman Sağlığı: {displayScore(damageScores.transmission)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.transmission)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.transmission)).color}`}>
                  {getDamageStatus(displayScore(damageScores.transmission)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Fren Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fren Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-red-600" 
                    style={{ width: `${displayScore(damageScores.brakes)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Fren Sağlığı: {displayScore(damageScores.brakes)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.brakes)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.brakes)).color}`}>
                  {getDamageStatus(displayScore(damageScores.brakes)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Lastik Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lastik Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-yellow-600" 
                    style={{ width: `${displayScore(damageScores.tires)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Lastik Sağlığı: {displayScore(damageScores.tires)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.tires)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.tires)).color}`}>
                  {getDamageStatus(displayScore(damageScores.tires)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Süspansiyon Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Süspansiyon Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-purple-600" 
                    style={{ width: `${displayScore(damageScores.suspension)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Süspansiyon Sağlığı: {displayScore(damageScores.suspension)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.suspension)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.suspension)).color}`}>
                  {getDamageStatus(displayScore(damageScores.suspension)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Direksiyon Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Direksiyon Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-indigo-600" 
                    style={{ width: `${displayScore(damageScores.steering)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Direksiyon Sağlığı: {displayScore(damageScores.steering)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.steering)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.steering)).color}`}>
                  {getDamageStatus(displayScore(damageScores.steering)).text}
                </span>
              </div>
            </div>
          </div>

          {/* Debriyaj Durumu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Debriyaj Durumu</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full bg-pink-600" 
                    style={{ width: `${displayScore(damageScores.clutch)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Debriyaj Sağlığı: {displayScore(damageScores.clutch)}%</p>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full ${getDamageStatus(displayScore(damageScores.clutch)).bg}`}>
                <span className={`text-sm font-medium ${getDamageStatus(displayScore(damageScores.clutch)).color}`}>
                  {getDamageStatus(displayScore(damageScores.clutch)).text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Öneriler Bölümü */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Öneriler</h2>
          <ul className="space-y-2">
            {/* Motor */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.engine) < 60 ? 'text-red-500' : displayScore(damageScores.engine) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.engine) < 60 && 'Motor performansında ciddi düşüş tespit edildi. Acil bakım önerilir.'}
                {displayScore(damageScores.engine) >= 60 && displayScore(damageScores.engine) < 80 && 'Motor performansında düşüş gözlemlendi. Düzenli bakım yaptırmanız önerilir.'}
                {displayScore(damageScores.engine) >= 80 && 'Motorun sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Şanzıman */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.transmission) < 60 ? 'text-red-500' : displayScore(damageScores.transmission) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.transmission) < 60 && 'Şanzıman sisteminde ciddi sorunlar tespit edildi. Servis kontrolü önerilir.'}
                {displayScore(damageScores.transmission) >= 60 && displayScore(damageScores.transmission) < 80 && 'Şanzıman sisteminde hafif sorunlar tespit edildi. Kontrol edilmesi önerilir.'}
                {displayScore(damageScores.transmission) >= 80 && 'Şanzımanın sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Frenler */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.brakes) < 60 ? 'text-red-500' : displayScore(damageScores.brakes) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.brakes) < 60 && 'Fren sisteminizde ciddi bir hasar tespit edildi. En kısa sürede servise gitmeniz önerilir.'}
                {displayScore(damageScores.brakes) >= 60 && displayScore(damageScores.brakes) < 80 && 'Fren sisteminde aşınma tespit edildi. Balatalarınızı kontrol ettiriniz.'}
                {displayScore(damageScores.brakes) >= 80 && 'Frenlerin sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Lastikler */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.tires) < 60 ? 'text-red-500' : displayScore(damageScores.tires) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.tires) < 60 && 'Lastiklerinizde ciddi aşınma tespit edildi. Değişim veya bakım önerilir.'}
                {displayScore(damageScores.tires) >= 60 && displayScore(damageScores.tires) < 80 && 'Lastiklerde hafif aşınma tespit edildi. Basınç ve diş derinliği kontrol edilmeli.'}
                {displayScore(damageScores.tires) >= 80 && 'Lastiklerin sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Süspansiyon */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.suspension) < 60 ? 'text-red-500' : displayScore(damageScores.suspension) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.suspension) < 60 && 'Süspansiyon sisteminde ciddi sorunlar tespit edildi. Servis kontrolü önerilir.'}
                {displayScore(damageScores.suspension) >= 60 && displayScore(damageScores.suspension) < 80 && 'Süspansiyon sisteminde hafif aşınma tespit edildi. Kontrol edilmesi önerilir.'}
                {displayScore(damageScores.suspension) >= 80 && 'Süspansiyonun sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Direksiyon */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.steering) < 60 ? 'text-red-500' : displayScore(damageScores.steering) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.steering) < 60 && 'Direksiyon sisteminde ciddi sorunlar tespit edildi. Servis kontrolü önerilir.'}
                {displayScore(damageScores.steering) >= 60 && displayScore(damageScores.steering) < 80 && 'Direksiyon sisteminde hafif sorunlar tespit edildi. Kontrol edilmesi önerilir.'}
                {displayScore(damageScores.steering) >= 80 && 'Direksiyonun sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
            {/* Debriyaj */}
            <li className="flex items-start">
              <span className={`mr-2 ${displayScore(damageScores.clutch) < 60 ? 'text-red-500' : displayScore(damageScores.clutch) < 80 ? 'text-yellow-500' : 'text-green-500'}`}>•</span>
              <span className="text-gray-700">
                {displayScore(damageScores.clutch) < 60 && 'Debriyaj sisteminde ciddi sorunlar tespit edildi. Servis kontrolü önerilir.'}
                {displayScore(damageScores.clutch) >= 60 && displayScore(damageScores.clutch) < 80 && 'Debriyajda hafif aşınma tespit edildi. Kontrol edilmesi önerilir.'}
                {displayScore(damageScores.clutch) >= 80 && 'Debriyajın sağlığı gayet iyi, zarar görmedi.'}
              </span>
            </li>
          </ul>
        </div>

        {/* Sonraki Sayfa Butonu */}
        <div className="flex justify-center mt-8 mb-8">
          {searchParams.get('driveId') && (
            <div className="mt-6">
              <button
                onClick={() => router.push(`/analysis/finalscreen?driveId=${searchParams.get('driveId')}`)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Sürüş Analizini Tamamla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 