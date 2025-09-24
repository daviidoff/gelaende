-- Add picture column to activities table
-- This migration adds support for storing pictures with activities

ALTER TABLE activities 
ADD COLUMN picture TEXT;

-- Add comment for documentation
COMMENT ON COLUMN activities.picture IS 'Stores picture data for the activity (base64 encoded image or file path)';