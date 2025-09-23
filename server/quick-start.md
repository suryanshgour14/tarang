# 🚀 Quick Start Guide

## Your Supabase Credentials Are Ready! 

✅ **Supabase URL**: `https://qqggoiysyjnwuyvzwrrr.supabase.co`  
✅ **Anon Key**: Already configured  
✅ **Environment**: Set up  
✅ **Dependencies**: Installed  

## 🔑 Next Steps:

### 1. Get Your Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qqggoiysyjnwuyvzwrrr)
2. Click **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Update your `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 2. Run Database Migrations
In your Supabase SQL Editor, run these 3 migrations:

**Migration 1 - Users Table:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('citizen', 'official', 'analyst')) NOT NULL DEFAULT 'citizen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

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

**Migration 2 - Reports Table:**
```sql
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

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_sentiment ON reports(sentiment);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

**Migration 3 - Heatmap Functions:**
```sql
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
```

### 3. Set Up Storage Bucket
1. In Supabase Dashboard, go to **Storage**
2. Create a new bucket called `media`
3. Set it to **Public**
4. Configure file size limits (10MB max)

### 4. Start the Server
```bash
npm run dev
```

## 🎉 You're Ready!

- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/

## 🧪 Test Your Setup

Try these endpoints:

1. **Health Check**: `GET http://localhost:3000/health`
2. **API Docs**: `GET http://localhost:3000/docs`
3. **Register User**: `POST http://localhost:3000/auth/register`

## 📱 Frontend Integration

Your backend is ready for frontend integration! The API provides:

- **Authentication**: JWT-based auth with Supabase
- **Reports**: CRUD operations with geolocation
- **Media**: File upload with signed URLs
- **Heatmap**: GeoJSON data for mapping
- **NLP**: Hazard classification and sentiment analysis
- **Sync**: Offline report synchronization

## 🔧 Troubleshooting

If you encounter issues:

1. **Check your `.env` file** - Make sure all keys are correct
2. **Verify database migrations** - Run them in order
3. **Check Supabase dashboard** - Ensure tables are created
4. **Review logs** - Check the console for error messages

## 🚀 Production Deployment

When ready for production:

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use Docker
npm run docker:build
npm run docker:run
```

Your Ocean Hazard Monitoring Backend is now ready to power your crowdsourced hazard monitoring platform! 🌊
