'use client'
import { useRouter } from 'next/navigation';
import HomeHero from '@/components/home/hero';
import { GlobeDemo } from '@/components/home/globe-section';
import OceanParticleBackground from '@/components/OceanParticleBackground';
import ReportForm from '@/components/home/report-form';
import HazardHeatmap from '@/components/home/hazard-heatmap';
import SafetyGuidelines from '@/components/home/safety-guidelines';
import LazyOnVisible from '@/components/home/LazyOnVisible';

export default function Home() {
  const router = useRouter();

  const handleViewFullReports = () => {
    router.push('/reports');
  };
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Ocean Particle Background */}
      <OceanParticleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Main content with underwater lighting */}
        <div className="flex-1 flex items-center justify-center">
          <HomeHero />
        </div>
        
        {/* Globe section below hero - reduced spacing.
            The globe pulls in three.js (~1.5MB) - only mount it once it's
            about to scroll into view instead of on every homepage load. */}
        <div className="flex justify-center pb-20 ">
          <LazyOnVisible minHeight="18rem" placeholder={<div className="w-full max-w-7xl h-72 md:h-[40rem]" />}>
            <GlobeDemo />
          </LazyOnVisible>
        </div>

        {/* Report Form section */}
        <div id="report-form" className="flex justify-center py-20">
          <ReportForm />
        </div>

        {/* Hazard Heatmap section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent mb-4">
                Ocean Hazard Hotspots
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-6">
                Real-time visualization of oceanic hazard reports across India&apos;s coastal regions. 
                Larger circles indicate higher report concentrations.
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-300">High Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-slate-300">Medium Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-300">Low Risk</span>
                </div>
              </div>
            </div>
            <HazardHeatmap />
            
            {/* More Reports Button */}
            <div className="flex justify-center mt-12">
              <button
                onClick={handleViewFullReports}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {/* Background with gradient and glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                
                {/* Button content */}
                <div className="relative flex items-center space-x-3">
                  <span>View Full Reports & Analytics</span>
                  <svg 
                    className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                
                {/* Ripple effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Safety Guidelines section */}
        <div className="py-20">
          <SafetyGuidelines />
        </div>
      </div>

      {/* Footer - positioned at bottom */}
      <div className="relative z-10 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <hr className="border-t border-slate-700/50 mb-4" />
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>Ministry of Earth Sciences (MoES)</span>
            <span>Made by : Team Tarang</span>
          </div>
        </div>
      </div>

    </div>
  );
}
