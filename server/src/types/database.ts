export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'citizen' | 'official' | 'analyst';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: 'citizen' | 'official' | 'analyst';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'citizen' | 'official' | 'analyst';
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          media_urls: string[];
          location: any; // PostGIS geography type
          status: 'new' | 'verified' | 'rejected';
          sentiment: number | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          media_urls?: string[];
          location?: any;
          status?: 'new' | 'verified' | 'rejected';
          sentiment?: number | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          media_urls?: string[];
          location?: any;
          status?: 'new' | 'verified' | 'rejected';
          sentiment?: number | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number;
          lon1: number;
          lat2: number;
          lon2: number;
        };
        Returns: number;
      };
      get_reports_in_bbox: {
        Args: {
          min_lat: number;
          min_lon: number;
          max_lat: number;
          max_lon: number;
        };
        Returns: {
          id: string;
          user_id: string;
          description: string;
          media_urls: string[];
          location: any;
          status: string;
          sentiment: number | null;
          tags: string[];
          created_at: string;
        }[];
      };
      get_heatmap_data: {
        Args: {
          grid_size?: number;
          start_date?: string;
          end_date?: string;
        };
        Returns: {
          grid_id: string;
          lat: number;
          lon: number;
          count: number;
          avg_sentiment: number | null;
          geojson: any;
        }[];
      };
      get_reports_by_geohash: {
        Args: {
          geohash_precision?: number;
        };
        Returns: {
          geohash: string;
          lat: number;
          lon: number;
          count: number;
          avg_sentiment: number | null;
        }[];
      };
    };
    Enums: {
      user_role: 'citizen' | 'official' | 'analyst';
      report_status: 'new' | 'verified' | 'rejected';
    };
  };
}
