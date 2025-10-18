#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Bundle Performance Measurement Script
 * 
 * This script measures and analyzes bundle loading performance:
 * - Load time simulation for different network conditions
 * - Bundle parse time estimation
 * - Critical path analysis
 * - Performance budget validation
 * - Real User Monitoring (RUM) integration setup
 */

const PERFORMANCE_DIR = 'bundle-analysis/performance'
const BUDGETS_FILE = 'performance-budgets.json'

class BundlePerformanceAnalyzer {
  constructor() {
    this.networkProfiles = {
      'slow-3g': {
        name: 'Slow 3G',
        downloadSpeed: 400 * 1024 / 8, // 400 kbps in bytes/sec
        latency: 400, // ms
        description: 'Emerging markets mobile'
      },
      'regular-3g': {
        name: 'Regular 3G', 
        downloadSpeed: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
        latency: 300,
        description: 'Average mobile connection'
      },
      'fast-3g': {
        name: 'Fast 3G',
        downloadSpeed: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps  
        latency: 150,
        description: 'Good mobile connection'
      },
      '4g': {
        name: '4G',
        downloadSpeed: 10 * 1024 * 1024 / 8, // 10 Mbps
        latency: 70,
        description: 'Modern mobile'
      },
      'wifi': {
        name: 'WiFi',
        downloadSpeed: 25 * 1024 * 1024 / 8, // 25 Mbps
        latency: 20,
        description: 'Broadband connection'
      }
    }

    this.performanceBudgets = this.loadPerformanceBudgets()
    this.analysis = null
  }

