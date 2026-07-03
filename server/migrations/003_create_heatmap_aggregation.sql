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
                ST_Transform(location::geometry, 3857),
                grid_size * 111000
            ) as grid_point,
            COUNT(*) as report_count,
            AVG(sentiment) as avg_sentiment,
            ST_Transform(
                ST_SnapToGrid(
                    ST_Transform(location::geometry, 3857),
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
        grid_cells.avg_sentiment,
        jsonb_build_object(
            'type', 'Feature',
            'geometry', jsonb_build_object(
                'type', 'Point',
                'coordinates', jsonb_build_array(ST_X(lat_lon), ST_Y(lat_lon))
            ),
            'properties', jsonb_build_object(
                'count', report_count,
                'avg_sentiment', grid_cells.avg_sentiment,
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
        AVG(ST_Y(location::GEOMETRY)) as lat,
        AVG(ST_X(location::GEOMETRY)) as lon,
        COUNT(*)::INTEGER as count,
        AVG(sentiment) as avg_sentiment
    FROM reports
    WHERE location IS NOT NULL
    GROUP BY ST_GeoHash(location, geohash_precision)
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
