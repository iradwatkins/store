#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function extractEnvVars(content) {
  // Match process.env.VARIABLE_NAME patterns
  const envVarPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g
  const matches = []
  let match

  while ((match = envVarPattern.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const envVars = extractEnvVars(content)
    
    return envVars.map(envVar => ({
      variable: envVar,
      file: path.relative(process.cwd(), filePath),
      line: content.split('\n').findIndex(line => line.includes(`process.env.${envVar}`)) + 1
    }))
  } catch (error) {
    return []
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = []
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
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

// Main execution
const projectRoot = process.cwd()
const allEnvVars = new Map()

console.log('🔍 Analyzing environment variable usage...\n')

// Analyze all TypeScript/JavaScript files
const files = findFiles(projectRoot)
for (const file of files) {
  const envVarUsages = analyzeFile(file)
  
  for (const usage of envVarUsages) {
    if (!allEnvVars.has(usage.variable)) {
      allEnvVars.set(usage.variable, [])
    }
    allEnvVars.get(usage.variable).push({
      file: usage.file,
      line: usage.line
    })
  }
}

// Sort environment variables alphabetically
const sortedEnvVars = Array.from(allEnvVars.entries()).sort()

console.log(`📊 Found ${sortedEnvVars.length} unique environment variables:\n`)

// Group by category for better organization
const categories = {
  'Database & Storage': ['DATABASE_URL', 'REDIS_URL', 'MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'],
  'Authentication': ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  'Payment & Billing': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS', 'STRIPE_PRICE_STARTER', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE', 'STRIPE_ACCOUNT_ID'],
  'Square Integration': ['SQUARE_ACCESS_TOKEN', 'SQUARE_ENVIRONMENT'],
  'Email & Communication': ['RESEND_API_KEY', 'EMAIL_FROM'],
  'Monitoring & Analytics': ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'],
  'Application': ['NODE_ENV', 'NEXT_PUBLIC_APP_URL', 'PORT'],
  'Other': []
}

// Categorize variables
const categorized = {}
for (const category of Object.keys(categories)) {
  categorized[category] = []
}

for (const [variable, usages] of sortedEnvVars) {
  let found = false
  for (const [category, vars] of Object.entries(categories)) {
    if (vars.includes(variable)) {
      categorized[category].push([variable, usages])
      found = true
      break
    }
  }
  if (!found) {
    categorized['Other'].push([variable, usages])
  }
}

// Display categorized results
for (const [category, vars] of Object.entries(categorized)) {
  if (vars.length > 0) {
    console.log(`\n📁 ${category}:`)
    for (const [variable, usages] of vars) {
      console.log(`  ${variable} (${usages.length} usage${usages.length > 1 ? 's' : ''})`)
      for (const usage of usages.slice(0, 3)) { // Show first 3 usages
        console.log(`    📄 ${usage.file}:${usage.line}`)
      }
      if (usages.length > 3) {
        console.log(`    ... and ${usages.length - 3} more`)
      }
    }
  }
}

console.log(`\n✅ Analysis complete. Found ${sortedEnvVars.length} environment variables across ${files.length} files.`)