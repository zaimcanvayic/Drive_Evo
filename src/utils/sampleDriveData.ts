import { DriveData } from './performanceCalculations';

export const sampleDriveData: DriveData = {
  gearShifting: {
    clutchUsage: {
      averageTime: 1.8, // saniye
      totalTime: 81, // saniye
      longPresses: 3 // 2 saniyeden uzun basmalar
    },
    gearSpeedMismatch: {
      lowGearHighSpeed: 2, // düşük viteste yüksek hız
      highGearLowSpeed: 4, // yüksek viteste düşük hız
      totalMismatchTime: 180 // saniye
    },
    stalls: 1 // motor stop sayısı
  },

  rpmControl: {
    averageRPM: 2200,
    highRPM: {
      count: 5, // 3000+ devir sayısı
      totalTime: 45 // saniye
    },
    lowRPM: {
      count: 3, // 1500- devir sayısı
      totalTime: 30 // saniye
    },
    rpmRange: {
      min: 1200,
      max: 3200
    }
  },

  drivingStyle: {
    unnecessaryManeuvers: 2, // gereksiz manevra sayısı
    wheelLock: 0, // teker kilitleme sayısı
    trafficCompliance: {
      speedLimitExceed: 2, // hız limiti aşım sayısı
      redLightViolation: 0,
      stopSignViolation: 0,
      complianceRate: 0.95 // %95 uyum
    }
  },

  abnormalConditions: {
    handbrakeMistake: 0,
    wrongGearStart: 1, // yanlış viteste kalkış
    suddenBraking: 2, // ani frenleme
    suddenAcceleration: 3 // ani hızlanma
  },

  fuelEfficiency: {
    averageConsumption: 6.8, // L/100km
    idleTime: 120, // saniye
    idlePercentage: 0.08 // %8
  }
}; 