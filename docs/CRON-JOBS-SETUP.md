# Cron Jobs Setup Guide

**Phase 2 Week 10 - Usage Reset & Scheduled Tasks**
**Date:** 2025-10-12

---

## 📋 Overview

This guide explains how to set up automated cron jobs for the multi-tenant SaaS platform.

---

## 🔧 Required Cron Jobs

### 1. Monthly Usage Reset

**Purpose:** Reset order count for all tenants on the 1st of each month

**Endpoint:** `https://stores.stepperslife.com/api/cron/reset-monthly-usage`

**Schedule:** `0 0 1 * *` (Midnight on 1st of every month)

**Method:** GET or POST

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**What it does:**
- Resets `currentOrders` to 0 for all tenants
- Allows fresh monthly quota tracking
- Logs summary of reset operation

---

## ⚙️ Setup Options

### Option A: cron-job.org (Recommended - Free & Easy)

1. Go to https://cron-job.org
2. Create free account
3. Click "Create Cron Job"
4. Configure:
   - **Title:** "SteppersLife - Monthly Usage Reset"
   - **URL:** `https://stores.stepperslife.com/api/cron/reset-monthly-usage`
   - **Schedule:** Custom expression: `0 0 1 * *`
   - **Request Method:** GET
   - **Headers:** Add header
     - Key: `Authorization`
     - Value: `Bearer TbPT2u6qX7+z6zNAoBs6FL9Xk+LIGte539SB9HH9Ke8=`
   - **Notifications:** Enable email on failure
5. Save and activate

---

### Option B: GitHub Actions (Free for public repos)

1. Create `.github/workflows/monthly-reset.yml`:

```yaml
name: Monthly Usage Reset

on:
  schedule:
    # Runs at midnight on 1st of every month (UTC)
    - cron: '0 0 1 * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  reset-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reset API
        run: |
          curl -X GET https://stores.stepperslife.com/api/cron/reset-monthly-usage \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. Add secret to GitHub repo:
   - Go to repo Settings → Secrets → Actions
   - Add `CRON_SECRET` with value from `.env`

3. Commit and push

---

### Option C: Server Crontab (Linux/VPS)

1. SSH into your server
2. Edit crontab:
   ```bash
   crontab -e
   ```

3. Add this line:
   ```bash
   0 0 1 * * curl -X GET https://stores.stepperslife.com/api/cron/reset-monthly-usage -H "Authorization: Bearer TbPT2u6qX7+z6zNAoBs6FL9Xk+LIGte539SB9HH9Ke8=" >> /var/log/cron-reset-usage.log 2>&1
   ```

4. Save and exit

5. Verify cron is running:
   ```bash
   crontab -l
   ```

---

### Option D: EasyCron (Paid - $2.99/month)

1. Go to https://www.easycron.com
2. Sign up for account
3. Add new cron job:
   - **URL:** `https://stores.stepperslife.com/api/cron/reset-monthly-usage`
   - **Cron Expression:** `0 0 1 * *`
   - **HTTP Method:** GET
   - **HTTP Headers:** `Authorization: Bearer <CRON_SECRET>`
4. Save

---

## 🔐 Security

### CRON_SECRET Value

The `CRON_SECRET` is stored in `.env`:
```
CRON_SECRET="TbPT2u6qX7+z6zNAoBs6FL9Xk+LIGte539SB9HH9Ke8="
```

**Important:**
- Keep this secret secure
- Never commit to Git
- Rotate periodically (update .env and cron service)

### Regenerating CRON_SECRET

If compromised, regenerate:

```bash
# Generate new secret
openssl rand -base64 32

# Update .env
CRON_SECRET="<new-secret-here>"

# Restart application
pm2 restart stores-stepperslife

# Update cron service with new secret
```

---

## ✅ Verification

### Test the Cron Job Manually

```bash
curl -X GET https://stores.stepperslife.com/api/cron/reset-monthly-usage \
  -H "Authorization: Bearer TbPT2u6qX7+z6zNAoBs6FL9Xk+LIGte539SB9HH9Ke8=" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Monthly usage reset complete for October 2025",
  "tenantsUpdated": 3,
  "timestamp": "2025-10-01T00:00:00.000Z"
}
```

### Check Logs

**PM2 Logs:**
```bash
pm2 logs stores-stepperslife | grep "Monthly usage reset"
```

**Expected Output:**
```
Starting monthly usage reset...
Monthly usage reset complete: 3 tenants updated for October 2025
```

---

## 📊 Monitoring

### Set Up Alerts

**Email Notifications:**
- cron-job.org: Enable "Notify on failure" in job settings
- GitHub Actions: Automatic email on workflow failure
- Server crontab: Use `MAILTO` directive

**Monitoring Dashboard:**
- Check execution history in cron service dashboard
- Verify last run timestamp
- Check failure rate

### Troubleshooting

**Issue: 401 Unauthorized**
- Check CRON_SECRET matches .env value exactly
- Verify Authorization header is included
- Check for extra whitespace in secret

**Issue: 500 Internal Server Error**
- Check PM2 logs: `pm2 logs stores-stepperslife`
- Verify database connection
- Check Prisma is working

**Issue: Cron not running**
- Verify schedule expression (use https://crontab.guru)
- Check cron service is active
- Test URL manually with curl

---

## 📅 Schedule Reference

### Cron Expression: `0 0 1 * *`

```
┌────────────── minute (0)
│ ┌──────────── hour (0 = midnight)
│ │ ┌────────── day of month (1 = 1st)
│ │ │ ┌──────── month (* = every month)
│ │ │ │ ┌────── day of week (* = any day)
│ │ │ │ │
0 0 1 * *
```

**When it runs:**
- January 1st at 00:00
- February 1st at 00:00
- March 1st at 00:00
- ... (every month)

---

## 🔄 Future Cron Jobs

### Other Potential Scheduled Tasks

1. **Trial Ending Reminders** (daily)
   - Check tenants with trial ending in 3 days
   - Send reminder emails
   - Schedule: `0 9 * * *` (9 AM daily)

2. **Invoice Reminders** (daily)
   - Check for unpaid invoices
   - Send reminders
   - Schedule: `0 10 * * *` (10 AM daily)

3. **Usage Warnings** (daily)
   - Check tenants at 90% quota
   - Send warning emails
   - Schedule: `0 8 * * *` (8 AM daily)

4. **Analytics Aggregation** (weekly)
   - Calculate weekly metrics
   - Schedule: `0 1 * * 0` (1 AM Sunday)

---

## ✅ Checklist

- [ ] Choose cron service (cron-job.org recommended)
- [ ] Create account on chosen service
- [ ] Configure monthly reset job
- [ ] Add Authorization header with CRON_SECRET
- [ ] Set schedule to `0 0 1 * *`
- [ ] Enable failure notifications
- [ ] Test job manually with curl
- [ ] Verify first execution on next month 1st
- [ ] Document which service you're using

---

**Status:** ✅ Cron endpoint ready
**Next Step:** Configure external cron service
**Estimated Setup Time:** 5-10 minutes
