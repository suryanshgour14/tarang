'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const demoHeatData = [
  [13.0827, 80.2707, 0.8], // Chennai
  [19.0760, 72.8777, 0.6], // Mumbai
  [22.5726, 88.3639, 0.7], // Kolkata
  [11.9416, 79.8083, 0.5], // Pondicherry
  // Add more coordinates with intensity
];

export default function CoastalHeatmap() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!mapRef.current) {
        const map = L.map('map').setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const heat = L.heatLayer(demoHeatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: '#3b82f6',
            0.6: '#6366f1',
            0.8: '#8b5cf6',
            1.0: '#d946ef'
          }
        }).addTo(map);

        mapRef.current = map;
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Coastal Activity Heatmap</h2>
      <div id="map" className="h-[500px] rounded-lg" />
    </div>
  );
}