  /**
   * Run performance analysis
   */
  async analyze() {
    console.log('⚡ Starting bundle performance analysis...\n')

    try {
      // Load bundle analysis data
      this.loadBundleAnalysis()

      // Ensure performance directory exists
      if (!fs.existsSync(PERFORMANCE_DIR)) {
        fs.mkdirSync(PERFORMANCE_DIR, { recursive: true })
      }

      // Run performance calculations
      const results = {
        timestamp: new Date().toISOString(),
        networkAnalysis: this.analyzeNetworkPerformance(),
        parseTimeAnalysis: this.analyzeParseTime(),
        criticalPathAnalysis: this.analyzeCriticalPath(),
        budgetAnalysis: this.analyzeBudgets(),
        recommendations: this.generatePerformanceRecommendations()
      }

      // Save results
      this.saveResults(results)

      // Display results
      this.displayResults(results)

      // Check budget violations
      this.checkBudgetViolations(results.budgetAnalysis)

    } catch (error) {
      console.error('❌ Performance analysis failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Load bundle analysis data
   */
  loadBundleAnalysis() {
    const analysisPath = path.join('bundle-analysis', 'latest.json')
    
    if (!fs.existsSync(analysisPath)) {
      throw new Error('Bundle analysis not found. Run `npm run bundle:size` first.')
    }

    this.analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'))
  }

  /**
   * Load performance budgets
   */
  loadPerformanceBudgets() {
    const budgetsPath = path.join(PERFORMANCE_DIR, BUDGETS_FILE)
    
    if (fs.existsSync(budgetsPath)) {
      try {
        return JSON.parse(fs.readFileSync(budgetsPath, 'utf8'))
      } catch (error) {
        console.warn('⚠️  Could not load performance budgets, using defaults')
      }
    }

    // Default performance budgets
    const defaultBudgets = {
      totalSize: {
        max: 250 * 1024, // 250KB
        warning: 200 * 1024, // 200KB
        description: 'Total JavaScript bundle size'
      },
      initialLoadTime: {
        max: 3000, // 3 seconds
        warning: 2000, // 2 seconds  
        description: 'Time to load initial bundle on 3G'
      },
      parseTime: {
        max: 1000, // 1 second
        warning: 500, // 0.5 seconds
        description: 'Time to parse JavaScript'
      },
      chunkSize: {
        max: 100 * 1024, // 100KB
        warning: 75 * 1024, // 75KB
        description: 'Individual chunk size'
      }
    }

    // Save default budgets
    fs.writeFileSync(
      path.join(PERFORMANCE_DIR, BUDGETS_FILE),
      JSON.stringify(defaultBudgets, null, 2)
    )

    return defaultBudgets
  }

  /**
   * Analyze network performance across different connections
   */
  analyzeNetworkPerformance() {
    const analysis = {}
    const totalSize = this.analysis.totalSize

    for (const [profileKey, profile] of Object.entries(this.networkProfiles)) {
      const downloadTime = (totalSize / profile.downloadSpeed) * 1000 // ms
      const totalTime = downloadTime + profile.latency

      analysis[profileKey] = {
        name: profile.name,
        downloadTime: Math.round(downloadTime),
        latency: profile.latency,
        totalTime: Math.round(totalTime),
        userExperience: this.classifyLoadTime(totalTime),
        description: profile.description
      }
    }

    return analysis
  }

  /**
   * Estimate JavaScript parse time
   */
  analyzeParseTime() {
    const jsChunks = this.analysis.chunks['JavaScript'] || { files: [], totalSize: 0 }
    
    // Parse time estimation: ~1ms per KB on average mobile device
    const parseTimePerKB = 1 // ms
    const totalParseTime = (jsChunks.totalSize / 1024) * parseTimePerKB

    // Analyze individual chunks
    const chunkAnalysis = jsChunks.files.map(file => ({
      name: file.name,
      size: file.size,
      estimatedParseTime: Math.round((file.size / 1024) * parseTimePerKB),
      impact: this.classifyParseTime((file.size / 1024) * parseTimePerKB)
    })).sort((a, b) => b.estimatedParseTime - a.estimatedParseTime)

    return {
      totalParseTime: Math.round(totalParseTime),
      impact: this.classifyParseTime(totalParseTime),
      largestChunks: chunkAnalysis.slice(0, 10),
      recommendations: this.getParseTimeRecommendations(totalParseTime, chunkAnalysis)
    }
  }

  /**
   * Analyze critical rendering path
   */
  analyzeCriticalPath() {
    const cssChunks = this.analysis.chunks['CSS'] || { files: [], totalSize: 0 }
    const jsChunks = this.analysis.chunks['JavaScript'] || { files: [], totalSize: 0 }

    // Critical resources (blocking)
    const criticalCSS = cssChunks.totalSize
    const criticalJS = jsChunks.files
      .filter(file => file.name.includes('_app') || file.name.includes('main'))
      .reduce((total, file) => total + file.size, 0)

    const criticalSize = criticalCSS + criticalJS

    // Estimate Critical Resource Download Time on 3G
    const profile3G = this.networkProfiles['regular-3g']
    const criticalLoadTime = (criticalSize / profile3G.downloadSpeed) * 1000 + profile3G.latency

    return {
      criticalResources: {
        css: {
          size: criticalCSS,
          files: cssChunks.files.length
        },
        javascript: {
          size: criticalJS,
          files: jsChunks.files.filter(f => f.name.includes('_app') || f.name.includes('main')).length
        }
      },
      totalCriticalSize: criticalSize,
      estimatedCriticalLoadTime: Math.round(criticalLoadTime),
      impact: this.classifyCriticalPath(criticalLoadTime),
      recommendations: this.getCriticalPathRecommendations(criticalLoadTime, criticalSize)
    }
  }

  /**
   * Analyze performance against budgets
   */
  analyzeBudgets() {
    const results = {}
    const analysis = this.analysis

    // Total size budget
    results.totalSize = this.checkBudget(
      'totalSize',
      analysis.totalSize,
      this.performanceBudgets.totalSize
    )

    // Initial load time budget (3G)
    const profile3G = this.networkProfiles['regular-3g']
    const loadTime = (analysis.totalSize / profile3G.downloadSpeed) * 1000 + profile3G.latency
    results.initialLoadTime = this.checkBudget(
      'initialLoadTime',
      loadTime,
      this.performanceBudgets.initialLoadTime
    )

    // Parse time budget
    const jsSize = analysis.chunks['JavaScript']?.totalSize || 0
    const parseTime = (jsSize / 1024) * 1 // 1ms per KB
    results.parseTime = this.checkBudget(
      'parseTime',
      parseTime,
      this.performanceBudgets.parseTime
    )

    // Individual chunk size budget
    const violations = []
    const jsChunks = analysis.chunks['JavaScript']?.files || []
    for (const chunk of jsChunks) {
      if (chunk.size > this.performanceBudgets.chunkSize.max) {
        violations.push({
          name: chunk.name,
          size: chunk.size,
          overage: chunk.size - this.performanceBudgets.chunkSize.max
        })
      }
    }

    results.chunkSize = {
      budget: this.performanceBudgets.chunkSize,
      violations: violations,
      status: violations.length > 0 ? 'fail' : 'pass'
    }

    return results
  }

  /**
   * Check individual budget
   */
  checkBudget(name, actual, budget) {
    let status = 'pass'
    if (actual > budget.max) {
      status = 'fail'
    } else if (actual > budget.warning) {
      status = 'warning'
    }

    return {
      budget,
      actual,
      status,
      overage: Math.max(0, actual - budget.max),
      percentOfBudget: ((actual / budget.max) * 100).toFixed(1)
    }
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = []
    const analysis = this.analysis

    // Bundle size recommendations
    if (analysis.totalSize > 250 * 1024) {
      recommendations.push({
        type: 'bundle-size',
        priority: 'high',
        title: 'Reduce total bundle size',
        description: `Bundle size (${this.formatBytes(analysis.totalSize)}) exceeds 250KB limit`,
        impact: 'High impact on load time, especially on slower connections',
        actions: [
          'Implement code splitting with dynamic imports',
          'Use Next.js automatic code splitting features',
          'Analyze and remove unused dependencies',
          'Enable tree shaking for all imports'
        ]
      })
    }

    // Parse time recommendations
    const jsSize = analysis.chunks['JavaScript']?.totalSize || 0
    const parseTime = (jsSize / 1024) * 1
    if (parseTime > 500) {
      recommendations.push({
        type: 'parse-time',
        priority: 'medium',
        title: 'Optimize JavaScript parse time',
        description: `Estimated parse time (${parseTime.toFixed(0)}ms) may cause delays on slower devices`,
        impact: 'Affects Time to Interactive (TTI) and user experience',
        actions: [
          'Split large JavaScript bundles',
          'Use service workers for caching',
          'Consider preloading critical scripts',
          'Optimize JavaScript with minification and compression'
        ]
      })
    }

    // Critical path recommendations  
    const cssSize = analysis.chunks['CSS']?.totalSize || 0
    if (cssSize > 50 * 1024) {
      recommendations.push({
        type: 'critical-css',
        priority: 'medium',
        title: 'Optimize CSS delivery',
        description: `CSS size (${this.formatBytes(cssSize)}) may block rendering`,
        impact: 'Delays First Contentful Paint (FCP)',
        actions: [
          'Inline critical CSS',
          'Use CSS-in-JS for component-specific styles',
          'Remove unused CSS with tools like PurgeCSS',
          'Load non-critical CSS asynchronously'
        ]
      })
    }

    return recommendations
  }

  /**
   * Classify load time user experience
   */
  classifyLoadTime(timeMs) {
    if (timeMs < 1000) return { rating: 'excellent', emoji: '🟢' }
    if (timeMs < 2500) return { rating: 'good', emoji: '🟡' }
    if (timeMs < 4000) return { rating: 'poor', emoji: '🟠' }
    return { rating: 'critical', emoji: '🔴' }
  }

  /**
   * Classify parse time impact
   */
  classifyParseTime(timeMs) {
    if (timeMs < 250) return { rating: 'excellent', emoji: '🟢' }
    if (timeMs < 500) return { rating: 'good', emoji: '🟡' }
    if (timeMs < 1000) return { rating: 'poor', emoji: '🟠' }
    return { rating: 'critical', emoji: '🔴' }
  }

  /**
   * Classify critical path performance
   */
  classifyCriticalPath(timeMs) {
    if (timeMs < 1500) return { rating: 'excellent', emoji: '🟢' }
    if (timeMs < 2500) return { rating: 'good', emoji: '🟡' }
    if (timeMs < 3500) return { rating: 'poor', emoji: '🟠' }
    return { rating: 'critical', emoji: '🔴' }
  }

  /**
   * Get parse time recommendations
   */
  getParseTimeRecommendations(totalTime, chunks) {
    const recommendations = []

    if (totalTime > 500) {
      recommendations.push('Consider code splitting for large chunks')
    }

    const largeChunks = chunks.filter(c => c.estimatedParseTime > 100)
    if (largeChunks.length > 0) {
      recommendations.push(`Split ${largeChunks.length} large JavaScript chunks`)
    }

    if (totalTime > 1000) {
      recommendations.push('Implement progressive loading strategy')
    }

    return recommendations
  }

  /**
   * Get critical path recommendations
   */
  getCriticalPathRecommendations(loadTime, size) {
    const recommendations = []

    if (loadTime > 2000) {
      recommendations.push('Reduce critical resource size')
      recommendations.push('Implement resource hints (preload, prefetch)')
    }

    if (size > 100 * 1024) {
      recommendations.push('Inline critical CSS to reduce requests')
      recommendations.push('Defer non-critical JavaScript')
    }

    return recommendations
  }

  /**
   * Save performance results
   */
  saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `performance-${timestamp}.json`
    const filepath = path.join(PERFORMANCE_DIR, filename)

    fs.writeFileSync(filepath, JSON.stringify(results, null, 2))
    fs.writeFileSync(
      path.join(PERFORMANCE_DIR, 'latest-performance.json'),
      JSON.stringify(results, null, 2)
    )

    console.log(`💾 Performance analysis saved: ${filename}`)
  }

  /**
   * Display performance results
   */
  displayResults(results) {
    console.log('⚡ Bundle Performance Analysis Results')
    console.log('═'.repeat(50))

    // Network performance
    console.log('\n🌐 Network Performance:')
    for (const [key, data] of Object.entries(results.networkAnalysis)) {
      const { emoji } = data.userExperience
      console.log(`  ${emoji} ${data.name}: ${data.totalTime}ms (${data.userExperience.rating})`)
    }

    // Parse time analysis
    console.log(`\n🧮 JavaScript Parse Time: ${results.parseTimeAnalysis.totalParseTime}ms`)
    console.log(`   Impact: ${results.parseTimeAnalysis.impact.emoji} ${results.parseTimeAnalysis.impact.rating}`)

    // Critical path
    console.log(`\n🎯 Critical Path Load Time: ${results.criticalPathAnalysis.estimatedCriticalLoadTime}ms`)
    console.log(`   Impact: ${results.criticalPathAnalysis.impact.emoji} ${results.criticalPathAnalysis.impact.rating}`)

    // Budget status
    console.log('\n💰 Performance Budget Status:')
    for (const [metric, data] of Object.entries(results.budgetAnalysis)) {
      const status = data.status === 'pass' ? '✅' : data.status === 'warning' ? '⚠️' : '❌'
      console.log(`   ${status} ${metric}: ${data.percentOfBudget}% of budget`)
    }

    // Recommendations
    if (results.recommendations.length > 0) {
      console.log('\n🚀 Performance Recommendations:')
      for (const rec of results.recommendations) {
        const priority = rec.priority === 'high' ? '🔴' : '🟡'
        console.log(`   ${priority} ${rec.title}`)
        console.log(`      ${rec.description}`)
      }
    }

    console.log('')
  }

  /**
   * Check budget violations and exit appropriately
   */
  checkBudgetViolations(budgetAnalysis) {
    const failures = Object.values(budgetAnalysis)
      .filter(result => result.status === 'fail')

    if (failures.length > 0) {
      console.log('❌ Performance budget violations detected:')
      for (const failure of failures) {
        console.log(`   • ${failure.budget.description}: exceeded by ${this.formatBytes(failure.overage)}`)
      }
      console.log('\nPlease optimize performance before proceeding.')
      process.exit(1)
    } else {
      console.log('✅ All performance budgets passed!')
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundlePerformanceAnalyzer()
  analyzer.analyze().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = BundlePerformanceAnalyzer