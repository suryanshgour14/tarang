'use client'
import { useEffect, useRef } from 'react';

export default function OceanParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let gradient;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fewer particles (and no per-particle glow/line-connections cost) on
    // small screens, where CPU/GPU budget is tighter and the effect is less
    // visible anyway.
    const particleCount = window.innerWidth < 768 ? 20 : 50;

    // Rebuilding this every frame (as before) was one of the bigger costs -
    // it only actually needs to change when the canvas is resized.
    const buildGradient = () => {
      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.3, '#1E293B');
      gradient.addColorStop(0.6, '#0F3460');
      gradient.addColorStop(1, '#063B5C');
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGradient();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles = [];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = this.getRandomColor();
      }

      getRandomColor() {
        const colors = [
          'rgba(135, 206, 235, ',  // Light blue
          'rgba(64, 224, 208, ',   // Turquoise
          'rgba(32, 178, 170, ',   // Dark turquoise
          'rgba(176, 224, 230, ',  // Powder blue
          'rgba(70, 130, 180, '    // Steel blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        // Gentle opacity pulse
        this.opacity += Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.01;
        this.opacity = Math.max(0.1, Math.min(0.7, this.opacity));
      }

      draw() {
        // A single fill (no shadowBlur - it forces an expensive software
        // blur pass per particle per frame, which was the main CPU cost
        // here) still reads as a soft glow at this size/opacity.
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }

      // Draw connecting lines between close particles. O(n^2) but n stays
      // small (<=50), and this avoids the per-frame array allocations the
      // .slice()-based version used to do.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(64, 224, 208, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // A static single frame (no requestAnimationFrame loop) honors
    // prefers-reduced-motion and also avoids burning CPU on hidden tabs.
    const renderStaticFrame = () => {
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) particle.draw();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (prefersReducedMotion) {
      renderStaticFrame();
    } else {
      animate();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-blue-950/20 pointer-events-none" />
      
      {/* Darker overlay for main page */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      {/* Subtle wave pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(64, 224, 208, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(135, 206, 235, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, rgba(32, 178, 170, 0.2) 0%, transparent 50%)`,
          animation: 'waveFlow 20s ease-in-out infinite'
        }}
      />

      <style jsx>{`
        @keyframes waveFlow {
          0%, 100% { 
            transform: translateX(0) translateY(0) scale(1);
            opacity: 0.05;
          }
          33% { 
            transform: translateX(-20px) translateY(-10px) scale(1.1);
            opacity: 0.08;
          }
          66% { 
            transform: translateX(20px) translateY(10px) scale(0.9);
            opacity: 0.03;
          }
        }
      `}</style>
    </div>
  );
}