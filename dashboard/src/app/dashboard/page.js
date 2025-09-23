'use client';

import RiskOverTime from '@/components/dashboard/RiskOverTime';
import RiskDistribution from '@/components/dashboard/RiskDistribution';
import WorldMap from '@/components/dashboard/WorldMap';
import StatsGrid from '@/components/dashboard/StatsGrid';
import AlertsByRegion from '@/components/dashboard/AlertsByRegion';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
          <RiskDistribution />
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
          <RiskOverTime />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
            <WorldMap />
          </div>
        </div>
        <div className="space-y-4">
          <StatsGrid />
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-800">
            <AlertsByRegion />
          </div>
        </div>
      </div>
    </div>
  );
}
