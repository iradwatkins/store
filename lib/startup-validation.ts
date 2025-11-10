import { validateEnvironment, checkCriticalEnvVars } from './env-validation'
import { logger } from './logger'

/**
 * Application Startup Validation
 * 
 * This module provides validation hooks that should be called
 * at application startup to ensure the environment is properly configured.
 */

export interface StartupValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Performs comprehensive startup validation
 * 
 * @param options Validation options
 */
export function validateAppStartup(options: {
  requireAllEnvVars?: boolean
  validateDatabaseConnection?: boolean
  validateRedisConnection?: boolean
} = {}): StartupValidationResult {
  
  const result: StartupValidationResult = {
    success: true,
    errors: [],
    warnings: []
  }

  logger.info('🚀 Starting application validation...')

  try {
    // 1. Validate environment variables
    const env = validateEnvironment(options.requireAllEnvVars ?? true)
    
    if (!env) {
      result.success = false
      result.errors.push('Environment variable validation failed')
      return result
    }

    // 2. Check critical environment variables for basic functionality
    if (!checkCriticalEnvVars()) {
      result.success = false
      result.errors.push('Critical environment variables are missing')
      return result
    }

    // 3. Validate environment-specific configurations
    if (env.NODE_ENV === 'production') {
      // Production-specific validations
      if (!env.NEXT_PUBLIC_SENTRY_DSN) {
        result.warnings.push('Sentry DSN not configured for production monitoring')
      }
      
      if (env.NEXTAUTH_SECRET === 'your-super-secret-jwt-secret-here') {
        result.errors.push('NEXTAUTH_SECRET is using the default example value in production')
        result.success = false
      }
      
      if (env.SQUARE_ENVIRONMENT === 'sandbox') {
        result.warnings.push('Square environment is set to sandbox in production')
      }
    }

    // 4. Validate URL configurations
    try {
      const appUrl = new URL(env.NEXT_PUBLIC_APP_URL)
      if (env.NODE_ENV === 'production' && appUrl.protocol === 'http:') {
        result.warnings.push('Using HTTP in production - consider HTTPS for security')
      }
    } catch {
      result.errors.push('NEXT_PUBLIC_APP_URL is not a valid URL')
      result.success = false
    }

    // 5. Validate email configuration
    if (!env.EMAIL_FROM.includes('@')) {
      result.errors.push('EMAIL_FROM must be a valid email address')
      result.success = false
    }

    // 6. Log validation summary
    if (result.success) {
      logger.info('✅ Startup validation completed successfully', {
        warnings: result.warnings.length,
        environment: env.NODE_ENV
      })
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => logger.warn(warning))
      }
    } else {
      logger.error('❌ Startup validation failed', {
        errors: result.errors.length,
        warnings: result.warnings.length
      })
      
      result.errors.forEach(error => logger.error(error))
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Startup validation error: ${error instanceof Error ? error.message : error}`)
    logger.error('Startup validation failed with exception', error)
  }

  return result
}

/**
 * Middleware-friendly validation for API routes
 * 
 * This is a lighter validation that can be used in middleware
 * without blocking the entire application startup.
 */
export function validateForApiRoute(): boolean {
  try {
    // Only check critical variables for API routes
    const critical = checkCriticalEnvVars()
    
    if (!critical) {
      logger.error('API route validation failed - critical environment variables missing')
      return false
    }

    return true
  } catch (error) {
    logger.error('API route validation error', error)
    return false
  }
}

/**
 * Development helper to validate and provide setup guidance
 */
export function validateDevelopmentSetup(): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  logger.info('🔧 Development setup validation...')

  const validation = validateAppStartup({ requireAllEnvVars: false })
  
  if (!validation.success) {
    /* eslint-disable no-console */
    console.log('\n❌ Development setup issues found:')
    validation.errors.forEach(error => console.log(`  • ${error}`))

    console.log('\n💡 Quick setup guide:')
    console.log('  1. Copy .env.example to .env.local')
    console.log('  2. Fill in required values for your setup')
    console.log('  3. Run `npm run env:validate` to check configuration')
    console.log('  4. Run `npm run env:list` to see all variables')
    console.log('')
    /* eslint-enable no-console */
  }

  if (validation.warnings.length > 0) {
    /* eslint-disable no-console */
    console.log('\n⚠️  Development recommendations:')
    validation.warnings.forEach(warning => console.log(`  • ${warning}`))
    console.log('')
    /* eslint-enable no-console */
  }
}

// Auto-run development validation in development mode
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Delay validation to avoid blocking imports
  setTimeout(() => {
    try {
      validateDevelopmentSetup()
    } catch (error) {
      // Silently handle validation errors during development
      // eslint-disable-next-line no-console
      console.warn('Development validation warning:', error instanceof Error ? error.message : error)
    }
  }, 100)
}