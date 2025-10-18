# Square Credentials Reference - Complete Configuration

**Date:** October 10, 2025
**API Version:** 2025-09-24 (Latest)
**Status:** ✅ **DOCUMENTED**

---

## 🔐 Square Account Credentials

### 📱 Sandbox Environment (Testing)

**Purpose:** Testing and development without real money

| Credential | Value |
|-----------|-------|
| **Application ID** | `sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg` |
| **Access Token** | `EAAAl9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo` |
| **Location ID** | `LZN634J2MSXRY` |
| **Environment URL** | `https://connect.squareupsandbox.com` |

---

### 💰 Production Environment (Live)

**Purpose:** Real transactions with actual money

| Credential | Value |
|-----------|-------|
| **Application ID** | `sq0idp-XG8irNWHf98C62-iqOwH6Q` |
| **Access Token** | `EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi` |
| **Location ID** | `L0Q2YC1SPBGD8` |
| **Environment URL** | `https://connect.squareup.com` |

---

## 📋 Environment Configuration

### Current (.env) - Sandbox Mode ✅

```env
# Square (Sandbox for Testing) - API Version 2025-09-24 (Latest) with Cash App Support
SQUARE_ACCESS_TOKEN="EAAAl9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo"
SQUARE_APPLICATION_ID="sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg"
SQUARE_LOCATION_ID="LZN634J2MSXRY"
SQUARE_ENVIRONMENT="https://connect.squareupsandbox.com"
NEXT_PUBLIC_SQUARE_APPLICATION_ID="sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg"
```

---

### Production Configuration (When Ready to Go Live)

To switch to production, update `.env` with:

```env
# Square (PRODUCTION - LIVE PAYMENTS) - API Version 2025-09-24 (Latest) with Cash App Support
SQUARE_ACCESS_TOKEN="EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi"
SQUARE_APPLICATION_ID="sq0idp-XG8irNWHf98C62-iqOwH6Q"
SQUARE_LOCATION_ID="L0Q2YC1SPBGD8"
SQUARE_ENVIRONMENT="https://connect.squareup.com"
NEXT_PUBLIC_SQUARE_APPLICATION_ID="sq0idp-XG8irNWHf98C62-iqOwH6Q"
```

Then rebuild and restart:
```bash
npm run build
pm2 restart stores-stepperslife
pm2 save
```

---

## 🔄 Switching Between Environments

### Option 1: Manual Switch

1. Edit `.env` file
2. Replace all Square credentials
3. Rebuild: `npm run build`
4. Restart: `pm2 restart stores-stepperslife`

### Option 2: Environment-Based (.env.production)

Create `.env.production` with production credentials:
```bash
cp .env .env.sandbox
# Edit .env with production values
NODE_ENV=production npm run build
```

---

## 🧪 Testing Credentials

### Sandbox Test Nonces:

Square provides test payment nonces for sandbox testing:

```typescript
// Credit Card - Success
sourceId: 'cnon:card-nonce-ok'

// Credit Card - Declined
sourceId: 'cnon:card-nonce-declined'

// Cash App - Success
sourceId: 'cnon:cash-app-success'

// Cash App - Declined
sourceId: 'cnon:cash-app-declined'

// Generic Card Errors
sourceId: 'cnon:card-nonce-rejected'
sourceId: 'cnon:card-nonce-charged'
sourceId: 'cnon:card-nonce-voided'
```

### Test Card Numbers (Sandbox):

| Card Type | Number | CVV | Zip | Result |
|-----------|--------|-----|-----|--------|
| Visa | 4111 1111 1111 1111 | 111 | 94103 | ✅ Success |
| Mastercard | 5105 1051 0510 5100 | 111 | 94103 | ✅ Success |
| Amex | 3782 822463 10005 | 1111 | 94103 | ✅ Success |
| Discover | 6011 0000 0000 0004 | 111 | 94103 | ✅ Success |

---

## 📊 Credential Comparison

