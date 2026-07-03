'use client'
import { useEffect, useState } from 'react';

const HeroContent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <div 
        className={`text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Main title with underwater lighting effect */}
        <h1 
          className="text-6xl md:text-8xl font-bold mb-6 select-none"
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
          className="text-lg md:text-xl opacity-90 select-none mb-8"
          style={{ 
            color: '#B0E0E6',
            textShadow: `
              0 0 5px rgba(176, 224, 230, 0.6),
              0 2px 4px rgba(0, 0, 0, 0.4)
            `,
            animation: 'subtleFloat 6s ease-in-out infinite'
          }}
        >
          Ocean of Possibilities
        </p>
        
        {/* Call to action button */}
        <button 
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          style={{
            boxShadow: '0 0 20px rgba(135, 206, 235, 0.3)',
            animation: 'subtleFloat 6s ease-in-out infinite'
          }}
        >
          Dive Deeper
        </button>
        
        {/* Depth indicator */}
        <div 
          className="mt-12 text-sm opacity-70 font-mono"
          style={{ 
            color: '#4682B4',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            animation: 'subtleFloat 6s ease-in-out infinite'
          }}
        >
          Scroll to explore the depths
        </div>
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
};

export default HeroContent;
