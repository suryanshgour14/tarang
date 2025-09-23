'use client';

import RegionalHazardChart from '@/components/dashboard/RegionalHazardChart';
import RequestsFeed from '@/components/dashboard/RequestsFeed';
import CoastalHeatmap from '@/components/dashboard/CoastalHeatmap';
import EmergencyAlertPanel from '@/components/dashboard/EmergencyAlertPanel';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Ocean Hazard Reports</h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            1W
          </button>
          <button className="px-4 py-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            1M
          </button>
          <button className="px-4 py-2 rounded-md bg-blue-500 text-white">
            1Y
          </button>
        </div>
      </header>

      {/* Regional Hazard Chart */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800">
        <RegionalHazardChart />
      </div>

      {/* Emergency Alert and Heatmap Container */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800">
          <EmergencyAlertPanel />
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800">
          <CoastalHeatmap />
        </div>
      </div>

      {/* Crowdsourced Reports Section */}
      <div className="mt-4 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800">
        <RequestsFeed />
      </div>
    </div>
  );
}
