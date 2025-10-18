# Development Setup Guide - SteppersLife Stores

**Project**: stores.stepperslife.com
**Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Redis, MinIO
**Version**: 1.0

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v20.x LTS
- **npm**: v10.x or **pnpm**: v8.x (recommended)
- **Docker**: v24.x+ and Docker Compose v2.x+
- **Git**: Latest version
- **Code Editor**: VSCode recommended

---

## Project Structure

```
stores-stepperslife/
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Template for environment variables
├── docker-compose.yml      # Local development services
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind CSS config
├──prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Database migrations
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Auth routes
│   │   ├── (vendor)/      # Vendor dashboard
│   │   ├── (storefront)/  # Public-facing store
│   │   ├── api/           # API routes
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── vendor/        # Vendor-specific components
│   │   └── storefront/    # Storefront components
│   ├── lib/
│   │   ├── db.ts          # Prisma client
│   │   ├── redis.ts       # Redis client
│   │   ├── storage.ts     # MinIO client
│   │   ├── stripe.ts      # Stripe SDK
│   │   └── utils.ts       # Utility functions
│   ├── services/          # Business logic
│   │   ├── store.service.ts
│   │   ├── product.service.ts
│   │   └── order.service.ts
│   └── types/             # TypeScript types
├── public/                # Static assets
└── docs/                  # Documentation (this file!)
```

---

## Step 1: Clone & Install

```bash
# Clone repository
git clone <your-repo-url> stores-stepperslife
cd stores-stepperslife

# Install dependencies (use pnpm for faster installs)
pnpm install
# OR
npm install
```

---

## Step 2: Environment Setup

### Create .env file:

```bash
cp .env.example .env
```

### Edit .env with your values:

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://stepperslife:password@localhost:5407/stepperslife_stores?schema=public"

# ============================================
# CLERK AUTHENTICATION (Same as main site)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# ============================================
# STRIPE PAYMENTS
# ============================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Connect (for vendor payouts)
STRIPE_CLIENT_ID="ca_..."

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://localhost:6407"

# ============================================
# MINIO (Object Storage)
# ============================================
MINIO_ENDPOINT="localhost"
MINIO_PORT="9007"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="stepperslife-stores"
MINIO_USE_SSL="false"

# ============================================
# RESEND (Email)
# ============================================
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="SteppersLife Stores <noreply@stepperslife.com>"

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3008"
NEXT_PUBLIC_MAIN_SITE_URL="http://localhost:3001"
PORT=3008

# Platform Settings
PLATFORM_FEE_PERCENT=7.0
```

---

## Step 3: Start Docker Services

### Create docker-compose.yml:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: stores-postgres
    ports:
      - "5407:5432"
    environment:
      POSTGRES_USER: stepperslife
      POSTGRES_PASSWORD: password
      POSTGRES_DB: stepperslife_stores
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stepperslife"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: stores-redis
    ports:
      - "6407:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: stores-minio
    ports:
      - "9007:9000"      # API
      - "9107:9001"      # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Start services:

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data (careful!)
docker-compose down -v
```

---

## Step 4: Database Setup

### Run Prisma migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Create and run initial migration
npx prisma migrate dev --name init

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### Seed database:

```bash
# Run seed script
npx prisma db seed
```

---

## Step 5: MinIO Setup

### Create storage bucket:

```bash
# Access MinIO Console at http://localhost:9107
# Login: minioadmin / minioadmin

# Create bucket named: stepperslife-stores
# Set bucket policy to public for images
```

### Or use MinIO CLI:

```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# OR
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# Configure
mc alias set local http://localhost:9007 minioadmin minioadmin

# Create bucket
mc mb local/stepperslife-stores

# Set public policy for images
mc policy set download local/stepperslife-stores
```

---

## Step 6: Install shadcn/ui Components

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

---

## Step 7: Start Development Server

```bash
# Start Next.js dev server
npm run dev
# OR
pnpm dev

# Server will start at http://localhost:3008
```

---

## Development Workflow

### 1. Database Changes

```bash
# After modifying schema.prisma:

# Create migration
npx prisma migrate dev --name description_of_change

# Reset database (careful!)
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

### 2. Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Build test
npm run build
```

### 3. Testing (when implemented)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

---

## Useful Development Scripts

### package.json scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 3008",
    "build": "next build",
    "start": "next start -p 3008",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset && prisma db seed"
  }
}
```

---

## Common Issues & Solutions

### Issue 1: Database Connection Failed

**Error**: `Error: Can't reach database server at localhost:5407`

**Solution**:
```bash
# Check if PostgreSQL container is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue 2: Redis Connection Error

**Error**: `Redis connection timeout`

**Solution**:
```bash
# Restart Redis
docker-compose restart redis

# Test connection
docker exec -it stores-redis redis-cli ping
# Should return: PONG
```

### Issue 3: MinIO Upload Fails

**Error**: `Access Denied when uploading to MinIO`

**Solution**:
```bash
# Set correct bucket policy
mc policy set download local/stepperslife-stores

# Or make specific paths public
mc policy set download local/stepperslife-stores/products
```

### Issue 4: Clerk Auth Not Working

**Error**: `Invalid Clerk publishable key`

**Solution**:
- Ensure `.env` has correct Clerk keys
- Check that keys start with `pk_test_` or `pk_live_`
- Restart dev server after changing .env

### Issue 5: Prisma Client Out of Sync

**Error**: `Prisma Client does not match schema`

**Solution**:
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart dev server
```

---

## VSCode Setup (Recommended)

### Install Extensions:

- **Prisma** (prisma.prisma)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **TypeScript Error Translator** (mattpocock.ts-error-translator)

### VSCode Settings (.vscode/settings.json):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/vendor-onboarding

# Make changes, commit frequently
git add .
git commit -m "feat: add vendor registration form"

# Push to remote
git push origin feature/vendor-onboarding

# Create pull request on GitHub
```

### Commit Message Format:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## Production Deployment (VPS)

### 1. Build for production:

```bash
# Build Next.js
npm run build

# Test production build locally
npm start
```

### 2. Environment variables:

```bash
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="https://stores.stepperslife.com"
# ... other production values
```

### 3. Deploy to VPS:

```bash
# SSH to server
ssh user@your-vps-ip

# Pull latest code
cd /root/websites/stores-stepperslife
git pull origin main

# Install dependencies
pnpm install --production

# Run migrations
npx prisma migrate deploy

# Build
pnpm build

# Restart application
pm2 restart stores-stepperslife

# OR use Docker
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Nginx Configuration:

```nginx
# /etc/nginx/sites-available/stores.stepperslife.com
server {
    listen 80;
    server_name stores.stepperslife.com;

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stores.stepperslife.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Set up SSL (Let's Encrypt)
sudo certbot --nginx -d stores.stepperslife.com
```

---

## Next Steps

Now that your development environment is ready:

1. ✅ Review the [Implementation Roadmap](./IMPLEMENTATION-ROADMAP.md)
2. ✅ Read [User Stories](./USER-STORIES-PHASE1.md) for Sprint 1
3. ✅ Start coding! Begin with Sprint 1, Week 1 tasks
4. ✅ Join daily standups and track progress

---

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Clerk Docs**: https://clerk.com/docs
- **Stripe Connect**: https://stripe.com/docs/connect
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Happy coding! 🚀**
