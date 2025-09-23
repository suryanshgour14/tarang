'use client'
import HomeHero from '@/components/home/hero';
import { GlobeDemo } from '@/components/home/globe-section';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content with underwater lighting */}
      <div className="flex-1 flex items-center justify-center">
        <HomeHero />
      </div>
      
      {/* Globe section below hero - reduced spacing */}
      <div className="flex justify-center pb-20 -mt-32">
        <GlobeDemo />
      </div>
    </div>
  );
}
