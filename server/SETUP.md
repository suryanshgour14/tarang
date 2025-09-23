# 🚀 Ocean Hazard Backend Setup Guide

## Quick Start with Your Supabase Credentials

You already have your Supabase credentials! Let's get everything set up:

### 1. Run the Setup Script
```bash
npm run setup
```

This will create your `.env` file with your Supabase credentials.

### 2. Get Your Service Role Key
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/qqggoiysyjnwuyvzwrrr)
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Update your `.env` file with the service role key

### 3. Run Database Migrations
In your Supabase dashboard, go to **SQL Editor** and run these migrations in order:

#### Migration 1: Create Users Table
```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('citizen', 'official', 'analyst')) NOT NULL DEFAULT 'citizen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 2: Create Reports Table
```sql
-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    location GEOGRAPHY(POINT, 4326),
    status TEXT CHECK (status IN ('new', 'verified', 'rejected')) DEFAULT 'new',
    sentiment FLOAT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_sentiment ON reports(sentiment);

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);

-- Create updated_at trigger
CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 FLOAT, 
    lon1 FLOAT, 
    lat2 FLOAT, 
    lon2 FLOAT
) RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get reports within bounding box
CREATE OR REPLACE FUNCTION get_reports_in_bbox(
    min_lat FLOAT,
    min_lon FLOAT,
    max_lat FLOAT,
    max_lon FLOAT
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    media_urls TEXT[],
    location GEOGRAPHY,
    status TEXT,
    sentiment FLOAT,
    tags TEXT[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        r.description,
        r.media_urls,
        r.location,
        r.status,
        r.sentiment,
        r.tags,
        r.created_at
    FROM reports r
    WHERE r.location && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326);
END;
$$ LANGUAGE plpgsql;
```

#### Migration 3: Create Heatmap Functions
```sql
-- Create function for heatmap aggregation
CREATE OR REPLACE FUNCTION get_heatmap_data(
    grid_size FLOAT DEFAULT 0.01,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
    grid_id TEXT,
    lat FLOAT,
    lon FLOAT,
    count INTEGER,
    avg_sentiment FLOAT,
    geojson JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH grid_cells AS (
        SELECT 
            ST_SnapToGrid(
                ST_Transform(location, 3857), 
                grid_size * 111000
            ) as grid_point,
            COUNT(*) as report_count,
            AVG(sentiment) as avg_sentiment,
            ST_Transform(
                ST_SnapToGrid(
                    ST_Transform(location, 3857), 
                    grid_size * 111000
                ), 
                4326
            ) as lat_lon
        FROM reports
        WHERE 
            (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
            AND location IS NOT NULL
        GROUP BY grid_point
        HAVING COUNT(*) > 0
    )
    SELECT 
        'grid_' || ROW_NUMBER() OVER (ORDER BY grid_point)::TEXT as grid_id,
        ST_Y(lat_lon) as lat,
        ST_X(lat_lon) as lon,
        report_count::INTEGER as count,
        avg_sentiment,
        jsonb_build_object(
            'type', 'Feature',
            'geometry', jsonb_build_object(
                'type', 'Point',
                'coordinates', jsonb_build_array(ST_X(lat_lon), ST_Y(lat_lon))
            ),
            'properties', jsonb_build_object(
                'count', report_count,
                'avg_sentiment', avg_sentiment,
                'grid_id', 'grid_' || ROW_NUMBER() OVER (ORDER BY grid_point)::TEXT
            )
        ) as geojson
    FROM grid_cells;
END;
$$ LANGUAGE plpgsql;

-- Create function to get reports by geohash
CREATE OR REPLACE FUNCTION get_reports_by_geohash(
    geohash_precision INTEGER DEFAULT 6
) RETURNS TABLE (
    geohash TEXT,
    lat FLOAT,
    lon FLOAT,
    count INTEGER,
    avg_sentiment FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_GeoHash(location, geohash_precision) as geohash,
        ST_Y(location::GEOMETRY) as lat,
        ST_X(location::GEOMETRY) as lon,
        COUNT(*)::INTEGER as count,
        AVG(sentiment) as avg_sentiment
    FROM reports
    WHERE location IS NOT NULL
    GROUP BY ST_GeoHash(location, geohash_precision)
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
```

### 4. Set Up Storage Bucket
In your Supabase dashboard:
1. Go to **Storage**
2. Create a new bucket called `media`
3. Set it to **Public**
4. Configure the allowed file types and size limits

### 5. Install Dependencies and Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 6. Test Your Setup
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/

## 🔧 Environment Variables

Your `.env` file should look like this:

```env
# Supabase Configuration
SUPABASE_URL=https://qqggoiysyjnwuyvzwrrr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ2dvaXlzeWpud3V5dnp3cnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDcxMTksImV4cCI6MjA3NDE4MzExOX0.PhNKPRbx-HKcRiIWoweA3FBXH2NL3beZ3ysQCDP878Y
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/quicktime

# NLP Service (Optional)
NLP_SERVICE_URL=http://localhost:8000
NLP_SERVICE_API_KEY=your_nlp_api_key_here

# Google Maps API (for frontend integration)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run with Docker
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

## 📚 API Endpoints

Once running, you'll have access to:

- **Authentication**: `POST /auth/register`
- **Users**: `GET /users/me`, `PATCH /users/me`
- **Reports**: `POST /reports`, `GET /reports`, `GET /reports/heatmap`
- **Media**: `POST /media/upload-url`
- **NLP**: `POST /nlp/analyze`
- **Sync**: `POST /sync`

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check your Supabase URL and keys
   - Ensure the database is accessible

2. **Migration Errors**
   - Make sure you're running migrations in the correct order
   - Check for any syntax errors in the SQL

3. **Storage Issues**
   - Ensure the `media` bucket exists in Supabase Storage
   - Check bucket permissions

4. **Authentication Issues**
   - Verify your Supabase keys are correct
   - Check if RLS (Row Level Security) is enabled

## 🎉 You're Ready!

Your Ocean Hazard Monitoring Backend is now set up and ready to use! 

- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qqggoiysyjnwuyvzwrrr
