'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaUser, FaEnvelope, FaCar, FaChartLine, FaTrophy, FaClock } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface ChartData {
  surusNo: string;
  puan: number;
  date: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else {
      // Rides verilerini localStorage'dan al
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
        } finally {
          setLoading(false);
        }
      };

      loadRides();
    }
  }, [status, router]);

  // Toplam sürüş sayısı
  const totalRides = rides.length;

  // Ortalama puan hesaplama
  const averageScore = rides.length > 0
    ? Math.round(rides.reduce((sum, ride) => sum + ride.score, 0) / rides.length)
    : 0;

  // Grafik için veri hazırlama
  const chartData: ChartData[] = rides.slice(0, 10).reverse().map((ride, index) => ({
    surusNo: `Sürüş ${index + 1}`,
    puan: ride.score,
    date: new Date(ride.startTime).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit'
    })
  }));

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profil Kartı */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-700 to-black px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full">
                <FaUser className="h-8 w-8 text-red-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{session?.user?.name}</h1>
                <p className="text-red-200 flex items-center">
                  <FaEnvelope className="mr-2" />
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Toplam Sürüş Kartı */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Toplam Sürüş</p>
                <p className="text-3xl font-bold text-black">{totalRides}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaCar className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </div>

          {/* Ortalama Puan Kartı */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ortalama Puan</p>
                <p className="text-3xl font-bold text-black">{averageScore}</p>
              </div>
              <div className="bg-black p-3 rounded-full">
                <FaChartLine className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>

          {/* En Yüksek Puan Kartı */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">En Yüksek Puan</p>
                <p className="text-3xl font-bold text-black">
                  {rides.length > 0 ? Math.max(...rides.map(ride => ride.score)) : 0}
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <FaTrophy className="h-6 w-6 text-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Son Sürüşler ve Grafik */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
            <FaClock className="mr-2 text-red-700" />
            Son 10 Sürüş
          </h2>
          
          {/* Sürüş Listesi */}
          <div className="space-y-4 mb-8">
            {rides.slice(0, 10).map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-red-50">
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(ride.startTime).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-black">Puan</p>
                    <p className="text-lg font-bold text-red-700">{ride.score}</p>
                  </div>
                </div>
              </div>
            ))}
            {rides.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz sürüş kaydı bulunmuyor.</p>
            )}
          </div>

          {/* Puan Grafiği */}
          {rides.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-black mb-4">Son 10 Sürüş Puan Değişimi</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="surusNo" 
                      type="category"
                      tick={{ fontSize: 12, fill: '#b91c1c' }}
                      label={{ value: 'Sürüş Sırası', position: 'insideBottom', offset: -5, fill: '#b91c1c' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#111' }}
                      label={{ value: 'Puan', angle: -90, position: 'insideLeft', fill: '#b91c1c' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#b91c1c', color: '#b91c1c' }}
                      formatter={(value: number) => [`${value} puan`, 'Puan']}
                      labelFormatter={(label: string) => label}
                    />
                    <Bar dataKey="puan" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 