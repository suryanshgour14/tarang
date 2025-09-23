// API service for communicating with the Tarang server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 5000, // 5 second timeout
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Don't throw error for 404s, just return null to use demo data
        if (response.status === 404) {
          console.warn(`API endpoint not found: ${endpoint}. Using demo data.`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('API request failed, using demo data:', error.message);
      return null; // Return null instead of throwing to use demo data
    }
  }

  // Reports API
  async getReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/reports${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async getReportById(reportId) {
    return this.request(`/reports/${reportId}`);
  }

  async createReport(reportData) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getHeatmapData(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/reports/heatmap${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async getReportStats() {
    return this.request('/reports/stats');
  }

  async getReportsByGeohash(precision = 6) {
    return this.request(`/reports/geohash?precision=${precision}`);
  }

  // Auth API
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Users API
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateUser(userData) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
