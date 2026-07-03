'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { dashboardApi } from '../../lib/api';

const demoHeatData = [
  [13.0827, 80.2707, 0.8], // Chennai
  [19.0760, 72.8777, 0.6], // Mumbai
  [22.5726, 88.3639, 0.7], // Kolkata
  [11.9416, 79.8083, 0.5], // Pondicherry
  // Add more coordinates with intensity
];

export default function CoastalHeatmap() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [heatData, setHeatData] = useState(null); // null = still loading

  useEffect(() => {
    let cancelled = false;
    dashboardApi.getReportsHeatmap()
      .then((result) => {
        if (cancelled) return;
        const features = result.data?.features || [];
        if (features.length === 0) {
          setHeatData(demoHeatData);
          return;
        }
        const maxCount = Math.max(...features.map(f => f.properties.count));
        setHeatData(features.map(f => [
          f.geometry.coordinates[1], // GeoJSON is [lon, lat]
          f.geometry.coordinates[0],
          Math.max(0.3, f.properties.count / maxCount),
        ]));
      })
      .catch(() => { if (!cancelled) setHeatData(demoHeatData); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current && heatData) {
      // Wait for container to have dimensions
      const checkDimensions = () => {
        const container = containerRef.current;
        if (container && container.offsetHeight > 0 && container.offsetWidth > 0) {
          if (!mapRef.current) {
            try {
              const map = L.map(container).setView([20.5937, 78.9629], 5);

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
              }).addTo(map);

              const heat = L.heatLayer(heatData, {
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
              
              // Force map to resize after a short delay
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.invalidateSize();
                }
              }, 100);
            } catch (error) {
              console.error('Error initializing map:', error);
            }
          }
        } else {
          // Retry after a short delay if dimensions aren't ready
          setTimeout(checkDimensions, 100);
        }
      };

      checkDimensions();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [heatData]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Coastal Activity Heatmap</h2>
      <div 
        ref={containerRef}
        className="h-[500px] w-full rounded-lg bg-gray-800" 
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}