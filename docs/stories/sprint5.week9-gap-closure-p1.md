# Story Sprint 5 Week 9: Gap Closure - Priority 1 Issues

## Status
**TODO** ⏳

## Story

**As a** platform owner,
**I want** all Priority 1 gaps from the comprehensive QA review to be closed,
**so that** the application is 100% production-ready with complete features, security, and test coverage.

## Acceptance Criteria

1. **AC1: Analytics Dashboard UI Complete**
   - Vendors can view analytics dashboard at `/dashboard/analytics`
   - Dashboard displays all metrics from analytics API:
     - Total sales (30d, 90d, all-time) with delta indicators
     - Total orders count for all periods
     - Active products count
     - Low stock items count with link to filtered view
   - Top 5 products table shows:
     - Product name with link to edit page
     - Sales count
     - Revenue (sorted by this)
   - Revenue chart displays 30 days of daily sales data:
     - Line chart with proper axis labels
     - Responsive on mobile/tablet
     - Zero-filled gaps for continuity
   - Loading states shown while fetching data
   - Error states handled gracefully

2. **AC2: API-Level Rate Limiting Implemented**
   - Rate limiting active on all API routes
   - Different limits by endpoint type:
     - Authentication: 10 requests/minute per IP
     - Payment/Checkout: 10 requests/minute per IP
     - General API: 60 requests/minute per IP
     - Analytics: 30 requests/minute per user
   - Rate limit responses return HTTP 429 with Retry-After header
   - Redis-based distributed rate limiting (works in Node.js runtime)
   - Rate limit bypassed for internal/admin requests
   - Monitoring/logging for rate limit violations

3. **AC3: Critical Integration Tests Created**
   - Minimum 15 integration tests covering critical paths:
     - Payment intent creation (valid/invalid data) - 3 tests
     - Stripe webhook handling (success/failure) - 3 tests
     - Order creation from payment - 2 tests
     - Tax calculation (multiple states) - 3 tests
     - Cart operations (add/update/remove) - 3 tests
     - Analytics calculations (30d/90d/all-time) - 3 tests
   - Test suite runs in CI/CD pipeline
   - All tests passing with >80% code coverage on tested modules
   - Test database seeded with known fixtures
   - Cleanup after each test run

## Tasks / Subtasks

- [ ] **Task 1: Analytics Dashboard UI (AC1)** - 3 hours
  - [ ] 1.1: Create analytics dashboard page component
  - [ ] 1.2: Implement metrics cards with delta indicators
  - [ ] 1.3: Create top products table component
  - [ ] 1.4: Integrate Recharts for revenue visualization
  - [ ] 1.5: Add loading and error states
  - [ ] 1.6: Make responsive for mobile/tablet
  - [ ] 1.7: Link low stock count to filtered products page
  - [ ] 1.8: Test with real data from seeded database

- [ ] **Task 2: API-Level Rate Limiting (AC2)** - 4 hours
  - [ ] 2.1: Create rate limiting utility for Node.js runtime (`lib/rate-limit-api.ts`)
  - [ ] 2.2: Implement Redis-based rate limiting with sliding window
  - [ ] 2.3: Add rate limiting to authentication endpoints
  - [ ] 2.4: Add rate limiting to payment/checkout endpoints
  - [ ] 2.5: Add rate limiting to general API routes
  - [ ] 2.6: Add rate limiting to analytics endpoints
  - [ ] 2.7: Return proper HTTP 429 responses with Retry-After
  - [ ] 2.8: Add bypass logic for admin/internal requests
  - [ ] 2.9: Log rate limit violations
  - [ ] 2.10: Test rate limiting with multiple concurrent requests

- [ ] **Task 3: Integration Tests (AC3)** - 8 hours
  - [ ] 3.1: Set up test environment and database
  - [ ] 3.2: Create test fixtures and seed data
  - [ ] 3.3: Write payment intent creation tests (3 tests)
  - [ ] 3.4: Write Stripe webhook handling tests (3 tests)
  - [ ] 3.5: Write order creation tests (2 tests)
  - [ ] 3.6: Write tax calculation tests (3 tests)
  - [ ] 3.7: Write cart operation tests (3 tests)
  - [ ] 3.8: Write analytics calculation tests (3 tests)
  - [ ] 3.9: Configure test runner (Jest/Vitest)
  - [ ] 3.10: Add test scripts to package.json
  - [ ] 3.11: Document test setup and running instructions
  - [ ] 3.12: Verify all tests pass

## Dev Notes

### Technical Implementation

**Task 1: Analytics Dashboard UI**

Location: `app/(vendor)/dashboard/analytics/page.tsx`

```typescript
// Example structure
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { TopProductsTable } from '@/components/dashboard/TopProductsTable'
import { RevenueChart } from '@/components/dashboard/RevenueChart'

export default async function AnalyticsPage() {
  const session = await auth()
  const vendorStore = await getVendorStore(session.user.id)

  // Fetch analytics data
  const analytics = await fetch(`/api/dashboard/analytics`)
  const dailySales = await fetch(`/api/dashboard/analytics/daily-sales`)

  return (
    <div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard title="Sales (30d)" value={analytics.sales.thirtyDays} />
        <MetricsCard title="Orders (30d)" value={analytics.orders.thirtyDays} />
        <MetricsCard title="Active Products" value={analytics.activeProducts} />
        <MetricsCard title="Low Stock" value={analytics.lowStockCount} link="/dashboard/products?lowStock=true" />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={dailySales} />

      {/* Top Products */}
      <TopProductsTable products={analytics.topProducts} />
    </div>
  )
}
```

