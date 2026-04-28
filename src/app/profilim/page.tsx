'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalDistance: 0,
    averageSpeed: 0,
    totalTime: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profilim</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Kişisel Bilgiler</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ad Soyad</label>
                    <p className="mt-1 text-sm text-gray-900">{session?.user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{session?.user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Sürüş İstatistikleri</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Toplam Sürüş</label>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.totalRides}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Toplam Mesafe</label>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.totalDistance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ortalama Hız</label>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.averageSpeed.toFixed(1)} km/s</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Toplam Süre</label>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">{Math.round(stats.totalTime / 60)} dk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="/gecmis-suruslerim"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Geçmiş Sürüşlerimi Görüntüle
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 