'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const demoUsers = [
  {
    id: 1,
    name: 'Rahul Kumar',
    role: 'Verified Contributor',
    region: 'Tamil Nadu Coast',
    status: 'active',
    reports: 23,
    accuracy: '95%',
    lastActive: '2 hours ago',
    avatar: '👤'
  },
  // Add more demo users...
];

export default function UserManagementPanel() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = {
    totalUsers: 1245,
    activeReporters: 89,
    verifiedContributors: 156,
    newRegistrations: 34,
    accuracyRate: '92%'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Add User
          </motion.button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(metrics).map(([key, value]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"
          >
            <h3 className="text-slate-400 text-sm">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-2xl font-semibold text-white mt-1">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white flex-grow"
        />
        <div className="flex gap-2">
          {['all', 'active', 'verified', 'new'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <AnimatePresence>
          {demoUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{user.avatar}</span>
                <div>
                  <h3 className="text-white font-medium">{user.name}</h3>
                  <p className="text-slate-400 text-sm">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white">{user.reports} Reports</p>
                  <p className="text-slate-400 text-sm">Accuracy: {user.accuracy}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  ⚙️
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}