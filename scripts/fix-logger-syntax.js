#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function fixLoggerSyntax(content) {
  let modifiedContent = content

  // Fix pattern: logger.method("message",  ? { context:  } : undefined)
  modifiedContent = modifiedContent.replace(
    /logger\.(info|error|warn|debug)\(([^,]+),\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
    'logger.$1($2)'
  )

  // Fix pattern: logger.method("message", error,  ? { context:  } : undefined)
  modifiedContent = modifiedContent.replace(
    /logger\.(info|error|warn|debug)\(([^,]+),\s*([^,]+),\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
    'logger.$1($2, $3)'
  )

  // Fix pattern: logger.method("message", error, context ? { context: context } : undefined)
  modifiedContent = modifiedContent.replace(
    /logger\.(info|error|warn|debug)\(([^,]+),\s*([^,]+),\s*([^?]+)\s*\?\s*\{\s*context:\s*\4\s*\}\s*:\s*undefined\)/g,
    'logger.$1($2, $3, { context: $4 })'
  )

  // Fix pattern: logger.method("message", undefined, context ? { context: context } : undefined)
  modifiedContent = modifiedContent.replace(
    /logger\.(info|error|warn|debug)\(([^,]+),\s*undefined,\s*([^?]+)\s*\?\s*\{\s*context:\s*\3\s*\}\s*:\s*undefined\)/g,
    'logger.$1($2, undefined, { context: $3 })'
  )

  return modifiedContent
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const fixedContent = fixLoggerSyntax(content)
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8')
      console.log(`Fixed: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return false
  }
}

function findFilesToFix(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath)
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

// Main execution
const projectRoot = process.cwd()
const targetDirs = ['app', 'lib', 'components']

console.log('🔧 Fixing logger syntax errors...')

let totalFixed = 0

for (const dir of targetDirs) {
  const dirPath = path.join(projectRoot, dir)
  if (fs.existsSync(dirPath)) {
    console.log(`\nProcessing ${dir}/ directory...`)
    const files = findFilesToFix(dirPath)
    
    for (const file of files) {
      if (processFile(file)) {
        totalFixed++
      }
    }
  }
}

console.log(`\n✅ Fixed logger syntax in ${totalFixed} files`)