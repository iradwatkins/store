# SteppersLife Stores - Quick Reference Card

**Domain:** https://stores.stepperslife.com
**Port:** 3008 (internal)
**Status:** ✅ Production Ready

---

## 🚀 Quick Commands

### Check Status
```bash
pm2 status                                    # PM2 process status
curl -I http://localhost:3008                 # Test local
curl -I https://stores.stepperslife.com       # Test public
```

### View Logs
```bash
pm2 logs stores-stepperslife                  # Real-time logs
pm2 logs stores-stepperslife --lines 100      # Last 100 lines
pm2 logs stores-stepperslife --err            # Errors only
```

### Restart Application
```bash
pm2 restart stores-stepperslife               # Quick restart
pm2 flush stores-stepperslife                 # Clear logs first
```

### Full Redeploy
```bash
cd /root/websites/stores-stepperslife
npm run build
pm2 restart stores-stepperslife
pm2 save
```

---

## 🔧 Environment Variables (Critical)

```bash
# View current config
cat /root/websites/stores-stepperslife/.env | grep -E "RESEND|STRIPE|CRON"

# Edit environment
nano /root/websites/stores-stepperslife/.env

# After editing, rebuild and restart
cd /root/websites/stores-stepperslife
npm run build
pm2 restart stores-stepperslife
```

**Must be set for production:**
- `RESEND_API_KEY` - Email service
- `CRON_SECRET` - Secure cron endpoints
- `STRIPE_SECRET_KEY` - Live mode (starts with `sk_live_`)
- `STRIPE_WEBHOOK_SECRET` - From Stripe Dashboard

---

## 📧 Email System

**Service:** Resend.com
**Endpoint:** https://resend.com/api-keys

### Email Triggers
| Event | Recipient | When |
|-------|-----------|------|
| Payment success | Customer + Vendor | Immediate (Stripe webhook) |
| Order shipped | Customer | When vendor marks as shipped |
| Store created | Vendor | Immediate |
| Review request | Customer | 3 days after shipment (cron) |

### Test Email Integration
```bash
# Check if emails are sending (look for "email sent")
pm2 logs stores-stepperslife | grep -i "email"

# Test cron job (development only)
curl http://localhost:3008/api/cron/send-review-requests
```

---

## 💳 Stripe Configuration

**Dashboard:** https://dashboard.stripe.com

### Switch to Live Mode
1. Toggle to "Live Mode" (top right)
2. Copy live API keys → `.env`
3. Configure webhook: `https://stores.stepperslife.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy webhook signing secret → `.env` as `STRIPE_WEBHOOK_SECRET`

### Verify Webhook
```bash
# Check logs during test payment
pm2 logs stores-stepperslife | grep -i stripe
```

---

## ⏰ Cron Job Setup

**Endpoint:** `/api/cron/send-review-requests`
**Schedule:** Daily at 10 AM UTC (`0 10 * * *`)
**Purpose:** Send review requests 3 days after shipment

### Using cron-job.org (Recommended)
1. Create account: https://cron-job.org
2. Add job:
   - URL: `https://stores.stepperslife.com/api/cron/send-review-requests`
   - Method: POST
   - Schedule: `0 10 * * *`
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`

### Test Cron
```bash
# With production cron secret
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://stores.stepperslife.com/api/cron/send-review-requests
```

---

## 🗄️ Database

**Type:** PostgreSQL
**Database:** `stepperslife_store`
**User:** `stepperslife`
**Password:** `securepass123`

### Quick Checks
```bash
# Test connection
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT 1;"

# Count orders
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT COUNT(*) FROM store_orders;"

# Count reviews
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT COUNT(*) FROM product_reviews;"
```

### Backup
```bash
# Create backup
pg_dump -h 127.0.0.1 -U stepperslife stepperslife_store > backup_$(date +%Y%m%d).sql

