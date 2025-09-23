'use client'

import { useState } from 'react';
import Link from 'next/link';

export default function FloatingNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <nav 
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-2xl"
      style={{
        width: '30%',
        minWidth: '320px',
        maxWidth: '480px',
        background: 'rgba(15, 41, 66, 0.7)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(135, 206, 235, 0.1),
          inset 0 1px 1px rgba(255, 255, 255, 0.1)
        `
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo Section - Clickable */}
        <Link href="/" className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
              color: '#0f2942',
              boxShadow: '0 0 15px rgba(64, 224, 208, 0.3)'
            }}
          >
            T
          </div>
          <span 
            className="text-lg font-semibold cursor-pointer"
            style={{
              color: '#87CEEB',
              textShadow: '0 0 10px rgba(135, 206, 235, 0.5)'
            }}
          >
            Tarang
          </span>
        </Link>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {!isLoggedIn ? (
            <>
              <button 
                className="text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  color: '#B0E0E6',
                  border: '1px solid rgba(176, 224, 230, 0.3)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(176, 224, 230, 0.1)';
                  e.target.style.borderColor = 'rgba(176, 224, 230, 0.5)';
                  e.target.style.boxShadow = '0 0 10px rgba(176, 224, 230, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(176, 224, 230, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
                onClick={() => setIsLoggedIn(!isLoggedIn)}
              >
                Login
              </button>
              <button 
                className="text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  color: '#0f2942',
                  boxShadow: '0 2px 8px rgba(64, 224, 208, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(64, 224, 208, 0.4)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 2px 8px rgba(64, 224, 208, 0.3)';
                  e.target.style.transform = 'scale(1)';
                }}
                onClick={() => setIsLoggedIn(!isLoggedIn)}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              {/* Upload Button */}
              <button 
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 hover:scale-110"
                style={{
                  background: 'rgba(64, 224, 208, 0.2)',
                  border: '1px solid rgba(64, 224, 208, 0.4)',
                  color: '#40E0D0',
                  boxShadow: '0 0 10px rgba(64, 224, 208, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(64, 224, 208, 0.3)';
                  e.target.style.boxShadow = '0 0 15px rgba(64, 224, 208, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(64, 224, 208, 0.2)';
                  e.target.style.boxShadow = '0 0 10px rgba(64, 224, 208, 0.3)';
                }}
                title="Upload"
              >
                {/* Upload Icon SVG */}
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  <path d="M12,11L16,15H13V19H11V15H8L12,11Z" />
                </svg>
              </button>
              
              {/* Profile Circle */}
              <div 
                className="w-8 h-8 rounded-full cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  boxShadow: '0 0 15px rgba(64, 224, 208, 0.4)',
                  backgroundImage: 'url("data:image/svg+xml,%3csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3ccircle cx=\'50\' cy=\'35\' r=\'15\' fill=\'%230f2942\'/%3e%3cpath d=\'M20 75 Q50 60 80 75 Q50 90 20 75\' fill=\'%230f2942\'/%3e%3c/svg%3e")',
                  backgroundSize: 'cover'
                }}
                onClick={() => setIsLoggedIn(!isLoggedIn)}
                title="Profile"
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile menu indicator */}
      <div className="md:hidden absolute right-4 top-1/2 transform -translate-y-1/2">
        <button 
          className="w-6 h-6 flex flex-col justify-center items-center space-y-1"
          style={{ color: '#B0E0E6' }}
        >
          <div className="w-4 h-0.5 bg-current rounded"></div>
          <div className="w-4 h-0.5 bg-current rounded"></div>
          <div className="w-4 h-0.5 bg-current rounded"></div>
        </button>
      </div>
    </nav>
  );
}
