# SteppersLife Stores - Implementation Roadmap

**Version**: 1.0
**Last Updated**: 2025-10-09
**Project**: Two-Phase Evolution (Marketplace → SaaS)

---

## Strategic Overview

### Phase 1: SteppersLife Marketplace (MVP)
**Timeline**: 8 weeks
**Domain**: stores.stepperslife.com (port 3008)
**Goal**: Launch vendor marketplace for Chicago Steppin merchandise
**Success Metric**: 10 active vendors, 100 orders in first month

### Phase 2: SaaS Platform Expansion
**Timeline**: Weeks 9-20 (12 weeks)
**Domain**: store.stepperslife.com (port 3004)
**Goal**: Convert to multi-tenant SaaS platform
**Success Metric**: 5 external paying tenants

---

## Phase 1: SteppersLife Marketplace (8 Weeks)

### Sprint 1: Foundation & Vendor Onboarding (Week 1-2)

#### Week 1: Project Setup
**Goal**: Development environment ready, database schema deployed

**Tasks**:
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Configure Clerk authentication (same instance as main site)
- [ ] Set up PostgreSQL database (port 5407)
- [ ] Set up Redis cache (port 6407)
- [ ] Set up MinIO storage (ports 9007/9107)
- [ ] Configure Docker Compose for local development
- [ ] Create base Prisma schema for Phase 1
- [ ] Run initial migration
- [ ] Set up shadcn/ui components
- [ ] Configure Tailwind with SteppersLife green theme

**Deliverables**:
- Working local dev environment
- Database schema deployed
- Authentication working
- Base UI components ready

---

#### Week 2: Vendor Onboarding Flow
**Goal**: Vendors can create stores and log in

**Tasks**:
- [ ] Create vendor registration flow (uses Clerk)
- [ ] Build store creation wizard (3 steps):
  - Step 1: Store details (name, slug, description)
  - Step 2: Contact info (email, phone, shipping address)
  - Step 3: Payment setup (Stripe Connect onboarding)
- [ ] Implement store profile page (logo, banner upload to MinIO)
- [ ] Create vendor dashboard layout (sidebar navigation)
- [ ] Build basic store settings page
- [ ] Add role-based middleware (STORE_OWNER, STORE_ADMIN)
- [ ] Create email verification flow

**Deliverables**:
- Vendors can register
- Vendors can create stores
- Vendors can log into dashboard
- Store profiles created

**API Endpoints**:
```
POST   /api/stores              # Create store
GET    /api/stores/[id]         # Get store details
PATCH  /api/stores/[id]         # Update store
POST   /api/stores/[id]/upload  # Upload logo/banner
```

---

### Sprint 2: Product Management (Week 3-4)

#### Week 3: Product CRUD
**Goal**: Vendors can list products

**Tasks**:
- [ ] Build product creation form
  - Name, description, price, compare price
  - Category selection (Clothing/Shoes/Accessories)
  - Tags (multi-select)
  - SKU, inventory quantity
- [ ] Implement image upload (up to 5 images, MinIO)
- [ ] Create product listing page (vendor dashboard)
  - Table view with filters
  - Status badges (Draft/Active/Out of Stock)
  - Bulk actions (delete, activate, deactivate)
- [ ] Build product edit page
- [ ] Add product variants system
  - Simple variants (size OR color, not both)
  - Variant inventory tracking
- [ ] Implement product status workflow
  - Draft → Active → Out of Stock → Archived

**Deliverables**:
- Vendors can add products
- Vendors can manage inventory
- Products support simple variants
- Image uploads working

**API Endpoints**:
```
POST   /api/products              # Create product
GET    /api/products              # List products (vendor filtered)
GET    /api/products/[id]         # Get product
PATCH  /api/products/[id]         # Update product
DELETE /api/products/[id]         # Delete product
POST   /api/products/[id]/images  # Upload images
```

---

#### Week 4: Product Display & Categories
**Goal**: Products are browsable by customers

**Tasks**:
- [ ] Create public product catalog page
  - Grid layout (mobile-responsive)
  - Filter by category
  - Filter by vendor
  - Search by name/description/tags
- [ ] Build product detail page
  - Image gallery (with zoom)
  - Variant selector
  - Add to cart button
  - Vendor info sidebar
- [ ] Implement category management
  - Seed categories: Clothing, Shoes, Accessories
  - Sub-categories if needed
- [ ] Add product SEO (meta tags, og:image)
- [ ] Create vendor storefront page (/vendors/[slug])
  - Vendor bio
  - All vendor products
  - Contact button

