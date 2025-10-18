# Phase 2: Multi-Tenancy SaaS Platform - Implementation Plan

**Version:** 1.0
**Created:** October 10, 2025
**Status:** 🚀 READY TO START
**Timeline:** 4 weeks (Weeks 9-12)

---

## 🎯 Executive Summary

Transform **stores.stepperslife.com** from a single marketplace into a **multi-tenant SaaS platform** where external businesses can launch their own branded e-commerce stores.

### Business Model Transformation
- **Current:** Single marketplace with multiple vendors (7% platform fee per transaction)
- **Future:** SaaS platform with subscription revenue + transaction fees

### Revenue Streams
1. **Subscription Revenue:** $29-$299/month per tenant
2. **Transaction Fees:** 2-7% depending on plan
3. **Add-on Services:** Custom domains, premium themes, API access

---

## 📊 Current Architecture Analysis

### What We Have (Phase 1)
✅ **Database:** Single PostgreSQL database with vendor isolation via `vendorStoreId`
✅ **Authentication:** NextAuth.js with Google OAuth SSO
✅ **Multi-vendor support:** Already isolates vendor data in queries
✅ **Payment processors:** Stripe, Square, PayPal, Cash
✅ **Subdomain ready:** Running on stores.stepperslife.com

### What Needs to Change (Phase 2)
🔄 **Add Tenant model:** New `Tenant` table for SaaS customers
🔄 **Subdomain routing:** Dynamic subdomain detection and routing
🔄 **Subscription billing:** Stripe subscriptions with usage-based billing
🔄 **Row-level security:** Tenant isolation at database level
🔄 **Usage tracking:** Product limits, order limits, storage quotas
🔄 **Custom domains:** SSL + DNS management

---

## 🏗️ Technical Architecture

### Database Schema Changes

#### New Models Needed:

```prisma
// Tenant (SaaS Customer)
model Tenant {
  id                String            @id @default(cuid())
  name              String            // "Nike Store"
  slug              String            @unique // "nike" -> nike.stepperslife.com
  ownerId           String            // User who created tenant
  subscriptionPlan  SubscriptionPlan  @default(STARTER)
  subscriptionStatus SubscriptionStatus @default(TRIAL)

  // Stripe subscription
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique
  stripePriceId         String?

  // Custom domain
  customDomain          String?  @unique
  customDomainVerified  Boolean  @default(false)
  sslCertificateStatus  String?  @default("PENDING")

  // Usage quotas
  maxProducts           Int      @default(50)   // Based on plan
  maxOrders             Int      @default(100)  // Per month
  maxStorageGB          Decimal  @default(1)    @db.Decimal(5, 2)

  // Current usage (reset monthly)
  currentProducts       Int      @default(0)
  currentOrders         Int      @default(0)    // This month
  currentStorageGB      Decimal  @default(0)    @db.Decimal(5, 2)

  // Transaction fees
  platformFeePercent    Decimal  @default(5.0)  @db.Decimal(5, 2)

  // Trial
  trialEndsAt           DateTime?

  // Status
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now()) @updatedAt

  owner                 User     @relation(fields: [ownerId], references: [id])
  vendorStores          VendorStore[]
  subscriptionHistory   SubscriptionHistory[]
  usageRecords          UsageRecord[]

  @@index([slug])
  @@index([ownerId])
  @@index([subscriptionStatus])
}

// Subscription tiers
enum SubscriptionPlan {
  TRIAL        // 14-day trial, 10 products, 20 orders/month
  STARTER      // $29/mo, 50 products, 100 orders/month, 1GB storage
  PRO          // $79/mo, 500 products, 1000 orders/month, 10GB storage
  ENTERPRISE   // $299/mo, unlimited products, unlimited orders, 100GB storage
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELLED
  PAUSED
}

// Subscription billing history
model SubscriptionHistory {
  id                String   @id @default(cuid())
  tenantId          String
  plan              SubscriptionPlan
  amount            Decimal  @db.Decimal(10, 2)
  stripePriceId     String
  stripeInvoiceId   String?
  status            String   // paid, pending, failed
  billingPeriodStart DateTime
  billingPeriodEnd   DateTime
  createdAt         DateTime @default(now())

  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, createdAt])
}

// Usage tracking (for overage billing)
model UsageRecord {
  id          String   @id @default(cuid())
  tenantId    String
  metric      String   // "products", "orders", "storage_gb"
  quantity    Int
  timestamp   DateTime @default(now())

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, metric, timestamp])
}
```

