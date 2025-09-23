'use client'
export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-6">
        <h1 
          className="text-6xl font-bold mb-8"
          style={{ 
            color: '#87CEEB',
            textShadow: `
              0 0 10px rgba(135, 206, 235, 0.8),
              0 0 20px rgba(135, 206, 235, 0.6),
              0 0 40px rgba(135, 206, 235, 0.4)
            `,
            animation: 'underwaterGlow 4s ease-in-out infinite alternate'
          }}
        >
          About Tarang
        </h1>
        
        <p 
          className="text-xl mb-6"
          style={{ 
            color: '#B0E0E6',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Welcome to the depths of innovation. Tarang represents the endless waves of creativity 
          and technological advancement in the digital ocean.
        </p>
        
        <p 
          className="text-lg opacity-80"
          style={{ 
            color: '#B0E0E6',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Navigate through our platform and discover the treasures hidden beneath the surface 
          of conventional thinking.
        </p>
        
        <style jsx>{`
          @keyframes underwaterGlow {
            0% { 
              text-shadow: 
                0 0 10px rgba(135, 206, 235, 0.8),
                0 0 20px rgba(135, 206, 235, 0.6),
                0 0 40px rgba(135, 206, 235, 0.4);
            }
            100% { 
              text-shadow: 
                0 0 15px rgba(135, 206, 235, 1),
                0 0 30px rgba(135, 206, 235, 0.8),
                0 0 60px rgba(135, 206, 235, 0.6);
            }
          }
        `}</style>
      </div>
    </div>
  );
}