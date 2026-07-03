'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { id: 'reports', label: 'Crowdsourced Reports', icon: '📱' },
  { id: 'hazard-chart', label: 'Regional Hazards', icon: '📊' },
  { id: 'emergency-alerts', label: 'Emergency Alerts', icon: '🚨' },
  { id: 'heatmap', label: 'Coastal Heatmap', icon: '🗺' },
  { id: 'user-management', label: 'User Management', icon: '👥' },
];

export default function Sidebar({ isOpen }) {
  const [activeSection, setActiveSection] = useState('hazard-chart');

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 pt-20 px-4 z-10"
        >
          <div className="space-y-4">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors w-full ${
                  activeSection === item.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}