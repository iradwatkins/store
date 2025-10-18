# User Stories - Phase 1: SteppersLife Marketplace

**Project**: stores.stepperslife.com
**Version**: 1.0
**Timeline**: 8 weeks

---

## Personas

### 1. Vendor (Store Owner)
**Name**: Marcus Johnson
**Background**: Sells custom Chicago Steppin shoes and apparel at events
**Goals**:
- Reach more customers online
- Manage inventory efficiently
- Track sales performance
- Get paid automatically

### 2. Customer (Shopper)
**Name**: Keisha Williams
**Background**: Active Chicago Steppin dancer, buys at events and online
**Goals**:
- Find quality Steppin merchandise
- Easy checkout experience
- Track orders
- Support small Black-owned businesses

### 3. Platform Admin
**Name**: SteppersLife Team
**Goals**:
- Onboard quality vendors
- Monitor platform health
- Collect platform fees
- Ensure great experience

---

## Epic 1: Vendor Onboarding & Store Setup

### Story 1.1: Vendor Registration
**As a** vendor who sells Chicago Steppin merchandise,
**I want to** register for a store account,
**So that** I can sell my products online to the SteppersLife community.

**Acceptance Criteria**:
1. Vendor clicks "Become a Vendor" on stepperslife.com
2. Redirects to stores.stepperslife.com/register
3. Uses Clerk authentication (same login as main site)
4. Email verification required before proceeding
5. After verification, redirected to store creation wizard

**Technical Notes**:
- Use Clerk SSO (same instance as stepperslife.com)
- Check if user already has VENDOR role in Clerk metadata
- If not, add role and redirect to wizard

**UI Mockup**:
```
┌─────────────────────────────────────┐
│  SteppersLife Stores                │
│  ──────────────────────────────     │
│                                     │
│  Sell Your Products to the          │
│  Chicago Steppin Community          │
│                                     │
│  [Continue with Email]              │
│  [Continue with Google]             │
│                                     │
│  Already have a store? [Login]      │
└─────────────────────────────────────┘
```

---

### Story 1.2: Store Creation Wizard
**As a** newly registered vendor,
**I want to** set up my store profile in a guided process,
**So that** I can start listing products quickly.

**Acceptance Criteria**:
1. **Step 1: Store Details**
   - Store name (required)
   - Store slug (auto-generated, editable, unique)
   - Tagline (optional, max 100 chars)
   - Description (optional, textarea)
   - Progress: "Step 1 of 3"

2. **Step 2: Contact & Shipping**
   - Email (pre-filled from account)
   - Phone (required, formatted)
   - Ship from address (street, city, state, zip)
   - Default shipping rate (flat rate in USD)
   - Progress: "Step 2 of 3"

3. **Step 3: Payment Setup**
   - Stripe Connect onboarding
   - "Connect with Stripe" button
   - Stripe handles KYC verification
   - Return to platform after completion
   - Progress: "Step 3 of 3 - Complete!"

4. After completion:
   - Store created with status: INACTIVE
   - Redirect to vendor dashboard
   - Show onboarding checklist

**Business Rules**:
- Slug must be unique across all stores
- Can save draft and return later
- Store stays INACTIVE until first product added

**Technical Notes**:
- Use Stripe Connect Express accounts
- Store Stripe account ID in database
- Webhook to confirm Stripe onboarding complete

---

### Story 1.3: Store Profile Management
**As a** vendor,
**I want to** customize my store's appearance,
**So that** customers recognize my brand.

**Acceptance Criteria**:
1. Upload store logo (max 2MB, JPG/PNG)
2. Upload store banner (max 5MB, JPG/PNG, 1200x400px recommended)
3. Edit store description (rich text editor)
4. Edit contact information
5. Preview storefront before saving
6. Changes save immediately (auto-save)

**Technical Notes**:
- Images stored in MinIO
- Image optimization with Sharp (compress, resize)
- Generate thumbnails automatically
- Validate file types and sizes server-side

---

## Epic 2: Product Management

### Story 2.1: Add Product (Simple)
**As a** vendor,
**I want to** add a product to my store,
**So that** customers can purchase it.

**Acceptance Criteria**:
1. Click "Add Product" from dashboard
2. Fill out product form:
   - Product name (required)
   - Description (rich text, required)
   - Price (required, USD, min $0.01)
   - Compare at price (optional, for sale display)
   - Category (dropdown: Clothing, Shoes, Accessories)
   - Tags (multi-select or free text)
   - SKU (optional)
   - Quantity (required, integer, min 0)
   - Track inventory (checkbox, default ON)

