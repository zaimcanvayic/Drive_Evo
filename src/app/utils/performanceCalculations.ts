// Tip tanımlamaları
export interface DriveData {
  // Motor verileri
  maxRPM: number;
  avgRPM: number;
  rpmControl: {
    averageRPM: number;
    highRPM: {
      count: number;
      totalTime: number;
    };
    lowRPM: {
      count: number;
      totalTime: number;
    };
    rpmRange: {
      min: number;
      max: number;
    };
  };

  // Hız verileri
  avgSpeed: number;
  maxSpeed: number;
  speedVariation: number;

  // Sürüş davranışı
  hardShifts: number;
  hardBrakes: number;
  hardTurns: number;
  smoothShifts: number;
  smoothBrakes: number;
  smoothTurns: number;

  // Vites kullanımı
  gearShifting: {
    clutchUsage: {
      averageTime: number;
      totalTime: number;
      longPresses: number;
    };
    gearSpeedMismatch: {
      lowGearHighSpeed: number;
      highGearLowSpeed: number;
      totalMismatchTime: number;
    };
    stalls: number;
  };

  // Sürüş tarzı
  drivingStyle: {
    unnecessaryManeuvers: number;
    wheelLock: number;
    trafficCompliance: {
      speedLimitExceed: number;
      redLightViolation: number;
      stopSignViolation: number;
      complianceRate: number;
    };
  };

  // Mesafe ve zaman
  totalDistance: number;
  driveTime: number;
  stopTime: number;

  // Yakıt verileri
  fuelConsumption: number;
  fuelEfficiency: number;

  // Sürüş stili
  aggressiveDriving: number;
  smoothDriving: number;
  ecoDriving: number;

  // Anormal durumlar
  suddenAccelerations: number;
  suddenDecelerations: number;
  sharpTurns: number;
  highSpeedTurns: number;
  highSpeedBraking: number;
  highSpeedAcceleration: number;

  // Araç bilgileri
  vehicleInfo: VehicleInfo;
}

// Normal aralıklar ve ceza puanları
export const NORMAL_RANGES = {
  clutchUsage: { min: 0.5, max: 1.5 }, // saniye
  rpmRange: { min: 2000, max: 2500 }, // RPM
  trafficCompliance: { min: 0.8, max: 1 }, // uyum oranı
  fuelConsumption: { min: 5, max: 7 }, // L/100km
  idlePercentage: { min: 0, max: 0.1 }, // toplam sürenin yüzdesi
};

// Ceza puanları
const PENALTIES = {
  clutchLongPress: 10, // her uzun basma için
  gearMismatch: 2, // saniye başına
  stall: 15, // her stop için
  highRPM: 5, // her 100 RPM sapma için
  lowRPM: 5, // her 100 RPM sapma için
  unnecessaryManeuver: 7, // her manevra için
  wheelLock: 20, // her kilitleme için
  trafficViolation: 10, // her ihlal için
  handbrakeMistake: 25, // her hata için
  wrongGearStart: 20, // her hata için
  suddenBraking: 15, // her ani fren için
  suddenAcceleration: 15, // her ani hızlanma için
  fuelConsumption: 5, // her 0.5 L sapma için
  idleTime: 8, // her %10 için
};

// Vites kullanımı puanı hesaplama
export const calculateGearShiftingScore = (data: DriveData['gearShifting']): number => {
  let score = 100;

  // Debriyaj kullanımı (40%)
  const clutchScore = (() => {
    let clutchPenalty = 0;
    
    // Uzun basma cezası
    clutchPenalty += data.clutchUsage.longPresses * PENALTIES.clutchLongPress;
    
    // Ortalama basma süresi cezası
    if (data.clutchUsage.averageTime > NORMAL_RANGES.clutchUsage.max) {
      clutchPenalty += (data.clutchUsage.averageTime - NORMAL_RANGES.clutchUsage.max) * 5;
    }
    
    return Math.max(0, 100 - clutchPenalty);
  })();

  // Vites-Hız uyumu (40%)
  const gearSpeedScore = (() => {
    let mismatchPenalty = 0;
    
    // Düşük viteste yüksek hız
    mismatchPenalty += data.gearSpeedMismatch.lowGearHighSpeed * PENALTIES.gearMismatch;
    
    // Yüksek viteste düşük hız
    mismatchPenalty += data.gearSpeedMismatch.highGearLowSpeed * PENALTIES.gearMismatch;
    
    // Toplam uyumsuzluk süresi
    mismatchPenalty += (data.gearSpeedMismatch.totalMismatchTime / 60) * PENALTIES.gearMismatch;
    
    return Math.max(0, 100 - mismatchPenalty);
  })();

  // Stop sayısı (20%)
  const stallScore = Math.max(0, 100 - (data.stalls * PENALTIES.stall));

  // Ağırlıklı ortalama
  return (clutchScore * 0.4) + (gearSpeedScore * 0.4) + (stallScore * 0.2);
};

