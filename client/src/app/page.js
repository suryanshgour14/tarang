'use client'
import HomeHero from '@/components/home/hero';
import { GlobeDemo } from '@/components/home/globe-section';
import OceanParticleBackground from '@/components/OceanParticleBackground';
import ReportForm from '@/components/home/report-form';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Ocean Particle Background */}
      <OceanParticleBackground />
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main content with underwater lighting */}
        <div className="flex-1 flex items-center justify-center">
          <HomeHero />
        </div>
        
        {/* Globe section below hero - reduced spacing */}
        <div className="flex justify-center pb-20 ">
          <GlobeDemo />
        </div>

        {/* Report Form section */}
        <div className="flex justify-center py-20">
          <ReportForm />
        </div>

      </div>
    </div>
  );
}