#### Update Existing Models:

```prisma
model VendorStore {
  // Add tenant relationship
  tenantId  String?
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])

  // Everything else stays the same
  // ...existing fields
}
```

---

## 🎨 Feature Breakdown

### Sprint 5 (Week 9): Foundation

#### 1. Database Schema & Migrations ✅
**Tasks:**
- [ ] Create Tenant model in Prisma schema
- [ ] Create SubscriptionHistory model
- [ ] Create UsageRecord model
- [ ] Add `tenantId` to VendorStore (nullable for backward compatibility)
- [ ] Run migration on production
- [ ] Seed 3 test tenants

**API Endpoints:**
```
POST   /api/tenants                   # Create new tenant
GET    /api/tenants/[id]              # Get tenant details
PATCH  /api/tenants/[id]              # Update tenant
GET    /api/tenants/check-slug        # Check slug availability
```

---

#### 2. Tenant Onboarding Wizard ✅
**Tasks:**
- [ ] Create tenant registration page (`/onboard`)
- [ ] Step 1: Business info (name, slug, industry)
- [ ] Step 2: Store branding (logo, colors, tagline)
- [ ] Step 3: Subscription plan selection
- [ ] Step 4: Payment setup (Stripe Checkout for subscription)
- [ ] Step 5: Confirmation + dashboard redirect

**Pages:**
```
/onboard                    # Multi-step wizard
/onboard/success            # Redirect after subscription payment
/tenant/[slug]/dashboard    # Tenant dashboard (replaces /dashboard)
```

---

#### 3. Subdomain Detection & Routing ✅
**Tasks:**
- [ ] Create subdomain detection middleware
- [ ] Extract tenant slug from subdomain (e.g., `nike.stepperslife.com` → `nike`)
- [ ] Load tenant from database in middleware
- [ ] Inject tenant context into requests
- [ ] 404 if tenant not found or inactive
- [ ] Redirect www to non-www

**Middleware Logic:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Extract subdomain
  const subdomain = hostname.split('.')[0]

  // Skip for main domain
  if (subdomain === 'stores' || subdomain === 'www') {
    return NextResponse.next()
  }

  // Load tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: subdomain }
  })

  if (!tenant || !tenant.isActive) {
    return new NextResponse('Store not found', { status: 404 })
  }

  // Inject tenant context
  request.headers.set('x-tenant-id', tenant.id)
  return NextResponse.next()
}
```

---

### Sprint 6 (Week 10): Billing & Quotas

#### 4. Stripe Subscription Integration ✅
**Tasks:**
- [ ] Create Stripe Products for each plan
  - Trial: Free (14 days)
  - Starter: $29/month
  - Pro: $79/month
  - Enterprise: $299/month
- [ ] Implement Stripe Checkout for subscriptions
- [ ] Handle subscription webhooks
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Downgrade/upgrade flow
- [ ] Cancel subscription flow
- [ ] Billing history page

**API Endpoints:**
```
POST   /api/billing/create-subscription     # Create Stripe subscription
POST   /api/billing/upgrade                 # Upgrade plan
POST   /api/billing/cancel                  # Cancel subscription
GET    /api/billing/portal                  # Stripe Customer Portal link
POST   /api/webhooks/stripe/subscriptions   # Subscription webhooks
```

---

#### 5. Usage Tracking & Quota Enforcement ✅
**Tasks:**
- [ ] Track product count (increment on create, decrement on delete)
- [ ] Track order count (reset monthly via cron job)
- [ ] Track storage usage (calculate on image upload)
- [ ] Enforce quotas in APIs
  - Block product creation if over limit
  - Block image uploads if over storage limit
  - Show usage warnings at 80% and 90%
- [ ] Create usage dashboard for tenants
- [ ] Implement overage billing for Enterprise plan

**Usage Enforcement Example:**
```typescript
// Before creating product
const tenant = await getTenant(tenantId)
if (tenant.currentProducts >= tenant.maxProducts) {
  return NextResponse.json(
    { error: `Product limit reached (${tenant.maxProducts}). Upgrade plan.` },
    { status: 403 }
  )
}

