'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dashboardApi } from '../../lib/api';

const demoData = [
  { region: 'Tamil Nadu Coast', reports: 156, severity: 'high' },
  { region: 'Kerala Coast', reports: 129, severity: 'medium' },
  { region: 'Andhra Coast', reports: 98, severity: 'high' },
  { region: 'Gujarat Coast', reports: 87, severity: 'low' },
  { region: 'Maharashtra Coast', reports: 76, severity: 'medium' },
  { region: 'Odisha Coast', reports: 65, severity: 'low' },
  { region: 'West Bengal Coast', reports: 54, severity: 'medium' },
];

// Same coastal bounding boxes webscraping.py uses (INDIAN_COASTAL_REGIONS), so
// a report's lat/lon buckets into the same regions across both dashboards.
const COASTAL_REGIONS = {
  'Andhra Pradesh Coast': { latRange: [12.6, 19.9], lonRange: [76.8, 84.8] },
  'Goa Coast': { latRange: [14.9, 15.8], lonRange: [73.7, 74.3] },
  'Gujarat Coast': { latRange: [20.1, 24.7], lonRange: [68.2, 74.4] },
  'Karnataka Coast': { latRange: [11.3, 18.5], lonRange: [74.1, 78.6] },
  'Kerala Coast': { latRange: [8.2, 12.8], lonRange: [74.9, 77.4] },
  'Maharashtra Coast': { latRange: [15.6, 22.0], lonRange: [72.6, 80.9] },
  'Odisha Coast': { latRange: [17.8, 22.6], lonRange: [81.3, 87.5] },
  'Tamil Nadu Coast': { latRange: [8.1, 13.6], lonRange: [76.2, 80.3] },
  'West Bengal Coast': { latRange: [21.5, 27.2], lonRange: [85.8, 89.9] },
};

function regionFor(lat, lon) {
  for (const [region, { latRange, lonRange }] of Object.entries(COASTAL_REGIONS)) {
    if (lat >= latRange[0] && lat <= latRange[1] && lon >= lonRange[0] && lon <= lonRange[1]) {
      return region;
    }
  }
  return 'Other';
}

export default function RegionalHazardChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    dashboardApi.getReportsByGeohash(4)
      .then((result) => {
        if (cancelled) return;
        const cells = result.data || [];
        if (cells.length === 0) {
          setData([...demoData].sort((a, b) => b.reports - a.reports));
          return;
        }
        const counts = {};
        cells.forEach(cell => {
          const region = regionFor(cell.lat, cell.lon);
          counts[region] = (counts[region] || 0) + cell.count;
        });
        const real = Object.entries(counts)
          .map(([region, reports]) => ({ region, reports }))
          .sort((a, b) => b.reports - a.reports);
        setData(real);
      })
      .catch(() => {
        setData([...demoData].sort((a, b) => b.reports - a.reports));
      });
    return () => { cancelled = true; };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-xl">
          <p className="text-white font-semibold">{label}</p>
          <p className="text-blue-400">Reports: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] p-4">
      <h2 className="text-xl font-semibold text-white mb-4">
        Hazard Reports by Region
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={false}
            stroke="rgba(148, 163, 184, 0.1)"
          />
          <XAxis 
            type="number"
            stroke="#94a3b8"
            tickLine={false}
          />
          <YAxis 
            dataKey="region" 
            type="category" 
            scale="band" 
            tick={{ fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={false} // Remove hover effect completely
          />
          <Bar
            dataKey="reports"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            animationDuration={2000}
            animationBegin={200}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}