**Deliverables**:
- Public catalog browsable
- Product pages with variant selection
- Vendor storefronts live

**Pages**:
```
/stores                    # All products
/stores/categories/[slug]  # Category view
/stores/products/[slug]    # Product detail
/vendors/[slug]            # Vendor storefront
```

---

### Sprint 3: Shopping & Checkout (Week 5-6)

#### Week 5: Cart & Checkout Flow
**Goal**: Customers can purchase products

**Tasks**:
- [ ] Build shopping cart system (Redis-backed)
  - Add to cart
  - Update quantity
  - Remove items
  - Cart persistence (guest + logged in)
- [ ] Create cart drawer/page
  - Line items display
  - Subtotal calculation
  - Continue shopping / Checkout buttons
- [ ] Build checkout page (3 steps):
  - Step 1: Shipping address
  - Step 2: Shipping method selection
  - Step 3: Payment (Stripe)
- [ ] Implement guest checkout
  - Email + phone collection
  - Order tracking via email link
- [ ] Add tax calculation
  - Basic tax by state
  - Use Stripe Tax API or simple lookup
- [ ] Integrate Stripe Checkout
  - Handle payment intents
  - Webhook for payment confirmation

**Deliverables**:
- Working shopping cart
- Complete checkout flow
- Payment processing via Stripe
- Guest orders supported

**API Endpoints**:
```
POST   /api/cart/add             # Add to cart
GET    /api/cart                 # Get cart
PATCH  /api/cart/items/[id]      # Update quantity
DELETE /api/cart/items/[id]      # Remove item
POST   /api/checkout/create      # Create checkout session
POST   /api/webhooks/stripe      # Payment webhooks
```

---

#### Week 6: Order Management
**Goal**: Orders are tracked from payment to fulfillment

**Tasks**:
- [ ] Create order model and workflow
  - Status: PENDING → PAID → SHIPPED → DELIVERED
  - Generate unique order numbers (SL-ORD-XXXXX)
- [ ] Build vendor order dashboard
  - List all orders for their store
  - Filter by status
  - Order detail view
- [ ] Implement order fulfillment workflow
  - Mark as shipped
  - Add tracking number + carrier
  - Send shipping notification email
- [ ] Create customer order confirmation emails
  - Order details
  - Estimated delivery
  - Tracking link (when shipped)
- [ ] Add platform fee calculation (7%)
  - Calculate vendor payout
  - Track in database for reporting
- [ ] Build basic order history for customers
  - View past orders
  - Track current orders

**Deliverables**:
- Vendors receive order notifications
- Vendors can fulfill orders
- Customers receive confirmations
- Platform fee tracking

**API Endpoints**:
```
GET    /api/orders               # List orders (vendor filtered)
GET    /api/orders/[id]          # Get order details
PATCH  /api/orders/[id]/fulfill  # Mark as shipped
POST   /api/orders/[id]/refund   # Process refund (basic)
```

---

### Sprint 4: Polish & Launch (Week 7-8)

#### Week 7: Analytics & Vendor Tools
**Goal**: Vendors can track performance

**Tasks**:
- [ ] Build vendor analytics dashboard
  - Total sales (30d, 90d, all time)
  - Total orders
  - Top products
  - Revenue chart (simple line graph)
- [ ] Add inventory alerts
  - Low stock notifications
  - Out of stock badge
- [ ] Create staff management
  - Add STORE_ADMIN role
  - Permission assignment
  - Staff invitation via email
- [ ] Implement basic shipping settings
  - Flat rate shipping
  - Free shipping over $X
  - Local pickup option
- [ ] Add payment processor switching
  - Stripe (default)
  - PayPal (if time allows)
  - Square (integration ready)

**Deliverables**:
- Vendor analytics live
- Staff management working
- Shipping options configurable

---

#### Week 8: Testing, Optimization & Deployment
**Goal**: Production-ready launch

**Tasks**:
- [ ] Performance optimization
  - Image optimization (Sharp)
  - Route caching
  - Database query optimization
  - Redis caching for product catalog
- [ ] Security hardening
  - Rate limiting per IP
  - CSRF protection
  - Input validation (Zod schemas)
  - SQL injection prevention (Prisma)
- [ ] Email templates finalization
  - Order confirmation
  - Shipping notification
  - Vendor new order alert
  - Welcome email
- [ ] Mobile responsiveness testing
  - iPhone/Android testing
  - Tablet optimization
- [ ] Load testing
  - 100 concurrent users
  - 1000 products load test
