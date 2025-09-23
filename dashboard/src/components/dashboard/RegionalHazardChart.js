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

const demoData = [
  { region: 'Tamil Nadu Coast', reports: 156, severity: 'high' },
  { region: 'Kerala Coast', reports: 129, severity: 'medium' },
  { region: 'Andhra Coast', reports: 98, severity: 'high' },
  { region: 'Gujarat Coast', reports: 87, severity: 'low' },
  { region: 'Maharashtra Coast', reports: 76, severity: 'medium' },
  { region: 'Odisha Coast', reports: 65, severity: 'low' },
  { region: 'West Bengal Coast', reports: 54, severity: 'medium' },
];

export default function RegionalHazardChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const sortedData = [...demoData].sort((a, b) => b.reports - a.reports);
    const timer = setTimeout(() => {
      setData(sortedData);
    }, 500);
    return () => clearTimeout(timer);
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