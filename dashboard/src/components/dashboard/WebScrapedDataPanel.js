'use client';

import { motion } from 'framer-motion';

export default function WebScrapedDataPanel() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
          Web Scraped Data
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-400">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <motion.div 
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">News Sources</h3>
          <div className="text-2xl font-bold text-cyan-400">12</div>
          <p className="text-xs text-slate-400">Active feeds monitored</p>
        </motion.div>
        <motion.div 
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">Social Media</h3>
          <div className="text-2xl font-bold text-blue-400">847</div>
          <p className="text-xs text-slate-400">Posts analyzed today</p>
        </motion.div>
        <motion.div 
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">Weather APIs</h3>
          <div className="text-2xl font-bold text-amber-400">5</div>
          <p className="text-xs text-slate-400">Data sources integrated</p>
        </motion.div>
      </div>

      <div className="space-y-4">
        <motion.div 
          className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-red-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-medium text-white mb-2">Recent Alert from News Sources</h4>
          <p className="text-slate-300 text-sm mb-2">
            "Cyclonic disturbance detected in Bay of Bengal, expected to intensify over next 48 hours..."
          </p>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Source: Times of India</span>
            <span>2 hours ago</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-amber-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-medium text-white mb-2">Social Media Trending</h4>
          <p className="text-slate-300 text-sm mb-2">
            "Increased mentions of 'coastal flooding' and 'high tide warnings' in Mumbai region..."
          </p>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Source: Twitter/X API</span>
            <span>45 minutes ago</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-blue-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-medium text-white mb-2">Weather API Update</h4>
          <p className="text-slate-300 text-sm mb-2">
            "Wind speeds reaching 65 km/h along Karnataka coast, storm surge warnings issued..."
          </p>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Source: OpenWeatherMap API</span>
            <span>15 minutes ago</span>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <motion.button 
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Configure Sources
        </motion.button>
        <motion.button 
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View All Data
        </motion.button>
      </div>
    </div>
  );
}