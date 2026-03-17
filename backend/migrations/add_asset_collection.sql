-- Migration: Add collection field to assets table
-- Date: 2026-03-17
-- Description: Add collection column for grouping assets into named collections

-- Add collection column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS collection VARCHAR(255);

-- Create index on collection for faster filtering
CREATE INDEX IF NOT EXISTS ix_assets_collection ON assets(collection);

-- Update existing assets to have NULL collection (they'll be shown as "Uncategorized")
-- No data migration needed - NULL is acceptable

