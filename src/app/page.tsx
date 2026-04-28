'use client';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import QuickActions from '@/components/landing/QuickActions';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white">
      <HeroSection />
      <FeaturesSection />
      <QuickActions />
    </main>
  );
}
