const fs = require('fs');
const path = require('path');

/**
 * This script is executed during the EAS Build process (pre-install).
 * it reconstructs the google-services.json file from an environment variable
 * to avoid committing sensitive files to version control.
 */

const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

if (GOOGLE_SERVICES_JSON) {
  console.log('✅ Found GOOGLE_SERVICES_JSON environment variable. Reconstructing google-services.json...');
  try {
    const filePath = path.join(__dirname, '..', 'google-services.json');
    fs.writeFileSync(filePath, GOOGLE_SERVICES_JSON);
    console.log('✨ google-services.json has been created successfully!');
  } catch (error) {
    console.error('❌ Failed to create google-services.json:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️ GOOGLE_SERVICES_JSON environment variable not found.');
  console.warn('If this is a production build, it may fail if the file is missing.');
}
