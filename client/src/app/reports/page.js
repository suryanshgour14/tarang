'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from "next/image";
import OceanParticleBackground from '@/components/OceanParticleBackground';
import ReportForm from '@/components/home/report-form';
import { FloatingDock } from '@/components/ui/floatingDock';
import {
  IconHome,
  IconFileText,
  IconBell,
  IconUser,
  IconUserCircle,
  IconUserPlus,
} from "@tabler/icons-react";
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';

// Dynamically import the Leaflet map component to avoid SSR issues
const LeafletReportsMap = dynamic(() => import('@/components/reports/LeafletReportsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-white text-lg">Loading map...</div>
    </div>
  )
});

export default function ReportsPage() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    newReports: 0,
    avgSentiment: 0
  });

  useEffect(() => {
    // Fetch basic stats - using mock data for now
    setStats({
      totalReports: 1247,
      verifiedReports: 856,
      newReports: 67,
      avgSentiment: 0.72
    });
  }, []);

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
              {/* Gmail Profile Picture */}
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <Image
                  src={user.user_metadata.avatar_url || user.user_metadata.picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover border-2 border-cyan-400 hover:border-cyan-300 transition-colors"
                />
              ) : (
                // Fallback if no profile picture available
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

  const fetchStats = async () => {
    try {
      // Try to fetch from the actual API
      const response = await apiService.getReportStats();
      
      if (response && response.success && response.data) {
        setStats({
          totalReports: response.data.total_reports || 0,
          verifiedReports: response.data.verified_reports || 0,
          newReports: response.data.new_reports || 0,
          avgSentiment: response.data.avg_sentiment || 0
        });
      } else {
        // Use demo data when API is not available
        setStats({
          totalReports: 1247,
          verifiedReports: 892,
          newReports: 355,
          avgSentiment: 0.73
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to mock data
      setStats({
        totalReports: 1247,
        verifiedReports: 892,
        newReports: 355,
        avgSentiment: 0.73
      });
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
              Ocean Hazard Reports
            </h1>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
              Comprehensive visualization and analysis of oceanic hazards including tsunamis, cyclones, 
              storm surges, and coastal flooding across India&apos;s coastal regions.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
            <div className="rounded-xl p-6 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Total Reports</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {stats.totalReports.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-6 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Verified</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                {stats.verifiedReports.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-6 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Pending</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {stats.newReports.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-6 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Response Rate</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                {(stats.avgSentiment * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Map Section */}
          <div className="rounded-xl p-8 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-cyan-400 mb-4">Interactive Hazard Map</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Real-time visualization of oceanic hazard reports across India&apos;s coastal regions. 
                Click on markers to view detailed information about each reported hazard.
              </p>
            </div>
            
            <LeafletReportsMap />
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            <div className="rounded-xl p-8 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-2xl font-bold text-white mb-6">Hazard Distribution</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 font-medium">Tsunami Risk</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[35%] h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"></div>
                    </div>
                    <span className="text-white font-bold min-w-[3rem] text-right">35%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 font-medium">Cyclone Activity</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[28%] h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></div>
                    </div>
                    <span className="text-white font-bold min-w-[3rem] text-right">28%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 font-medium">Storm Surge</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[22%] h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"></div>
                    </div>
                    <span className="text-white font-bold min-w-[3rem] text-right">22%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 font-medium">Coastal Flooding</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[15%] h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"></div>
                    </div>
                    <span className="text-white font-bold min-w-[3rem] text-right">15%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-8 backdrop-blur-md border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
              <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border-l-4 border-red-500">
                  <div className="text-slate-300">
                    <span className="text-white font-semibold">8 tsunami alerts</span> reported in the last 24 hours
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border-l-4 border-amber-500">
                  <div className="text-slate-300">
                    <span className="text-white font-semibold">3 cyclones</span> currently tracked by monitoring systems
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border-l-4 border-orange-500">
                  <div className="text-slate-300">
                    <span className="text-white font-semibold">Chennai coast</span> designated as high tsunami risk zone
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border-l-4 border-cyan-500">
                  <div className="text-slate-300">
                    <span className="text-white font-semibold">Kochi region</span> under active storm surge monitoring
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Form Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Submit New Report
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Help strengthen our coastal monitoring network by reporting oceanic hazards, 
              emergency situations, or environmental threats in your area.
            </p>
          </div>
          <div className="flex justify-center">
            <ReportForm />
          </div>
          </div>
        </div>
        
        {/* Footer - positioned at bottom */}
        <div className="relative z-10 mb-20">
          <div className="max-w-7xl mx-auto px-4">
            <hr className="border-t border-slate-700/50 mb-4" />
            <div className="flex justify-between items-center text-sm text-slate-500">
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
  