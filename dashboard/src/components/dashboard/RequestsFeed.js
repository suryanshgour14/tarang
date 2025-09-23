'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const demoRequests = [
  {
    id: 1,
    location: 'Chennai Beach, Tamil Nadu',
    description: 'Unusual high tide observed with strong waves',
    image: '/demo/wave1.jpg',
    timestamp: '2024-02-20T10:30:00Z',
    status: 'pending',
    coordinates: { lat: 13.0827, lng: 80.2707 }
  },
  // Add more demo requests...
];

export default function RequestsFeed() {
  const [requests, setRequests] = useState(demoRequests);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleAction = (id, action) => {
    if (action === 'reject') {
      setRequests(requests.filter(req => req.id !== id));
    } else {
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      ));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Crowdsourced Reports</h2>
      
      <div className="space-y-4">
        <AnimatePresence>
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex gap-4">
                <div className="relative w-32 h-32 cursor-pointer"
                     onClick={() => setSelectedImage(request.image)}>
                  <Image
                    src={request.image}
                    alt="Report image"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{request.location}</h3>
                  <p className="text-slate-300 mt-1">{request.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAction(request.id, 'approve')}
                      className="px-4 py-2 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(request.id, 'reject')}
                      className="px-4 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <Image
                src={selectedImage}
                alt="Enlarged view"
                width={800}
                height={600}
                className="object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}