// Devir kontrolü puanı hesaplama
export const calculateRPMControlScore = (data: DriveData['rpmControl']): number => {
  let score = 100;

  // Yüksek devir (50%)
  const highRPMPenalty = (() => {
    let penalty = 0;
    
    // 3000+ devir sayısı
    penalty += data.highRPM.count * 5;
    
    // Toplam yüksek devir süresi
    penalty += (data.highRPM.totalTime / 60) * 3;
    
    return penalty;
  })();

  // Düşük devir (50%)
  const lowRPMPenalty = (() => {
    let penalty = 0;
    
    // 1500- devir sayısı
    penalty += data.lowRPM.count * 5;
    
    // Toplam düşük devir süresi
    penalty += (data.lowRPM.totalTime / 60) * 3;
    
    return penalty;
  })();

  // Ağırlıklı ortalama
  return Math.max(0, 100 - ((highRPMPenalty * 0.5) + (lowRPMPenalty * 0.5)));
};

// Sürüş tarzı puanı hesaplama
export const calculateDrivingStyleScore = (data: DriveData['drivingStyle']): number => {
  let score = 100;

  // Gereksiz manevralar (40%)
  score -= data.unnecessaryManeuvers * PENALTIES.unnecessaryManeuver;

  // Teker kilitleme (30%)
  score -= data.wheelLock * PENALTIES.wheelLock;

  // Trafik uyumu (30%)
  const trafficPenalty = (() => {
    let penalty = 0;
    
    // Hız limiti aşımı
    penalty += data.trafficCompliance.speedLimitExceed * PENALTIES.trafficViolation;
    
    // Kırmızı ışık ihlali
    penalty += data.trafficCompliance.redLightViolation * PENALTIES.trafficViolation;
    
    // Dur işareti ihlali
    penalty += data.trafficCompliance.stopSignViolation * PENALTIES.trafficViolation;
    
    // Genel uyum oranı
    if (data.trafficCompliance.complianceRate < NORMAL_RANGES.trafficCompliance.min) {
      penalty += (NORMAL_RANGES.trafficCompliance.min - data.trafficCompliance.complianceRate) * 100;
    }
    
    return penalty;
  })();

  score -= trafficPenalty;

  return Math.max(0, score);
};

// Anormal durumlar puanı hesaplama
export const calculateAbnormalConditionsScore = (data: DriveData['abnormalConditions']): number => {
  let score = 100;

  // El freni hatası
  score -= data.handbrakeMistake * PENALTIES.handbrakeMistake;

  // Yanlış viteste kalkış
  score -= data.wrongGearStart * PENALTIES.wrongGearStart;

  // Ani frenleme
  score -= data.suddenBraking * PENALTIES.suddenBraking;

  // Ani hızlanma
  score -= data.suddenAcceleration * PENALTIES.suddenAcceleration;

  return Math.max(0, score);
};

// Yakıt verimliliği puanı hesaplama
export const calculateFuelEfficiencyScore = (data: DriveData['fuelEfficiency']): number => {
  let score = 100;

  // Ortalama tüketim (60%)
  if (data.averageConsumption > NORMAL_RANGES.fuelConsumption.max) {
    score -= ((data.averageConsumption - NORMAL_RANGES.fuelConsumption.max) / 0.5) * PENALTIES.fuelConsumption;
  }

  // Rölanti süresi (40%)
  if (data.idlePercentage > NORMAL_RANGES.idlePercentage.max) {
    score -= ((data.idlePercentage - NORMAL_RANGES.idlePercentage.max) / 0.1) * PENALTIES.idleTime;
  }

  return Math.max(0, score);
};

// Genel puan hesaplama
export const calculateOverallScore = (data: DriveData): number => {
  const gearShiftingScore = calculateGearShiftingScore(data.gearShifting);
  const rpmControlScore = calculateRPMControlScore(data.rpmControl);
  const drivingStyleScore = calculateDrivingStyleScore(data.drivingStyle);
  const abnormalConditionsScore = calculateAbnormalConditionsScore(data.abnormalConditions);
  const fuelEfficiencyScore = calculateFuelEfficiencyScore(data.fuelEfficiency);

  // Ağırlıklı ortalama
  return (
    gearShiftingScore * 0.25 +
    rpmControlScore * 0.2 +
    drivingStyleScore * 0.2 +
    abnormalConditionsScore * 0.15 +
    fuelEfficiencyScore * 0.2
  );
};

// Benzersiz sürüş ID'si oluşturma
export const generateDriveId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Sürüş verilerini localStorage'a kaydetme
export const saveDriveData = (driveId: string, data: DriveData): void => {
  localStorage.setItem(`drive_${driveId}`, JSON.stringify(data));
};

