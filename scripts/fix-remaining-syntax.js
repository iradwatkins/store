#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Map of files and their specific fixes based on TypeScript errors
const fixes = {
  'app/api/cron/check-low-stock/route.ts': [
    {
      search: /logger\.info\([^,]+,\s*[^,]+,\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
      replace: match => {
        // Extract the first two arguments
        const parts = match.match(/logger\.info\(([^,]+),\s*([^,]+),/)
        if (parts) {
          return `logger.info(${parts[1]}, ${parts[2]})`
        }
        return match
      }
    }
  ],
  'app/api/cron/send-review-requests/route.ts': [
    {
      search: /logger\.info\([^,]+,\s*[^,]+,\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
      replace: match => {
        const parts = match.match(/logger\.info\(([^,]+),\s*([^,]+),/)
        if (parts) {
          return `logger.info(${parts[1]}, ${parts[2]})`
        }
        return match
      }
    }
  ],
  'app/api/webhooks/stripe/route.ts': [
    {
      search: /logger\.(error|info|warn)\([^,]+,\s*[^,]+,\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
      replace: match => {
        const methodMatch = match.match(/logger\.(\w+)\(([^,]+),\s*([^,]+),/)
        if (methodMatch) {
          return `logger.${methodMatch[1]}(${methodMatch[2]}, ${methodMatch[3]})`
        }
        return match
      }
    }
  ],
  'app/api/webhooks/stripe/subscriptions/route.ts': [
    {
      search: /logger\.(error|info|warn)\([^,]+,\s*[^,]+,\s*\?\s*\{\s*context:\s*\}\s*:\s*undefined\)/g,
      replace: match => {
        const methodMatch = match.match(/logger\.(\w+)\(([^,]+),\s*([^,]+),/)
        if (methodMatch) {
          return `logger.${methodMatch[1]}(${methodMatch[2]}, ${methodMatch[3]})`
        }
        return match
      }
    }
  ]
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`)
    return false
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8')
    let modified = false
    
    const fileFixes = fixes[filePath]
    if (fileFixes) {
      for (const fix of fileFixes) {
        const originalContent = content
        if (typeof fix.replace === 'function') {
          content = content.replace(fix.search, fix.replace)
        } else {
          content = content.replace(fix.search, fix.replace)
        }
        if (content !== originalContent) {
          modified = true
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🔧 Fixing remaining syntax errors...')

let totalFixed = 0

for (const filePath of Object.keys(fixes)) {
  if (processFile(filePath)) {
    totalFixed++
  }
}

console.log(`\n✅ Fixed syntax in ${totalFixed} files`)