# Restore
psql -h 127.0.0.1 -U stepperslife stepperslife_store < backup_YYYYMMDD.sql
```

---

## 🌐 Nginx

**Config:** `/etc/nginx/sites-available/stores.stepperslife.com`

### Reload Nginx
```bash
sudo nginx -t                      # Test config
sudo systemctl reload nginx        # Reload if test passes
sudo systemctl restart nginx       # Full restart
```

### Check Logs
```bash
# Access logs
tail -f /var/log/nginx/stores.stepperslife.com.access.log

# Error logs
tail -f /var/log/nginx/stores.stepperslife.com.error.log
```

---

## 🔍 Health Checks

```bash
# Application
curl http://localhost:3008

# Redis
redis-cli ping

# Database
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT 1;"

# Disk space
df -h

# Memory
free -h
```

---

## 🚨 Troubleshooting

### Application Not Responding
```bash
pm2 restart stores-stepperslife
pm2 logs stores-stepperslife --lines 50
```

### Emails Not Sending
```bash
# Check environment
echo $RESEND_API_KEY

# Check logs for email errors
pm2 logs stores-stepperslife | grep -i email

# Verify RESEND_API_KEY in .env
grep RESEND_API_KEY /root/websites/stores-stepperslife/.env
```

### Stripe Webhook Failing
```bash
# Check webhook secret
grep STRIPE_WEBHOOK_SECRET /root/websites/stores-stepperslife/.env

# View webhook attempts in Stripe Dashboard
# https://dashboard.stripe.com/webhooks

# Check logs during payment
pm2 logs stores-stepperslife | grep -i stripe
```

### Out of Memory
```bash
pm2 restart stores-stepperslife
free -h
```

---

## 📊 Monitoring

### Key Metrics
```bash
# PM2 status
pm2 status

# System resources
top
htop

# Disk usage
df -h

# Network connections
netstat -tulpn | grep 3008
```

### Application Metrics
```bash
# Order count
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT COUNT(*) FROM store_orders WHERE \"paymentStatus\" = 'PAID';"

# Review count
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT COUNT(*) FROM product_reviews WHERE status = 'PUBLISHED';"

# Active vendors
PGPASSWORD=securepass123 psql -h 127.0.0.1 -U stepperslife -d stepperslife_store -c "SELECT COUNT(*) FROM vendor_stores WHERE \"isActive\" = true;"
```

---

## 📞 Emergency Contacts

**Documentation:**
- Full Deployment Guide: `docs/PRODUCTION-DEPLOYMENT.md`
- Project Summary: `docs/PROJECT-COMPLETION-SUMMARY.md`
- Implementation Roadmap: `docs/IMPLEMENTATION-ROADMAP.md`

**Key Files:**
- Environment: `/root/websites/stores-stepperslife/.env`
- Nginx Config: `/etc/nginx/sites-available/stores.stepperslife.com`
- Application: `/root/websites/stores-stepperslife/`

---

## ⚡ Performance Tips

### Clear PM2 Logs (If Large)
```bash
pm2 flush stores-stepperslife
```

### Clear Redis Cache (If Needed)
```bash
redis-cli FLUSHDB  # ⚠️ Clears cart data - use with caution
```

### Rebuild Application
```bash
cd /root/websites/stores-stepperslife
npm run build
pm2 restart stores-stepperslife
```

---

## 🎯 Pre-Launch Checklist

- [ ] `RESEND_API_KEY` set to production key
- [ ] `CRON_SECRET` generated and set
- [ ] Stripe keys switched to live mode (`sk_live_`, `pk_live_`)
- [ ] Stripe webhook configured and `STRIPE_WEBHOOK_SECRET` set
- [ ] Cron job scheduled (cron-job.org or similar)
- [ ] Test transaction completed end-to-end
- [ ] All emails tested and delivered
- [ ] PM2 auto-restart enabled (`pm2 startup && pm2 save`)
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] SSL certificate active
- [ ] Database backed up

---

**Last Updated:** October 10, 2025
**Status:** Production Ready 🚀

*For detailed information, see: `docs/PRODUCTION-DEPLOYMENT.md`*
