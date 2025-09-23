'use client'

export default function HomeHero() {
  return (
    <div className="relative z-10 flex mt-36 justify-center min-h-screen">
      <div className="">
        {/* Main title with underwater lighting effect */}
        <h1 
          className="text-8xl font-bold mb-6 select-none"
          style={{ 
            color: '#87CEEB',
            textShadow: `
              0 0 10px rgba(135, 206, 235, 0.8),
              0 0 20px rgba(135, 206, 235, 0.6),
              0 0 40px rgba(135, 206, 235, 0.4),
              0 5px 10px rgba(0, 0, 0, 0.3)
            `,
            animation: 'underwaterGlow 4s ease-in-out infinite alternate',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}
        >
          Tarang
        </h1>
        
        {/* Subtitle with depth effect */}
        <p 
          className="text-xl opacity-80 select-none"
          style={{ 
            color: '#B0E0E6',
            textShadow: `
              0 0 5px rgba(176, 224, 230, 0.6),
              0 2px 4px rgba(0, 0, 0, 0.4)
            `,
            animation: 'subtleFloat 6s ease-in-out infinite'
          }}
        >
          Safer Seas, Smarter Shores.
        </p>
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