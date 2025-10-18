# Stores Stepperslife - Architecture Documentation

**⚠️ READ THIS FIRST - Critical for maintaining consistency across all Stepperslife subdomains**

---

## 🎯 This Subdomain's Configuration

**Subdomain:** stores.stepperslife.com
**Port:** 3008
**Database:** stepperslife_stores
**Database URL:** postgresql://stepperslife:securepass123@localhost:5432/stepperslife_stores
**MinIO Container:** stores-minio
**MinIO Port:** 9003 (Console: 9103)
**MinIO Bucket:** stores
**PM2 Process:** stores-stepperslife
**Directory:** /root/websites/stores-stepperslife

---

## 🏗️ Architecture Pattern

### This is a **Fully Isolated Microservice**

✅ **Own PostgreSQL database** (stepperslife_stores)
✅ **Own MinIO container** (stores-minio)
✅ **Own PM2 process** (stores-stepperslife)
✅ **Can be sold separately** (complete isolation)

❌ **DO NOT share databases** with other subdomains
❌ **DO NOT share MinIO buckets** with other subdomains
❌ **DO NOT hardcode references** to other subdomain services

---

## 🔐 SSO Configuration (Shared Across All Subdomains)

All Stepperslife subdomains use **Clerk SSO** for authentication:

```env
NEXTAUTH_URL="https://stores.stepperslife.com"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_Y3VycmVudC1hbnQtNzUuY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_test_your_actual_key_here"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

**Key Points:**
- ✅ User logs in once on stepperslife.com = logged into ALL subdomains
- ✅ Each subdomain validates session via Clerk
- ✅ NEXTAUTH_URL must be unique per subdomain (https://stores.stepperslife.com)
- ✅ Clerk keys are SHARED across all subdomains

---

## 📊 Data Flow

```
User visits stepperslife.com (main site)
    ↓
Main site fetches data from stores.stepperslife.com/api/*
    ↓
Stores data displayed on main site
    ↓
User clicks to view/purchase stores content
    ↓
Redirects to stores.stepperslife.com
    ↓
Transaction happens on stores subdomain
```

### Your Responsibilities

1. **Expose API endpoints** for main site to fetch data
2. **Handle transactions** on this subdomain
3. **Store data** in your own database (stepperslife_stores)
4. **Store files** in your own MinIO bucket (stores)

---

## 🚫 Critical Rules - DO NOT BREAK

### ❌ Never Change These

1. **Port:** 3008 (reserved for stores)
2. **Database name:** stepperslife_stores
3. **Database credentials:** stepperslife:securepass123
4. **MinIO credentials:** minioadmin:minioadmin
5. **Clerk publishable key:** Must match other subdomains
6. **PM2 process name:** stores-stepperslife

### ✅ You Can Customize

1. **UI/UX** - Make it unique to stores
2. **Features** - Add stores-specific functionality
3. **Database schema** - Add tables as needed (in your own DB)
4. **API endpoints** - Create stores-specific APIs
5. **Business logic** - Implement stores workflows

---

## 🌐 All Stepperslife Subdomains

| Subdomain    | Port | Database                | MinIO Port | Status |
|--------------|------|-------------------------|------------|--------|
| stores       | 3008 | stepperslife_stores     | 9003       | ✅      |
| events       | 3004 | stepperslife_events     | 9004       | ✅      |
| magazine     | 3007 | stepperslife_magazine   | 9007       | ✅      |
| services     | 3011 | stepperslife_services   | 9011       | ✅      |
| restaurants  | 3010 | stepperslife_restaurants| 9010       | ✅      |
| classes      | 3009 | stepperslife_classes    | 9009       | ✅      |

**Note:** Each subdomain follows the same pattern - complete isolation with shared SSO.

---

## 📝 Common Commands

### Start this subdomain
```bash
cd /root/websites/stores-stepperslife
NODE_ENV=production PORT=3008 pm2 start npm --name "stores-stepperslife" -- start
```

### Restart this subdomain
```bash
pm2 restart stores-stepperslife
```

### View logs
```bash
pm2 logs stores-stepperslife --lines 50
```

### Build application
```bash
cd /root/websites/stores-stepperslife
npm run build
```

### Check database
```bash
PGPASSWORD=securepass123 psql -h localhost -U stepperslife -d stepperslife_stores
```

### Check MinIO container
```bash
docker ps | grep stores-minio
```

---

## 🔗 Integration with Main Site

### Expose APIs for stepperslife.com

Create API routes that the main site can call. Example:

```
GET /api/stores/list       - List all items
GET /api/stores/item/:id   - Get single item
GET /api/stores/featured   - Get featured content
GET /api/stores/categories - List categories
```

Main site will fetch from: `https://stores.stepperslife.com/api/stores/*`

---

## 🛡️ Environment Variables Template

Your `.env` file should look like this:

```env
# Database Configuration
DATABASE_URL="postgresql://stepperslife:securepass123@localhost:5432/stepperslife_stores"

# MinIO Configuration (Isolated)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9003"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="stores"

# NextAuth Configuration (SSO)
NEXTAUTH_URL="https://stores.stepperslife.com"
NEXTAUTH_SECRET="{unique_secret_here}"

# Clerk SSO Configuration (SHARED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_Y3VycmVudC1hbnQtNzUuY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_test_your_actual_key_here"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Application Configuration
NEXT_PUBLIC_APP_NAME="Stores - Stepperslife"
NEXT_PUBLIC_APP_URL="https://stores.stepperslife.com"

# Port Configuration
PORT=3008
```

---

## 🚀 Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Environment variables configured in `.env`
- [ ] Database schema applied: `npx prisma db push`
- [ ] PM2 process running: `pm2 list | grep stores`
- [ ] MinIO container running: `docker ps | grep stores-minio`
- [ ] DNS points to server: stores.stepperslife.com → 72.60.28.175
- [ ] SSL certificate installed: `certbot --nginx -d stores.stepperslife.com`
- [ ] API endpoints accessible from main site
- [ ] SSO login works across domains

---

## 📚 Additional Resources

- **Full Setup Guide:** /var/www/downloads/stepperslife-docs/SUBDOMAIN_MICROSERVICES_SETUP.md
- **Setup Script:** /usr/local/bin/create-subdomain-microservice.sh
- **Quick Reference:** /var/www/downloads/stepperslife-docs/QUICK-REFERENCE.txt

---

## ⚠️ Final Reminder

**This subdomain (stores.stepperslife.com) is part of a larger ecosystem:**

1. Users login via **stepperslife.com** (main site)
2. Main site **aggregates data** from all subdomains via APIs
3. This subdomain must **expose APIs** for data sharing
4. This subdomain is **fully isolated** - can operate independently
5. This subdomain can be **sold separately** if needed

**When in doubt, follow the pattern used by stores.stepperslife.com (the reference implementation).**

---

**Last Updated:** October 9, 2025
**Architecture Version:** 1.0
**Maintained By:** Stepperslife Development Team
