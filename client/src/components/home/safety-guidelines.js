'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SafetyGuidelines = () => {
  const [activeTab, setActiveTab] = useState('immediate-response');

  const safetyCategories = [
    {
      id: 'immediate-response',
      title: 'Immediate Response to Ocean Emergencies',
      guidelines: [
        'Stay calm and do not panic - clear thinking saves lives',
        'Move to higher ground immediately if you notice unusual wave patterns',
        'Alert others around you about the danger calmly but urgently',
        'Follow evacuation routes and instructions from local authorities',
        'Do not attempt to retrieve belongings - your life is the priority'
      ]
    },
    {
      id: 'evacuation-procedures',
      title: 'Evacuation Procedures',
      guidelines: [
        'Know your evacuation zones and routes before visiting coastal areas',
        'Head inland and to higher elevation as quickly as possible',
        'Use designated evacuation routes - do not take shortcuts',
        'Help elderly, children, and disabled individuals if safely possible',
        'Stay away from beaches, harbors, and low-lying coastal areas'
      ]
    },
    {
      id: 'warning-signs',
      title: 'Natural Warning Signs',
      guidelines: [
        'Ocean water receding unusually far from shore',
        'Loud roaring sound coming from the ocean',
        'Earthquake felt in coastal areas - even minor ones',
        'Unusual animal behavior - animals fleeing to higher ground',
        'Rapid rise or fall in sea level at harbors'
      ]
    },
    {
      id: 'communication',
      title: 'Communication During Emergency',
      guidelines: [
        'Keep emergency contacts list readily accessible',
        'Use text messages instead of calls - networks may be overloaded',
        'Listen to official emergency broadcasts and warnings',
        'Share your location with family members if possible',
        'Do not spread unverified information or rumors'
      ]
    },
    {
      id: 'shelter-safety',
      title: 'Finding Safe Shelter',
      guidelines: [
        'Seek shelter in sturdy buildings at least 3 stories high',
        'Stay away from windows and glass structures',
        'If no tall building available, move as far inland as possible',
        'Avoid bridges, overpasses, and structures near water',
        'Stay in your safe location until authorities declare all-clear'
      ]
    }
  ];

  const emergencyContacts = [
    { service: 'National Emergency Response', number: '112', description: 'All emergencies' },
    { service: 'Coastal Guard', number: '1554', description: 'Maritime emergencies' },
    { service: 'Disaster Management', number: '1078', description: 'Natural disasters' },
    { service: 'Medical Emergency', number: '108', description: 'Health emergencies' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
          Ocean Emergency Guidelines
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Essential emergency response procedures for ocean-related disasters and calamities.
        </p>
      </motion.div>

      {/* Guidelines Tabs */}
      <div className="mb-16">
        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {safetyCategories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setActiveTab(category.id)}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm
                ${activeTab === category.id 
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {category.title}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {safetyCategories.map((category) => (
            activeTab === category.id && (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.guidelines.map((guideline, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-800/30 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {guideline}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Emergency Contacts Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-16"
      >
        <h3 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-8">
          Emergency Contacts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {emergencyContacts.map((contact, index) => (
            <motion.div
              key={contact.service}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
              className="text-center p-6 hover:scale-105 transition-all duration-300"
            >
              <div className="mb-4">
                <div className="text-4xl font-bold text-cyan-400 mb-2 font-mono tracking-wider">
                  {contact.number}
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">{contact.service}</h4>
                <p className="text-sm text-slate-300">{contact.description}</p>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Remember Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-center mt-16"
      >
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Remember
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mb-6"></div>
          <p className="text-lg text-slate-300 leading-relaxed">
            When in doubt, don&apos;t go out. It&apos;s always better to be safe than sorry. 
            These guidelines can help save lives during ocean emergencies. Ocean conditions can change rapidly, 
            so always stay alert and prioritize safety over everything else.
          </p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default SafetyGuidelines;
