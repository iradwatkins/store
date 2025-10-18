#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Bundle Size Analysis and Monitoring Script
 * 
 * This script analyzes the Next.js build output to:
 * - Calculate total bundle sizes
 * - Identify largest chunks and pages
 * - Track size changes over time
 * - Generate actionable optimization recommendations
 * - Provide CI/CD integration for size monitoring
 */

const BUILD_DIR = '.next'
const STATIC_DIR = path.join(BUILD_DIR, 'static')
const ANALYSIS_DIR = 'bundle-analysis'
const MAX_BUNDLE_SIZE = 250 * 1024 // 250KB warning threshold
const MAX_CHUNK_SIZE = 100 * 1024 // 100KB warning threshold

class BundleSizeAnalyzer {
  constructor() {
    this.buildInfo = null
    this.analysis = {
      timestamp: new Date().toISOString(),
      totalSize: 0,
      gzippedSize: 0,
      pages: {},
      chunks: {},
      warnings: [],
      recommendations: []
    }
  }

  /**
   * Main analysis execution
   */
  async analyze() {
    console.log('🔍 Starting bundle size analysis...\n')

    try {
      // Check if build exists
      if (!fs.existsSync(BUILD_DIR)) {
        throw new Error('Build directory not found. Run `npm run build` first.')
      }

      // Load Next.js build info
      this.loadBuildInfo()

      // Analyze static assets
      this.analyzeStaticAssets()

      // Analyze pages and chunks
      this.analyzePages()
      this.analyzeChunks()

      // Generate recommendations
      this.generateRecommendations()

      // Save analysis results
      this.saveAnalysis()

      // Display results
      this.displayResults()

      // Check thresholds and exit with appropriate code
      this.checkThresholds()

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Load Next.js build information
   */
  loadBuildInfo() {
    const buildManifestPath = path.join(BUILD_DIR, 'build-manifest.json')
    
    if (fs.existsSync(buildManifestPath)) {
      this.buildInfo = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))
    }
  }

  /**
   * Analyze static assets in the build directory
   */
  analyzeStaticAssets() {
    const staticPath = path.join(BUILD_DIR, 'static')
    
    if (!fs.existsSync(staticPath)) {
      return
    }

    const analyzeDirectory = (dir, prefix = '') => {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const itemPath = path.join(dir, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
          analyzeDirectory(itemPath, `${prefix}${item}/`)
        } else if (stat.isFile()) {
          const size = stat.size
          this.analysis.totalSize += size
          
          // Categorize file types
          const ext = path.extname(item)
          const category = this.categorizeFile(ext)
          
          if (!this.analysis.chunks[category]) {
            this.analysis.chunks[category] = {
              files: [],
              totalSize: 0,
              count: 0
            }
          }
          
          this.analysis.chunks[category].files.push({
            name: `${prefix}${item}`,
            size: size,
            sizeFormatted: this.formatBytes(size)
          })
          this.analysis.chunks[category].totalSize += size
          this.analysis.chunks[category].count++
          
          // Check for large files
          if (size > MAX_CHUNK_SIZE) {
            this.analysis.warnings.push({
              type: 'large-file',
              message: `Large file detected: ${prefix}${item} (${this.formatBytes(size)})`,
              file: `${prefix}${item}`,
              size: size
            })
          }
        }
      }
    }

