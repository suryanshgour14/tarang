'use client'

export default function HomeHero() {
  return (
    <div className="relative z-10 flex mt-38 px-36 mb-12 justify-center">
      <div className="">
        {/* Main tagline as primary text */}
        <h1 
          className="text-6xl font-bold text-center select-none"  
          style={{ 
            color: '#87CEEB',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            textShadow: `
              0 0 15px rgba(135, 206, 235, 0.8),
              0 0 25px rgba(135, 206, 235, 0.6),  
              0 0 35px rgba(135, 206, 235, 0.4),
              0 6px 12px rgba(0, 0, 0, 0.4)
            `,
            animation: 'underwaterGlow 4s ease-in-out infinite alternate',
            filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))'
          }}
        >
          Safer Seas, Smarter Shores
        </h1>
      </div>
  
      <style jsx>{`
        @keyframes underwaterGlow {
          0% { 
            text-shadow: 
              0 0 10px rgba(135, 206, 235, 0.8),
              0 0 20px rgba(135, 206, 235, 0.6),
              0 0 40px rgba(135, 206, 235, 0.4),
              0 5px 10px rgba(0, 0, 0, 0.3);
          }
          100% { 
            text-shadow: 
              0 0 15px rgba(135, 206, 235, 1),
              0 0 30px rgba(135, 206, 235, 0.8),
              0 0 60px rgba(135, 206, 235, 0.6),
              0 5px 15px rgba(0, 0, 0, 0.4);
          }
        }
        @keyframes subtleFloat {
          0%, 100% { 
            transform: translateY(0px); 
            opacity: 0.8; 
          }
          50% { 
            transform: translateY(-5px); 
            opacity: 0.9; 
          }
        }
      `}</style>
    </div>
  );
}