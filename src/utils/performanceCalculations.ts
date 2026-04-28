// Tip tanımlamaları
export interface DriveData {
  // Vites Kullanımı
  gearShifting: {
    clutchUsage: {
      averageTime: number; // saniye
      totalTime: number; // saniye
      longPresses: number; // 2 saniyeden uzun basmalar
    };
    gearSpeedMismatch: {
      lowGearHighSpeed: number; // düşük viteste yüksek hız
      highGearLowSpeed: number; // yüksek viteste düşük hız
      totalMismatchTime: number; // saniye
    };
    stalls: number; // motor stop sayısı
  };

  // Devir Kontrolü
  rpmControl: {
    averageRPM: number;
    highRPM: {
      count: number; // 3000+ devir sayısı
      totalTime: number; // saniye
    };
    lowRPM: {
      count: number; // 1500- devir sayısı
      totalTime: number; // saniye
    };
    rpmRange: {
      min: number;
      max: number;
    };
  };

  // Sürüş Tarzı
  drivingStyle: {
    unnecessaryManeuvers: number; // gereksiz manevra sayısı
    wheelLock: number; // teker kilitleme sayısı
    trafficCompliance: {
      speedLimitExceed: number; // hız limiti aşım sayısı
      redLightViolation: number;
      stopSignViolation: number;
      complianceRate: number; // %95 uyum
    };
  };

  // Anormal Durumlar
  abnormalConditions: {
    handbrakeMistake: number;
    wrongGearStart: number; // yanlış viteste kalkış
    suddenBraking: number; // ani frenleme
    suddenAcceleration: number; // ani hızlanma
  };

  // Yakıt Verimliliği
  fuelEfficiency: {
    averageConsumption: number; // L/100km
    idleTime: number; // saniye
    idlePercentage: number; // %8
  };
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

  score -= trafficPenalty * 0.3;

  return Math.max(0, score);
};

// Anormal durumlar puanı hesaplama
export const calculateAbnormalConditionsScore = (data: DriveData['abnormalConditions']): number => {
  let score = 100;

  // El freni hatası (30%)
  score -= data.handbrakeMistake * PENALTIES.handbrakeMistake;

  // Yanlış vitesle kalkış (20%)
  score -= data.wrongGearStart * PENALTIES.wrongGearStart;

  // Ani frenleme (25%)
  score -= data.suddenBraking * PENALTIES.suddenBraking;

  // Ani hızlanma (25%)
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
  const weights = {
    gearShifting: 0.25,
    rpmControl: 0.20,
    drivingStyle: 0.20,
    abnormalConditions: 0.15,
    fuelEfficiency: 0.20
  };

  const scores = {
    gearShifting: calculateGearShiftingScore(data.gearShifting),
    rpmControl: calculateRPMControlScore(data.rpmControl),
    drivingStyle: calculateDrivingStyleScore(data.drivingStyle),
    abnormalConditions: calculateAbnormalConditionsScore(data.abnormalConditions),
    fuelEfficiency: calculateFuelEfficiencyScore(data.fuelEfficiency)
  };

  return Object.entries(scores).reduce((acc, [key, score]) => {
    return acc + (score * weights[key as keyof typeof weights]);
  }, 0);
};

// Benzersiz ID oluşturma
export const generateDriveId = (): string => {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8);
  return `drive_${timestamp}_${random}`;
};

// Veri saklama ve getirme fonksiyonları
export const saveDriveData = (driveId: string, data: DriveData): void => {
  localStorage.setItem(`drive_${driveId}`, JSON.stringify(data));
};

export const getDriveData = (driveId: string): DriveData | null => {
  const data = localStorage.getItem(`drive_${driveId}`);
  return data ? JSON.parse(data) : null;
}; 