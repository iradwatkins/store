# Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in the stores-stepperslife application.

## Current Optimizations

### 1. Image Optimization

**Status**: ✅ Complete

- All images use `next/image` component (no `<img>` tags found)
- Configured modern formats: AVIF and WebP
- Responsive image sizes: 8 breakpoints (640px to 3840px)
- Image caching: 30-day TTL
- Remote patterns configured for:
  - AWS S3 (**.amazonaws.com)
  - Cloudinary (**.cloudinary.com)
  - Unsplash (images.unsplash.com)

**Configuration** (`next.config.js`):
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
}
```

### 2. Bundle Optimization

**Status**: ✅ Complete

- **Tree Shaking**: Enabled by default in Next.js 15
- **Code Splitting**: Automatic route-based splitting
- **Package Optimization**: Configured for:
  - `@radix-ui/react-icons`
  - `lucide-react`
  - `@tremor/react`
- **CSS Optimization**: Experimental CSS optimization enabled
- **Compression**: Gzip/Brotli enabled

**Bundle Analyzer**:
```bash
npm run analyze  # Analyze bundle size with visualization
```

### 3. Caching Strategy

**Status**: ✅ Complete

#### Client-Side Caching
- Static assets: 1 year cache (immutable)
- API responses: Configurable TTL with SWR strategy
- Images: 30-day browser cache

#### Server-Side Caching (Redis)
**File**: `lib/cache.ts`

Cache TTL tiers:
- **Short** (60s): Frequently changing data
- **Medium** (5min): Default for most data
- **Long** (15min): Relatively stable data
- **Very Long** (1hr): Rarely changing data

Cache key patterns:
```typescript
cacheKeys.productCatalog({ category, vendor, search, page })
cacheKeys.product(idOrSlug)
cacheKeys.vendorStorefront(slug)
cacheKeys.analytics(vendorStoreId)
```

Cache invalidation:
```typescript
// Tag-based invalidation
invalidateCacheTags(['products', 'vendors'])

