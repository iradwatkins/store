import { z } from 'zod'
import { logger } from './logger'

/**
 * Environment Variable Validation Schema
 * 
 * This centralizes all environment variable validation with proper types,
 * descriptions, and validation rules for the entire application.
 */

// Custom validation helpers
const booleanString = z.enum(['true', 'false']).transform(val => val === 'true')
const nonEmptyString = z.string().min(1, 'Cannot be empty')
const urlString = z.string().url('Must be a valid URL')
const emailString = z.string().email('Must be a valid email address')

// Environment-specific schemas
const developmentOnlyString = z.string().optional()
const productionRequiredString = z.string().min(1).optional()

// Define the complete environment schema
const envSchema = z.object({
  // Application Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: urlString.describe('Public application URL for client-side usage'),
  NEXTAUTH_URL: urlString.optional().describe('NextAuth.js authentication base URL'),
  
  // Database & Storage
  DATABASE_URL: nonEmptyString.describe('Prisma database connection string'),
  REDIS_URL: nonEmptyString.describe('Redis connection URL for caching and sessions'),
  
  // MinIO Object Storage
  MINIO_ENDPOINT: nonEmptyString.describe('MinIO server endpoint'),
  MINIO_PORT: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).describe('MinIO server port'),
  MINIO_ACCESS_KEY: nonEmptyString.describe('MinIO access key'),
  MINIO_SECRET_KEY: nonEmptyString.describe('MinIO secret key'),
  MINIO_BUCKET: nonEmptyString.describe('MinIO bucket name for file storage'),
  MINIO_USE_SSL: booleanString.describe('Whether to use SSL for MinIO connections'),
  MINIO_PUBLIC_ENDPOINT: urlString.optional().describe('Public MinIO endpoint for file access'),
  
  // Authentication
  NEXTAUTH_SECRET: nonEmptyString.describe('NextAuth.js secret for JWT signing'),
  GOOGLE_CLIENT_ID: z.string().optional().describe('Google OAuth client ID (optional)'),
  GOOGLE_CLIENT_SECRET: z.string().optional().describe('Google OAuth client secret (optional)'),
  
  // Email Services
  RESEND_API_KEY: nonEmptyString.describe('Resend email service API key'),
  EMAIL_FROM: emailString.describe('Default sender email address'),
  
  // Payment Processing - Stripe
  STRIPE_SECRET_KEY: nonEmptyString.describe('Stripe secret key for server-side operations'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: nonEmptyString.describe('Stripe publishable key for client-side'),
  STRIPE_WEBHOOK_SECRET: nonEmptyString.describe('Stripe webhook signing secret'),
  STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS: nonEmptyString.describe('Stripe subscription webhook signing secret'),
  STRIPE_ACCOUNT_ID: nonEmptyString.optional().describe('Stripe connected account ID'),
  
  // Stripe Price IDs
  STRIPE_PRICE_STARTER: nonEmptyString.describe('Stripe price ID for starter plan'),
  STRIPE_PRICE_PRO: nonEmptyString.describe('Stripe price ID for pro plan'),
  STRIPE_PRICE_ENTERPRISE: nonEmptyString.describe('Stripe price ID for enterprise plan'),
  
  // Square Payment Processing
  SQUARE_ACCESS_TOKEN: nonEmptyString.describe('Square API access token'),
  SQUARE_ENVIRONMENT: z.enum(['sandbox', 'production']).describe('Square environment'),
  SQUARE_APPLICATION_ID: nonEmptyString.optional().describe('Square application ID'),
  SQUARE_LOCATION_ID: nonEmptyString.optional().describe('Square location ID'),
  
  // Security & Monitoring
  NEXT_PUBLIC_SENTRY_DSN: urlString.optional().describe('Sentry DSN for error monitoring'),
  CRON_SECRET: nonEmptyString.describe('Secret token for securing cron job endpoints'),
  
  // Development & Testing
  SEED_USER_PASSWORD: developmentOnlyString.describe('Password for seeded development users'),
  TEST_EMAIL: emailString.optional().describe('Email address for testing'),
  TEST_URL: urlString.optional().describe('URL for testing purposes'),
})

