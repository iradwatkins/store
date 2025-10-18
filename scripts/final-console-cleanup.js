#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Files to process (excluding scripts, tests, and docs)
const targetFiles = [
  'app/api/cron/renew-ssl-certificates/route.ts',
  'app/api/cron/check-domain-status/route.ts', 
  'app/api/cron/check-low-stock/route.ts',
  'app/api/cron/send-review-requests/route.ts',
  'app/api/webhooks/stripe/subscriptions/route.ts',
  'app/api/vendor/products/[id]/images/route.ts',
  'lib/logger.ts'
]

function replacementRules(content, filePath) {
  let modifiedContent = content

  // Add logger import if not present and console statements exist
  if (content.includes('console.') && !content.includes('import { logger }')) {
    // Find the import section
    const importMatch = content.match(/(import[^;]+;?\s*)+/g)
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1]
      modifiedContent = modifiedContent.replace(
        lastImport,
        lastImport + '\nimport { logger } from "@/lib/logger"'
      )
    }
  }

  // Replace console.log with appropriate logger method
  modifiedContent = modifiedContent.replace(
    /console\.log\(([^)]+)\)/g,
    'logger.info($1)'
  )

  // Replace console.error with logger.error
  modifiedContent = modifiedContent.replace(
    /console\.error\(([^)]+)\)/g,
    'logger.error($1)'
  )

  // Replace console.warn with logger.warn
  modifiedContent = modifiedContent.replace(
    /console\.warn\(([^)]+)\)/g,
    'logger.warn($1)'
  )

  // Replace console.info with logger.info
  modifiedContent = modifiedContent.replace(
    /console\.info\(([^)]+)\)/g,
    'logger.info($1)'
  )

  // Replace console.debug with logger.debug
  modifiedContent = modifiedContent.replace(
    /console\.debug\(([^)]+)\)/g,
    'logger.debug($1)'
  )

  // Special case: lib/logger.ts should keep its single console.log for fallback
  if (filePath.endsWith('lib/logger.ts')) {
    // Don't replace console statements in logger.ts as they're intentional fallbacks
    return content
  }

  return modifiedContent
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`)
    return false
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const modifiedContent = replacementRules(content, filePath)
    
    if (content !== modifiedContent) {
      fs.writeFileSync(fullPath, modifiedContent, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    } else {
      console.log(`⏭️  No changes: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🧹 Final console statement cleanup...')

let totalFixed = 0

for (const file of targetFiles) {
  if (processFile(file)) {
    totalFixed++
  }
}

console.log(`\n✅ Cleaned up ${totalFixed} additional files`)
console.log('🎉 Week 1 console statement removal task complete!')