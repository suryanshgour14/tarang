-- Used by webscraping.py (the hazard-aggregation API).
-- Not used by the server/ Node API - kept alongside the other migrations
-- so the whole project's schema lives in one place.
CREATE TABLE IF NOT EXISTS hazard_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hazard_type TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    url TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    confidence_score FLOAT DEFAULT 0.5,
    event_unique_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hazard_events_type ON hazard_events(hazard_type);
CREATE INDEX IF NOT EXISTS idx_hazard_events_time ON hazard_events(event_time);

CREATE TABLE IF NOT EXISTS user_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES hazard_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hazard_type TEXT NOT NULL,
    url TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 0.5,
    event_latitude FLOAT,
    event_longitude FLOAT,
    location_name TEXT,
    user_latitude FLOAT NOT NULL,
    user_longitude FLOAT NOT NULL,
    distance_km FLOAT,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_discoveries_user_id ON user_discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_discoveries_event_time ON user_discoveries(event_time);
CREATE INDEX IF NOT EXISTS idx_user_discoveries_discovered_at ON user_discoveries(discovered_at);
