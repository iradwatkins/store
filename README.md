# SteppersLife Stores 🛍️

**Multi-vendor marketplace for Chicago Steppin merchandise**

**Live at**: [stores.stepperslife.com](https://stores.stepperslife.com) (port 3008)

---

## 🎯 What Is This?

A dedicated e-commerce platform where vendors can sell Chicago Steppin-related products (clothing, shoes, accessories) to the SteppersLife community.

### Key Features:
- ✅ **Multi-vendor marketplace** (not multi-tenant SaaS)
- ✅ **Clerk SSO** (same login as stepperslife.com)
- ✅ **Stripe Connect** for vendor payouts
- ✅ **7% platform fee** on all transactions
- ✅ **Guest checkout** supported
- ✅ **Product variants** (size OR color)
- ✅ **Order management** & tracking

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [**Implementation Roadmap**](./docs/IMPLEMENTATION-ROADMAP.md) | 8-week development plan with sprint breakdown |
| [**User Stories**](./docs/USER-STORIES-PHASE1.md) | Detailed feature requirements & acceptance criteria |
| [**Database Schema**](./docs/DATABASE-SCHEMA.md) | Complete Prisma schema with relationships |
| [**Development Setup**](./docs/DEVELOPMENT-SETUP.md) | Local environment setup & troubleshooting |

---

## 🚀 Quick Start

### Prerequisites:
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended)

### Setup:

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker services (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Set up database
npx prisma migrate dev --name init
npx prisma db seed

# 5. Start development server
pnpm dev
```

**App runs at**: http://localhost:3008

---

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (port 5407)
- **ORM**: Prisma
- **Cache**: Redis 7 (port 6407)
- **Storage**: MinIO (ports 9007/9107)

### Authentication & Payments
- **Auth**: Clerk (SSO with main site)
- **Payments**: Stripe Connect
- **Email**: Resend

### UI & Styling
- **CSS**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React

---

## 📦 Project Structure

```
stores-stepperslife/
├── docs/                  # 📚 All documentation
│   ├── IMPLEMENTATION-ROADMAP.md
│   ├── USER-STORIES-PHASE1.md
│   ├── DATABASE-SCHEMA.md
│   └── DEVELOPMENT-SETUP.md
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth routes
│   │   ├── (vendor)/      # Vendor dashboard
│   │   ├── (storefront)/  # Public store
│   │   └── api/           # API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & clients
│   └── services/          # Business logic
└── docker-compose.yml     # Local services
```

---

## 🎯 Phase 1 Roadmap (8 Weeks)

### Sprint 1: Foundation & Vendor Onboarding (Weeks 1-2)
- [x] Project setup & Docker environment
- [ ] Clerk authentication integration
- [ ] Vendor registration & store creation wizard
- [ ] Store profile management

### Sprint 2: Product Management (Weeks 3-4)
- [ ] Product CRUD operations
- [ ] Image uploads to MinIO
- [ ] Product variants (size OR color)
- [ ] Public product catalog

### Sprint 3: Shopping & Checkout (Weeks 5-6)
- [ ] Shopping cart (Redis)
- [ ] Guest checkout flow
- [ ] Stripe payment processing
- [ ] Order management

### Sprint 4: Polish & Launch (Weeks 7-8)
- [ ] Vendor analytics dashboard
- [ ] Email notifications (Resend)
- [ ] Performance optimization
- [ ] Production deployment

---

## 📊 Success Metrics (Week 8)

- [ ] **10 active vendors** onboarded
- [ ] **100+ products** listed
- [ ] **50 orders** processed
- [ ] **$5,000 GMV** (Gross Merchandise Volume)
- [ ] **99% uptime**
- [ ] **<2s page load** time

---

## 🔐 Environment Variables

Create `.env` from `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://stepperslife:password@localhost:5407/stepperslife_stores"

# Clerk (same as main site)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis & MinIO
REDIS_URL="redis://localhost:6407"
MINIO_ENDPOINT="localhost"
MINIO_PORT="9007"

# Email
RESEND_API_KEY="re_..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3008"
PORT=3008
```

---

## 🧪 Development Commands

```bash
# Development
pnpm dev                  # Start dev server (port 3008)
pnpm build                # Build for production
pnpm start                # Start production server

# Database
npx prisma migrate dev    # Create migration
npx prisma db seed        # Seed database
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Regenerate Prisma Client

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs

# Code Quality
pnpm lint                 # Run ESLint
pnpm type-check           # TypeScript check
pnpm format               # Format with Prettier
```

---

## 📝 Development Workflow

### 1. Pick a user story from [USER-STORIES-PHASE1.md](./docs/USER-STORIES-PHASE1.md)

### 2. Create feature branch:
```bash
git checkout -b feature/vendor-registration
```

### 3. Implement feature following acceptance criteria

### 4. Test locally:
```bash
pnpm dev
# Visit http://localhost:3008
```

### 5. Commit & push:
```bash
git add .
git commit -m "feat: add vendor registration form"
git push origin feature/vendor-registration
```

### 6. Create pull request

---

## 🐛 Troubleshooting

### Database connection failed?
```bash
docker-compose ps          # Check if postgres is running
docker-compose restart postgres
```

### Prisma Client out of sync?
```bash
npx prisma generate
# Restart dev server
```

### MinIO upload fails?
```bash
# Access MinIO Console: http://localhost:9107
# Login: minioadmin / minioadmin
# Check bucket "stepperslife-stores" exists
```

**More solutions**: See [DEVELOPMENT-SETUP.md](./docs/DEVELOPMENT-SETUP.md#common-issues--solutions)

---

## 🚀 Deployment

### Production (VPS)

```bash
# Build
pnpm build

# Deploy to VPS (Ubuntu)
# Nginx reverse proxy on port 3008
# SSL via Let's Encrypt

# See full deployment guide in DEVELOPMENT-SETUP.md
```

---

## 👥 Team

- **Product Owner**: SteppersLife Team
- **Business Analyst**: Mary (you're reading her docs!)
- **Developers**: [Your team here]

---

## 📞 Support

- **Documentation Issues**: Check [docs/](./docs/)
- **Bug Reports**: Create GitHub issue
- **Questions**: Contact SteppersLife Team

---

## 📄 License

Proprietary - SteppersLife LLC

---

## 🎉 Ready to Build?

1. ✅ Read the [Implementation Roadmap](./docs/IMPLEMENTATION-ROADMAP.md)
2. ✅ Set up your [Development Environment](./docs/DEVELOPMENT-SETUP.md)
3. ✅ Review [User Stories](./docs/USER-STORIES-PHASE1.md)
4. ✅ Start with **Sprint 1, Week 1** tasks
5. ✅ Ship it! 🚢

---

**Let's build something great for the Chicago Steppin community! 💚**
