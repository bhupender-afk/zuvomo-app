const { executeQuery } = require('../config/database');

async function migrateCaseStudies() {
  try {
    console.log('🔄 Starting case studies image migration...');

    // Check if columns already exist
    const checkColumns = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'case_studies'
      AND TABLE_SCHEMA = 'zuvomo_db'
      AND COLUMN_NAME IN ('company_name', 'company_logo', 'featured_image')
    `;

    const existingColumns = await executeQuery(checkColumns);
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);

    console.log('📋 Existing columns:', existingColumnNames);

    // Add missing columns
    if (!existingColumnNames.includes('company_name')) {
      console.log('➕ Adding company_name column...');
      await executeQuery('ALTER TABLE case_studies ADD COLUMN company_name VARCHAR(200) AFTER client_name');
    }

    if (!existingColumnNames.includes('company_logo')) {
      console.log('➕ Adding company_logo column...');
      await executeQuery('ALTER TABLE case_studies ADD COLUMN company_logo VARCHAR(500) AFTER client_logo');
    }

    if (!existingColumnNames.includes('featured_image')) {
      console.log('➕ Adding featured_image column...');
      await executeQuery('ALTER TABLE case_studies ADD COLUMN featured_image VARCHAR(500) AFTER company_logo');
    }

    // Migrate existing data
    console.log('🔄 Migrating existing data...');
    await executeQuery(`
      UPDATE case_studies
      SET company_name = COALESCE(client_name, company_name)
      WHERE company_name IS NULL AND client_name IS NOT NULL
    `);

    await executeQuery(`
      UPDATE case_studies
      SET company_logo = COALESCE(client_logo, company_logo)
      WHERE company_logo IS NULL AND client_logo IS NOT NULL
    `);

    // Update any incomplete records
    await executeQuery(`
      UPDATE case_studies
      SET
        company_name = COALESCE(company_name, client_name, 'TechStartup Inc'),
        status = COALESCE(status, 'published'),
        is_featured = COALESCE(is_featured, 0),
        views = COALESCE(views, 0)
      WHERE company_name IS NULL OR company_name = ''
    `);

    // Add indexes for performance
    try {
      await executeQuery('ALTER TABLE case_studies ADD INDEX idx_company_name (company_name)');
    } catch (e) {
      console.log('⚠️  Index idx_company_name already exists');
    }

    try {
      await executeQuery('ALTER TABLE case_studies ADD INDEX idx_featured_image (featured_image)');
    } catch (e) {
      console.log('⚠️  Index idx_featured_image already exists');
    }

    // Show final table structure
    console.log('📊 Final table structure:');
    const tableStructure = await executeQuery('DESCRIBE case_studies');
    console.table(tableStructure);

    console.log('✅ Case studies migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCaseStudies()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrateCaseStudies;