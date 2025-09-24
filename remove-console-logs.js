const fs = require('fs');
const path = require('path');

// Function to recursively find all JavaScript and JSX files
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = findJsFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalSize = content.length;
    
    // Replace console.log statements
    // This regex matches console.log statements including multiline ones
    const regex = /console\.log\s*\(\s*(['"`].*?['"`])?.*?\);?/g;
    content = content.replace(regex, '');
    
    // If content changed, write it back
    if (content.length !== originalSize) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const frontendDir = path.resolve(__dirname, 'frontend');
  const jsFiles = findJsFiles(frontendDir);
  
  console.log(`Found ${jsFiles.length} JavaScript/TypeScript files`);
  
  let modifiedCount = 0;
  
  jsFiles.forEach(file => {
    const wasModified = removeConsoleLogs(file);
    if (wasModified) {
      modifiedCount++;
      console.log(`Removed console.logs from: ${file}`);
    }
  });
  
  console.log(`\nCompleted! Modified ${modifiedCount} files.`);
}

main();