'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'High Risk', value: 30, color: '#ef4444' },
  { name: 'Medium Risk', value: 45, color: '#f97316' },
  { name: 'Low Risk', value: 25, color: '#22c55e' }
];

export default function RiskDistribution() {
  return (
    <div className="h-[300px]">
      <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}