// Entity-specific invalidation
invalidateProductCache(productId, vendorStoreId)
invalidateVendorCache(vendorStoreId)
```

### 4. Header Caching Rules

**Static Assets** (1 year, immutable):
- `/favicon.ico`
- `/_next/static/*`
- `/images/*`

**Security Headers** (all routes):
- HSTS: 1 year with preload
- CSP: Configured for Stripe, Google OAuth, Square
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### 5. Performance Utilities

**File**: `lib/performance.ts`

Available utilities:
- `reportWebVitals()` - Web Vitals monitoring
- `debounce()` / `throttle()` - Rate limiting functions
- `lazyLoad()` - Dynamic import wrapper
- `prefetchPage()` - Prefetch pages for faster navigation
- `measureRender()` - Component render time tracking
- `getConnectionQuality()` - Network quality detection
- `shouldLoadHeavyContent()` - Adaptive loading
- `monitorLongTasks()` - Long task detection (>50ms)
- `SWRCache` class - Stale-while-revalidate cache

### 6. Rate Limiting

**File**: `lib/cache.ts` (RateLimiter class)

Default limits:
- 100 requests per minute per user/IP
- Sliding window algorithm
- Automatic cleanup of expired entries

Usage:
```typescript
withRateLimit(handler, userId, { limit: 100, window: 60000 })
```

## Performance Metrics

### Target Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Lighthouse Performance | >90 | 🎯 To verify |
| First Contentful Paint (FCP) | <1.8s | 🎯 To verify |
| Largest Contentful Paint (LCP) | <2.5s | 🎯 To verify |
| Cumulative Layout Shift (CLS) | <0.1 | 🎯 To verify |
| Time to Interactive (TTI) | <3.8s | 🎯 To verify |
| Total Blocking Time (TBT) | <300ms | 🎯 To verify |
| Bundle Size (First Load JS) | <300KB | 🎯 To verify |

### Monitoring

```bash
# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze

# Check bundle performance
npm run bundle:performance
```

## Best Practices

### 1. Images

```tsx
import Image from 'next/image'

// ✅ Good: Using next/image with priority for above-fold
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority
/>

// ✅ Good: Lazy loading for below-fold images
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={400}
  loading="lazy"
/>

// ❌ Bad: Using <img> tag
<img src="/product.jpg" alt="Product" />
```

### 2. Code Splitting

```tsx
// ✅ Good: Dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false // Disable SSR for client-only components
})

// ❌ Bad: Static import for rarely used component
import HeavyChart from '@/components/HeavyChart'
```

### 3. Caching

```tsx
// ✅ Good: Cache API responses
import { getOrSetCache, cacheKeys, cacheTTL } from '@/lib/cache'

const products = await getOrSetCache(
  cacheKeys.productCatalog({ category: 'clothing' }),
  async () => await fetchProducts(),
  { ttl: cacheTTL.medium, tags: ['products'] }
)

// ❌ Bad: No caching for expensive operations
const products = await fetchProducts()
```

### 4. Debouncing/Throttling

```tsx
import { debounce, throttle } from '@/lib/performance'

// ✅ Good: Debounce search input
const handleSearch = debounce((query: string) => {
  fetchResults(query)
}, 300)

// ✅ Good: Throttle scroll handler
const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)
```

### 5. Adaptive Loading

```tsx
import { shouldLoadHeavyContent, getConnectionQuality } from '@/lib/performance'

// ✅ Good: Load high-res images only on fast connections
const imageQuality = shouldLoadHeavyContent() ? 100 : 75

<Image
  src="/product.jpg"
  quality={imageQuality}
  width={800}
  height={600}
/>
```

## Performance Checklist

### Pre-Launch
- [ ] Run Lighthouse audit (target: >90)
- [ ] Verify all images use `next/image`
- [ ] Check bundle size (`npm run analyze`)
- [ ] Test on slow 3G connection
- [ ] Verify cache headers are set correctly
- [ ] Test rate limiting on API routes
- [ ] Monitor Web Vitals in production

### Post-Launch
- [ ] Set up real user monitoring (RUM)
- [ ] Monitor Core Web Vitals weekly
- [ ] Review slow API endpoints monthly
- [ ] Analyze bundle size trends
- [ ] Optimize images based on usage data
- [ ] Review and adjust cache TTLs

## Tools & Scripts

```bash
# Performance testing
npm run test:e2e          # E2E tests include performance checks
npm run lighthouse        # Run Lighthouse audit

# Bundle analysis
npm run analyze           # Interactive bundle analyzer
npm run bundle:size       # Check bundle size limits
npm run bundle:report     # Generate detailed bundle report
npm run bundle:performance # Performance metrics

# Development
npm run dev               # Development server with Fast Refresh
npm run build             # Production build with optimizations
```

## Common Issues & Solutions

### Issue: Images loading slowly
**Solution**:
1. Verify `next/image` is being used
2. Check image formats (prefer AVIF/WebP)
3. Use appropriate `priority` prop for above-fold images
4. Ensure CDN is configured correctly

### Issue: Large bundle size
**Solution**:
1. Run `npm run analyze` to identify large dependencies
2. Use dynamic imports for heavy components
3. Check for duplicate dependencies in `package.json`
4. Consider replacing large libraries with smaller alternatives

### Issue: Slow API responses
**Solution**:
1. Implement Redis caching (already configured)
2. Use database query optimization (add indexes)
3. Consider CDN caching for static API responses
4. Implement rate limiting to prevent abuse

### Issue: Poor CLS (Cumulative Layout Shift)
**Solution**:
1. Always set `width` and `height` on images
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use `placeholder="blur"` on images

## Future Optimizations

- [ ] Implement Service Worker for offline support
- [ ] Add Edge caching with Vercel Edge Network
- [ ] Optimize database queries (add missing indexes)
- [ ] Implement CDN for static assets
- [ ] Add resource hints (preconnect, dns-prefetch)
- [ ] Implement critical CSS inlining
- [ ] Add Brotli compression fallback
- [ ] Optimize font loading strategy
- [ ] Implement progressive image loading
- [ ] Add WebP image generation pipeline

## References

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
