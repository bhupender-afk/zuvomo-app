-- Migration: Add funding_from_other_sources field to projects table
-- Date: 2025-09-15
-- Description: Replace minimum_investment usage with new funding_from_other_sources field

-- Add the new column
ALTER TABLE projects 
ADD COLUMN funding_from_other_sources DECIMAL(15,2) DEFAULT 0.00 
AFTER minimum_investment;

-- Update any existing projects to have 0 for funding from other sources
UPDATE projects 
SET funding_from_other_sources = 0.00 
WHERE funding_from_other_sources IS NULL;

-- Add index for better query performance
CREATE INDEX idx_funding_from_other_sources ON projects(funding_from_other_sources);