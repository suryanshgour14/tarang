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
