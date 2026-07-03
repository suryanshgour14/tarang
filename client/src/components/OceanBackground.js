'use client'

export default function OceanBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep ocean gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center top, 
              rgba(45, 95, 145, 0.3) 0%,
              rgba(25, 60, 100, 0.6) 30%,
              rgba(15, 35, 65, 0.8) 60%,
              rgba(8, 20, 40, 0.95) 80%,
              rgba(3, 10, 25, 1) 100%
            ),
            linear-gradient(180deg,
              #1a4a6b 0%,
              #0f2942 40%,
              #081729 70%,
              #030a19 100%
            )
          `
        }}
      />
      
      {/* Light rays from surface */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse 400px 600px at center top,
              rgba(135, 206, 235, 0.4) 0%,
              rgba(100, 180, 220, 0.2) 30%,
              rgba(70, 150, 200, 0.1) 60%,
              transparent 100%
            )
          `,
          filter: 'blur(2px)'
        }}
      />
      
      {/* Secondary light rays */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-80 opacity-15"
        style={{
          background: `
            conic-gradient(from 180deg at center top,
              transparent 0deg,
              rgba(135, 206, 235, 0.3) 30deg,
              rgba(100, 180, 220, 0.2) 60deg,
              transparent 90deg,
              transparent 270deg,
              rgba(100, 180, 220, 0.2) 300deg,
              rgba(135, 206, 235, 0.3) 330deg,
              transparent 360deg
            )
          `,
          filter: 'blur(3px)'
        }}
      />
      
      {/* Caustic light patterns */}
      <div 
        className="absolute top-10 left-1/2 transform -translate-x-1/2 w-80 h-60 opacity-10"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(135, 206, 235, 0.1) 10px,
              rgba(135, 206, 235, 0.1) 20px
            )
          `,
          animation: 'caustics 8s ease-in-out infinite',
          filter: 'blur(1px)'
        }}
      />
      
      <style jsx>{`
        @keyframes caustics {
          0%, 100% { 
            transform: translateX(-50%) translateY(0px) rotate(0deg); 
            opacity: 0.1; 
          }
          50% { 
            transform: translateX(-50%) translateY(-20px) rotate(2deg); 
            opacity: 0.15; 
          }
        }
      `}</style>
    </div>
  );
}