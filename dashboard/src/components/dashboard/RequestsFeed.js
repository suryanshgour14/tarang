'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const demoRequests = [
  {
    id: 1,
    location: 'Chennai Beach, Tamil Nadu',
    description: 'Unusual high tide observed with strong waves',
    image: 'https://media.istockphoto.com/id/476044242/photo/sunrise-on-beach.jpg?s=612x612&w=0&k=20&c=wye8Ryn31nrmMT6DBzQ2BncW9PHvVkU7jjmUhFIdVNU=', // Replace with your image path
    timestamp: '2024-02-20T10:30:00Z',
    status: 'pending',
    coordinates: { lat: 13.0827, lng: 80.2707 }
  },
  {
    id: 2,
    location: 'Kovalam Beach, Kerala',
    description: 'Coastal erosion spotted, beach line receding rapidly',
    image: 'https://t4.ftcdn.net/jpg/05/58/87/41/360_F_558874150_UBXtzzXkvbVgno5GYNAftE3BT9B6mqV9.jpg', // Replace with your image path
    timestamp: '2024-02-20T09:15:00Z',
    status: 'pending',
    coordinates: { lat: 8.4004, lng: 76.9787 }
  },
  {
    id: 3,
    location: 'Marina Beach, Tamil Nadu',
    description: 'Large amount of plastic waste washed ashore after storm',
    image: 'https://images.firstpost.com/wp-content/uploads/2018/09/marinabeach380.jpg', // Replace with your image path
    timestamp: '2024-02-20T08:45:00Z',
    status: 'pending',
    coordinates: { lat: 13.0500, lng: 80.2824 }
  },
  {
    id: 4,
    location: 'Visakhapatnam Beach, Andhra Pradesh',
    description: 'Oil spill observed near fishing harbor, urgent attention needed',
    image: 'https://media-cdn.tripadvisor.com/media/photo-s/0d/56/77/e3/the-beach-at-night.jpg', // Replace with your image path
    timestamp: '2024-02-20T07:30:00Z',
    status: 'pending',
    coordinates: { lat: 17.7292, lng: 83.3046 }
  },
  {
    id: 5,
    location: 'Puri Beach, Odisha',
    description: 'Sudden changes in wave patterns noticed, potential rip current formation',
    image: 'https://media.istockphoto.com/id/1463637569/photo/puri-sea-beach-during-holiday-season-with-crowd-of-tourists-enjoying-beach-time-at-puri.jpg?s=612x612&w=0&k=20&c=YWTzQS9xHckWZlTU8W4dG2P2pER8gn1MVlHYWYOmQ88=',
    timestamp: '2024-02-20T06:15:00Z',
    status: 'pending',
    coordinates: { lat: 19.8134, lng: 85.8312 }
  },
  {
    id: 6,
    location: 'Goa Calangute Beach',
    description: 'Red tide phenomenon observed, water color changed significantly',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfX7yW7MV5rUGo4LFs_hm3FXkfHTbCqh81ag&s',
    timestamp: '2024-02-20T05:45:00Z',
    status: 'pending',
    coordinates: { lat: 15.5439, lng: 73.7527 }
  },
  {
    id: 7,
    location: 'Kanyakumari Coast',
    description: 'Multiple fishing nets damaged due to unexpected strong currents',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfX7yW7MV5rUGo4LFs_hm3FXkfHTbCqh81ag&s',
    timestamp: '2024-02-20T04:30:00Z',
    status: 'pending',
    coordinates: { lat: 8.0883, lng: 77.5385 }
  },
  {
    id: 8,
    location: 'Digha Beach, West Bengal',
    description: 'Unusual sea foam accumulation along the shoreline',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzTGZNw0rVOJvTWezGldnbcrCcGSKyo8-NAQ&s',
    timestamp: '2024-02-20T03:15:00Z',
    status: 'pending',
    coordinates: { lat: 21.6238, lng: 87.5055 }
  }
];

export default function RequestsFeed() {
  const [requests, setRequests] = useState(demoRequests);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 4;

  const handleAction = (id, action) => {
    if (action === 'reject') {
      setRequests(requests.filter(req => req.id !== id));
    } else {
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      ));
    }
  };

  // Calculate pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(requests.length / requestsPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Crowdsourced Reports</h2>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <motion.button
              key={i + 1}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {currentRequests.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex flex-col gap-4">
                <div 
                  className="relative w-full h-48 cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setSelectedImage(request.image)}
                >
                  <Image
                    src={request.image}
                    alt="Report image"
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">{request.location}</h3>
                  <p className="text-slate-300 mt-1 line-clamp-2">{request.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAction(request.id, 'approve')}
                      className="flex-1 px-4 py-2 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(request.id, 'reject')}
                      className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors"
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