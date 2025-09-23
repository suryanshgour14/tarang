'use client'

export default function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Marine snow particles */}
      <div className="absolute top-20 left-1/4 w-1 h-1 bg-white opacity-30 rounded-full" style={{ animation: 'marineSnow1 15s linear infinite' }}></div>
      <div className="absolute top-0 left-1/3 w-0.5 h-0.5 bg-blue-100 opacity-40 rounded-full" style={{ animation: 'marineSnow2 20s linear infinite' }}></div>
      <div className="absolute top-10 left-2/3 w-1.5 h-1.5 bg-blue-50 opacity-25 rounded-full" style={{ animation: 'marineSnow3 18s linear infinite' }}></div>
      <div className="absolute top-5 right-1/4 w-0.5 h-0.5 bg-white opacity-35 rounded-full" style={{ animation: 'marineSnow4 22s linear infinite' }}></div>
      <div className="absolute top-15 right-1/3 w-1 h-1 bg-blue-100 opacity-30 rounded-full" style={{ animation: 'marineSnow5 16s linear infinite' }}></div>
      <div className="absolute top-0 left-1/5 w-0.5 h-0.5 bg-white opacity-40 rounded-full" style={{ animation: 'marineSnow6 25s linear infinite' }}></div>
      
      {/* Larger organic particles */}
      <div className="absolute top-0 left-1/6 w-2 h-2 bg-blue-200 opacity-15 rounded-full" style={{ animation: 'organicFloat1 30s linear infinite' }}></div>
      <div className="absolute top-10 right-1/5 w-1.5 h-1.5 bg-blue-100 opacity-20 rounded-full" style={{ animation: 'organicFloat2 35s linear infinite' }}></div>
      <div className="absolute top-5 left-3/4 w-2.5 h-2.5 bg-blue-50 opacity-10 rounded-full" style={{ animation: 'organicFloat3 28s linear infinite' }}></div>
      
      {/* Air bubbles */}
      <div className="absolute bottom-1/3 left-1/4 w-3 h-3 border border-blue-200 opacity-20 rounded-full" style={{ animation: 'bubble1 12s ease-in-out infinite' }}></div>
      <div className="absolute bottom-1/2 right-1/3 w-2 h-2 border border-blue-100 opacity-25 rounded-full" style={{ animation: 'bubble2 15s ease-in-out infinite' }}></div>
      <div className="absolute bottom-2/3 left-2/3 w-4 h-4 border border-blue-300 opacity-15 rounded-full" style={{ animation: 'bubble3 10s ease-in-out infinite' }}></div>
      
      <style jsx>{`
        @keyframes marineSnow1 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
        }
        @keyframes marineSnow2 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) translateX(-15px); opacity: 0; }
        }
        @keyframes marineSnow3 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.25; }
          90% { opacity: 0.25; }
          100% { transform: translateY(100vh) translateX(10px); opacity: 0; }
        }
        @keyframes marineSnow4 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.35; }
          100% { transform: translateY(100vh) translateX(-25px); opacity: 0; }
        }
        @keyframes marineSnow5 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(100vh) translateX(5px); opacity: 0; }
        }
        @keyframes marineSnow6 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) translateX(-10px); opacity: 0; }
        }
        @keyframes organicFloat1 {
          0% { transform: translateY(-30px) translateX(0px) rotate(0deg); opacity: 0; }
          5% { opacity: 0.15; }
          95% { opacity: 0.15; }
          100% { transform: translateY(100vh) translateX(30px) rotate(360deg); opacity: 0; }
        }
        @keyframes organicFloat2 {
          0% { transform: translateY(-30px) translateX(0px) rotate(0deg); opacity: 0; }
          5% { opacity: 0.2; }
          95% { opacity: 0.2; }
          100% { transform: translateY(100vh) translateX(-40px) rotate(-360deg); opacity: 0; }
        }
        @keyframes organicFloat3 {
          0% { transform: translateY(-30px) translateX(0px) rotate(0deg); opacity: 0; }
          5% { opacity: 0.1; }
          95% { opacity: 0.1; }
          100% { transform: translateY(100vh) translateX(20px) rotate(180deg); opacity: 0; }
        }
        @keyframes bubble1 {
          0% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-50px) scale(1.2); opacity: 0.25; }
          100% { transform: translateY(-100vh) scale(0.8); opacity: 0; }
        }
        @keyframes bubble2 {
          0% { transform: translateY(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.9); opacity: 0; }
        }
        @keyframes bubble3 {
          0% { transform: translateY(0px) scale(1); opacity: 0.15; }
          50% { transform: translateY(-40px) scale(1.3); opacity: 0.2; }
          100% { transform: translateY(-100vh) scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}