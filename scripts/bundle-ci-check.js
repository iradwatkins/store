#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * CI/CD Bundle Analysis Integration Script
 * 
 * This script provides automated bundle monitoring for CI/CD pipelines:
 * - Size regression detection
 * - Performance budget enforcement
 * - Pull request comments with bundle analysis
 * - Slack/Teams notifications for significant changes
 * - Historical tracking and trend analysis
 */

const ANALYSIS_DIR = 'bundle-analysis'
const CI_CONFIG_FILE = 'bundle-ci-config.json'
const GITHUB_OUTPUT_FILE = process.env.GITHUB_OUTPUT
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL

class BundleCIChecker {
  constructor() {
    this.config = this.loadConfig()
    this.isCI = this.detectCIEnvironment()
    this.results = {
      success: true,
      checks: [],
      metrics: {},
      notifications: []
    }
  }

  /**
   * Run CI bundle checks
   */
  async run() {
    console.log('🔍 Running CI bundle analysis...\n')

    try {
      // Check if analysis data exists
      this.validateAnalysisData()

      // Load current analysis
      const currentAnalysis = this.loadCurrentAnalysis()
      const historicalData = this.loadHistoricalData()

      // Run checks
      await this.runSizeRegressionCheck(currentAnalysis, historicalData)
      await this.runPerformanceBudgetCheck()
      await this.runTrendAnalysis(currentAnalysis, historicalData)

      // Generate outputs
      this.generateCIOutputs(currentAnalysis)
      this.generatePRComment(currentAnalysis, historicalData)
      
      // Send notifications if configured
      await this.sendNotifications(currentAnalysis, historicalData)

      // Display results
      this.displayResults()

      // Exit with appropriate code
      process.exit(this.results.success ? 0 : 1)

    } catch (error) {
      console.error('❌ CI bundle check failed:', error.message)
      this.results.success = false
      this.results.checks.push({
        name: 'CI Setup',
        status: 'fail',
        message: error.message
      })
      process.exit(1)
    }
  }

