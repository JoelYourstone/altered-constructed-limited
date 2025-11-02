-- Migration number: 0001 	 2025-11-02T18:47:36.015Z

-- Season Settings: Track which sets are active for the current season
CREATE TABLE IF NOT EXISTS season_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_code TEXT NOT NULL UNIQUE,
    set_name TEXT NOT NULL,
    max_packs INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_season_sets_active ON season_sets(is_active);

-- Example data (uncomment to insert initial data)
-- INSERT INTO season_sets (set_code, set_name, max_packs, is_active, display_order) VALUES
-- ('CORE', 'Core Set', 24, TRUE, 1),
-- ('BTG', 'Beyond the Gates', 12, TRUE, 2),
-- ('UNCHAINED', 'Unchained', 6, TRUE, 3);
