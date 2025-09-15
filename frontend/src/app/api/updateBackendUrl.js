// This script updates all API route files to use a fallback for BACKEND_URL
const fs = require('fs');
const path = require('path');

// Function to update a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace direct process.env.BACKEND_URL usage with fallback
    const updatedContent = content.replace(
      /const response = await axios\.([a-z]+)\(`\$\{process\.env\.BACKEND_URL\}/g,
      'const backendUrl = process.env.BACKEND_URL || \'http://localhost:5000\';\
    const response = await axios.$1(`${backendUrl}'
    );
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Function to recursively find and update all route.js files
function updateAllRouteFiles(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      updateAllRouteFiles(fullPath);
    } else if (file.name === 'route.js') {
      updateFile(fullPath);
    }
  }
}

// Start updating from the API directory
const apiDirectory = path.join(__dirname);
updateAllRouteFiles(apiDirectory);

console.log('All API route files have been updated!');