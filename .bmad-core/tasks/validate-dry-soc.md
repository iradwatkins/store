# DRY + SoC Architecture Validation

## Task Overview
Validate adherence to DRY (Don't Repeat Yourself) and SoC (Separation of Concerns) principles across the codebase.

## Validation Checklist

### DRY Principle Validation

#### API Patterns
- [ ] All API routes use standardized auth middleware (`withAuth`, `withVendorStore`, `withAdmin`)
- [ ] API responses use standard response utilities from `/lib/utils/api.ts`
- [ ] No duplicate authentication boilerplate in API routes
- [ ] Error handling follows consistent patterns using `handleApiError`

#### Component Patterns  
- [ ] Form components use `useFormValidation` or `useAsyncOperation` hooks
- [ ] No duplicate async state management patterns (loading, error, success)
- [ ] Toast notifications use standardized patterns
- [ ] Modal and wizard components follow established patterns

#### Email Templates
- [ ] All email templates extend `BaseEmailTemplate`
- [ ] No duplicate email styling or structure
- [ ] Email components use standardized `EmailSection`, `EmailHeading`, etc.

#### Utility Functions
- [ ] No duplicate utility functions across different modules
- [ ] Common calculations extracted to shared utilities
- [ ] Date/time formatting uses centralized functions

### SoC Principle Validation

#### Layer Separation
- [ ] **Presentation Layer**: UI components contain only rendering logic
- [ ] **Application Layer**: Business logic resides in services, not components
- [ ] **Domain Layer**: Core business entities and rules are centralized
- [ ] **Infrastructure Layer**: Data access is handled by repositories

#### Component Concerns
- [ ] React components don't contain:
  - Direct database queries
  - Complex business logic calculations
  - API endpoint definitions
  - Authentication logic
- [ ] API routes don't contain:
  - UI rendering logic
  - Complex data transformation
  - Mixed business domains

#### File Organization
- [ ] Components are organized by feature/domain, not technical layer
- [ ] Shared utilities are properly categorized
- [ ] Business logic is separated from infrastructure code
- [ ] Types and interfaces are centralized in domain layer

## Architecture Rules

### Import Restrictions
```typescript
// ❌ BAD: UI components importing database
import prisma from '@/lib/db'

// ✅ GOOD: UI components using services
import { ProductService } from '@/lib/services/ProductService'

// ❌ BAD: API routes importing UI components
import { Button } from '@/components/ui/button'

// ✅ GOOD: API routes using utilities and services
import { withVendorStore } from '@/lib/middleware/auth'
```

### Code Pattern Rules

#### 1. Authentication Pattern
```typescript
// ✅ GOOD: Using middleware
export const POST = withVendorStore(async (req, { store }) => {
  // Route logic here
})

// ❌ BAD: Inline auth
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Duplicate pattern...
}
```

#### 2. Form Handling Pattern
```typescript
// ✅ GOOD: Using validation hook
const { formState, validateAll, getFieldProps } = useFormValidation(
  initialValues,
  { schema: validationSchemas.product }
)

// ❌ BAD: Manual validation
const [errors, setErrors] = useState({})
const [isSubmitting, setIsSubmitting] = useState(false)
// Manual validation logic...
```

#### 3. Email Template Pattern
```typescript
// ✅ GOOD: Using base template
export function OrderConfirmationEmail(props) {
  return (
    <BaseEmailTemplate
      title="Order Confirmation"
      preview="Your order has been confirmed"
    >
      <EmailSection>
        <EmailHeading>Thank you for your order!</EmailHeading>
        <EmailText>Your order #{props.orderNumber} has been confirmed.</EmailText>
      </EmailSection>
    </BaseEmailTemplate>
  )
}

// ❌ BAD: Duplicate structure
export function OrderConfirmationEmail(props) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Duplicate structure... */}
        </Container>
      </Body>
    </Html>
  )
}
```

## Validation Commands

### Automated Checks
```bash
# Check for authentication patterns
npm run validate:auth-patterns

# Check for duplicate code
npm run validate:duplication

# Check import restrictions
npm run validate:imports

# Check architectural layers
npm run validate:layers
```

### Manual Review Points

#### Code Review Checklist
- [ ] New API routes use appropriate middleware
- [ ] New components use established hooks and patterns
- [ ] Business logic is extracted to services
- [ ] Database access goes through repositories
- [ ] Email templates use base components

#### Refactoring Opportunities
- [ ] Identify similar code blocks (>3 lines) for extraction
- [ ] Look for mixed concerns in components
- [ ] Check for business logic in UI components
- [ ] Verify proper error handling patterns

## Metrics to Track

### DRY Metrics
- Lines of duplicate code removed
- Number of components using standard hooks
- API routes following middleware patterns
- Email templates using base structure

### SoC Metrics
- Components with business logic (should be 0)
- API routes with mixed concerns (should be 0)
- Proper layer separation adherence
- Import violations count

## Success Criteria

### DRY Success
- [ ] <100 lines of duplicate code across entire codebase
- [ ] 100% of API routes use standardized patterns
- [ ] 100% of forms use validation hooks
- [ ] 100% of emails use base template

### SoC Success
- [ ] 0 UI components with database imports
- [ ] 0 API routes with UI imports
- [ ] All business logic in service layer
- [ ] Clean architectural boundaries

## Next Steps

When validation fails:
1. Identify the specific violation
2. Refactor using established patterns
3. Update documentation if patterns evolve
4. Re-run validation

When adding new features:
1. Use existing patterns and utilities
2. Extract any new common patterns
3. Maintain architectural boundaries
4. Update this validation as needed