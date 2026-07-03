-- Used by main.py (the waterbody report-submission orchestrator).
-- Not used by the server/ Node API - kept alongside the other migrations
-- so the whole project's schema lives in one place.
CREATE TABLE IF NOT EXISTS user_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('new', 'verified', 'rejected')) DEFAULT 'verified',
    model_confidence FLOAT,
    geotag_source TEXT CHECK (geotag_source IN ('live_capture', 'exif')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_created_at ON user_uploads(created_at);

CREATE TRIGGER update_user_uploads_updated_at
    BEFORE UPDATE ON user_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