3. Upload images (drag & drop):
   - Up to 5 images
   - First image is featured
   - Reorder by drag & drop
   - Max 5MB per image
   - JPG, PNG, WebP supported

4. Status selection:
   - Draft (not visible to customers)
   - Active (visible and purchasable)

5. Save button:
   - Validates all required fields
   - Shows success message
   - Redirects to product list OR "Add another product"

**Business Rules**:
- If quantity = 0, auto-status = OUT_OF_STOCK
- If quantity > 0, vendor can set ACTIVE
- All images compressed to <500KB

**Technical Notes**:
- Generate unique slug from product name
- Store images in MinIO: `stores/{storeId}/products/{productId}/`
- Create thumbnails: 200x200, 600x600, 1200x1200

---

### Story 2.2: Add Product Variants
**As a** vendor selling items in multiple sizes or colors,
**I want to** add product variants,
**So that** customers can choose their preferred option.

**Acceptance Criteria**:
1. In product form, toggle "This product has variants"
2. Choose variant type (radio):
   - Size only
   - Color only
   - *Note: Size AND color combo deferred to Phase 2*

3. Add variant options:
   - For Size: S, M, L, XL, XXL (or custom)
   - For Color: List colors with hex code picker

4. For each variant:
   - Auto-name: "{Product Name} - {Variant}"
   - Price (optional override, else use product price)
   - SKU (optional)
   - Quantity (required)
   - Image (optional, else use product images)
   - Available (toggle)

5. Bulk actions:
   - "Set all prices" (apply price to all variants)
   - "Set all quantities" (apply quantity to all)

**Business Rules**:
- Must have at least 2 variants if enabled
- Parent product quantity = sum of variant quantities
- If any variant available, product shows as available
- Variant SKUs must be unique within store

**UI Example**:
```
┌─ Product Variants ───────────────┐
│ ☑ This product has variants      │
│                                   │
│ Variant Type: ⦿ Size  ○ Color    │
│                                   │
│ Sizes:                            │
│ ┌──────────────────────────────┐ │
│ │ Small   | Qty: 10 | $75.00  │ │
│ │ Medium  | Qty: 15 | $75.00  │ │
│ │ Large   | Qty: 8  | $75.00  │ │
│ └──────────────────────────────┘ │
│                                   │
│ [+ Add Size] [Bulk Edit Prices]  │
└───────────────────────────────────┘
```

---

### Story 2.3: Manage Product Inventory
**As a** vendor,
**I want to** view and update my inventory,
**So that** I never oversell items.

**Acceptance Criteria**:
1. Inventory dashboard shows:
   - All products in table format
   - Current quantity for each
   - Status indicator (Active, Low Stock, Out of Stock)
   - "Last sold" timestamp

2. Low stock alerts:
   - Highlight products with qty < 5
   - Optional: Email notification when low

3. Quick edit quantity:
   - Click quantity field to edit inline
   - Save on Enter or blur
   - Validation: must be integer >= 0

4. Bulk quantity update:
   - Select multiple products (checkbox)
   - "Adjust inventory" button
   - Options: Add/Subtract/Set to
   - Confirm before applying

5. Inventory history (basic):
   - Show recent changes
   - "Adjusted by admin" or "Sold in order #123"

**Business Rules**:
- When order placed, decrease quantity automatically
- When quantity reaches 0, auto-set status to OUT_OF_STOCK
- Track inventory changes for audit trail

---

### Story 2.4: Product List & Search
**As a** vendor,
**I want to** view all my products in one place,
**So that** I can manage them efficiently.

**Acceptance Criteria**:
1. Product list table shows:
   - Thumbnail image
   - Product name
   - Price
   - Quantity
   - Status badge
   - Last updated
   - Actions (Edit, Duplicate, Delete)

2. Filters:
   - By status (All, Active, Draft, Out of Stock)
   - By category
   - Search by name/SKU

3. Sorting:
   - By name (A-Z, Z-A)
   - By price (low to high, high to low)
   - By date created (newest, oldest)
   - By quantity (low to high)

4. Pagination:
   - 25 items per page
   - "Load more" or numbered pages

5. Bulk actions:
   - Select multiple products
   - Activate, Deactivate, Delete

