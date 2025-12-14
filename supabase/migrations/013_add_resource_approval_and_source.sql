-- Migration: Add resource approval status and source type
-- This enables role-based resource filtering

-- Add approval status column
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;

-- Add source type column (curated = official, community = user-created)
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'curated' CHECK (source_type IN ('curated', 'community'));

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_resources_approved ON resources(approved);
CREATE INDEX IF NOT EXISTS idx_resources_source_type ON resources(source_type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- Update existing resources to be approved and curated by default
UPDATE resources 
SET approved = true, source_type = 'curated' 
WHERE approved IS NULL OR source_type IS NULL;

-- Add comment
COMMENT ON COLUMN resources.approved IS 'Whether the resource is approved for general viewing';
COMMENT ON COLUMN resources.source_type IS 'Source of resource: curated (official) or community (user-created)';