- [ ] Production deployment
  - Configure Nginx reverse proxy (port 3008)
  - Set up SSL certificate
  - Environment variables
  - Database migration on production
  - Deploy to VPS
- [ ] Documentation
  - Vendor onboarding guide
  - User manual (PDF)
  - API documentation

**Deliverables**:
- Production deployed at stores.stepperslife.com
- All tests passing
- Documentation complete
- Ready for vendor onboarding

---

## Phase 1 Feature Checklist

### ✅ Included in Phase 1 (8 weeks)
- [x] Clerk SSO authentication
- [x] Vendor store creation
- [x] Product CRUD with variants
- [x] Image uploads (MinIO)
- [x] Public product catalog
- [x] Shopping cart (Redis)
- [x] Guest checkout
- [x] Stripe payment processing
- [x] Order management
- [x] Email notifications
- [x] Vendor analytics dashboard
- [x] Staff management (STORE_ADMIN)
- [x] Platform fee (7%) tracking
- [x] Basic shipping options

### ❌ NOT in Phase 1 (Deferred to Phase 2)
- [ ] Custom domain mapping
- [ ] Multiple payment processors (focus Stripe only)
- [ ] Advanced variants (size AND color)
- [ ] Customer accounts (guest checkout only)
- [ ] Discount codes/coupons
- [ ] Advanced analytics
- [ ] Returns/refunds workflow (manual for now)
- [ ] Product reviews
- [ ] Wishlist
- [ ] Advanced search (Algolia/Elasticsearch)
- [ ] Multi-tenant SaaS features
- [ ] Subscription billing
- [ ] Theme customization
- [ ] API for third parties

---

## Phase 2: SaaS Platform Expansion (Weeks 9-20)

### Overview
Convert the SteppersLife marketplace into a multi-tenant SaaS platform at store.stepperslife.com

### Sprint 5-8: Multi-Tenancy Foundation (Weeks 9-12)
**Goal**: Add tenant isolation and subscription billing

**Key Features**:
- Subdomain provisioning (tenant.platform.com)
- PostgreSQL row-level security
- Subscription management (Stripe)
- Usage quotas (products, orders, storage)
- Tenant onboarding wizard
- Billing dashboard
- Custom domain mapping

### Sprint 9-12: SaaS Features (Weeks 13-20)
**Goal**: White-label capabilities and theme system

**Key Features**:
- Theme marketplace (3-5 starter themes)
- Logo/branding customization
- Email template customization
- Advanced analytics
- Multiple payment gateways
- API access for tenants
- Webhook system
- App marketplace foundation

---

## Technical Stack (Locked)

### Core
- **Framework**: Next.js 15, React 18, TypeScript
- **Database**: PostgreSQL (port 5407) + Prisma
- **Cache**: Redis (port 6407)
- **Storage**: MinIO (ports 9007/9107)
- **Auth**: Clerk
- **Payments**: Stripe (primary), Square, PayPal
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **Deployment**: Docker + Nginx (port 3008 for Phase 1)

---

## Success Metrics

### Phase 1 (Week 8)
- [ ] 10 active vendors onboarded
- [ ] 100+ products listed
- [ ] 50 orders processed
- [ ] $5,000 GMV (Gross Merchandise Volume)
- [ ] 99% uptime
- [ ] <2s page load time

### Phase 2 (Week 20)
- [ ] 5 external tenants paying
- [ ] $2,000 MRR (Monthly Recurring Revenue)
- [ ] Custom domains working
- [ ] Theme marketplace launched
- [ ] API documentation published

---

## Risk Mitigation

### Technical Risks
1. **Stripe Connect onboarding complexity**
   - Mitigation: Use Stripe Express accounts (simpler)
   - Fallback: Manual payouts initially

2. **Image storage costs**
   - Mitigation: MinIO self-hosted, compression with Sharp
   - Quota: 100MB per vendor initially

3. **Database performance**
   - Mitigation: Proper indexing, Redis caching
   - Monitor slow queries with Prisma logging

### Business Risks
1. **Low vendor adoption**
   - Mitigation: Personal outreach to Chicago Steppin influencers
   - Offer first 10 vendors free for 3 months

2. **Payment processing failures**
   - Mitigation: Comprehensive error handling
   - Email alerts on failed payments

---

## Next Steps

1. **Review & Approve** this roadmap
2. **Set up development environment** (Docker Compose)
3. **Create detailed Prisma schema** for Phase 1
4. **Begin Sprint 1, Week 1** implementation
5. **Recruit 5 beta vendors** for testing (Week 6)

---

**Questions? Adjustments needed? Let's refine before development begins.**