**Task 2: API-Level Rate Limiting**

Location: `lib/rate-limit-api.ts`

```typescript
import redis from './redis'

export async function rateLimit(
  identifier: string, // IP or user ID
  limit: number,      // Max requests
  window: number      // Time window in seconds
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - (window * 1000)

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count requests in window
  const count = await redis.zcard(key)

  if (count >= limit) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetTime = parseInt(oldest[1]) + (window * 1000)

    return {
      success: false,
      remaining: 0,
      reset: Math.ceil((resetTime - now) / 1000)
    }
  }

  // Add current request
  await redis.zadd(key, now, `${now}`)
  await redis.expire(key, window)

  return {
    success: true,
    remaining: limit - count - 1,
    reset: window
  }
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const result = await rateLimit(ip, 10, 60)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': result.reset.toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString()
        }
      }
    )
  }

  // Process request...
}
```

**Task 3: Integration Tests**

Location: `__tests__/integration/`

```typescript
// Example test structure
import { POST } from '@/app/api/checkout/create-payment-intent/route'

describe('Payment Intent Creation', () => {
  beforeEach(async () => {
    await seedTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should create payment intent with valid shipping info', async () => {
    const request = new Request('http://localhost/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        shippingInfo: {
          email: 'test@example.com',
          phone: '555-0100',
          fullName: 'Test User',
          address: '123 Main St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        },
        shippingMethod: 'standard'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.clientSecret).toBeDefined()
    expect(data.amount).toBeGreaterThan(0)
  })

  it('should reject invalid email address', async () => {
    // Test implementation
  })

  it('should calculate tax correctly for Illinois', async () => {
    // Test implementation
  })
})
```

### File List

**Created:**
- `app/(vendor)/dashboard/analytics/page.tsx` - Analytics dashboard page
- `components/dashboard/MetricsCard.tsx` - Reusable metrics card component
- `components/dashboard/TopProductsTable.tsx` - Top products table
- `components/dashboard/RevenueChart.tsx` - Revenue line chart with Recharts
- `lib/rate-limit-api.ts` - API-level rate limiting utility
- `__tests__/integration/payment-intent.test.ts` - Payment tests
- `__tests__/integration/webhooks.test.ts` - Webhook tests
- `__tests__/integration/order-creation.test.ts` - Order tests
- `__tests__/integration/tax-calculation.test.ts` - Tax tests
- `__tests__/integration/cart-operations.test.ts` - Cart tests
- `__tests__/integration/analytics.test.ts` - Analytics tests
- `__tests__/setup.ts` - Test environment setup
- `__tests__/fixtures/test-data.ts` - Test fixtures

**Modified:**
- `app/api/auth/[...nextauth]/route.ts` - Add rate limiting
- `app/api/checkout/create-payment-intent/route.ts` - Add rate limiting
- `app/api/cart/add/route.ts` - Add rate limiting
- `app/api/dashboard/analytics/route.ts` - Add rate limiting
- `package.json` - Add test scripts and dependencies
- `jest.config.js` or `vitest.config.ts` - Test configuration

### Dependencies

```bash
# Testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest jest-environment-jsdom
npm install -D vitest @vitest/ui # Alternative to Jest

# Already installed
# - recharts (for charts)
# - ioredis (for rate limiting)
```

### Estimated Effort

- Task 1 (Analytics Dashboard): 3 hours
- Task 2 (Rate Limiting): 4 hours
- Task 3 (Integration Tests): 8 hours

**Total: 15 hours (2 work days)**

## Success Metrics

- Analytics dashboard accessible and functional
- All metrics display correctly with live data
- Rate limiting prevents >60 req/min per IP on general APIs
- Rate limiting prevents >10 req/min on auth/payment endpoints
- 15+ integration tests passing
- Test coverage >80% on critical modules
- Zero P1 gaps remaining in QA report

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-09 | 1.0 | Initial story creation for P1 gap closure | Claude (QA Agent) |

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- QA Report: `docs/qa/COMPREHENSIVE-QA-REPORT.md`
- Week 7 QA: `docs/qa/sprint4-week7-qa-summary.md`
- Week 5 QA: `docs/qa/sprint3-week5-qa-summary.md`

### Completion Notes List
- Story created following BMAD template
- All P1 gaps from QA report addressed
- Estimated effort: 15 hours total
- Ready to begin implementation

## References

- **Comprehensive QA Report**: `docs/qa/COMPREHENSIVE-QA-REPORT.md`
- **Analytics APIs**: Already implemented in Week 7
- **Existing Rate Limiting**: `middleware.ts` (Edge Runtime - not working)
- **Testing Framework**: Jest or Vitest (to be configured)
