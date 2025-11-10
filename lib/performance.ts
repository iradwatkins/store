/* eslint-disable no-console */
/**
 * Performance monitoring and optimization utilities
 */

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Report to analytics service (e.g., Google Analytics, Vercel Analytics)
    console.log(metric)

    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }
}

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to ensure a function is only called once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load components with dynamic imports
 */
export async function lazyLoad<T>(
  importFunc: () => Promise<T>,
  componentName?: string
): Promise<T> {
  try {
    const start = performance.now()
    const loadedModule = await importFunc()
    const duration = performance.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Lazy Load] ${componentName || 'Component'} loaded in ${duration.toFixed(2)}ms`
      )
    }

    return loadedModule
  } catch (error) {
    console.error(`[Lazy Load] Failed to load ${componentName || 'component'}:`, error)
    throw error
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string) {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

/**
 * Prefetch pages for faster navigation
 */
export function prefetchPage(href: string) {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string, callback: () => void) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const start = performance.now()
    callback()
    const duration = performance.now() - start

    if (process.env.NODE_ENV === 'development' && duration > 16) {
      // Warn if render takes longer than one frame (16ms at 60fps)
      console.warn(
        `[Performance] ${componentName} render took ${duration.toFixed(2)}ms (>16ms threshold)`
      )
    }

    return duration
  }

  callback()
  return 0
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {return false}

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get connection quality
 */
export function getConnectionQuality(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown'
  }

  const connection = (navigator as any).connection
  const effectiveType = connection?.effectiveType

  if (effectiveType === '4g') {return 'fast'}
  if (effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g') {
    return 'slow'
  }

  return 'unknown'
}

/**
 * Adaptive loading based on network and device capabilities
 */
export function shouldLoadHeavyContent(): boolean {
  // Check if user is on a fast connection
  const connectionQuality = getConnectionQuality()
  if (connectionQuality === 'slow') {return false}

  // Check if device has limited memory (< 4GB)
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory
    if (memory && memory < 4) {return false}
  }

  // Check if battery is low
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    ;(navigator as any).getBattery().then((battery: any) => {
      if (battery.level < 0.2 && !battery.charging) {return false}
    })
  }

  return true
}

/**
 * Image loading priority helper
 */
export function getImagePriority(index: number, _totalImages: number): boolean {
  // Prioritize first 3 images
  return index < 3
}

/**
 * Calculate layout shift score
 */
export function calculateCLS(entries: PerformanceEntry[]): number {
  let clsValue = 0

  entries.forEach((entry: any) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value
    }
  })

  return clsValue
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[Performance] Long task detected:', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime,
            })
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })

      return () => observer.disconnect()
    } catch {
      // PerformanceObserver not supported
      console.log('[Performance] Long task monitoring not supported')
    }
  }

  return () => {}
}

/**
 * Cache key generator for React Query / SWR
 */
export function generateCacheKey(...args: any[]): string {
  return JSON.stringify(args)
}

/**
 * Stale-while-revalidate cache helper
 */
export interface CacheOptions {
  maxAge: number // milliseconds
  staleWhileRevalidate?: number // milliseconds
}

export class SWRCache {
  private cache = new Map<string, { data: any; timestamp: number }>()

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string, options: CacheOptions): { data: any; isStale: boolean } | null {
    const cached = this.cache.get(key)
    if (!cached) {return null}

    const age = Date.now() - cached.timestamp
    const isStale = age > options.maxAge

    if (isStale && (!options.staleWhileRevalidate || age > options.staleWhileRevalidate)) {
      this.cache.delete(key)
      return null
    }

    return { data: cached.data, isStale }
  }

  clear() {
    this.cache.clear()
  }
}
