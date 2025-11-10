# Testing Infrastructure

## Overview

Comprehensive testing infrastructure covering unit tests, integration tests, component tests, and E2E tests targeting 80%+ code coverage.

## Test Structure

```
__tests__/
├── api/              # API route tests
│   ├── auth/         # Authentication tests
│   ├── products/     # Product API tests
│   ├── cart/         # Shopping cart tests
│   └── orders/       # Order management tests
├── components/       # React component tests
│   ├── ProductCard.test.tsx
│   └── CartSummary.test.tsx
└── utils/           # Test utilities and helpers
    └── test-helpers.ts

e2e/                 # Playwright E2E tests
├── homepage.spec.ts
└── checkout-flow.spec.ts
```

## Running Tests

### Unit & Integration Tests (Jest)
```bash
# Run all Jest tests
npm test

# Watch mode (development)
npm run test:watch

# With coverage report
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### All Tests
```bash
# Run both Jest and Playwright tests
npm run test:all
```

## Test Coverage Goals

- **API Routes**: 85%+ coverage
- **Components**: 80%+ coverage
- **Critical User Flows**: 100% E2E coverage
- **Overall Target**: 80%+ code coverage

## Test Files Created

### API Tests (4 files, ~30 test cases)
1. `__tests__/api/auth/register.test.ts` - User registration validation
2. `__tests__/api/products/create.test.ts` - Product CRUD operations
3. `__tests__/api/cart/add.test.ts` - Cart management
4. `__tests__/api/orders/create.test.ts` - Order creation and validation

### Component Tests (2 files, ~18 test cases)
1. `__tests__/components/ProductCard.test.tsx` - Product display logic
2. `__tests__/components/CartSummary.test.tsx` - Cart calculations and interactions

### E2E Tests (2 files, ~13 scenarios)
1. `e2e/homepage.spec.ts` - Homepage and navigation
2. `e2e/checkout-flow.spec.ts` - Complete shopping flow

## Test Utilities

`__tests__/utils/test-helpers.ts` provides:
- Mock data factories (users, products, orders, sessions)
- Request/response helpers
- Common assertions (expectUnauthorized, expectSuccess, etc.)

## Mocking Strategy

### Global Mocks (jest.setup.js)
- NextAuth session management
- Next.js router and navigation
- Prisma client database operations
- Console logging (suppressed during tests)

### Environment Variables
All tests run with isolated test environment variables to prevent interference with development/production.

## Continuous Integration

Tests automatically run on every push via GitHub Actions (`.github/workflows/ci.yml`).

## Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Mocking**: External dependencies are mocked to ensure fast, reliable tests
3. **Descriptive Names**: Test names clearly describe what they test
4. **AAA Pattern**: Arrange, Act, Assert structure for clarity
5. **Coverage**: Focus on critical paths and edge cases

## Adding New Tests

### API Route Test Template
```typescript
import { POST } from '@/app/api/your-route/route'
import { mockRequest, mockSession } from '@/__tests__/utils/test-helpers'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

jest.mock('next-auth')
jest.mock('@/lib/prisma')

describe('/api/your-route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle valid request', async () => {
    const session = mockSession()
    ;(getServerSession as jest.Mock).mockResolvedValue(session)

    const request = mockRequest({
      method: 'POST',
      body: { /* your data */ },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { YourComponent } from '@/components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("Action")')
    await expect(page).toHaveURL('/expected-url')
  })
})
```

## Troubleshooting

### Tests Failing Locally

1. Clear Jest cache: `npx jest --clearCache`
2. Regenerate Prisma client: `npm run db:generate`
3. Check environment variables in jest.setup.js

### E2E Tests Failing

1. Ensure dev server is running: `npm run dev`
2. Check PORT configuration in playwright.config.ts
3. Install Playwright browsers: `npx playwright install`

### Coverage Not Meeting Goals

1. Identify uncovered files: `npm run test:coverage`
2. Focus on critical business logic first
3. Use test coverage report in `coverage/` directory

## Next Steps

- Expand API test coverage to all 70 endpoints
- Add component tests for remaining 20+ components
- Create E2E tests for 10 critical user journeys
- Integrate visual regression testing
- Add performance benchmarking to test suite
