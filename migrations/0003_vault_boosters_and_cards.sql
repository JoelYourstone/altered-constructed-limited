-- Migration number: 0003 	 2025-11-02T21:12:56.323Z

-- ==========================================
-- VAULT BOOSTERS AND CARDS SCHEMA
-- ==========================================
-- This schema moves the scanning/vault system from client-side localStorage to server-side database
-- 
-- DESIGN RATIONALE:
-- 
-- 1. BOOSTERS ARE THE CORE ORGANIZATIONAL UNIT
--    - In Altered TCG, players open boosters (packs) containing 12 cards:
--      * 1 Hero card
--      * 8 Common cards  
--      * 3 Rare/Unique cards (mix of Rare and Unique rarities)
--    - Each booster belongs to a specific set (e.g., Core Set, Beyond the Gates)
--    - Users can have multiple active boosters from the same set simultaneously
--    - Tracking boosters separately allows for proper game rule enforcement
--
-- 2. CARDS MUST BE GLOBALLY UNIQUE BY PHYSICAL TOKEN
--    - Each physical card has a unique_token (the tiny URL identifier)
--    - This prevents the same physical card from being scanned multiple times
--    - GLOBAL uniqueness (not per-user) prevents cheating/sharing
--    - This is a key business rule: you can only register each physical card once
--
-- 3. COMPLETION TRACKING VIA TIMESTAMP
--    - Boosters: completed_at IS NULL = active, IS NOT NULL = completed
--    - Simple boolean check, no status enum needed
--    - Timestamp gives us historical data for analytics
--
-- 4. COUNTS CALCULATED ON-DEMAND (NOT DENORMALIZED)
--    - No need to store counts in vault_boosters
--    - Each booster has max 12 cards - trivial to fetch and count
--    - Simpler schema, no risk of counts getting out of sync
--    - Just track completion via completed_at timestamp
--
-- 5. NORMALIZED CARD METADATA
--    - Card metadata stored separately in cards_metadata table
--    - Keyed by reference (e.g., "ALT_CORE_B_AX_01_C")
--    - Multiple physical cards (unique_tokens) can share the same reference
--    - Stored as JSON for flexibility
--    - Reduces data duplication
--
-- 6. NO FAILED SCANS TABLE
--    - Failed scans are temporary UI feedback only
--    - No need for database persistence
--    - Keep in client state (React Query cache) during session
--    - Simpler schema, less database overhead
--
-- 7. INDEXES FOR COMMON QUERIES
--    - user_id on all tables (filtering by user)
--    - unique_token (checking if card already scanned)
--    - booster completed_at + user_id (finding active boosters)
--    - set_code (filtering by set)
--
-- ==========================================

-- Track booster packs (groups of 12 cards)
CREATE TABLE IF NOT EXISTS vault_boosters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL, -- References auth id
    set_code TEXT NOT NULL, -- References season_sets.set_code
    set_name TEXT NOT NULL, -- Denormalized for display
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP, -- When booster was completed (all 12 cards), NULL = active
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track individual scanned physical cards
CREATE TABLE IF NOT EXISTS vault_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL, -- References auth id
    booster_id INTEGER NOT NULL, -- References vault_boosters.id
    
    -- Physical card identifier (GLOBALLY UNIQUE - prevents double scanning)
    unique_token TEXT NOT NULL UNIQUE, -- The tiny URL from QR code
    
    -- Card reference (links to cards_metadata)
    reference TEXT NOT NULL, -- e.g., "ALT_CORE_B_AX_01_C"
    
    -- Timestamps
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booster_id) REFERENCES vault_boosters(id) ON DELETE SET NULL
);

-- Store card metadata (shared by multiple physical cards with same reference)
CREATE TABLE IF NOT EXISTS cards_metadata (
    reference TEXT PRIMARY KEY, -- e.g., "ALT_CORE_B_AX_01_C"
    card_data TEXT NOT NULL, -- JSON object with all card metadata from Altered API
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Find cards by user
CREATE INDEX IF NOT EXISTS idx_vault_cards_user 
    ON vault_cards(user_id);

-- Find cards in a booster
CREATE INDEX IF NOT EXISTS idx_vault_cards_booster 
    ON vault_cards(booster_id);

-- Check if card already scanned (CRITICAL for preventing duplicates)
CREATE INDEX IF NOT EXISTS idx_vault_cards_unique_token 
    ON vault_cards(unique_token);

-- Find cards by reference (for joining with metadata)
CREATE INDEX IF NOT EXISTS idx_vault_cards_reference 
    ON vault_cards(reference);

-- ==========================================
-- EXAMPLE QUERIES FOR COMMON OPERATIONS
-- ==========================================

-- Get user's active boosters:
-- SELECT * FROM vault_boosters 
-- WHERE user_id = ? AND completed_at IS NULL 
-- ORDER BY created_at DESC;

-- Get cards in a specific booster with metadata:
-- SELECT vc.*, cm.card_data 
-- FROM vault_cards vc
-- JOIN cards_metadata cm ON cm.reference = vc.reference
-- WHERE vc.booster_id = ? 
-- ORDER BY vc.scanned_at ASC;
-- Then parse JSON and count in application:
--   hero_count = cards.filter(c => JSON.parse(c.card_data).cardType === 'HERO').length
--   common_count = cards.filter(c => JSON.parse(c.card_data).rarity === 'COMMON').length
--   etc.

-- Check if physical card already scanned (CRITICAL - prevents duplicates):
-- SELECT id, user_id FROM vault_cards 
-- WHERE unique_token = ?;

-- Get completed boosters count by set:
-- SELECT set_code, COUNT(*) as count 
-- FROM vault_boosters 
-- WHERE user_id = ? AND completed_at IS NOT NULL 
-- GROUP BY set_code;

-- Get all cards for completed boosters by set (for display):
-- SELECT vb.set_code, vb.set_name, vb.completed_at, vc.*, cm.card_data
-- FROM vault_boosters vb
-- JOIN vault_cards vc ON vc.booster_id = vb.id
-- JOIN cards_metadata cm ON cm.reference = vc.reference
-- WHERE vb.user_id = ? AND vb.completed_at IS NOT NULL
-- ORDER BY vb.completed_at DESC, vc.scanned_at ASC;

-- Insert or update card metadata (upsert when scanning):
-- INSERT INTO cards_metadata (reference, card_data, updated_at) 
-- VALUES (?, ?, CURRENT_TIMESTAMP)
-- ON CONFLICT(reference) DO UPDATE SET 
--   card_data = excluded.card_data,
--   updated_at = CURRENT_TIMESTAMP;
