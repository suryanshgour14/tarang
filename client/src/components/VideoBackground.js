'use client'
import { useEffect, useRef } from 'react';

export default function VideoBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.log('Video autoplay prevented:', error);
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/vecteezy_dark-underwater-with-light-ray-and-bubble-particle-floating_67021499.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Optional overlay for better text readability if needed later */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.1)' // Very subtle overlay
        }}
      />
    </div>
  );
}
