'use client'
import { useEffect, useRef, useState } from 'react';

export default function TestVideo() {
  const videoRef = useRef(null);
  const [videoStatus, setVideoStatus] = useState('Loading...');
  const [videoError, setVideoError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setVideoStatus('Loading video...');
      console.log('Video load started');
    };

    const handleLoadedData = () => {
      setVideoStatus('Video data loaded');
      console.log('Video data loaded');
    };

    const handleCanPlay = () => {
      setVideoStatus('Video can play');
      console.log('Video can play');
    };

    const handlePlay = () => {
      setVideoStatus('Video is playing');
      console.log('Video is playing');
    };

    const handleError = (e) => {
      setVideoError(e.target.error);
      setVideoStatus('Video error occurred');
      console.error('Video error:', e.target.error);
    };

    const handlePause = () => {
      setVideoStatus('Video paused');
      console.log('Video paused');
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('error', handleError);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const playVideo = async () => {
    try {
      await videoRef.current.play();
    } catch (error) {
      console.error('Play failed:', error);
      setVideoError(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Video Test Page</h1>
      
      <div className="mb-4">
        <p className="text-lg">Status: {videoStatus}</p>
        {videoError && (
          <p className="text-red-400">Error: {videoError.message || 'Unknown error'}</p>
        )}
      </div>

      <div className="mb-4">
        <button 
          onClick={playVideo}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4"
        >
          Play Video
        </button>
        <button 
          onClick={() => videoRef.current?.pause()}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Pause Video
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <video
          ref={videoRef}
          controls
          className="w-full h-auto"
          style={{ maxHeight: '500px' }}
        >
          <source src="/vecteezy_dark-underwater-with-light-ray-and-bubble-particle-floating_67021499.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Video Info:</h2>
        <ul className="space-y-2">
          <li>File: vecteezy_dark-underwater-with-light-ray-and-bubble-particle-floating_67021499.mp4</li>
          <li>Size: ~65MB</li>
          <li>Location: /public/ directory</li>
          <li>Format: MP4</li>
        </ul>
      </div>
    </div>
  );
}
