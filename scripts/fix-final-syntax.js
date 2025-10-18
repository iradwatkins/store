#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function fixSyntaxIssues(content) {
  let fixed = content

  // Fix logger calls with missing arguments or malformed context patterns
  fixed = fixed.replace(
    /logger\.(error|info|warn|debug)\([^,]+,\s*,\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
    (match, method) => {
      const messageMatch = match.match(/logger\.\w+\(([^,]+),/)
      if (messageMatch) {
        return `logger.${method}(${messageMatch[1]})`
      }
      return match
    }
  )

  // Fix malformed object arguments
  fixed = fixed.replace(
    /logger\.(error|info|warn|debug)\([^,]+,\s*\{\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\s*\}/g,
    (match, method) => {
      const messageMatch = match.match(/logger\.\w+\(([^,]+),/)
      if (messageMatch) {
        return `logger.${method}(${messageMatch[1]})`
      }
      return match
    }
  )

  return fixed
}

function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = []
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build', 'scripts'].includes(item)) {
            traverse(fullPath)
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir)
  return files
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const fixedContent = fixSyntaxIssues(content)
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8')
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🔧 Final syntax cleanup...')

const projectRoot = process.cwd()
const appDir = path.join(projectRoot, 'app')
const libDir = path.join(projectRoot, 'lib')

let totalFixed = 0

// Process app directory
if (fs.existsSync(appDir)) {
  console.log('Processing app/ directory...')
  const appFiles = findFiles(appDir)
  for (const file of appFiles) {
    if (processFile(file)) {
      totalFixed++
    }
  }
}

// Process lib directory  
if (fs.existsSync(libDir)) {
  console.log('Processing lib/ directory...')
  const libFiles = findFiles(libDir)
  for (const file of libFiles) {
    if (processFile(file)) {
      totalFixed++
    }
  }
}

console.log(`\n✅ Fixed ${totalFixed} files total`)