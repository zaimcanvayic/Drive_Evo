"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Marka ve model verileri
const carData = {
  'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Twingo', 'Austral'],
  'Fiat': ['500', 'Punto', 'Egea', 'Doblo', 'Panda', 'Egea Cross', '600'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'T-Roc'],
  'Opel': ['Corsa', 'Astra', 'Mokka', 'Insignia', 'Crossland'],
  'Hyundai': ['i20', 'i30', 'Tucson', 'Santa Fe', 'Kona', 'Bayon'],
  'Ford': ['Focus', 'Fiesta', 'Kuga', 'Mustang', 'Mustang Mach-E','Mustang Shelby GT500', 'Puma', 'Transit'],
  'Toyota': ['Corolla', 'C-HR', 'Supra', 'RAV4', 'Yaris', 'Hilux'],
  'Peugeot': ['208', '308', '3008', '508', '2008'],
  'Honda': ['Civic', 'CR-V', 'HR-V', 'Jazz', 'Accord'],
  'Porsche': ['911', '718', 'Taycan', 'Macan', 'Cayenne', 'Panamera'],
  'Dacia': ['Duster', 'Sandero', 'Logan', 'Jogger', 'Spring'],
  'BMW': ['3 Serisi', '5 Serisi', 'X3', 'X5', '1 Serisi'],
  'Audi': ['A3', 'A4', 'A6', 'Q5','Coupe', 'Q3'],
  'Mercedes-Benz': ['C Serisi', 'E Serisi', 'A Serisi', 'GLC', 'CLA'],
  'Skoda': ['Octavia', 'Fabia', 'Kodiaq', 'Superb', 'Karoq'],
  'Nissan': ['Qashqai', 'Juke','GTR', 'Leaf', 'Ariya', 'Qashqai Cross', 'Qashqai e-Power'],
  'Volvo': ['XC60', 'XC90', 'S90', 'S60', 'XC40', 'V60']
};

const fuelTypes = ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'];

export default function VehicleInfoPage() {
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [carImage, setCarImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Marka değiştiğinde modelleri güncelle
  useEffect(() => {
    if (brand) {
      setAvailableModels(carData[brand as keyof typeof carData] || []);
      setModel(''); // Model seçimini sıfırla
    } else {
      setAvailableModels([]);
    }
    setCarImage(null); // Fotoğrafı sıfırla
  }, [brand]);

  // Marka, model veya yıl değiştiğinde fotoğrafı güncelle
  useEffect(() => {
    if (brand && model && year && year.length === 4) {
      fetchCarImage();
    } else {
      setCarImage(null);
    }
  }, [brand, model, year]);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrand(e.target.value);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sadece sayı girişine izin ver
    if (/^\d*$/.test(value)) {
      setYear(value);
    }
  };

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Sadece sayı girişine izin ver
    if (/^\d*$/.test(value)) {
      setMileage(value);
    }
  };

  const handleFuelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFuelType(e.target.value);
  };

  const fetchCarImage = async () => {
    if (!brand || !model || !year || year.length !== 4) return;

    setLoading(true);
    setCarImage(null);
    try {
      const query = `${brand} ${model} ${year} car`;
      const response = await fetch(`/api/car-image?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setCarImage(data.imageUrl);
      } else {
        setCarImage(null);
      }
    } catch (error) {
      console.error('Arac fotografi alinamadi:', error);
      setCarImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brand && model && year && year.length === 4 && mileage && fuelType) {
      // Seçilen araç bilgilerini localStorage'a kaydet
      const selectedVehicle = {
        brand: brand,
        model: model,
        year: year,
        mileage: mileage,
        fuelType: fuelType,
        image: carImage // API'den gelen görsel URL'i
      };
      localStorage.setItem('selectedVehicle', JSON.stringify(selectedVehicle));

      // Yönlendirme yap
      router.push('/upload');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Araç Bilgilerinizi Girin
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Lütfen aracınızın bilgilerini girin
          </p>
        </div>

        <div className="mt-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <div className="space-y-4">
                {/* Marka */}
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    Marka
                  </label>
                  <select
                    id="brand"
                    value={brand}
                    onChange={handleBrandChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">Marka Seçin</option>
                    {Object.keys(carData).map((brandKey) => (
                      <option key={brandKey} value={brandKey}>
                        {brandKey}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={handleModelChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                    disabled={!brand || availableModels.length === 0}
                  >
                    <option value="">Model Seçin</option>
                    {availableModels.map((modelName) => (
                      <option key={modelName} value={modelName}>
                        {modelName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yıl */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Yıl
                  </label>
                  <input
                    type="text"
                    id="year"
                    value={year}
                    onChange={handleYearChange}
                    placeholder="Örn: 2020"
                    maxLength={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Kilometre */}
                <div>
                  <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
                    Kilometre
                  </label>
                  <input
                    type="text"
                    id="mileage"
                    value={mileage}
                    onChange={handleMileageChange}
                    placeholder="Örn: 50000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Yakıt Tipi */}
                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700">
                    Yakıt Tipi
                  </label>
                  <select
                    id="fuelType"
                    value={fuelType}
                    onChange={handleFuelTypeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">Yakıt Tipi Seçin</option>
                    {fuelTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!brand || !model || !year || year.length !== 4 || !mileage || !fuelType}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      brand && model && year && year.length === 4 && mileage && fuelType
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    Devam Et
                  </button>
                </div>
              </div>
            </div>

            {/* Fotoğraf Alanı */}
            <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center" style={{ minHeight: '260px' }}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent" />
                    <p className="text-sm text-gray-500">Araç fotoğrafı aranıyor...</p>
                  </div>
                ) : carImage ? (
                  <img
                    src={carImage}
                    alt={`${brand} ${model} ${year}`}
                    className="object-contain rounded-xl w-full"
                    style={{ maxHeight: '320px' }}
                    onError={() => setCarImage(null)}
                  />
                ) : brand && model && year && year.length === 4 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                      <circle cx="7.5" cy="14.5" r="1.5"/>
                      <circle cx="16.5" cy="14.5" r="1.5"/>
                    </svg>
                    <p className="text-gray-400 text-sm">{brand} {model} {year}<br/>fotoğrafı bulunamadı</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                      <circle cx="7.5" cy="14.5" r="1.5"/>
                      <circle cx="16.5" cy="14.5" r="1.5"/>
                    </svg>
                    <p className="text-gray-400 text-sm">Marka, model ve yıl<br/>seçince fotoğraf görünür</p>
                  </div>
                )}
              </div>
              {brand && model && year && year.length === 4 && !loading && (
                <p className="mt-3 text-xs text-gray-400 text-center">{brand} {model} &middot; {year}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 