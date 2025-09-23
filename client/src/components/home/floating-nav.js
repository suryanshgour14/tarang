'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function FloatingNav() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState(3); // Example notification count

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
          {!isAuthenticated ? (
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
                onClick={() => {
                  window.location.href = '/auth';
                }}
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
                onClick={() => {
                  window.location.href = '/auth?mode=signup';
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              {/* Notification Button */}
              <div className="relative">
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
                  title="Notifications"
                >
                  {/* Notification Bell Icon SVG */}
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21" />
                  </svg>
                </button>
                
                {/* Notification Badge */}
                {notifications > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: '#ff6b6b',
                      color: 'white',
                      fontSize: '10px'
                    }}
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </div>
              
              {/* Profile Circle */}
              <div 
                className="w-8 h-8 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 overflow-hidden"
                style={{
                  background: user?.user_metadata?.avatar_url || user?.user_metadata?.picture 
                    ? 'none' 
                    : 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  boxShadow: '0 0 15px rgba(64, 224, 208, 0.4)',
                  backgroundImage: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
                    ? `url("${user.user_metadata.avatar_url || user.user_metadata.picture}")`
                    : 'url("data:image/svg+xml,%3csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3ccircle cx=\'50\' cy=\'35\' r=\'15\' fill=\'%230f2942\'/%3e%3cpath d=\'M20 75 Q50 60 80 75 Q50 90 20 75\' fill=\'%230f2942\'/%3e%3c/svg%3e")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={() => window.location.href = '/account'}
                title="Account Settings"
              >
                {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                  <img 
                    src={user.user_metadata.avatar_url || user.user_metadata.picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = 'linear-gradient(135deg, #40E0D0, #87CEEB)'
                      e.target.parentElement.style.backgroundImage = 'url("data:image/svg+xml,%3csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3ccircle cx=\'50\' cy=\'35\' r=\'15\' fill=\'%230f2942\'/%3e%3cpath d=\'M20 75 Q50 60 80 75 Q50 90 20 75\' fill=\'%230f2942\'/%3e%3c/svg%3e")'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: '#0f2942' }}>
                    {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu button - only show on mobile */}
      <div className="md:hidden absolute right-4 top-1/2 transform -translate-y-1/2">
        <button 
          className="w-8 h-8 flex flex-col justify-center items-center space-y-1"
          style={{ color: '#B0E0E6' }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          ) : (
            <>
              <div className="w-4 h-0.5 bg-current rounded"></div>
              <div className="w-4 h-0.5 bg-current rounded"></div>
              <div className="w-4 h-0.5 bg-current rounded"></div>
            </>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex flex-col space-y-3">
            <Link 
              href="/reports" 
              className="text-white/80 hover:text-white transition-colors py-2"
              style={{ color: '#B0E0E6' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reports
            </Link>
            <Link 
              href="/about" 
              className="text-white/80 hover:text-white transition-colors py-2"
              style={{ color: '#B0E0E6' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="text-white/80 hover:text-white transition-colors py-2"
              style={{ color: '#B0E0E6' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-2 pt-2 border-t border-white/20">
                <button 
                  className="text-left text-sm font-medium px-3 py-2 rounded-full transition-all duration-300"
                  style={{
                    color: '#B0E0E6',
                    border: '1px solid rgba(176, 224, 230, 0.3)',
                  }}
                  onClick={() => {
                    window.location.href = '/auth';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </button>
                <button 
                  className="text-sm font-medium px-3 py-2 rounded-full transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                    color: '#0f2942',
                    boxShadow: '0 2px 8px rgba(64, 224, 208, 0.3)'
                  }}
                  onClick={() => {
                    window.location.href = '/auth?mode=signup';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden"
                    style={{
                      background: user?.user_metadata?.avatar_url || user?.user_metadata?.picture 
                        ? 'none' 
                        : 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                      backgroundImage: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
                        ? `url("${user.user_metadata.avatar_url || user.user_metadata.picture}")`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                      <img 
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.style.background = 'linear-gradient(135deg, #40E0D0, #87CEEB)'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: '#0f2942' }}>
                        {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-slate-300">
                      Welcome, {user?.user_metadata?.name || user?.email}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {user?.user_metadata?.role || 'Citizen Reporter'}
                    </div>
                  </div>
                </div>
                <button 
                  className="text-left text-sm font-medium px-3 py-2 rounded-full transition-all duration-300 mb-2"
                  style={{
                    color: '#B0E0E6',
                    border: '1px solid rgba(176, 224, 230, 0.3)',
                  }}
                  onClick={() => {
                    window.location.href = '/account';
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Account Settings
                </button>
                <button 
                  className="text-left text-sm font-medium px-3 py-2 rounded-full transition-all duration-300"
                  style={{
                    color: '#B0E0E6',
                    border: '1px solid rgba(176, 224, 230, 0.3)',
                  }}
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
