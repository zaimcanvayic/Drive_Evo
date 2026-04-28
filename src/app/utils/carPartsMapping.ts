export interface CarPart {
  id: string;
  name: string;
  description: string;
  damageType: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
}

export const carParts: CarPart[] = [
  {
    id: 'engine',
    name: 'Motor',
    description: 'Araç motoru ve ilgili bileşenler',
    damageType: 'engine',
    coordinates: {
      x: 740,
      y: 160,
      width: 70,
      height: 110
    },
    tooltipPosition: 'top'
  },
  {
    id: 'transmission',
    name: 'Şanzıman',
    description: 'Vites kutusu ve aktarma organları',
    damageType: 'transmission',
    coordinates: {
      x: 670,
      y: 160,
      width: 70,
      height: 110
    },
    tooltipPosition: 'top'
  },
  {
    id: 'clutch',
    name: 'Debriyaj',
    description: 'Debriyaj balatası ve sistemi',
    damageType: 'clutch',
    coordinates: {
      x: 510,
      y: 70,
      width: 60,
      height: 40
    },
    tooltipPosition: 'top'
  },
  {
    id: 'frontBrakes',
    name: 'Ön Frenler',
    description: 'Ön tekerlek fren sistemi ve balatalar',
    damageType: 'brakes',
    coordinates: {
      x: 600,
      y: 150,
      width: 80,
      height: 60
    },
    tooltipPosition: 'left'
  },
  {
    id: 'rearBrakes',
    name: 'Arka Frenler',
    description: 'Arka tekerlek fren sistemi ve balatalar',
    damageType: 'brakes',
    coordinates: {
      x: 200,
      y: 150,
      width: 80,
      height: 60
    },
    tooltipPosition: 'right'
  },
  {
    id: 'frontSuspension',
    name: 'Ön Süspansiyon',
    description: 'Ön amortisörler ve yaylar',
    damageType: 'suspension',
    coordinates: {
      x: 650,
      y: 200,
      width: 100,
      height: 60
    },
    tooltipPosition: 'left'
  },
  {
    id: 'rearSuspension',
    name: 'Arka Süspansiyon',
    description: 'Arka amortisörler ve yaylar',
    damageType: 'suspension',
    coordinates: {
      x: 150,
      y: 200,
      width: 100,
      height: 60
    },
    tooltipPosition: 'right'
  },
  {
    id: 'steering',
    name: 'Direksiyon Sistemi',
    description: 'Direksiyon kutusu ve bağlantıları',
    damageType: 'steering',
    coordinates: {
      x: 510,
      y: 120,
      width: 110,
      height: 90
    },
    tooltipPosition: 'top'
  },
  {
    id: 'frontTires',
    name: 'Ön Lastikler',
    description: 'Ön tekerlekler ve lastikler',
    damageType: 'tires',
    coordinates: {
      x: 650,
      y: 100,
      width: 80,
      height: 60
    },
    tooltipPosition: 'left'
  },
  {
    id: 'rearTires',
    name: 'Arka Lastikler',
    description: 'Arka tekerlekler ve lastikler',
    damageType: 'tires',
    coordinates: {
      x: 150,
      y: 100,
      width: 80,
      height: 60
    },
    tooltipPosition: 'right'
  }
];

// Hasar durumuna göre renk kodları
export const getDamageColor = (damage: number) => {
  if (damage >= 80) return '#22c55e'; // yeşil
  if (damage >= 60) return '#eab308'; // sarı
  if (damage >= 40) return '#f97316'; // turuncu
  return '#ef4444'; // kırmızı
};

// Hasar durumuna göre açıklama
export const getDamageDescription = (damage: number) => {
  if (damage >= 80) return 'Mükemmel durumda';
  if (damage >= 60) return 'İyi durumda';
  if (damage >= 40) return 'Dikkat edilmeli';
  return 'Acil servis gerekli';
}; 