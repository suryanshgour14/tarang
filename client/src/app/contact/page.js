'use client'
export default function Contact() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
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
          Contact Us
        </h1>
        
        <div className="space-y-6">
          <div 
            className="p-6 rounded-lg backdrop-blur-sm border border-white/20"
            style={{ background: 'rgba(15, 41, 66, 0.5)' }}
          >
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: '#87CEEB' }}
            >
              Email
            </h3>
            <p style={{ color: '#B0E0E6' }}>
              hello@tarang.ocean
            </p>
          </div>
          
          <div 
            className="p-6 rounded-lg backdrop-blur-sm border border-white/20"
            style={{ background: 'rgba(15, 41, 66, 0.5)' }}
          >
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: '#87CEEB' }}
            >
              Location
            </h3>
            <p style={{ color: '#B0E0E6' }}>
              Deep Ocean Trench, Mariana Basin
            </p>
          </div>
        </div>
        
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