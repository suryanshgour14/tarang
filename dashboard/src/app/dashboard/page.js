'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import RegionalHazardChart from '../../components/dashboard/RegionalHazardChart';
import RequestsFeed from '../../components/dashboard/RequestsFeed';
import CoastalHeatmap from '../../components/dashboard/CoastalHeatMap';
import EmergencyAlertPanel from '../../components/dashboard/EmergencyAlertPanel';
import Sidebar from '../../components/dashboard/Sidebar';
import IconButton from '../../components/dashboard/IconButton';
import UserManagementPanel from '../../components/dashboard/UserManagementPanel';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <IconButton 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <Sidebar isOpen={isSidebarOpen} />
      <motion.main 
        initial={false}
        animate={{
          marginLeft: isSidebarOpen ? '16rem' : '0',
          paddingLeft: '1rem'
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="min-h-screen"
      >
        <div className="container mx-auto p-4 space-y-4 pt-16 max-w-7xl">
          <header className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-slate-900/50 backdrop-blur-sm py-4 -mx-4 px-4">
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          </header>

          <motion.div 
            layout
            id="reports" 
            className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 scroll-mt-16"
          >
            <RequestsFeed />
          </motion.div>

          <motion.div 
            layout
            id="hazard-chart" 
            className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 scroll-mt-16"
          >
            <RegionalHazardChart />
          </motion.div>

          <motion.div 
            layout
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4"
          >
            <motion.div 
              layout
              id="emergency-alerts" 
              className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 scroll-mt-16"
            >
              <EmergencyAlertPanel />
            </motion.div>
            <motion.div 
              layout
              id="heatmap" 
              className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 scroll-mt-16"
            >
              <CoastalHeatmap />
            </motion.div>
          </motion.div>

          <motion.div 
            layout
            id="user-management" 
            className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 scroll-mt-16"
          >
            <UserManagementPanel />
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
