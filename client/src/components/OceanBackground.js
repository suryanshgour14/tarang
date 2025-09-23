'use client'

export default function OceanBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep ocean gradient background - much darker */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center top, 
              rgba(20, 40, 70, 0.2) 0%,
              rgba(12, 25, 45, 0.5) 30%,
              rgba(6, 15, 30, 0.8) 60%,
              rgba(3, 8, 20, 0.95) 80%,
              rgba(1, 3, 12, 1) 100%
            ),
            linear-gradient(180deg,
              #0a1f35 0%,
              #061425 40%,
              #030b15 70%,
              #01050a 100%
            )
          `
        }}
      />
      
      {/* Prominent top center light source */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-80 h-40 opacity-25"
        style={{
          background: `
            radial-gradient(ellipse 300px 150px at center top,
              rgba(120, 160, 200, 0.4) 0%,
              rgba(80, 120, 160, 0.25) 30%,
              rgba(50, 90, 130, 0.15) 60%,
              rgba(30, 60, 100, 0.08) 80%,
              transparent 100%
            )
          `,
          filter: 'blur(3px)'
        }}
      />
      
      {/* Realistic underwater light shafts */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 opacity-12"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(40, 80, 120, 0.2) 0%,
              rgba(30, 60, 100, 0.15) 20%,
              rgba(20, 40, 80, 0.1) 50%,
              rgba(10, 20, 40, 0.05) 80%,
              transparent 100%
            )
          `,
          filter: 'blur(4px)',
          clipPath: 'polygon(45% 0%, 55% 0%, 65% 100%, 35% 100%)'
        }}
      />
      
      {/* Secondary soft light beam */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-80 opacity-10"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(50, 90, 130, 0.12) 0%,
              rgba(35, 70, 110, 0.08) 30%,
              rgba(20, 50, 90, 0.04) 60%,
              transparent 100%
            )
          `,
          filter: 'blur(6px)',
          clipPath: 'polygon(42% 0%, 58% 0%, 70% 100%, 30% 100%)'
        }}
      />
      
      {/* Subtle underwater shimmer */}
      <div 
        className="absolute top-20 left-1/2 transform -translate-x-1/2 w-40 h-40 opacity-4"
        style={{
          background: `
            radial-gradient(circle,
              rgba(60, 100, 140, 0.08) 0%,
              rgba(40, 80, 120, 0.04) 40%,
              transparent 70%
            )
          `,
          animation: 'gentleShimmer 12s ease-in-out infinite',
          filter: 'blur(8px)'
        }}
      />
      
      <style jsx>{`
        @keyframes gentleShimmer {
          0%, 100% { 
            transform: translateX(-50%) scale(1); 
            opacity: 0.04; 
          }
          50% { 
            transform: translateX(-50%) scale(1.1); 
            opacity: 0.06; 
          }
        }
      `}</style>
    </div>
  );
}