// Extract the validated environment type
export type ValidatedEnv = z.infer<typeof envSchema>

// Cache for validated environment
let _validatedEnv: ValidatedEnv | null = null

/**
 * Validates and returns the application environment variables
 * 
 * @param throwOnError - Whether to throw an error if validation fails (default: true)
 * @returns Validated environment variables
 */
export function validateEnvironment(throwOnError: boolean = true): ValidatedEnv | null {
  // Return cached result if available
  if (_validatedEnv) {
    return _validatedEnv
  }

  try {
    logger.info('🔍 Validating environment variables...')
    
    // Parse and validate environment variables
    const result = envSchema.safeParse(process.env)
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => {
        const path = err.path.join('.')
        return `  ❌ ${path}: ${err.message}`
      }).join('\n')
      
      const errorMessage = `Environment validation failed:\n${errors}\n\nPlease check your .env files and ensure all required variables are set.`
      
      logger.error('Environment validation failed', result.error as any, {
        errorCount: result.error.issues.length,
        missingVars: result.error.issues.map((err: any) => err.path.join('.'))
      })
      
      if (throwOnError) {
        throw new Error(errorMessage)
      }
      
      return null
    }
    
    // Cache successful result
    _validatedEnv = result.data
    
    // Log successful validation with some stats
    const definedVars = Object.keys(result.data).filter(key => result.data[key as keyof ValidatedEnv] !== undefined)
    logger.info('✅ Environment validation successful', {
      totalVariables: Object.keys(envSchema.shape).length,
      definedVariables: definedVars.length,
      environment: result.data.NODE_ENV
    })
    
    return result.data
    
  } catch (error) {
    logger.error('Failed to validate environment', error)
    
    if (throwOnError) {
      throw error
    }
    
    return null
  }
}

/**
 * Gets a validated environment variable value
 * Throws an error if the environment hasn't been validated yet
 */
export function getEnv(): ValidatedEnv {
  if (!_validatedEnv) {
    throw new Error('Environment not validated. Call validateEnvironment() first.')
  }
  return _validatedEnv
}

/**
 * Validates environment variables for build-time checks
 * More lenient than runtime validation
 */
export function validateEnvironmentForBuild(): boolean {
  try {
    validateEnvironment(false)
    return true
  } catch (error) {
    logger.warn('Build-time environment validation failed', error as any)
    return false
  }
}

/**
 * Development helper to list all expected environment variables
 */
export function listEnvironmentVariables(): Record<string, string> {
  const shape = envSchema.shape
  const variables: Record<string, string> = {}
  
  for (const [key, schema] of Object.entries(shape)) {
    // Extract description from nested schema structure
    let description = 'No description available'
    let current = schema as any
    
    // Navigate through potential wrapper schemas (optional, transform, etc.)
    while (current) {
      if (current._def?.description) {
        description = current._def.description
        break
      }
      if (current._def?.innerType) {
        current = current._def.innerType
      } else if (current._def?.schema) {
        current = current._def.schema
      } else {
        break
      }
    }
    
    variables[key] = description
  }
  
  return variables
}

/**
 * Runtime check to ensure critical environment variables are available
 * This is a lighter check that can be used in middleware or API routes
 */
export function checkCriticalEnvVars(): boolean {
  const critical = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'REDIS_URL',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  for (const varName of critical) {
    if (!process.env[varName]) {
      logger.error(`Critical environment variable missing: ${varName}`)
      return false
    }
  }
  
  return true
}

// Auto-validate on import in non-test environments
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Use a try-catch to prevent import failures during build
  try {
    validateEnvironment(false)
  } catch (error) {
    // Only log in development to avoid noise in production logs
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Environment validation failed on import:', error instanceof Error ? error.message : error)
    }
  }
}