// After creating product
await prisma.tenant.update({
  where: { id: tenantId },
  data: { currentProducts: { increment: 1 } }
})
```

---

#### 6. Billing Dashboard ✅
**Tasks:**
- [ ] Current plan display
- [ ] Usage meters (products, orders, storage)
- [ ] Upgrade/downgrade CTA
- [ ] Subscription history table
- [ ] Payment method management (Stripe Customer Portal)
- [ ] Cancel subscription button

**Page:**
```
/tenant/[slug]/settings/billing
```

---

### Sprint 7 (Week 11): Custom Domains

#### 7. Custom Domain Mapping ✅
**Tasks:**
- [ ] Add custom domain field to Tenant model
- [ ] DNS verification flow
  - Tenant adds CNAME record (custom.com → stores.stepperslife.com)
  - System verifies DNS record (dig or DNS API)
  - Mark as verified once confirmed
- [ ] SSL certificate provisioning (Let's Encrypt via Certbot API)
- [ ] Nginx configuration update
  - Add `server` block for custom domain
  - Reload Nginx
- [ ] Middleware: Detect custom domains
- [ ] Custom domain settings page

**API Endpoints:**
```
POST   /api/tenants/[id]/domain         # Add custom domain
POST   /api/tenants/[id]/verify-domain  # Verify DNS
DELETE /api/tenants/[id]/domain         # Remove custom domain
```

**Nginx Config Template:**
```nginx
server {
  listen 443 ssl http2;
  server_name custom.com;

  ssl_certificate /etc/letsencrypt/live/custom.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/custom.com/privkey.pem;

  location / {
    proxy_pass http://localhost:3008;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

#### 8. Automated SSL & DNS Management ✅
**Tasks:**
- [ ] Certbot integration for SSL provisioning
- [ ] Automatic certificate renewal (cron job)
- [ ] DNS verification via DNS provider API (Cloudflare, Route53)
- [ ] Status tracking (PENDING → VERIFIED → SSL_ISSUED → ACTIVE)
- [ ] Error handling and retry logic

---

### Sprint 8 (Week 12): Polish & Launch

#### 9. Tenant Dashboard Enhancements ✅
**Tasks:**
- [ ] Overview page with key metrics
  - MRR (Monthly Recurring Revenue)
  - Active tenants
  - Total GMV (Gross Merchandise Volume)
  - Tenant growth chart
- [ ] Tenant list page (admin only)
- [ ] Tenant settings page
  - Business info
  - Branding (logo, colors, fonts)
  - Email settings (from name, reply-to)
- [ ] Staff management (add TENANT_ADMIN role)

---

#### 10. Multi-Tenant Isolation Testing ✅
**Tasks:**
- [ ] Test data isolation (Tenant A can't see Tenant B data)
- [ ] Test subdomain routing
- [ ] Test custom domain routing
- [ ] Test quota enforcement
- [ ] Test subscription lifecycle (trial → paid → cancel)
- [ ] Load testing with 50 concurrent tenants
- [ ] Security audit (SQL injection, XSS, CSRF)

---

#### 11. Documentation & Launch Prep ✅
**Tasks:**
- [ ] Tenant onboarding guide (PDF)
- [ ] Custom domain setup guide
- [ ] API documentation (if exposing APIs)
- [ ] Pricing page (public)
- [ ] FAQ page
- [ ] Terms of Service (SaaS-specific)
- [ ] Privacy Policy update
- [ ] Launch checklist

---

## 💰 Pricing Strategy

### Subscription Plans

| Plan | Price | Products | Orders/Month | Storage | Transaction Fee | Target Customer |
|------|-------|----------|--------------|---------|-----------------|-----------------|
| **Trial** | Free (14 days) | 10 | 20 | 500MB | 7% | Testing |
| **Starter** | $29/month | 50 | 100 | 1GB | 5% | Solo entrepreneurs |
| **Pro** | $79/month | 500 | 1,000 | 10GB | 3% | Small businesses |
| **Enterprise** | $299/month | Unlimited | Unlimited | 100GB | 2% | Large businesses |

### Add-Ons (Optional)
- Custom domain: Included in Pro/Enterprise
- Email support: Included in Pro/Enterprise
- Priority support: Included in Enterprise
- API access: $49/month (all plans)
- White-label (remove branding): $99/month

---

## 🔒 Security & Compliance

### Tenant Isolation
- ✅ Database-level isolation via `tenantId` in all queries
- ✅ Middleware validation on every request
- ✅ No cross-tenant data leakage
- ✅ Audit logs for all admin actions

### Payment Security
- ✅ PCI compliance via Stripe
- ✅ No credit card storage
- ✅ Webhook signature verification
- ✅ Idempotency keys for all payments

### Data Privacy
- ✅ GDPR compliance (data export, deletion)
- ✅ Tenant data encryption at rest
- ✅ SSL/TLS for all traffic
- ✅ Privacy Policy and Terms of Service

---

## 📈 Success Metrics (Week 12)

### Technical Metrics
- [ ] 99.9% uptime for all tenants
- [ ] <2s page load time (p95)
- [ ] Zero data leakage incidents
- [ ] 100% subdomain routing accuracy
- [ ] 100% SSL certificate provisioning success

### Business Metrics
- [ ] 5 paying tenants (external to SteppersLife)
- [ ] $500+ MRR (Monthly Recurring Revenue)
- [ ] 80% trial-to-paid conversion rate
- [ ] <5% churn rate
- [ ] $10,000+ GMV across all tenants

---

## 🚧 Risk Mitigation

### Technical Risks
1. **Subdomain routing complexity**
   - Mitigation: Test with 10+ subdomains in staging
   - Fallback: Manual Nginx configuration if dynamic fails

2. **Database performance with row-level security**
   - Mitigation: Index all `tenantId` columns
   - Monitor slow queries with Prisma logging

3. **SSL provisioning failures**
   - Mitigation: Manual Certbot fallback
   - Support email for troubleshooting

### Business Risks
1. **Low tenant adoption**
   - Mitigation: Offer first 10 tenants 50% off for 6 months
   - Partner with industry influencers

2. **Subscription cancellations**
   - Mitigation: Exit surveys to identify issues
   - Offer downgrades instead of cancellations

---

## 🛠️ Development Workflow

### Week 9: Foundation
- Days 1-2: Database schema + migrations
- Days 3-4: Tenant onboarding wizard
- Day 5: Subdomain routing

### Week 10: Billing
- Days 1-2: Stripe subscription integration
- Days 3-4: Usage tracking & quota enforcement
- Day 5: Billing dashboard

### Week 11: Domains
- Days 1-3: Custom domain mapping + DNS verification
- Days 4-5: SSL automation

### Week 12: Launch
- Days 1-2: Dashboard enhancements
- Days 3-4: Testing (isolation, security, load)
- Day 5: Documentation + launch

---

## 📚 Resources & Dependencies

### External Services Needed
- [ ] Stripe (already configured)
- [ ] DNS provider API (Cloudflare or Route53)
- [ ] Let's Encrypt (Certbot)
- [ ] Email service (Resend - already configured)

### Code Dependencies
- [x] Prisma (already installed)
- [x] Stripe SDK (already installed)
- [ ] Certbot Node.js wrapper (new)
- [ ] DNS provider SDK (new - Cloudflare or AWS SDK)

---

## 🎯 Next Steps

1. **Review & approve** this plan
2. **Create test Stripe products** for all subscription plans
3. **Set up staging environment** for multi-tenant testing
4. **Begin Sprint 5, Week 9** - Database schema changes
5. **Recruit 3 beta tenants** for testing (Week 10)

---

## ❓ Open Questions

1. **Custom domain DNS provider?** Cloudflare (easier) or Route53 (AWS)?
2. **Overage billing?** Charge extra for going over quota, or hard block?
3. **White-label branding?** Remove "Powered by SteppersLife" for extra fee?
4. **API access?** Expose REST API for tenants to integrate externally?
5. **Multi-currency support?** USD only, or support EUR/GBP?

---

**Status:** ✅ Ready to begin implementation
**Estimated Completion:** December 8, 2025 (4 weeks from now)
**Risk Level:** Medium (subdomain routing + SSL automation complexity)

---

**Questions? Adjustments needed? Let's refine before development begins.**