**Technical Notes**:
- Server-side pagination for performance
- Debounced search (300ms)
- Cache product list in Redis (5min TTL)

---

## Epic 3: Customer Shopping Experience

### Story 3.1: Browse Product Catalog
**As a** customer,
**I want to** see all available products,
**So that** I can find what I'm looking for.

**Acceptance Criteria**:
1. Public catalog page at `/stores`
2. Shows all ACTIVE products from all vendors
3. Product grid layout:
   - 2 columns on mobile
   - 3 columns on tablet
   - 4 columns on desktop
   - Each card shows: image, name, price, vendor name

4. Filters (sidebar on desktop, drawer on mobile):
   - By category (Clothing, Shoes, Accessories)
   - By vendor (dropdown list)
   - Price range (slider: $0 - $500)

5. Sort options (dropdown):
   - Featured (default)
   - Price: Low to High
   - Price: High to Low
   - Newest First

6. Search bar:
   - Search by product name, description, tags
   - Show results count
   - Clear search button

7. Empty state:
   - "No products found" message
   - Suggest adjusting filters

**Performance**:
- Lazy load images (blur placeholder)
- Infinite scroll OR pagination
- Cache catalog page (1min TTL)

---

### Story 3.2: View Product Details
**As a** customer,
**I want to** see detailed information about a product,
**So that** I can decide if I want to buy it.

**Acceptance Criteria**:
1. Product page at `/stores/products/[slug]`
2. Left side: Image gallery
   - Large main image
   - Thumbnail strip below
   - Click thumbnail to change main image
   - Zoom on hover (desktop)

3. Right side: Product info
   - Product name (H1)
   - Price (large, prominent)
   - Compare at price (strikethrough, if exists)
   - Vendor name (link to vendor page)
   - Star rating (if reviews exist, Phase 2)

4. Variant selector (if applicable):
   - Dropdown or button group
   - Show available variants only
   - Update price if variant has custom price

5. Quantity selector:
   - Number input (min 1, max = inventory)
   - +/- buttons

6. Add to Cart button:
   - Prominent, green
   - Disabled if out of stock
   - Shows "Out of Stock" if quantity = 0
   - Shows "Only X left!" if quantity < 5

