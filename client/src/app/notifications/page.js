'use client'

import { useState, useEffect } from 'react';
import Image from "next/image";
import OceanParticleBackground from '@/components/OceanParticleBackground';
import { FloatingDock } from '@/components/ui/floatingDock';
import {
  IconHome,
  IconFileText,
  IconBell,
  IconUser,
  IconUserCircle,
  IconUserPlus,
  IconAlertTriangle,
  IconInfoCircle,
  IconMapPin,
  IconClock,
  IconWave,
  IconWind,
  IconCloud,
} from "@tabler/icons-react";
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [location, setLocation] = useState({ city: 'Mumbai', state: 'Maharashtra' });

  useEffect(() => {
    // Get user location (mock for now)
    getUserLocation();
    // Fetch location-based notifications
    fetchLocationNotifications();
  }, []);

  const getUserLocation = () => {
    // Mock location - in real app would use geolocation API
    setLocation({ city: 'Mumbai', state: 'Maharashtra' });
  };

  const fetchLocationNotifications = () => {
    // Mock notifications based on location
    const mockNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Cyclone Alert - High Priority',
        message: 'Cyclone Biparjoy approaching Mumbai coast. Expected landfall in 18-24 hours. Evacuate low-lying areas immediately.',
        location: 'Mumbai, Maharashtra',
        time: '2 hours ago',
        severity: 'high',
        icon: IconAlertTriangle
      },
      {
        id: 2,
        type: 'alert',
        title: 'Tsunami Watch Issued',
        message: 'Underwater seismic activity detected 150km off Mumbai coast. Tsunami watch in effect for coastal areas.',
        location: 'Western Coast, Maharashtra',
        time: '4 hours ago',
        severity: 'medium',
        icon: IconAlertTriangle
      },
      {
        id: 3,
        type: 'info',
        title: 'Storm Surge Warning',
        message: 'High tide combined with strong winds may cause coastal flooding in low-lying areas of Worli and Bandra.',
        location: 'Mumbai Metropolitan Region',
        time: '6 hours ago',
        severity: 'medium',
        icon: IconWind
      },
      {
        id: 4,
        type: 'info',
        title: 'Weather Advisory',
        message: 'Heavy rainfall expected in coastal Karnataka and Goa. Fishermen advised not to venture into sea.',
        location: 'Karnataka & Goa Coast',
        time: '8 hours ago',
        severity: 'low',
        icon: IconInfoCircle
      },
      {
        id: 5,
        type: 'resolved',
        title: 'All Clear - Previous Alert Resolved',
        message: 'Previous tsunami warning has been lifted. Normal coastal activities can resume with caution.',
        location: 'Mumbai, Maharashtra',
        time: '12 hours ago',
        severity: 'resolved',
        icon: IconInfoCircle
      }
    ];

    setNotifications(mockNotifications);
  };

  // Navigation items for FloatingDock
  const baseLinks = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "/",
    },
    {
      title: "Report",
      icon: (
        <IconFileText className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "/reports",
    },
    {
      title: "Notifications",
      icon: (
        <IconBell className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
      ),
      href: "/notifications",
    },
  ];

  const authLinks = isAuthenticated
    ? [
        {
          title: "Profile",
          icon: (
            <div className="relative h-full w-full">
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <Image
                  src={user.user_metadata.avatar_url || user.user_metadata.picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover border-2 border-cyan-400 hover:border-cyan-300 transition-colors"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center border-2 border-cyan-400 hover:border-cyan-300 transition-colors">
                  <IconUser className="h-3/4 w-3/4 text-white" />
                </div>
              )}
            </div>
          ),
          href: "/account",
        },
      ]
    : [
        {
          title: "Login",
          icon: (
            <IconUserCircle className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
          ),
          href: "/auth",
        },
        {
          title: "Sign Up",
          icon: (
            <IconUserPlus className="h-full w-full text-cyan-400 hover:text-cyan-300 transition-colors" />
          ),
          href: "/auth",
        },
      ];

  const navLinks = [...baseLinks, ...authLinks];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'from-red-500 to-red-400';
      case 'medium':
        return 'from-amber-500 to-amber-400';
      case 'low':
        return 'from-blue-500 to-blue-400';
      case 'resolved':
        return 'from-green-500 to-green-400';
      default:
        return 'from-slate-500 to-slate-400';
    }
  };

  const getSeverityBorder = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/30';
      case 'medium':
        return 'border-amber-500/30';
      case 'low':
        return 'border-blue-500/30';
      case 'resolved':
        return 'border-green-500/30';
      default:
        return 'border-slate-500/30';
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Ocean Particle Background */}
      <OceanParticleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-20">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent mb-6">
                Ocean Alerts & Notifications
              </h1>
              <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                Real-time warnings and alerts for oceanic hazards in your area. Stay informed about 
                tsunamis, cyclones, storm surges, and other coastal threats.
              </p>
            </div>

            {/* Location Info */}
            <div className="mb-12">
              <div className="rounded-xl p-6 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-3">
                  <IconMapPin className="h-6 w-6 text-cyan-400" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white">Your Location</h3>
                    <p className="text-slate-300">{location.city}, {location.state}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-6">
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`rounded-xl p-6 backdrop-blur-md border ${getSeverityBorder(notification.severity)} bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 hover:from-slate-900/60 hover:via-slate-800/40 hover:to-slate-900/60 transition-all duration-300`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-full bg-gradient-to-r ${getSeverityColor(notification.severity)} flex-shrink-0`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white pr-4">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-slate-400 text-sm flex-shrink-0">
                            <IconClock className="h-4 w-4" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-300 leading-relaxed mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <IconMapPin className="h-4 w-4 text-cyan-400" />
                          <span className="text-slate-400">{notification.location}</span>
                        </div>
                      </div>

                      {/* Severity Indicator */}
                      <div className="flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getSeverityColor(notification.severity)}`}>
                          {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Emergency Contacts */}
            <div className="mt-16">
              <div className="rounded-xl p-8 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Emergency Contacts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">National Emergency</h3>
                    <p className="text-2xl font-bold text-white">112</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Coast Guard</h3>
                    <p className="text-2xl font-bold text-white">1554</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">NDRF</h3>
                    <p className="text-2xl font-bold text-white">9711077372</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - positioned at bottom */}
        <div className="relative z-10 mb-32">
          <div className="max-w-7xl mx-auto px-4">
            <hr className="border-t border-slate-700/50 mb-4" />
            <div className="flex justify-between items-center text-sm text-slate-400">
              <span>Ministry of Earth Sciences (MoES)</span>
              <span>Made by : Team Tarang</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* FloatingDock Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <FloatingDock
          mobileClassName="translate-y-0"
          desktopClassName=""
          items={navLinks}
        />
      </div>
    </div>
  );
}