| Aspect | Sandbox | Production |
|--------|---------|------------|
| **Real Money** | ❌ No | ✅ Yes |
| **Testing** | ✅ Unlimited | ⚠️ Use carefully |
| **Webhooks** | ✅ Work | ✅ Work |
| **Cash App** | ✅ Test mode | ✅ Live |
| **Cards** | ✅ Test cards | ✅ Real cards |
| **Fees** | ❌ No charges | ✅ Real fees |
| **Payouts** | ❌ Simulated | ✅ Real payouts |

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Keep access tokens in `.env` (not in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Use sandbox for all development/testing
- ✅ Rotate tokens regularly in production
- ✅ Monitor API usage in Square Dashboard
- ✅ Enable webhook signature verification

### ❌ DON'T:
- ❌ Commit access tokens to git
- ❌ Share tokens in public channels
- ❌ Use production tokens for testing
- ❌ Hardcode credentials in source code
- ❌ Expose tokens in client-side code
- ❌ Use same tokens across environments

---

## 📍 Location Information

### Sandbox Location
**ID:** `LZN634J2MSXRY`
- Used for all sandbox testing
- Simulated location data
- Test mode only

### Production Location
**ID:** `L0Q2YC1SPBGD8`
- Real business location
- Actual address and details
- Live transactions

---

## 🛠️ Troubleshooting

### Issue: 401 Unauthorized

**Possible Causes:**
1. Token expired or invalid
2. Token not activated
3. Wrong environment (sandbox token in production)
4. Incorrect formatting

**Solutions:**
```bash
# 1. Regenerate token in Square Dashboard
# 2. Update .env with new token
# 3. Rebuild application
npm run build
pm2 restart stores-stepperslife

# 4. Test connection
npx tsx scripts/test-square2.ts
```

### Issue: Location Not Found

**Cause:** Wrong location ID for environment

**Solution:**
- Sandbox: Use `LZN634J2MSXRY`
- Production: Use `L0Q2YC1SPBGD8`

---

## 📞 Support Resources

### Square Developer Dashboard:
- **Sandbox:** https://developer.squareup.com/
- **Production:** https://squareup.com/dashboard

### Documentation:
- **API Reference:** https://developer.squareup.com/reference/square
- **Web Payments SDK:** https://developer.squareup.com/docs/web-payments/overview
- **Cash App Pay:** https://developer.squareup.com/docs/cash-app/web-payments-sdk

### Testing:
```bash
# Test Square connection
npx tsx scripts/test-square2.ts

# Check application health
curl https://stores.stepperslife.com/api/health

# View PM2 logs
pm2 logs stores-stepperslife

# Check environment variables
grep SQUARE .env
```

---

## 📋 Quick Reference

### Sandbox (Current):
```
Application ID: sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg
Access Token:   EAAAI9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo
Location ID:    LZN634J2MSXRY
Environment:    https://connect.squareupsandbox.com
```

### Production (When Ready):
```
Application ID: sq0idp-XG8irNWHf98C62-iqOwH6Q
Access Token:   EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi
Location ID:    L0Q2YC1SPBGD8
Environment:    https://connect.squareup.com
```

---

## ✅ Checklist for Go-Live

### Pre-Production:
- [ ] Test all payment methods in sandbox
- [ ] Verify Cash App integration
- [ ] Test error handling
- [ ] Verify email notifications
- [ ] Complete end-to-end checkout flow
- [ ] Review transaction logs
- [ ] Test refund process

### Production Switch:
- [ ] Update all Square credentials to production
- [ ] Update webhook URLs in Square Dashboard
- [ ] Rebuild application: `npm run build`
- [ ] Restart: `pm2 restart stores-stepperslife`
- [ ] Test with small real transaction ($1-5)
- [ ] Verify order creation in database
- [ ] Check email delivery
- [ ] Monitor PM2 logs for errors

### Post-Launch:
- [ ] Monitor transaction success rates
- [ ] Track payment method usage (Card vs Cash App)
- [ ] Review Square Dashboard analytics
- [ ] Set up transaction alerts
- [ ] Schedule regular token rotation
- [ ] Review fraud detection settings

---

**Credentials Documented By:** Claude (BMAD Agent)
**Date:** October 10, 2025
**Status:** ✅ **COMPLETE REFERENCE GUIDE**

**⚠️ IMPORTANT:** Keep this file secure and never commit actual production credentials to version control!