7. Below fold:
   - Product description (formatted HTML)
   - Shipping info (vendor's shipping policy)
   - Return policy (platform standard)

8. Vendor sidebar:
   - Vendor logo
   - Vendor name
   - "Visit Store" button
   - Contact vendor (email icon)

**Technical Notes**:
- Server-side rendering for SEO
- OpenGraph meta tags for social sharing
- Canonical URL
- Schema.org Product markup

---

### Story 3.3: Add Product to Cart
**As a** customer,
**I want to** add products to my cart,
**So that** I can purchase multiple items at once.

**Acceptance Criteria**:
1. Click "Add to Cart" on product page
2. Show success toast notification:
   - "{Product name} added to cart"
   - Cart icon animates (shake or bounce)
   - Cart count badge updates

3. Cart drawer slides in from right (optional):
   - Shows cart contents
   - "Continue Shopping" button
   - "Checkout" button

4. Cart persists:
   - For logged-in users: Stored in database
   - For guests: Stored in Redis with session ID
   - Synced across devices (logged in)
   - Persists for 7 days (guests)

5. Cart items show:
   - Product image (thumbnail)
   - Product name + variant
   - Price per unit
   - Quantity (editable)
   - Remove button (X icon)
   - Subtotal per line item

6. Cart summary:
   - Subtotal (sum of line items)
   - "Taxes calculated at checkout"
   - "Shipping calculated at checkout"
   - Total item count

**Business Rules**:
- Cannot add out-of-stock items
- Cannot exceed available inventory
- If inventory drops while in cart, show warning at checkout
- Mixed vendor orders supported (multi-vendor cart)

**Technical Notes**:
- Redis schema: `cart:{sessionId}` → JSON
- TTL: 7 days
- On login, merge guest cart with user cart

---

## Epic 4: Checkout & Orders

### Story 4.1: Guest Checkout
**As a** customer,
**I want to** checkout without creating an account,
**So that** I can complete my purchase quickly.

**Acceptance Criteria**:
1. Checkout page at `/checkout`
2. Multi-step form (3 steps):

**Step 1: Shipping Information**
- Email (required, validated)
- Phone (required, formatted)
- Full name (required)
- Address line 1 (required)
- Address line 2 (optional)
- City (required)
- State (dropdown, required)
- ZIP code (required, validated)
- "Save this address" (checkbox, for logged-in users)
- "Continue to Shipping" button

**Step 2: Shipping Method**
- Show available shipping options:
  - Standard Shipping ($X.XX, 5-7 days)
  - Express Shipping ($X.XX, 2-3 days)
  - Local Pickup ($0.00, vendor location shown)
- Radio button selection
- Update total on selection
- "Continue to Payment" button

**Step 3: Payment**
- Stripe Payment Element (card details)
- Order summary (collapsed view, expandable)
- Apply promo code (Phase 2)
- Total breakdown:
  - Subtotal
  - Shipping
  - Tax
  - **Total (bold, large)**
- "Place Order" button
- Trust badges (Secure Checkout, etc.)

3. After payment success:
   - Redirect to `/orders/[orderNumber]/confirmation`
   - Show thank you message
   - Order details
   - Email confirmation sent

**Business Rules**:
- Validate inventory before payment
- If item sold out, remove from cart and notify
- Process payment via Stripe
- Send confirmation emails immediately
- Generate unique order number: SL-ORD-XXXXXX

---

### Story 4.2: Order Confirmation & Tracking
**As a** customer,
**I want to** receive order confirmation and track my order,
**So that** I know when to expect delivery.

**Acceptance Criteria**:
1. Confirmation email contains:
   - Order number (SL-ORD-XXXXX)
   - Order date
   - Items purchased (with images)
   - Shipping address
   - Payment method (last 4 digits)
   - Total amount
   - Estimated delivery date
   - Tracking link (when shipped)
   - Vendor contact info

2. Order tracking page at `/orders/[orderNumber]`:
   - Accessible via magic link in email (no login required)
   - Shows order status:
     - ✅ Paid
     - 📦 Processing
     - 🚚 Shipped (tracking number shown)
     - ✔️ Delivered

3. Status timeline (visual):
   - Order placed (timestamp)
   - Payment received (timestamp)
   - Shipped (timestamp + tracking link)
   - Delivered (timestamp, when available)

4. Shipping updates:
   - When vendor marks as shipped, send email:
     - "Your order has shipped!"
     - Tracking number + carrier link
   - When delivered (carrier webhook), send email:
     - "Your order was delivered"

**Technical Notes**:
- Use Resend for transactional emails
- Email templates: HTML + plain text fallback
- Track email open rates (optional)
- Carrier webhooks for delivery updates (FedEx, UPS)

---

## Epic 5: Order Management (Vendor)

### Story 5.1: View Incoming Orders
**As a** vendor,
**I want to** see all new orders,
**So that** I can fulfill them promptly.

**Acceptance Criteria**:
1. Orders dashboard at `/dashboard/orders`
2. Order list table shows:
   - Order number (clickable)
   - Order date
   - Customer name
   - Items count
   - Total amount
   - Status badge (Paid, Processing, Shipped, Delivered)
   - Actions (View, Fulfill, Refund)

3. Filters:
   - By status (All, Unfulfilled, Shipped, Delivered)
   - By date range (last 7 days, 30 days, custom)
   - Search by order number or customer email

4. Sorting:
   - By date (newest first, oldest first)
   - By total (high to low, low to high)

5. New order notification:
   - Email when order received
   - In-app notification badge
   - Desktop notification (if enabled)

**Business Rules**:
- New orders show as "Unfulfilled"
- Vendor sees only their store's orders
- Platform admin sees all orders

---

### Story 5.2: Fulfill Order (Ship)
**As a** vendor,
**I want to** mark an order as shipped,
**So that** the customer knows it's on the way.

**Acceptance Criteria**:
1. Click order to view details:
   - Customer shipping address (formatted)
   - Items ordered (with variants)
   - Payment status (Paid)
   - Fulfillment status (Unfulfilled)

2. Click "Fulfill Order" button
3. Fulfillment modal appears:
   - Shipping carrier (dropdown: USPS, FedEx, UPS, Other)
   - Tracking number (text input)
   - Shipping date (auto-filled to today, editable)
   - Notes (optional, internal)
   - "Confirm Shipment" button

4. After confirmation:
   - Order status → SHIPPED
   - Shipped timestamp recorded
   - Email sent to customer with tracking info
   - Vendor sees "Shipped" badge on order

5. Print packing slip:
   - "Print Packing Slip" button
   - PDF generated with:
     - Order number
     - Customer address
     - Items list
     - "Thank you!" message
     - Vendor contact info

**Business Rules**:
- Can only fulfill PAID orders
- Tracking number optional (for local pickup)
- Email sent only if tracking number provided
- Payout to vendor initiated after shipment (Stripe)

---

### Story 5.3: Basic Refund Processing
**As a** vendor,
**I want to** issue refunds when needed,
**So that** I can maintain good customer relationships.

**Acceptance Criteria**:
1. On order detail page, click "Issue Refund"
2. Refund modal:
   - Refund amount (default = full order total)
   - Partial refund option (enter custom amount)
   - Refund reason (dropdown):
     - Customer request
     - Damaged item
     - Wrong item sent
     - Out of stock
     - Other (text field)
   - Restock inventory (checkbox, default ON)
   - "Confirm Refund" button

3. After confirmation:
   - Stripe processes refund (3-5 business days)
   - Order status → REFUNDED
   - Customer receives refund email
   - If restocked, inventory increased
   - Platform fee also refunded

4. Refund history:
   - Show on order detail page
   - "Refunded on [date]"
   - Refund amount
   - Reason

**Business Rules**:
- Can only refund PAID or SHIPPED orders
- Cannot exceed original payment amount
- Partial refunds allowed
- Platform fee refunded proportionally
- Inventory restocked unless checkbox unchecked

---

## Epic 6: Analytics & Reporting

### Story 6.1: Vendor Sales Dashboard
**As a** vendor,
**I want to** see my sales performance at a glance,
**So that** I can make informed business decisions.

**Acceptance Criteria**:
1. Dashboard at `/dashboard` shows:

**Top Metrics (Cards)**:
- Total Sales (30 days)
  - Dollar amount (large)
  - Comparison to previous 30 days (+X% or -X%)
- Total Orders (30 days)
  - Order count
  - Comparison to previous 30 days
- Active Products
  - Current count
  - Link to product list
- Low Stock Items
  - Count of items with qty < 5
  - Alert icon if > 0

**Sales Chart**:
- Line graph showing daily sales (last 30 days)
- Y-axis: Revenue ($)
- X-axis: Date
- Tooltip on hover shows exact amount

**Top Products Table**:
- Top 5 best-selling products
- Columns: Product name, Units sold, Revenue
- "View all" link to full report

**Recent Orders**:
- Last 10 orders
- Mini table: Order #, Date, Customer, Amount, Status
- "View all orders" link

2. Date range selector:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - All time
   - Custom range (date picker)

**Technical Notes**:
- Cache dashboard data (5min TTL)
- Aggregate sales data in database
- Use Recharts for visualization

---

---

## Success Criteria (Phase 1)

### Week 8 Goals:
- [ ] 10 active vendor stores created
- [ ] 100+ products listed
- [ ] 50 orders successfully processed
- [ ] $5,000 total GMV
- [ ] 0 critical bugs
- [ ] 99% uptime
- [ ] <2s average page load
- [ ] 100% mobile responsive

---

## Phase 2: Critical Etsy Features (Missing from MVP)

### PRIORITY 1 - Trust & Discovery:
- ✅ Customer reviews & ratings (5-star + written)
- ✅ Customer accounts (order history, saved addresses)
- ✅ Wishlist / favorites
- ✅ Enhanced vendor profiles ("About the Shop" page)
- ✅ Shop policies (shipping, returns, exchanges)

### PRIORITY 2 - Engagement:
- ✅ Discount codes (simple percentage/dollar off)
- ✅ Improved search (tags, filters, relevance sorting)
- ✅ Shop announcements/updates

### Out of Scope (NOT Etsy Core):
- ❌ Multi-tenant SaaS (this is ONE marketplace)
- ❌ Custom domain mapping (all on stores.stepperslife.com)
- ❌ Vendor staff management (Etsy shops are single-owner)
- ❌ Theme marketplace (one consistent theme)
- ❌ API access for third parties
- ❌ Email marketing tools (vendors use their own)
- ❌ Mobile native apps (responsive web is sufficient)
- ❌ Gift cards
- ❌ Product bundles
- ❌ Abandoned cart recovery

---

**Ready to build? Next step: [Create Prisma database schema](./DATABASE-SCHEMA.md)**