  /**
   * Load CI configuration
   */
  loadConfig() {
    const configPath = path.join(ANALYSIS_DIR, CI_CONFIG_FILE)
    
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'))
      } catch (error) {
        console.warn('⚠️  Could not load CI config, using defaults')
      }
    }

    // Default CI configuration
    const defaultConfig = {
      sizeRegression: {
        maxIncrease: 10 * 1024, // 10KB
        maxIncreasePercent: 5, // 5%
        failOnRegression: true
      },
      performanceBudgets: {
        enforce: true,
        failOnViolation: true
      },
      notifications: {
        slack: {
          enabled: !!SLACK_WEBHOOK,
          threshold: 20 * 1024 // 20KB change
        },
        github: {
          enabled: !!GITHUB_OUTPUT_FILE,
          prComments: true
        }
      },
      trends: {
        analyzePeriod: 30, // days
        alertThreshold: 50 * 1024 // 50KB total growth
      }
    }

    // Save default config
    if (!fs.existsSync(ANALYSIS_DIR)) {
      fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

    return defaultConfig
  }

  /**
   * Detect CI environment
   */
  detectCIEnvironment() {
    const ciEnvs = [
      'CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS', 
      'GITLAB_CI', 'CIRCLECI', 'TRAVIS', 'JENKINS_URL'
    ]
    
    return ciEnvs.some(env => process.env[env])
  }

  /**
   * Validate analysis data exists
   */
  validateAnalysisData() {
    const requiredFiles = [
      path.join(ANALYSIS_DIR, 'latest.json'),
      path.join(ANALYSIS_DIR, 'performance', 'latest-performance.json')
    ]

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required analysis file not found: ${file}. Run bundle analysis first.`)
      }
    }
  }

  /**
   * Load current analysis data
   */
  loadCurrentAnalysis() {
    const analysisPath = path.join(ANALYSIS_DIR, 'latest.json')
    const performancePath = path.join(ANALYSIS_DIR, 'performance', 'latest-performance.json')

    return {
      bundle: JSON.parse(fs.readFileSync(analysisPath, 'utf8')),
      performance: JSON.parse(fs.readFileSync(performancePath, 'utf8'))
    }
  }

  /**
   * Load historical data
   */
  loadHistoricalData() {
    const historyPath = path.join(ANALYSIS_DIR, 'history.json')
    
    if (fs.existsSync(historyPath)) {
      try {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'))
      } catch (error) {
        console.warn('⚠️  Could not load historical data')
      }
    }

    return { entries: [] }
  }

  /**
   * Check for size regressions
   */
  async runSizeRegressionCheck(currentAnalysis, historicalData) {
    const config = this.config.sizeRegression
    const currentSize = currentAnalysis.bundle.totalSize

    if (historicalData.entries.length === 0) {
      this.results.checks.push({
        name: 'Size Regression',
        status: 'skip',
        message: 'No historical data available for comparison'
      })
      return
    }

    const previousEntry = historicalData.entries[historicalData.entries.length - 1]
    const previousSize = previousEntry.totalSize
    const sizeDiff = currentSize - previousSize
    const percentDiff = (sizeDiff / previousSize) * 100

    // Check thresholds
    const exceedsAbsolute = Math.abs(sizeDiff) > config.maxIncrease
    const exceedsPercent = Math.abs(percentDiff) > config.maxIncreasePercent
    const isRegression = sizeDiff > 0 && (exceedsAbsolute || exceedsPercent)

    const status = isRegression && config.failOnRegression ? 'fail' : 
                  isRegression ? 'warning' : 'pass'

    this.results.checks.push({
      name: 'Size Regression',
      status,
      message: `Bundle size changed by ${this.formatBytes(sizeDiff)} (${percentDiff.toFixed(1)}%)`,
      details: {
        currentSize,
        previousSize,
        sizeDiff,
        percentDiff,
        threshold: {
          absolute: config.maxIncrease,
          percent: config.maxIncreasePercent
        }
      }
    })

    this.results.metrics.sizeChange = {
      absolute: sizeDiff,
      percent: percentDiff,
      direction: sizeDiff > 0 ? 'increase' : 'decrease'
    }

    if (status === 'fail') {
      this.results.success = false
    }
  }

  /**
   * Check performance budgets
   */
  async runPerformanceBudgetCheck() {
    const config = this.config.performanceBudgets
    
    if (!config.enforce) {
      this.results.checks.push({
        name: 'Performance Budgets',
        status: 'skip',
        message: 'Performance budget enforcement disabled'
      })
      return
    }

    const performanceFile = path.join(ANALYSIS_DIR, 'performance', 'latest-performance.json')
    const performanceData = JSON.parse(fs.readFileSync(performanceFile, 'utf8'))
    
    const violations = []
    const budgetAnalysis = performanceData.budgetAnalysis

    for (const [metric, result] of Object.entries(budgetAnalysis)) {
      if (result.status === 'fail') {
        violations.push({
          metric,
          actual: result.actual,
          budget: result.budget.max,
          overage: result.overage
        })
      }
    }

    const status = violations.length > 0 && config.failOnViolation ? 'fail' : 
                  violations.length > 0 ? 'warning' : 'pass'

    this.results.checks.push({
      name: 'Performance Budgets',
      status,
      message: violations.length > 0 ? 
        `${violations.length} budget violations detected` : 
        'All performance budgets passed',
      details: { violations }
    })

    if (status === 'fail') {
      this.results.success = false
    }
  }

  /**
   * Analyze trends over time
   */
  async runTrendAnalysis(currentAnalysis, historicalData) {
    const config = this.config.trends
    const entries = historicalData.entries

    if (entries.length < 5) {
      this.results.checks.push({
        name: 'Trend Analysis',
        status: 'skip',
        message: 'Insufficient historical data for trend analysis'
      })
      return
    }

    // Analyze last 30 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.analyzePeriod)

    const recentEntries = entries.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    )

    if (recentEntries.length < 3) {
      this.results.checks.push({
        name: 'Trend Analysis', 
        status: 'skip',
        message: 'Insufficient recent data for trend analysis'
      })
      return
    }

    const firstSize = recentEntries[0].totalSize
    const currentSize = currentAnalysis.bundle.totalSize
    const totalGrowth = currentSize - firstSize
    const avgGrowthPerDay = totalGrowth / config.analyzePeriod

    const isGrowthConcerning = Math.abs(totalGrowth) > config.alertThreshold
    const status = isGrowthConcerning ? 'warning' : 'pass'

    this.results.checks.push({
      name: 'Trend Analysis',
      status,
      message: `Bundle size ${totalGrowth > 0 ? 'increased' : 'decreased'} by ${this.formatBytes(Math.abs(totalGrowth))} over ${config.analyzePeriod} days`,
      details: {
        periodDays: config.analyzePeriod,
        totalGrowth,
        avgGrowthPerDay,
        dataPoints: recentEntries.length
      }
    })

    this.results.metrics.trend = {
      totalGrowth,
      avgGrowthPerDay,
      period: config.analyzePeriod
    }
  }

  /**
   * Generate CI system outputs
   */
  generateCIOutputs(currentAnalysis) {
    const metrics = {
      bundleSize: currentAnalysis.bundle.totalSize,
      bundleSizeFormatted: this.formatBytes(currentAnalysis.bundle.totalSize),
      checksTotal: this.results.checks.length,
      checksPassed: this.results.checks.filter(c => c.status === 'pass').length,
      checksFailed: this.results.checks.filter(c => c.status === 'fail').length,
      checksWarnings: this.results.checks.filter(c => c.status === 'warning').length,
      success: this.results.success
    }

    // GitHub Actions outputs
    if (GITHUB_OUTPUT_FILE) {
      const outputs = [
        `bundle-size=${metrics.bundleSize}`,
        `bundle-size-formatted=${metrics.bundleSizeFormatted}`,
        `checks-passed=${metrics.checksPassed}`,
        `checks-failed=${metrics.checksFailed}`,
        `checks-warnings=${metrics.checksWarnings}`,
        `success=${metrics.success}`
      ]

      if (this.results.metrics.sizeChange) {
        outputs.push(`size-change=${this.results.metrics.sizeChange.absolute}`)
        outputs.push(`size-change-percent=${this.results.metrics.sizeChange.percent.toFixed(2)}`)
      }

      fs.appendFileSync(GITHUB_OUTPUT_FILE, outputs.join('\n') + '\n')
      console.log('📤 GitHub Actions outputs generated')
    }

    // Save CI results
    const ciResultsPath = path.join(ANALYSIS_DIR, 'ci-results.json')
    fs.writeFileSync(ciResultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      checks: this.results.checks,
      environment: this.getCIEnvironmentInfo()
    }, null, 2))

    this.results.metrics = { ...this.results.metrics, ...metrics }
  }

  /**
   * Generate PR comment
   */
  generatePRComment(currentAnalysis, historicalData) {
    if (!this.config.notifications.github.prComments) {
      return
    }

    const currentSize = currentAnalysis.bundle.totalSize
    const sizeChange = this.results.metrics.sizeChange

    let comment = `## 📊 Bundle Analysis Report\n\n`
    comment += `**Bundle Size:** ${this.formatBytes(currentSize)}\n\n`

    if (sizeChange) {
      const direction = sizeChange.direction === 'increase' ? '📈' : '📉'
      const sign = sizeChange.absolute >= 0 ? '+' : ''
      comment += `**Size Change:** ${direction} ${sign}${this.formatBytes(sizeChange.absolute)} (${sizeChange.percent.toFixed(1)}%)\n\n`
    }

    // Check results
    comment += `### Check Results\n\n`
    for (const check of this.results.checks) {
      const emoji = check.status === 'pass' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌'
      comment += `${emoji} **${check.name}**: ${check.message}\n`
    }

    // Performance highlights
    if (currentAnalysis.performance.budgetAnalysis) {
      comment += `\n### Performance Budget Status\n\n`
      const budgets = currentAnalysis.performance.budgetAnalysis
      for (const [metric, result] of Object.entries(budgets)) {
        const emoji = result.status === 'pass' ? '✅' : 
                     result.status === 'warning' ? '⚠️' : '❌'
        comment += `${emoji} ${metric}: ${result.percentOfBudget}% of budget\n`
      }
    }

    comment += `\n---\n*Generated by Bundle Analyzer CI*`

    // Save PR comment
    const prCommentPath = path.join(ANALYSIS_DIR, 'pr-comment.md')
    fs.writeFileSync(prCommentPath, comment)
    console.log('💬 PR comment generated: pr-comment.md')
  }

  /**
   * Send notifications
   */
  async sendNotifications(currentAnalysis, historicalData) {
    const sizeChange = this.results.metrics.sizeChange
    
    // Only notify on significant changes
    if (!sizeChange || Math.abs(sizeChange.absolute) < this.config.notifications.slack.threshold) {
      return
    }

    // Slack notification
    if (this.config.notifications.slack.enabled && SLACK_WEBHOOK) {
      await this.sendSlackNotification(currentAnalysis, sizeChange)
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(currentAnalysis, sizeChange) {
    const direction = sizeChange.direction === 'increase' ? 'increased' : 'decreased'
    const emoji = sizeChange.direction === 'increase' ? '📈' : '📉'
    const color = sizeChange.direction === 'increase' ? 'warning' : 'good'

    const payload = {
      text: `Bundle Size ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
      attachments: [{
        color,
        fields: [
          {
            title: 'Bundle Size',
            value: this.formatBytes(currentAnalysis.bundle.totalSize),
            short: true
          },
          {
            title: 'Change',
            value: `${emoji} ${this.formatBytes(Math.abs(sizeChange.absolute))} (${Math.abs(sizeChange.percent).toFixed(1)}%)`,
            short: true
          },
          {
            title: 'Branch',
            value: this.getGitBranch(),
            short: true
          },
          {
            title: 'Commit',
            value: this.getGitCommit(),
            short: true
          }
        ],
        footer: 'Bundle Analyzer CI',
        ts: Math.floor(Date.now() / 1000)
      }]
    }

    try {
      const response = await fetch(SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        console.log('📱 Slack notification sent')
      } else {
        console.warn('⚠️  Failed to send Slack notification')
      }
    } catch (error) {
      console.warn('⚠️  Slack notification error:', error.message)
    }
  }

  /**
   * Display CI results
   */
  displayResults() {
    console.log('🎯 CI Bundle Check Results')
    console.log('═'.repeat(40))

    // Overall status
    const overallEmoji = this.results.success ? '✅' : '❌'
    console.log(`\n${overallEmoji} Overall Status: ${this.results.success ? 'PASSED' : 'FAILED'}`)

    // Bundle metrics
    if (this.results.metrics.bundleSize) {
      console.log(`\n📦 Bundle Size: ${this.results.metrics.bundleSizeFormatted}`)
      
      if (this.results.metrics.sizeChange) {
        const change = this.results.metrics.sizeChange
        const sign = change.absolute >= 0 ? '+' : ''
        console.log(`   Change: ${sign}${this.formatBytes(change.absolute)} (${change.percent.toFixed(1)}%)`)
      }
    }

    // Check results
    console.log('\n🔍 Check Results:')
    for (const check of this.results.checks) {
      const emoji = check.status === 'pass' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : 
                   check.status === 'skip' ? '⏭️' : '❌'
      console.log(`   ${emoji} ${check.name}: ${check.message}`)
    }

    console.log('')
  }

  /**
   * Get CI environment info
   */
  getCIEnvironmentInfo() {
    return {
      isCI: this.isCI,
      platform: process.platform,
      nodeVersion: process.version,
      ci: {
        github: !!process.env.GITHUB_ACTIONS,
        gitlab: !!process.env.GITLAB_CI,
        travis: !!process.env.TRAVIS,
        circle: !!process.env.CIRCLECI
      },
      git: {
        branch: this.getGitBranch(),
        commit: this.getGitCommit()
      }
    }
  }

  /**
   * Helper methods
   */
  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return process.env.GITHUB_REF_NAME || 'unknown'
    }
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return process.env.GITHUB_SHA?.substring(0, 7) || 'unknown'
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

// Run CI checks if called directly
if (require.main === module) {
  const checker = new BundleCIChecker()
  checker.run().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = BundleCIChecker