    analyzeDirectory(staticPath)
  }

  /**
   * Analyze individual pages
   */
  analyzePages() {
    const pagesManifestPath = path.join(BUILD_DIR, 'server', 'pages-manifest.json')
    
    if (!fs.existsSync(pagesManifestPath)) {
      return
    }

    const pagesManifest = JSON.parse(fs.readFileSync(pagesManifestPath, 'utf8'))
    
    for (const [page, info] of Object.entries(pagesManifest)) {
      this.analysis.pages[page] = {
        path: info,
        size: 0,
        chunks: []
      }
      
      // Try to find corresponding static files
      if (typeof info === 'string') {
        const staticFile = path.join(BUILD_DIR, info)
        if (fs.existsSync(staticFile)) {
          const stat = fs.statSync(staticFile)
          this.analysis.pages[page].size = stat.size
        }
      }
    }
  }

  /**
   * Analyze JavaScript chunks
   */
  analyzeChunks() {
    if (!this.buildInfo || !this.buildInfo.pages) {
      return
    }

    for (const [page, chunks] of Object.entries(this.buildInfo.pages)) {
      const pageInfo = this.analysis.pages[page] || { chunks: [] }
      
      for (const chunk of chunks) {
        const chunkPath = path.join(BUILD_DIR, 'static', chunk)
        
        if (fs.existsSync(chunkPath)) {
          const stat = fs.statSync(chunkPath)
          pageInfo.chunks.push({
            name: chunk,
            size: stat.size,
            sizeFormatted: this.formatBytes(stat.size)
          })
          
          // Update page total size
          pageInfo.size = (pageInfo.size || 0) + stat.size
        }
      }
      
      this.analysis.pages[page] = pageInfo
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = []
    
    // Check total bundle size
    if (this.analysis.totalSize > MAX_BUNDLE_SIZE * 4) {
      recommendations.push({
        type: 'bundle-size',
        priority: 'high',
        message: 'Total bundle size is very large. Consider code splitting and lazy loading.',
        suggestion: 'Implement dynamic imports for large components and use Next.js automatic code splitting.'
      })
    }

    // Check for large JavaScript chunks
    const jsChunks = this.analysis.chunks['JavaScript'] || { files: [] }
    const largeJSFiles = jsChunks.files.filter(file => file.size > MAX_CHUNK_SIZE)
    
    if (largeJSFiles.length > 0) {
      recommendations.push({
        type: 'large-js-chunks',
        priority: 'medium',
        message: `Found ${largeJSFiles.length} large JavaScript chunks.`,
        suggestion: 'Consider splitting large components and using dynamic imports.',
        files: largeJSFiles.map(f => f.name)
      })
    }

    // Check for duplicate dependencies
    const packageLockPath = 'package-lock.json'
    if (fs.existsSync(packageLockPath)) {
      try {
        const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
        const duplicates = this.findDuplicateDependencies(packageLock)
        
        if (duplicates.length > 0) {
          recommendations.push({
            type: 'duplicate-dependencies',
            priority: 'medium',
            message: `Found ${duplicates.length} potential duplicate dependencies.`,
            suggestion: 'Review package-lock.json for duplicate packages with different versions.',
            packages: duplicates
          })
        }
      } catch (error) {
        // Ignore package-lock parsing errors
      }
    }

    // Check for missing compression
    const hasGzipFiles = fs.readdirSync(STATIC_DIR, { recursive: true })
      .some(file => file.toString().endsWith('.gz'))
    
    if (!hasGzipFiles) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        message: 'No gzip compression detected in build output.',
        suggestion: 'Enable gzip compression in your deployment configuration or Next.js config.'
      })
    }

    this.analysis.recommendations = recommendations
  }

  /**
   * Find duplicate dependencies in package-lock.json
   */
  findDuplicateDependencies(packageLock) {
    const packages = {}
    const duplicates = []

    const traversePackages = (packages_obj, depth = 0) => {
      for (const [name, info] of Object.entries(packages_obj || {})) {
        const key = name
        const version = info.version
        
        if (packages[key]) {
          if (packages[key] !== version) {
            duplicates.push({
              name: key,
              versions: [packages[key], version]
            })
          }
        } else {
          packages[key] = version
        }
        
        if (info.dependencies) {
          traversePackages(info.dependencies, depth + 1)
        }
      }
    }

    if (packageLock.packages) {
      traversePackages(packageLock.packages)
    }

    return duplicates.slice(0, 10) // Limit to first 10 duplicates
  }

  /**
   * Categorize files by extension
   */
  categorizeFile(extension) {
    const categories = {
      '.js': 'JavaScript',
      '.css': 'CSS',
      '.woff': 'Fonts',
      '.woff2': 'Fonts',
      '.ttf': 'Fonts',
      '.eot': 'Fonts',
      '.png': 'Images',
      '.jpg': 'Images',
      '.jpeg': 'Images',
      '.svg': 'Images',
      '.gif': 'Images',
      '.webp': 'Images',
      '.ico': 'Images',
      '.json': 'Data',
      '.map': 'Source Maps'
    }
    
    return categories[extension] || 'Other'
  }

  /**
   * Save analysis results to file
   */
  saveAnalysis() {
    if (!fs.existsSync(ANALYSIS_DIR)) {
      fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
    }

    const filename = `bundle-analysis-${Date.now()}.json`
    const filepath = path.join(ANALYSIS_DIR, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(this.analysis, null, 2))
    
    // Also save as latest
    fs.writeFileSync(
      path.join(ANALYSIS_DIR, 'latest.json'),
      JSON.stringify(this.analysis, null, 2)
    )

    console.log(`📊 Analysis saved to: ${filepath}`)
  }

  /**
   * Display analysis results
   */
  displayResults() {
    console.log('📊 Bundle Size Analysis Results')
    console.log('═'.repeat(50))
    
    // Total size summary
    console.log(`\n📦 Total Bundle Size: ${this.formatBytes(this.analysis.totalSize)}`)
    
    // Breakdown by category
    console.log('\n📋 Size Breakdown:')
    for (const [category, info] of Object.entries(this.analysis.chunks)) {
      console.log(`  ${category}: ${this.formatBytes(info.totalSize)} (${info.count} files)`)
    }

    // Largest files
    console.log('\n🔍 Largest Files:')
    const allFiles = []
    for (const category of Object.values(this.analysis.chunks)) {
      allFiles.push(...category.files)
    }
    
    const largest = allFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
    
    for (const file of largest) {
      console.log(`  ${file.sizeFormatted.padStart(10)} ${file.name}`)
    }

    // Pages analysis
    const pageEntries = Object.entries(this.analysis.pages)
      .filter(([, info]) => info.size > 0)
      .sort(([, a], [, b]) => (b.size || 0) - (a.size || 0))
      .slice(0, 10)

    if (pageEntries.length > 0) {
      console.log('\n📄 Largest Pages:')
      for (const [page, info] of pageEntries) {
        console.log(`  ${this.formatBytes(info.size).padStart(10)} ${page}`)
      }
    }

    // Warnings
    if (this.analysis.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      for (const warning of this.analysis.warnings) {
        console.log(`  • ${warning.message}`)
      }
    }

    // Recommendations
    if (this.analysis.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:')
      for (const rec of this.analysis.recommendations) {
        const priority = rec.priority === 'high' ? '🔴' : '🟡'
        console.log(`  ${priority} ${rec.message}`)
        console.log(`     💡 ${rec.suggestion}`)
      }
    }

    console.log('')
  }

  /**
   * Check if bundle size exceeds thresholds
   */
  checkThresholds() {
    let exitCode = 0
    const errors = []
    
    // Check total bundle size
    if (this.analysis.totalSize > MAX_BUNDLE_SIZE * 8) {
      errors.push(`Total bundle size (${this.formatBytes(this.analysis.totalSize)}) exceeds critical threshold`)
      exitCode = 1
    }

    // Check for critical warnings
    const criticalWarnings = this.analysis.warnings.filter(w => w.type === 'large-file' && w.size > MAX_CHUNK_SIZE * 3)
    if (criticalWarnings.length > 0) {
      errors.push(`${criticalWarnings.length} files exceed critical size threshold`)
      exitCode = 1
    }

    if (errors.length > 0) {
      console.log('❌ Bundle size check failed:')
      for (const error of errors) {
        console.log(`  • ${error}`)
      }
      console.log('\nPlease optimize your bundle before proceeding.')
    } else {
      console.log('✅ Bundle size check passed!')
    }

    process.exit(exitCode)
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
  const analyzer = new BundleSizeAnalyzer()
  analyzer.analyze().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = BundleSizeAnalyzer