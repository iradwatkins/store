#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function fixEmailRenderCalls(content) {
  // Fix render calls that are missing await
  let fixed = content.replace(
    /const emailHtml = render\(/g,
    'const emailHtml = await render('
  )
  
  return fixed
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const fixedContent = fixEmailRenderCalls(content)
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8')
      console.log(`✅ Fixed email render calls in: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
const emailFile = path.join(process.cwd(), 'lib/email.ts')

console.log('🔧 Fixing email render calls...')

if (processFile(emailFile)) {
  console.log('✅ Email render calls fixed!')
} else {
  console.log('⏭️  No changes needed in email.ts')
}