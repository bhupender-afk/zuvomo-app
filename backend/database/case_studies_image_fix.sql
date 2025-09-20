-- Case Studies Image Fix Migration
-- Adds missing image columns to match API expectations
-- Run this script to fix case studies image saving issues

USE zuvomo_db_local;

-- Add missing image columns if they don't exist
SET @dbname = DATABASE();
SET @tablename = "case_studies";
SET @columnname1 = "company_name";
SET @columnname2 = "company_logo";
SET @columnname3 = "featured_image";
SET @preparedStatement1 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname1, " VARCHAR(200) AFTER client_name;")
));
PREPARE alterIfNotExists1 FROM @preparedStatement1;
EXECUTE alterIfNotExists1;
DEALLOCATE PREPARE alterIfNotExists1;

SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname2, " VARCHAR(500) AFTER client_logo;")
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname3)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname3, " VARCHAR(500) AFTER company_logo;")
));
PREPARE alterIfNotExists3 FROM @preparedStatement3;
EXECUTE alterIfNotExists3;
DEALLOCATE PREPARE alterIfNotExists3;

-- Migrate existing data from client_* to company_* fields (if any data exists)
UPDATE case_studies
SET company_name = COALESCE(client_name, company_name)
WHERE company_name IS NULL AND client_name IS NOT NULL;

UPDATE case_studies
SET company_logo = COALESCE(client_logo, company_logo)
WHERE company_logo IS NULL AND client_logo IS NOT NULL;

-- Update existing case studies with missing fields for better compatibility
UPDATE case_studies
SET
  company_name = COALESCE(company_name, client_name, 'TechStartup Inc'),
  status = COALESCE(status, 'published'),
  is_featured = COALESCE(is_featured, 0),
  views = COALESCE(views, 0)
WHERE company_name IS NULL OR company_name = '';

-- Add indexes for better performance
ALTER TABLE case_studies ADD INDEX IF NOT EXISTS idx_company_name (company_name);
ALTER TABLE case_studies ADD INDEX IF NOT EXISTS idx_featured_image (featured_image);

-- Display current table structure for verification
DESCRIBE case_studies;