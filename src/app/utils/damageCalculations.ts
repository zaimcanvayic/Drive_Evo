import { DriveData } from './performanceCalculations'; // DriveData tipini import et

// Hasar hesaplama fonksiyonu
export interface DamageScores {
  engine: number;
  transmission: number;
  brakes: number;
  suspension: number;
  steering: number;
  tires: number;
  clutch: number;
}

export const calculateDamageScores = (data: DriveData): DamageScores => {
  // Başlangıç puanları
  let engineDamage = 100;
  let transmissionDamage = 100;
  let brakesDamage = 100;
  let tiresDamage = 100;
  let suspensionDamage = 100;
  let steeringDamage = 100;
  let clutchDamage = 100;

  // Motor hasarı hesaplama
  if (data.maxRPM > 5000) {
    engineDamage -= (data.maxRPM - 5000) * 0.4;
  }
  if (data.avgRPM > 3000) {
    engineDamage -= (data.avgRPM - 3000) * 0.15;
  }
  if (data.suddenAccelerations > 0) {
    engineDamage -= data.suddenAccelerations * 3;
  }
  if (data.highSpeedAcceleration > 0) {
    engineDamage -= data.highSpeedAcceleration * 4;
  }
  // Yüksek devir kullanımı hasarı
  if (data.rpmControl && data.rpmControl.highRPM) {
    engineDamage -= (data.rpmControl.highRPM.count * 2); // Her yüksek devir için -2%
    engineDamage -= (data.rpmControl.highRPM.totalTime / 60) * 0.5; // Her dakika yüksek devir için -0.5%
  }

  // Fren hasarı hesaplama
  if (data.hardBrakes > 0) {
    brakesDamage -= data.hardBrakes * 10;
  }
  if (data.avgSpeed > 80) {
    brakesDamage -= (data.avgSpeed - 80) * 0.25;
  }
  if (data.highSpeedBraking > 0) {
    brakesDamage -= data.highSpeedBraking * 8;
  }
  if (data.suddenDecelerations > 0) {
    brakesDamage -= data.suddenDecelerations * 5;
  }
  // Teker kilitleme hasarı
  if (data.drivingStyle && data.drivingStyle.wheelLock) {
    brakesDamage -= data.drivingStyle.wheelLock * 15; // Her teker kilitleme için -15%
  }

  // Lastik hasarı hesaplama
  if (data.hardTurns > 0) {
    tiresDamage -= data.hardTurns * 3;
  }
  if (data.hardBrakes > 0) {
    tiresDamage -= data.hardBrakes * 4;
  }
  if (data.avgSpeed > 80) {
    tiresDamage -= (data.avgSpeed - 80) * 0.15;
  }
  if (data.sharpTurns > 0) {
    tiresDamage -= data.sharpTurns * 5;
  }
  if (data.highSpeedTurns > 0) {
    tiresDamage -= data.highSpeedTurns * 6;
  }
  // Teker kilitleme lastik hasarı
  if (data.drivingStyle && data.drivingStyle.wheelLock) {
    tiresDamage -= data.drivingStyle.wheelLock * 12; // Her teker kilitleme için -12%
  }

  // Şanzıman hasarı hesaplama
  if (data.hardShifts > 0) {
    transmissionDamage -= data.hardShifts * 8;
  }
  if (data.avgRPM > 3000) {
    transmissionDamage -= (data.avgRPM - 3000) * 0.15;
  }
  if (data.suddenAccelerations > 0) {
    transmissionDamage -= data.suddenAccelerations * 4;
  }
  // Vites-Hız uyumsuzluğu hasarı
  if (data.gearShifting && data.gearShifting.gearSpeedMismatch) {
    transmissionDamage -= (data.gearShifting.gearSpeedMismatch.totalMismatchTime / 60) * 2; // Her dakika uyumsuzluk için -2%
  }

  // Süspansiyon hasarı hesaplama
  if (data.hardTurns > 0) {
    suspensionDamage -= data.hardTurns * 4;
  }
  if (data.avgSpeed > 80) {
    suspensionDamage -= (data.avgSpeed - 80) * 0.2;
  }
  if (data.sharpTurns > 0) {
    suspensionDamage -= data.sharpTurns * 6;
  }
  if (data.highSpeedTurns > 0) {
    suspensionDamage -= data.highSpeedTurns * 7;
  }
  // Gereksiz manevra hasarı
  if (data.drivingStyle && data.drivingStyle.unnecessaryManeuvers) {
    suspensionDamage -= data.drivingStyle.unnecessaryManeuvers * 5; // Her gereksiz manevra için -5%
  }

  // Direksiyon hasarı hesaplama
  if (data.hardTurns > 0) {
    steeringDamage -= data.hardTurns * 5;
  }
  if (data.avgSpeed > 90) {
    steeringDamage -= (data.avgSpeed - 90) * 0.2;
  }
  if (data.sharpTurns > 0) {
    steeringDamage -= data.sharpTurns * 7;
  }
  if (data.highSpeedTurns > 0) {
    steeringDamage -= data.highSpeedTurns * 8;
  }
  // Gereksiz manevra direksiyon hasarı
  if (data.drivingStyle && data.drivingStyle.unnecessaryManeuvers) {
    steeringDamage -= data.drivingStyle.unnecessaryManeuvers * 4; // Her gereksiz manevra için -4%
  }

  // Debriyaj hasarı hesaplama
  if (data.hardShifts > 0) {
    clutchDamage -= data.hardShifts * 10;
  }
  if (data.avgRPM > 3500) {
    clutchDamage -= (data.avgRPM - 3500) * 0.2;
  }
  if (data.suddenAccelerations > 0) {
    clutchDamage -= data.suddenAccelerations * 5;
  }
  // Debriyaj kullanım hasarı
  if (data.gearShifting && data.gearShifting.clutchUsage) {
    clutchDamage -= (data.gearShifting.clutchUsage.longPresses * 8); // Her uzun basma için -8%
    if (data.gearShifting.clutchUsage.averageTime > 1.5) {
      clutchDamage -= (data.gearShifting.clutchUsage.averageTime - 1.5) * 5; // Ortalama basma süresi fazlaysa
    }
  }

  // Puanları 0-100 arasında sınırla
  const clampScore = (score: number) => Math.max(0, Math.min(100, score));

  return {
    engine: clampScore(engineDamage),
    transmission: clampScore(transmissionDamage),
    brakes: clampScore(brakesDamage),
    tires: clampScore(tiresDamage),
    suspension: clampScore(suspensionDamage),
    steering: clampScore(steeringDamage),
    clutch: clampScore(clutchDamage)
  };
}; 