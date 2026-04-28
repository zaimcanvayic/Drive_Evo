'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CircularProgress } from '@/components/CircularProgress';

interface Ride {
  id: string;
  startTime: string;
  score: number;
  categoryScores: {
    gearShifting: number;
    rpmControl: number;
    drivingStyle: number;
    abnormalConditions: number;
    fuelEfficiency: number;
  };
}

export default function RidesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // localStorage'dan sürüş verilerini al
    const loadRides = () => {
      try {
        const rideKeys = Object.keys(localStorage).filter(key => key.startsWith('ride_'));
        const rideData = rideKeys.map(key => {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          return {
            id: data.id,
            startTime: data.startTime,
            score: data.score,
            categoryScores: data.categoryScores
          };
        });

        // Tarihe göre sırala (en yeniden en eskiye)
        rideData.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        
        setRides(rideData);
        console.log('Sürüşler yüklendi:', rideData);
      } catch (error) {
        console.error('Sürüş verileri yüklenirken hata:', error);
        setError('Sürüş verileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();
  }, [status, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreColor = (score: number): string => {
    if (score < 40) return '#ef4444'; // Kırmızı
    if (score < 70) return '#f59e0b'; // Turuncu
    return '#22c55e'; // Yeşil
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-red-700 mb-8">Sürüş Geçmişi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-red-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black">
                    {formatDate(ride.startTime)}
                  </h3>
                </div>
                <div className="ml-4">
                  <CircularProgress
                    value={ride.score}
                    percentage={ride.score}
                    size={80}
                    strokeWidth={8}
                    color={getScoreColor(ride.score)}
                    showValue={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {rides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Henüz kayıtlı sürüş bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
} 