#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Files with broken imports based on TypeScript errors
const problematicFiles = [
  'app/api/tenants/[id]/nginx/route.ts',
  'app/api/tenants/[id]/ssl/route.ts', 
  'app/api/vendor/products/[id]/images/route.ts'
]

function fixImportSyntax(content) {
  let modifiedContent = content

  // Fix broken import patterns like:
  // import {
  // import { logger } from "@/lib/logger"
  // other imports...
  modifiedContent = modifiedContent.replace(
    /import \{\s*\nimport \{ logger \} from "@\/lib\/logger"\s*\n([^}]*)\} from/g,
    'import { logger } from "@/lib/logger"\nimport {\n$1} from'
  )

  // Fix other variations of broken imports
  modifiedContent = modifiedContent.replace(
    /import \{\s*import \{ logger \} from "@\/lib\/logger"\s*/g,
    'import { logger } from "@/lib/logger"\nimport {'
  )

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
    const modifiedContent = fixImportSyntax(content)
    
    if (content !== modifiedContent) {
      fs.writeFileSync(fullPath, modifiedContent, 'utf8')
      console.log(`✅ Fixed imports: ${filePath}`)
      return true
    } else {
      console.log(`⏭️  No import issues: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🔧 Fixing import syntax errors...')

let totalFixed = 0

for (const file of problematicFiles) {
  if (processFile(file)) {
    totalFixed++
  }
}

console.log(`\n✅ Fixed imports in ${totalFixed} files`)