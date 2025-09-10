const fs = require('fs');
const path = require('path');

// Function to create a Windows screensaver file from the portable executable
function createScreensaver() {
  const version = require('./package.json').version;
  const sourceFile = path.join(__dirname, 'release-builds', `QuickMarkets-${version}.exe`);
  const targetFile = path.join(__dirname, 'release-builds', 'QuickMarkets.scr');
  
  console.log(`Creating screensaver from ${sourceFile}`);
  
  // Check if the source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    console.error('Please run "npm run build-win" first to create the portable executable.');
    process.exit(1);
  }
  
  // Copy the executable to a .scr file
  try {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Successfully created screensaver: ${targetFile}`);
  } catch (error) {
    console.error(`Error creating screensaver: ${error.message}`);
    process.exit(1);
  }
}

// Run the function
createScreensaver();
