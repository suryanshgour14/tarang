export const mockData = {
  stats: {
    cloudProviders: 4,
    accounts: 5,
    assets: 66370,
    iamUsers: 503,
    alerts: 356
  },
  regions: [
    {
      id: 1,
      name: "North America",
      count: 156,
      lat: 40.7128,
      lng: -74.0060,
      risk: 75,
      alerts: [
        { id: 1, type: "security", severity: "high", timestamp: "2025-09-23" },
        { id: 2, type: "performance", severity: "medium", timestamp: "2025-09-22" }
      ]
    },
    {
      id: 2,
      name: "Europe",
      count: 203,
      lat: 51.5074,
      lng: -0.1278,
      risk: 62,
      alerts: [
        { id: 3, type: "network", severity: "high", timestamp: "2025-09-23" },
        { id: 4, type: "security", severity: "low", timestamp: "2025-09-21" }
      ]
    },
    // Add more regions as needed
  ],
  timeSeriesData: [
    { month: "Jan", risk: 65, alerts: 120, issues: 45 },
    { month: "Feb", risk: 72, alerts: 140, issues: 52 },
    // Add more monthly data
  ]
};