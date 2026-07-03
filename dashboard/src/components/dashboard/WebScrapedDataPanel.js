'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../../lib/api';

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.round(hours / 24)} day(s) ago`;
}

export default function WebScrapedDataPanel() {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dashboardApi.getRecentHazardEvents({ limit: 20, hours: 72 })
      .then((result) => {
        if (!cancelled) {
          setEvents(result.data || []);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  const countBySource = (source) => events.filter(e => e.source === source).length;
  const recentEvents = events.slice(0, 3);
  const borderColors = ['border-red-500', 'border-amber-500', 'border-blue-500'];

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
          <h3 className="text-sm font-medium text-slate-300 mb-2">NewsAPI</h3>
          <div className="text-2xl font-bold text-cyan-400">{countBySource('NewsAPI')}</div>
          <p className="text-xs text-slate-400">Events discovered (72h)</p>
        </motion.div>
        <motion.div
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">NASA EONET</h3>
          <div className="text-2xl font-bold text-blue-400">{countBySource('NASA EONET')}</div>
          <p className="text-xs text-slate-400">Events discovered (72h)</p>
        </motion.div>
        <motion.div
          className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">INCOIS</h3>
          <div className="text-2xl font-bold text-amber-400">{countBySource('INCOIS')}</div>
          <p className="text-xs text-slate-400">Events discovered (72h)</p>
        </motion.div>
      </div>

      <div className="space-y-4">
        {loaded && recentEvents.length === 0 && (
          <p className="text-slate-400 text-sm py-4 text-center">
            No hazard events discovered yet. These populate once users trigger a nearby hazard search.
          </p>
        )}
        {recentEvents.map((event, i) => (
          <motion.div
            key={event.event_unique_id || i}
            className={`bg-slate-800/30 rounded-lg p-4 border-l-4 ${borderColors[i % borderColors.length]}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h4 className="font-medium text-white mb-2">{event.title}</h4>
            <p className="text-slate-300 text-sm mb-2">{event.description}</p>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Source: {event.source}</span>
              <span>{timeAgo(event.event_time)}</span>
            </div>
          </motion.div>
        ))}
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