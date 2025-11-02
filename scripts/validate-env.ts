#!/usr/bin/env ts-node

import * as dotenv from 'dotenv'
import { validateEnvironment, listEnvironmentVariables } from '../lib/env-validation'

// Load environment variables from .env file
dotenv.config()

/**
 * Environment Variable Validation Script
 *
 * This script validates environment variables and provides helpful output
 * for development, CI/CD, and deployment processes.
 */

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'validate'

  switch (command) {
    case 'validate':
      validateEnvVars()
      break
    case 'list':
      listEnvVars()
      break
    case 'check':
      checkEnvVars()
      break
    default:
      showHelp()
  }
}

function validateEnvVars() {
  console.log('🔍 Validating environment variables...\n')
  
  try {
    const env = validateEnvironment(true)
    
    if (env) {
      console.log('✅ All environment variables are valid!')
      console.log(`📊 Environment: ${env.NODE_ENV}`)
      console.log(`🌐 App URL: ${env.NEXT_PUBLIC_APP_URL}`)
      
      // Show warnings for optional but recommended variables
      const warnings = []
      if (!env.NEXT_PUBLIC_SENTRY_DSN) {
        warnings.push('⚠️  NEXT_PUBLIC_SENTRY_DSN not set - error monitoring disabled')
      }
      if (!env.MINIO_PUBLIC_ENDPOINT) {
        warnings.push('⚠️  MINIO_PUBLIC_ENDPOINT not set - using internal endpoint for file URLs')
      }
      
      if (warnings.length > 0) {
        console.log('\n📋 Recommendations:')
        warnings.forEach(warning => console.log(`  ${warning}`))
      }
      
      console.log('\n🎉 Environment validation successful!')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Environment validation failed:')
    console.error(error instanceof Error ? error.message : error)
    console.log('\n💡 Tips:')
    console.log('  1. Copy .env.example to .env.local')
    console.log('  2. Fill in all required values')
    console.log('  3. Run `npm run env:validate` to check again')
    console.log('  4. Run `npm run env:list` to see all variables')
    process.exit(1)
  }
}

function listEnvVars() {
  console.log('📋 Environment Variables Reference:\n')
  
  const variables = listEnvironmentVariables()
  const categories = {
    'Application Environment': ['NODE_ENV'],
    'Application URLs': ['NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL'],
    'Database & Storage': ['DATABASE_URL', 'REDIS_URL'],
    'MinIO Object Storage': ['MINIO_ENDPOINT', 'MINIO_PORT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET', 'MINIO_USE_SSL', 'MINIO_PUBLIC_ENDPOINT'],
    'Authentication': ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    'Email Services': ['RESEND_API_KEY', 'EMAIL_FROM'],
    'Payment - Stripe': ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS', 'STRIPE_ACCOUNT_ID', 'STRIPE_PRICE_STARTER', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE'],
    'Payment - Square': ['SQUARE_ACCESS_TOKEN', 'SQUARE_ENVIRONMENT', 'SQUARE_APPLICATION_ID', 'SQUARE_LOCATION_ID'],
    'Security & Monitoring': ['NEXT_PUBLIC_SENTRY_DSN', 'CRON_SECRET'],
    'Development & Testing': ['SEED_USER_PASSWORD', 'TEST_EMAIL', 'TEST_URL']
  }

  for (const [category, varNames] of Object.entries(categories)) {
    console.log(`\n📁 ${category}:`)
    for (const varName of varNames) {
      const description = variables[varName] || 'No description available'
      const isSet = process.env[varName] ? '✅' : '❌'
      console.log(`  ${isSet} ${varName}`)
      console.log(`      ${description}`)
    }
  }

  console.log('\n💡 Legend:')
  console.log('  ✅ = Variable is set')
  console.log('  ❌ = Variable is missing')
  console.log('\n📖 For detailed setup instructions, see .env.example')
}

function checkEnvVars() {
  console.log('🔍 Quick environment check...\n')
  
  const result = validateEnvironment(false)
  
  if (result) {
    console.log('✅ Environment check passed')
    process.exit(0)
  } else {
    console.log('❌ Environment check failed')
    process.exit(1)
  }
}

function showHelp() {
  console.log('🔧 Environment Variable Validation Tool\n')
  console.log('Usage:')
  console.log('  npm run env:validate     # Validate all environment variables')
  console.log('  npm run env:list         # List all environment variables with descriptions')
  console.log('  npm run env:check        # Quick validation check (for CI/CD)')
  console.log('')
  console.log('Examples:')
  console.log('  ts-node scripts/validate-env.ts validate')
  console.log('  ts-node scripts/validate-env.ts list')
  console.log('  ts-node scripts/validate-env.ts check')
}

// Run main function
main()