# SteppersLife Stores - Production Deployment Guide

## 📋 Overview

This guide covers the complete production deployment and launch checklist for the SteppersLife Stores marketplace platform.

**Domain:** https://stores.stepperslife.com
**Internal Port:** 3008
**Framework:** Next.js 15 (App Router)
**Database:** PostgreSQL (isolated per microservice)
**Cache:** Redis (shared across microservices)
**Storage:** MinIO (isolated per microservice)
**Email:** Resend.com + React Email

---

## ✅ Deployment Status

### Infrastructure ✅
- [x] VPS server configured
- [x] PostgreSQL database created (`stepperslife_store`)
- [x] Redis cache accessible
- [x] MinIO object storage configured (port 9003)
- [x] Nginx reverse proxy configured
- [x] SSL certificate active (Let's Encrypt)
- [x] PM2 process manager running
- [x] Application responding on port 3008

### Application ✅
- [x] All features implemented (Sprints 1-3)
- [x] Email integration complete
- [x] Database indexes optimized
- [x] Build successful
- [x] Environment variables template created

### Pending ⏳
- [ ] Production environment variables configured
- [ ] Stripe live mode keys updated
- [ ] Resend API key configured
- [ ] Cron job scheduled for review requests
- [ ] End-to-end production testing

---

## 🚀 Quick Start Deployment

### 1. Update Environment Variables

```bash
cd /root/websites/stores-stepperslife
cp .env .env.backup
nano .env
```

Update the following critical variables:

```bash
# Email (Get production key from https://resend.com/api-keys)
RESEND_API_KEY="re_PRODUCTION_KEY_HERE"

# Cron Security (Generate with: openssl rand -base64 32)
CRON_SECRET="YOUR_SECURE_CRON_SECRET_HERE"

# Stripe Live Mode (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # From webhook configuration
STRIPE_CLIENT_ID="ca_..." # For Stripe Connect
```

### 2. Rebuild Application

```bash
npm run build
```

### 3. Restart PM2 Process

```bash
pm2 restart stores-stepperslife
pm2 save
```

### 4. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs stores-stepperslife --lines 50

# Test local endpoint
curl -I http://localhost:3008

# Test public endpoint
curl -I https://stores.stepperslife.com
```

---

## 📧 Email Configuration

### Resend.com Setup

1. **Get API Key**
   - Visit: https://resend.com/api-keys
   - Create API key with full send permissions
   - Add to `.env` as `RESEND_API_KEY`

2. **Verify Domain**
   - Add `stepperslife.com` domain to Resend
   - Configure DNS records (SPF, DKIM, DMARC)
   - Verify domain ownership

3. **Email Templates Available**
   - `emails/OrderConfirmation.tsx` - Customer order confirmation
   - `emails/ShippingNotification.tsx` - Shipment tracking
   - `emails/VendorNewOrderAlert.tsx` - Vendor notifications
   - `emails/WelcomeVendor.tsx` - New vendor welcome
   - `emails/ReviewRequest.tsx` - Product review requests

4. **Email Triggers**
   - **Order Confirmation**: Sent via Stripe webhook when payment succeeds
   - **Vendor Alert**: Sent via Stripe webhook when payment succeeds
   - **Shipping Notification**: Sent when vendor fulfills order with tracking
   - **Welcome Vendor**: Sent when vendor creates store
   - **Review Request**: Sent via cron job 3 days after shipment

---

## ⏰ Cron Job Setup

### Review Request Cron

Sends review request emails 3 days after orders are shipped.

**Endpoint:** `POST /api/cron/send-review-requests`
**Schedule:** Daily at 10 AM UTC (`0 10 * * *`)
**Authorization:** `Bearer ${CRON_SECRET}`

#### Option 1: Vercel Cron (Recommended if using Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Create account at https://cron-job.org
2. Add new cron job:
   - **URL:** `https://stores.stepperslife.com/api/cron/send-review-requests`
   - **Method:** POST
   - **Schedule:** `0 10 * * *`
   - **Headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET_HERE
     Content-Type: application/json
     ```

#### Option 3: Server Cron (systemd timer or crontab)

```bash
# Add to crontab
crontab -e

# Add this line (replace CRON_SECRET with actual value)
0 10 * * * curl -X POST -H "Authorization: Bearer CRON_SECRET" https://stores.stepperslife.com/api/cron/send-review-requests
```

#### Test Cron Job (Development Only)

```bash
# Test with GET in development mode
curl http://localhost:3008/api/cron/send-review-requests

# Test with POST and auth header
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://stores.stepperslife.com/api/cron/send-review-requests
```

---

## 💳 Stripe Configuration

### 1. Switch to Live Mode

Dashboard: https://dashboard.stripe.com

- Toggle to **Live Mode** (top right)
- Copy live API keys to `.env`

### 2. Configure Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. **Endpoint URL:** `https://stores.stepperslife.com/api/webhooks/stripe`
4. **Events to send:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing secret** to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Verify Stripe Connect

- Ensure `STRIPE_CLIENT_ID` is set for vendor onboarding
- Test vendor Stripe Connect flow:
  1. Create test vendor store
  2. Complete Stripe onboarding
  3. Verify payouts are configured correctly (7% platform fee)

---

## 🗄️ Database Maintenance

### Performance Indexes

Applied indexes for optimal performance:

```sql
-- Applied via: prisma/migrations/add_performance_indexes.sql

✅ store_orders_shipped_at_payment_status_idx (review cron)
✅ store_orders_vendor_paid_created_idx (analytics)
✅ product_reviews_vendor_status_idx (moderation)
✅ product_reviews_product_published_idx (display)
✅ products_vendor_low_stock_idx (analytics)
✅ products_vendor_sales_count_idx (analytics)
```

### Backup Strategy

```bash
# Manual backup
pg_dump -h 127.0.0.1 -U stepperslife stepperslife_store > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h 127.0.0.1 -U stepperslife stepperslife_store < backup_YYYYMMDD.sql
```

---

## 🔒 Security Checklist

- [x] HTTPS enforced via Nginx
- [x] Strict CSP headers configured
- [x] Rate limiting on sensitive endpoints
- [x] SQL injection protection (Prisma)
- [x] XSS protection via React
- [x] CSRF protection via NextAuth
- [x] Environment variables secured
- [ ] Stripe webhook signature verification active
- [ ] Cron endpoints secured with secret token

---

## 📊 Monitoring & Logging

### Application Logs

```bash
# PM2 logs
pm2 logs stores-stepperslife

# Nginx access logs
tail -f /var/log/nginx/stores.stepperslife.com.access.log

# Nginx error logs
tail -f /var/log/nginx/stores.stepperslife.com.error.log
```

### Health Check

```bash
# Application health
curl https://stores.stepperslife.com/api/health

# Database connection
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT 1;"

# Redis connection
redis-cli ping
```

### Performance Monitoring

Consider adding (optional):
- **Sentry** for error tracking
- **Google Analytics** for user analytics
- **LogRocket** for session replay
- **Datadog** for infrastructure monitoring

---

## 🧪 Production Testing Checklist

### Vendor Flow
- [ ] Vendor registration
- [ ] Stripe Connect onboarding
- [ ] Store creation + welcome email
- [ ] Product creation with images
- [ ] Product listing on storefront

### Customer Flow
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout with Stripe (test mode first!)
- [ ] Order confirmation email received
- [ ] Vendor alert email received

### Order Fulfillment
- [ ] Vendor marks order as shipped
- [ ] Shipping notification email sent
- [ ] Tracking URL works

### Review System
- [ ] Customer receives review request (3 days after shipment)
- [ ] Review submission with photos
- [ ] Review displays on product page
- [ ] Helpful voting works
- [ ] Vendor response functionality
- [ ] Flag/report functionality

### Analytics
- [ ] Vendor dashboard loads
- [ ] Revenue charts display correctly
- [ ] Top products show accurate data
- [ ] Low stock alerts work

---

## 🚨 Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# View recent logs
pm2 logs stores-stepperslife --lines 100

# Restart PM2
pm2 restart stores-stepperslife

# Rebuild if needed
npm run build
pm2 restart stores-stepperslife
```

### Emails Not Sending

```bash
# Check environment variable
echo $RESEND_API_KEY

# Check application logs for email errors
pm2 logs stores-stepperslife | grep -i email

# Test Resend API directly
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "SteppersLife Stores <noreply@stepperslife.com>",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

### Database Connection Issues

```bash
# Test connection
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store

# Check DATABASE_URL in .env
grep DATABASE_URL .env

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Stripe Webhook Issues

```bash
# Check webhook logs in Stripe Dashboard
# Verify STRIPE_WEBHOOK_SECRET is correct
# Check Nginx allows POST to /api/webhooks/stripe
# Review application logs during test payment
pm2 logs stores-stepperslife | grep -i stripe
```

---

## 📞 Support & Maintenance

### Key Files
- **Environment:** `/root/websites/stores-stepperslife/.env`
- **PM2 Config:** `pm2 list`
- **Nginx Config:** `/etc/nginx/sites-available/stores.stepperslife.com`
- **Logs:** `/var/log/nginx/stores.stepperslife.com.*.log`
- **Database:** PostgreSQL `stepperslife_store` database

### Useful Commands

```bash
# Restart application
pm2 restart stores-stepperslife

# Rebuild application
cd /root/websites/stores-stepperslife && npm run build && pm2 restart stores-stepperslife

# Check running processes
pm2 status

# Monitor logs in real-time
pm2 logs stores-stepperslife

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Generate new CRON_SECRET
openssl rand -base64 32
```

---

## 🎯 Launch Day Checklist

Final checks before going live:

- [ ] All environment variables set correctly
- [ ] Stripe in live mode with webhooks configured
- [ ] Resend API key active and domain verified
- [ ] Cron job scheduled for review requests
- [ ] PM2 auto-restart enabled (`pm2 startup && pm2 save`)
- [ ] Database backed up
- [ ] SSL certificate active and auto-renewing
- [ ] Test transaction completed end-to-end
- [ ] All emails tested and delivered
- [ ] Analytics dashboard verified
- [ ] Error monitoring active (if using Sentry)
- [ ] DNS propagated and resolving correctly
- [ ] Team trained on vendor dashboard
- [ ] Customer support processes defined

---

## 📚 Additional Resources

- **Implementation Roadmap:** `docs/IMPLEMENTATION-ROADMAP.md`
- **API Documentation:** `docs/API.md`
- **Database Schema:** `prisma/schema.prisma`
- **Environment Template:** `.env.production.example`
- **Performance Indexes:** `prisma/migrations/add_performance_indexes.sql`

---

**Last Updated:** October 10, 2025
**Version:** 1.0.0
**Status:** Ready for Production 🚀
