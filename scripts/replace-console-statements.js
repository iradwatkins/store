#!/usr/bin/env node

/**
 * Systematic Console Statement Replacement Script
 * Replaces all console.* statements with proper logger calls
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Directories to process
  directories: ['app', 'lib', 'components'],
  
  // File extensions to process
  extensions: ['.ts', '.tsx'],
  
  // Files to skip (already processed)
  skipFiles: [
    'lib/auth.ts',
    'lib/cache.ts', 
    'prisma/seed.ts',
    'lib/logger.ts'  // Don't process the logger file itself
  ],
  
  // Replacement patterns
  replacements: [
    {
      // console.error with message and error object
      pattern: /console\.error\(['"]([^'"]+)['"],\s*([^,)]+)(?:,\s*([^)]+))?\)/g,
      replacement: 'logger.error("$1", $2, $3 ? { context: $3 } : undefined)'
    },
    {
      // console.error with template literal
      pattern: /console\.error\(`([^`]+)`(?:,\s*([^)]+))?\)/g,
      replacement: 'logger.error(`$1`, $2 ? $2 : undefined)'
    },
    {
      // console.error with simple string
      pattern: /console\.error\(['"]([^'"]+)['"]\)/g,
      replacement: 'logger.error("$1")'
    },
    {
      // console.log with template literal (info level)
      pattern: /console\.log\(`([^`]+)`(?:,\s*([^)]+))?\)/g,
      replacement: 'logger.info(`$1`, $2 ? { context: $2 } : undefined)'
    },
    {
      // console.log with string and data
      pattern: /console\.log\(['"]([^'"]+)['"],\s*([^)]+)\)/g,
      replacement: 'logger.info("$1", { data: $2 })'
    },
    {
      // console.log with simple string
      pattern: /console\.log\(['"]([^'"]+)['"]\)/g,
      replacement: 'logger.info("$1")'
    },
    {
      // console.warn
      pattern: /console\.warn\(['"]([^'"]+)['"](?:,\s*([^)]+))?\)/g,
      replacement: 'logger.warn("$1", $2 ? { context: $2 } : undefined)'
    },
    {
      // console.debug
      pattern: /console\.debug\(['"]([^'"]+)['"](?:,\s*([^)]+))?\)/g,
      replacement: 'logger.debug("$1", $2 ? { context: $2 } : undefined)'
    }
  ]
};

// Track statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: []
};

function findTSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && config.extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function shouldSkipFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return config.skipFiles.some(skipFile => relativePath.includes(skipFile));
}

function needsLoggerImport(content) {
  return /console\.[a-z]/.test(content) && !content.includes('from "@/lib/logger"') && !content.includes('from "../lib/logger"') && !content.includes('from "./logger"');
}

function addLoggerImport(content, filePath) {
  const lines = content.split('\n');
  
  // Find the best place to add the import
  let importIndex = -1;
  let hasImports = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('import ') && !line.includes('type')) {
      hasImports = true;
      importIndex = i;
    } else if (hasImports && !line.startsWith('import ') && line !== '') {
      break;
    }
  }
  
  // Determine the correct import path
  const relativePath = path.relative(process.cwd(), filePath);
  const depth = relativePath.split('/').length - 1;
  const importPath = depth === 1 ? './logger' : '../'.repeat(depth - 1) + 'logger';
  
  const loggerImport = `import { logger } from "@/lib/logger"`;
  
  if (importIndex >= 0) {
    lines.splice(importIndex + 1, 0, loggerImport);
  } else {
    // Add at the beginning if no imports found
    lines.unshift(loggerImport, '');
  }
  
  return lines.join('\n');
}

function processFile(filePath) {
  try {
    stats.filesProcessed++;
    
    if (shouldSkipFile(filePath)) {
      console.log(`⏭️  Skipping ${filePath} (already processed)`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileReplacements = 0;
    
    // Check if file has console statements
    if (!/console\.[a-z]/.test(content)) {
      return; // No console statements found
    }
    
    console.log(`🔄 Processing ${filePath}`);
    
    // Add logger import if needed
    if (needsLoggerImport(content)) {
      modifiedContent = addLoggerImport(modifiedContent, filePath);
    }
    
    // Apply replacements
    for (const { pattern, replacement } of config.replacements) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern, replacement);
        fileReplacements += matches.length;
      }
    }
    
    // Handle complex console statements that weren't caught by patterns
    const remainingConsole = modifiedContent.match(/console\.[a-z]+/g);
    if (remainingConsole) {
      console.log(`⚠️  ${filePath} still has console statements: ${remainingConsole.join(', ')}`);
    }
    
    if (modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      stats.filesModified++;
      stats.replacementsMade += fileReplacements;
      console.log(`✅ Modified ${filePath} (${fileReplacements} replacements)`);
    }
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting systematic console statement replacement...\n');
  
  // Process each directory
  for (const dir of config.directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
      continue;
    }
    
    console.log(`📁 Processing directory: ${dir}`);
    const files = findTSFiles(dir);
    
    for (const file of files) {
      processFile(file);
    }
  }
  
  // Print summary
  console.log('\n📊 Replacement Summary:');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total replacements: ${stats.replacementsMade}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors encountered: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }
  
  console.log('\n✅ Console statement replacement completed!');
  
  // Verify the changes
  console.log('\n🔍 Checking remaining console statements...');
  try {
    const result = execSync('grep -r "console\\." app lib components --include="*.ts" --include="*.tsx" | wc -l', { encoding: 'utf8' });
    const remaining = parseInt(result.trim());
    console.log(`Remaining console statements: ${remaining}`);
    
    if (remaining > 0) {
      console.log('Files with remaining console statements:');
      const remainingFiles = execSync('grep -r "console\\." app lib components --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq', { encoding: 'utf8' });
      console.log(remainingFiles);
    }
  } catch (error) {
    console.log('Could not verify remaining console statements');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, config, stats };