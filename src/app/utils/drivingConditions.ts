// Define type for Driving Conditions data
export interface DrivingConditions {
  roadCondition: string;
  weatherCondition: string;
  trafficDensity: string;
}

// Rastgele sürüş koşulları üreten fonksiyon
export const generateDrivingConditions = (): DrivingConditions => {
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