// Sürüş verilerini localStorage'dan alma
export const getDriveData = (driveId: string): DriveData | null => {
  const data = localStorage.getItem(`drive_${driveId}`);
  return data ? JSON.parse(data) : null;
};

export const generateDriveData = (vehicleInfo: VehicleInfo): DriveData => {
  // Temel sürüş verileri
  const driveData: DriveData = {
    // Motor verileri
    maxRPM: Math.random() * 3000 + 3000,      // 3000-6000 arası
    avgRPM: Math.random() * 2000 + 2000,      // 2000-4000 arası
    rpmControl: {
      averageRPM: Math.random() * 2000 + 2000,      // 2000-4000 arası
      highRPM: {
        count: Math.floor(Math.random() * 10),    // 0-9 arası
        totalTime: Math.random() * 60 + 300,        // 300-360 dakika arası
      },
      lowRPM: {
        count: Math.floor(Math.random() * 10),    // 0-9 arası
        totalTime: Math.random() * 60 + 1500,        // 1500-2100 dakika arası
      },
      rpmRange: {
        min: Math.floor(Math.random() * 2000) + 2000,      // 2000-4000 arası
        max: Math.floor(Math.random() * 2500) + 2500,      // 2500-5000 arası
      },
    },

    // Hız verileri
    avgSpeed: Math.random() * 100 + 30,       // 30-130 arası
    maxSpeed: Math.random() * 80 + 70,        // 70-150 arası
    speedVariation: Math.random() * 40 + 20,  // 20-60 arası

    // Sürüş davranışı
    hardShifts: Math.floor(Math.random() * 8),    // 0-7 arası
    hardBrakes: Math.floor(Math.random() * 6),    // 0-5 arası
    hardTurns: Math.floor(Math.random() * 7),     // 0-6 arası
    smoothShifts: Math.floor(Math.random() * 10) + 5,  // 5-15 arası
    smoothBrakes: Math.floor(Math.random() * 8) + 4,   // 4-12 arası
    smoothTurns: Math.floor(Math.random() * 9) + 3,    // 3-12 arası

    // Vites kullanımı
    gearShifting: {
      clutchUsage: {
        averageTime: Math.random() * 1 + 0.5,      // 0.5-1.5 saniye arası
        totalTime: Math.random() * 10 + 5,          // 5-15 saniye arası
        longPresses: Math.floor(Math.random() * 5),    // 0-4 arası
      },
      gearSpeedMismatch: {
        lowGearHighSpeed: Math.random() * 0.1 + 0.1,      // 0.1-0.2 arası
        highGearLowSpeed: Math.random() * 0.1 + 0.1,      // 0.1-0.2 arası
        totalMismatchTime: Math.random() * 10 + 5,          // 5-15 saniye arası
      },
      stalls: Math.floor(Math.random() * 8),    // 0-7 arası
    },

    // Sürüş tarzı
    drivingStyle: {
      unnecessaryManeuvers: Math.floor(Math.random() * 10),    // 0-9 arası
      wheelLock: Math.floor(Math.random() * 10),    // 0-9 arası
      trafficCompliance: {
        speedLimitExceed: Math.floor(Math.random() * 10),    // 0-9 arası
        redLightViolation: Math.floor(Math.random() * 10),    // 0-9 arası
        stopSignViolation: Math.floor(Math.random() * 10),    // 0-9 arası
        complianceRate: Math.random() * 0.8 + 0.2,      // 0.2-1 arası
      },
    },

    // Mesafe ve zaman
    totalDistance: Math.random() * 100 + 20,   // 20-120 km arası
    driveTime: Math.random() * 60 + 20,        // 20-80 dakika arası
    stopTime: Math.random() * 20 + 5,          // 5-25 dakika arası

    // Yakıt verileri
    fuelConsumption: Math.random() * 8 + 3,    // 3-11 litre arası
    fuelEfficiency: Math.random() * 3 + 5,     // 5-8 km/litre arası

    // Sürüş stili
    aggressiveDriving: Math.random() * 40 + 10,  // 10-50 arası
    smoothDriving: Math.random() * 40 + 50,      // 50-90 arası
    ecoDriving: Math.random() * 30 + 20,         // 20-50 arası

    // Anormal durumlar
    suddenAccelerations: Math.floor(Math.random() * 5),  // 0-4 arası
    suddenDecelerations: Math.floor(Math.random() * 5),  // 0-4 arası
    sharpTurns: Math.floor(Math.random() * 6),           // 0-5 arası
    highSpeedTurns: Math.floor(Math.random() * 4),       // 0-3 arası
    highSpeedBraking: Math.floor(Math.random() * 4),     // 0-3 arası
    highSpeedAcceleration: Math.floor(Math.random() * 4), // 0-3 arası

    // Araç bilgileri
    vehicleInfo: vehicleInfo
  };

  return driveData;
};

