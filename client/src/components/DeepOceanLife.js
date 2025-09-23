'use client'

export default function DeepOceanLife() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Bioluminescent creatures */}
      <div 
        className="absolute top-1/3 left-10 w-2 h-2 rounded-full opacity-40"
        style={{ 
          backgroundColor: '#40E0D0',
          boxShadow: '0 0 20px #40E0D0, 0 0 40px #40E0D0',
          animation: 'bioluminescence1 6s ease-in-out infinite'
        }}
      ></div>
      
      <div 
        className="absolute top-2/3 right-20 w-1.5 h-1.5 rounded-full opacity-30"
        style={{ 
          backgroundColor: '#00FFFF',
          boxShadow: '0 0 15px #00FFFF, 0 0 30px #00FFFF',
          animation: 'bioluminescence2 8s ease-in-out infinite'
        }}
      ></div>
      
      <div 
        className="absolute bottom-1/4 left-1/3 w-3 h-3 rounded-full opacity-25"
        style={{ 
          backgroundColor: '#87CEEB',
          boxShadow: '0 0 25px #87CEEB, 0 0 50px #87CEEB',
          animation: 'bioluminescence3 10s ease-in-out infinite'
        }}
      ></div>
      
      {/* Silhouettes of deep sea creatures */}
      <div 
        className="absolute bottom-1/3 left-0 text-4xl opacity-15"
        style={{ 
          color: '#0a1a2a',
          animation: 'swim2 30s linear infinite',
          filter: 'blur(2px)'
        }}
      >
        🐟
      </div>
      
      <div 
        className="absolute top-3/4 right-0 text-5xl opacity-10"
        style={{ 
          color: '#0a1a2a',
          animation: 'swim3 35s linear infinite',
          filter: 'blur(1.5px)'
        }}
      >
        🐠
      </div>
      
      {/* Jellyfish silhouettes */}
      <div 
        className="absolute top-1/4 left-1/4 text-8xl opacity-8"
        style={{ 
          color: '#0f2942',
          animation: 'jellyfishFloat1 20s ease-in-out infinite',
          filter: 'blur(3px)'
        }}
      >
        🎐
      </div>
      
      <div 
        className="absolute top-1/2 right-1/4 text-6xl opacity-12"
        style={{ 
          color: '#0f2942',
          animation: 'jellyfishFloat2 15s ease-in-out infinite',
          filter: 'blur(2px)'
        }}
      >
        🎐
      </div>
      
      <style jsx>{`
        @keyframes bioluminescence1 {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1); 
            box-shadow: 0 0 20px #40E0D0, 0 0 40px #40E0D0;
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.2); 
            box-shadow: 0 0 30px #40E0D0, 0 0 60px #40E0D0, 0 0 80px #40E0D0;
          }
        }
        @keyframes bioluminescence2 {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
            box-shadow: 0 0 15px #00FFFF, 0 0 30px #00FFFF;
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1.3); 
            box-shadow: 0 0 25px #00FFFF, 0 0 50px #00FFFF, 0 0 70px #00FFFF;
          }
        }
        @keyframes bioluminescence3 {
          0%, 100% { 
            opacity: 0.25; 
            transform: scale(1); 
            box-shadow: 0 0 25px #87CEEB, 0 0 50px #87CEEB;
          }
          50% { 
            opacity: 0.5; 
            transform: scale(1.1); 
            box-shadow: 0 0 35px #87CEEB, 0 0 70px #87CEEB, 0 0 90px #87CEEB;
          }
        }
        @keyframes swim1 {
          0% { transform: translateX(100px); }
          100% { transform: translateX(-100vw); }
        }
        @keyframes swim2 {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(100vw); }
        }
        @keyframes swim3 {
          0% { transform: translateX(100px) translateY(0px); }
          50% { transform: translateX(50vw) translateY(-30px); }
          100% { transform: translateX(-100vw) translateY(0px); }
        }
        @keyframes jellyfishFloat1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(1deg); }
          75% { transform: translateY(20px) rotate(-1deg); }
        }
        @keyframes jellyfishFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(15px) rotate(-0.5deg); }
          66% { transform: translateY(-15px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}