# Phase 2 Week 11 - Custom Domains Implementation Plan

**Project:** SteppersLife Stores - Multi-Tenant SaaS Platform
**Phase:** Custom Domain Support
**Duration:** Week 11 (5 days)
**Status:** 🔄 **PLANNING**

---

## 📋 Executive Summary

Implement custom domain support allowing tenants to use their own domains (e.g., `shop.nikestore.com` or `www.mystore.com`) instead of subdomains (`nike.stepperslife.com`). This enterprise feature enables full white-labeling and professional branding.

---

## 🎯 Week 11 Goals

### Primary Objectives:
1. **DNS Verification System**: Validate tenant ownership of custom domains
2. **SSL Certificate Automation**: Auto-provision Let's Encrypt certificates
3. **Domain Routing**: Route custom domains to correct tenant
4. **Nginx Configuration**: Dynamic virtual host management
5. **UI Integration**: Domain management in tenant dashboard

### Success Metrics:
- ✅ Tenants can add custom domains via dashboard
- ✅ Automatic DNS verification (CNAME or TXT record)
- ✅ SSL certificates auto-provision within 5 minutes
- ✅ Custom domains resolve to correct tenant
- ✅ Fallback to subdomain if domain fails
- ✅ Status monitoring and error messages

---

## 🗓️ Day-by-Day Breakdown

### Day 1: DNS Verification System
**Goal:** Implement DNS record validation

**Tasks:**
1. **Database Schema Updates**
   ```prisma
   model Tenant {
     // ... existing fields
     customDomain           String?              @unique
     customDomainVerified   Boolean              @default(false)
     customDomainStatus     DomainStatus         @default(PENDING)
     customDomainDnsRecord  String?              // Verification token
     sslCertificateStatus   SSLStatus            @default(PENDING)
     sslCertificateExpiry   DateTime?
     sslLastCheckedAt       DateTime?
   }

   enum DomainStatus {
     PENDING       // Awaiting DNS setup
     VERIFYING     // Checking DNS records
     VERIFIED      // DNS confirmed
     FAILED        // Verification failed
     ACTIVE        // Fully operational
     SUSPENDED     // Temporarily disabled
   }

   enum SSLStatus {
     PENDING       // Not requested yet
     REQUESTING    // Cert request in progress
     ACTIVE        // Certificate installed
     EXPIRED       // Needs renewal
     FAILED        // Request failed
   }
   ```

2. **DNS Verification API**
   - `POST /api/tenants/[id]/domain` - Add custom domain
   - `POST /api/tenants/[id]/domain/verify` - Trigger DNS check
   - `DELETE /api/tenants/[id]/domain` - Remove domain
   - `GET /api/tenants/[id]/domain/status` - Check verification status

3. **DNS Lookup Logic**
   ```typescript
   // Use Node.js dns module to check CNAME record
   import dns from 'dns/promises'

   async function verifyDomain(domain: string, expectedValue: string) {
     try {
       const records = await dns.resolveCname(domain)
       return records.includes(expectedValue)
     } catch (error) {
       return false
     }
   }

   // Alternative: TXT record verification
   async function verifyViaTxt(domain: string, token: string) {
     const records = await dns.resolveTxt(`_stepperslife.${domain}`)
     return records.flat().includes(token)
   }
   ```

4. **Verification Token Generation**
   - Generate unique token per tenant
   - Store in `customDomainDnsRecord`
   - Provide clear instructions to user

**Deliverables:**
- DNS verification APIs working
- Database schema updated
- Token generation system
- Documentation for users

---

### Day 2: SSL Certificate Automation
**Goal:** Auto-provision Let's Encrypt certificates

**Tasks:**
1. **Certbot Integration**
   ```bash
   # Install certbot
   apt-get install certbot python3-certbot-nginx

   # Generate certificate via Node.js
   import { exec } from 'child_process'

   async function provisionSSL(domain: string) {
     return new Promise((resolve, reject) => {
       exec(
         `certbot certonly --nginx -d ${domain} --non-interactive --agree-tos --email ssl@stepperslife.com`,
         (error, stdout, stderr) => {
           if (error) reject(error)
           else resolve(stdout)
         }
       )
     })
   }
   ```

2. **SSL Status API**
   - `POST /api/tenants/[id]/ssl/request` - Request certificate
   - `GET /api/tenants/[id]/ssl/status` - Check SSL status
   - `POST /api/tenants/[id]/ssl/renew` - Manual renewal

3. **Automatic Renewal Cron**
   ```bash
   # Cron job: Check expiring certificates daily
   0 2 * * * certbot renew --quiet && systemctl reload nginx
   ```

4. **Certificate Monitoring**
   - Check expiry dates daily
   - Auto-renew 30 days before expiration
   - Email alerts if renewal fails
   - Update `sslCertificateExpiry` in DB

**Deliverables:**
- Certbot working with API calls
- Auto-renewal cron configured
- SSL status tracking in DB
- Email alerts for failures

---

### Day 3: Nginx Dynamic Configuration
**Goal:** Route custom domains to correct tenant

**Tasks:**
1. **Nginx Template System**
   ```nginx
   # Template: /etc/nginx/sites-available/custom-domain.template
   server {
       listen 80;
       listen 443 ssl http2;
       server_name {{DOMAIN}};

       ssl_certificate /etc/letsencrypt/live/{{DOMAIN}}/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/{{DOMAIN}}/privkey.pem;

       location / {
           proxy_pass http://localhost:3008;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header X-Tenant-Domain {{DOMAIN}};
       }
   }
   ```

2. **Config Generation API**
   ```typescript
   import fs from 'fs/promises'
   import { exec } from 'child_process'

   async function createNginxConfig(domain: string) {
     const template = await fs.readFile('/etc/nginx/sites-available/custom-domain.template', 'utf-8')
     const config = template.replace(/{{DOMAIN}}/g, domain)

     await fs.writeFile(`/etc/nginx/sites-available/${domain}`, config)
     await fs.symlink(
       `/etc/nginx/sites-available/${domain}`,
       `/etc/nginx/sites-enabled/${domain}`
     )

     // Test config
     await execPromise('nginx -t')

     // Reload nginx
     await execPromise('systemctl reload nginx')
   }
   ```

3. **Middleware Enhancement**
   ```typescript
   // middleware.ts - Add custom domain detection
   export function middleware(request: NextRequest) {
     const hostname = request.headers.get('host') || ''

     // Check if custom domain
     if (!hostname.endsWith('.stepperslife.com')) {
       // Look up tenant by custom domain
       const tenant = await prisma.tenant.findUnique({
         where: { customDomain: hostname }
       })

       if (tenant) {
         return NextResponse.rewrite(request.url, {
           headers: {
             'x-tenant-id': tenant.id,
             'x-tenant-slug': tenant.slug,
             'x-is-custom-domain': 'true'
           }
         })
       }
     }

     // ... existing subdomain logic
   }
   ```

4. **Domain Cleanup on Removal**
   - Remove nginx config file
   - Remove SSL certificate
   - Update DNS status in DB

**Deliverables:**
- Nginx template system working
- Dynamic config generation
- Middleware recognizes custom domains
- Config cleanup on removal

---

### Day 4: UI Integration
**Goal:** Domain management in tenant dashboard

**Tasks:**
1. **Domain Settings Page**
   - `/tenant-dashboard/settings/domain`
   - Current domain display (subdomain or custom)
   - Add custom domain form
   - DNS setup instructions
   - Verification status display
   - SSL status indicator

2. **UI Components**
   ```tsx
   // DomainSettingsCard.tsx
   - Input for custom domain
   - Verify button (triggers DNS check)
   - Status badge (Pending/Verifying/Verified/Active)
   - DNS instructions (CNAME record details)
   - Copy buttons for DNS values
   - Remove domain button (with confirmation)
   ```

3. **DNS Setup Instructions**
   ```
   To use your custom domain:

   1. Add a CNAME record in your DNS provider:
      Type: CNAME
      Name: shop (or www)
      Value: {{tenant-slug}}.stepperslife.com
      TTL: 3600

   2. Click "Verify DNS" below

   3. SSL certificate will be automatically provisioned

   Note: DNS propagation can take 24-48 hours
   ```

4. **Status Monitoring UI**
   - Real-time status updates (polling)
   - Progress indicators
   - Error messages with solutions
   - Success confirmation

5. **Plan Restriction**
   - Custom domains only for PRO and ENTERPRISE plans
   - Show upgrade prompt for TRIAL/STARTER
   - Feature badge "PRO Feature"

**Deliverables:**
- Domain settings page live
- Clear DNS setup instructions
- Status monitoring UI
- Plan-based access control

---

### Day 5: Testing & Documentation
**Goal:** End-to-end testing and comprehensive docs

**Tasks:**
1. **E2E Testing Scenarios**
   - Add custom domain
   - Verify DNS (with actual test domain)
   - SSL provisioning
   - Domain routing
   - Remove domain
   - Error scenarios (invalid domain, DNS failure, SSL failure)

2. **Integration Tests**
   ```typescript
   describe('Custom Domains', () => {
     it('should add custom domain', async () => {
       // POST /api/tenants/[id]/domain
       // Assert status PENDING
     })

     it('should verify DNS', async () => {
       // Mock DNS lookup
       // POST /api/tenants/[id]/domain/verify
       // Assert status VERIFIED
     })

     it('should provision SSL', async () => {
       // POST /api/tenants/[id]/ssl/request
       // Assert certificate created
     })

     it('should route custom domain', async () => {
       // Request to custom-domain.com
       // Assert correct tenant data returned
     })
   })
   ```

3. **Documentation**
   - `CUSTOM-DOMAINS-SETUP.md` - Technical implementation guide
   - `CUSTOM-DOMAINS-USER-GUIDE.md` - End-user instructions
   - `CUSTOM-DOMAINS-TROUBLESHOOTING.md` - Common issues
   - API documentation for domain endpoints

4. **Monitoring & Alerting**
   - Daily SSL expiry checks
   - DNS verification failures
   - Nginx reload failures
   - Email alerts to tenant owners

5. **Production Checklist**
   - [ ] Certbot installed and configured
   - [ ] Nginx template created
   - [ ] Cron jobs set up
   - [ ] Email alerts configured
   - [ ] All APIs tested
   - [ ] UI tested on mobile
   - [ ] Documentation complete

**Deliverables:**
- All tests passing
- Comprehensive documentation
- Monitoring system active
- Production-ready

---

## 🔧 Technical Architecture

### DNS Verification Flow
```
1. User adds domain: shop.mystore.com
2. System generates token: stepperslife-verify-abc123
3. User adds CNAME: shop.mystore.com → nike.stepperslife.com
4. System checks DNS every 5 minutes (background job)
5. Once verified, trigger SSL provisioning
6. Generate nginx config
7. Domain goes ACTIVE
```

### SSL Provisioning Flow
```
1. DNS verified
2. Call certbot API: certbot certonly --nginx -d shop.mystore.com
3. Certbot performs HTTP-01 challenge
4. Certificate saved to /etc/letsencrypt/live/shop.mystore.com/
5. Update nginx config with cert paths
6. Reload nginx
7. Update DB: sslCertificateStatus = ACTIVE, sslCertificateExpiry = Date
```

### Request Routing Flow
```
User Request: https://shop.mystore.com
    ↓
Nginx (port 443)
    ↓
Check server_name (shop.mystore.com)
    ↓
Proxy to localhost:3008
    ↓
Middleware: Detect custom domain (not *.stepperslife.com)
    ↓
Query DB: tenant WHERE customDomain = 'shop.mystore.com'
    ↓
Inject headers: x-tenant-id, x-tenant-slug
    ↓
Page renders with tenant context
```

---

## 📁 Files to Create/Modify

### New Files (15)

**API Routes (4):**
1. `app/api/tenants/[id]/domain/route.ts` - Add/remove domain
2. `app/api/tenants/[id]/domain/verify/route.ts` - DNS verification
3. `app/api/tenants/[id]/ssl/request/route.ts` - SSL provisioning
4. `app/api/tenants/[id]/ssl/status/route.ts` - SSL status check

**Background Jobs (2):**
5. `app/api/cron/verify-domains/route.ts` - Check pending verifications
6. `app/api/cron/check-ssl-expiry/route.ts` - Monitor certificates

**UI Pages (3):**
7. `app/(tenant)/tenant-dashboard/settings/domain/page.tsx` - Domain management
8. `app/(tenant)/tenant-dashboard/settings/domain/DomainSetupInstructions.tsx` - DNS guide
9. `app/(tenant)/tenant-dashboard/settings/domain/DomainStatusCard.tsx` - Status display

**Utilities (3):**
10. `lib/dns.ts` - DNS verification helpers
11. `lib/ssl.ts` - SSL certificate management
12. `lib/nginx.ts` - Nginx config generation

**Documentation (3):**
13. `docs/CUSTOM-DOMAINS-SETUP.md` - Implementation guide
14. `docs/CUSTOM-DOMAINS-USER-GUIDE.md` - User instructions
15. `docs/CUSTOM-DOMAINS-TROUBLESHOOTING.md` - Problem solving

### Modified Files (3)

1. `prisma/schema.prisma` - Add domain/SSL fields
2. `middleware.ts` - Add custom domain detection
3. `lib/tenant.ts` - Helper functions for custom domains

---

## 🔐 Security Considerations

### DNS Verification
- ✅ Prevent domain hijacking with unique tokens
- ✅ Rate limit verification attempts (5/hour per tenant)
- ✅ Validate domain format (no localhost, internal IPs)
- ✅ Check domain not already claimed by another tenant

### SSL Certificates
- ✅ Store certificates securely in /etc/letsencrypt
- ✅ Restrict nginx config file permissions (600)
- ✅ Use strong SSL ciphers (TLS 1.2+)
- ✅ Enable HSTS header

### Nginx Configuration
- ✅ Sanitize domain names before config generation
- ✅ Test config before reload (nginx -t)
- ✅ Rollback on config errors
- ✅ Log all config changes

---

## 💰 Business Impact

### Revenue Opportunity
- **Custom Domains** = Premium Feature
- Only available on PRO ($79/mo) and ENTERPRISE ($299/mo)
- Estimated conversion: 30% of STARTER users upgrade for this feature
- Additional MRR: ~$150/month per upgraded tenant

### Competitive Advantage
- Professional branding (shop.nike.com vs nike.stepperslife.com)
- White-label experience
- SEO benefits (own domain authority)
- Enterprise appeal

---

## 📊 Success Metrics

### Technical Metrics
- DNS verification success rate: >95%
- SSL provisioning time: <5 minutes
- Certificate renewal success: >99%
- Domain uptime: 99.9%

### User Metrics
- Custom domain adoption: >40% of PRO+ tenants
- Setup completion rate: >80%
- Support tickets: <5% of custom domain users

---

## 🚨 Risk Mitigation

### Risk 1: DNS Propagation Delays
**Mitigation:**
- Clear user communication about 24-48hr wait
- Background job retries (check every 5 min for 48hrs)
- Email notification when verified

### Risk 2: SSL Provisioning Failures
**Mitigation:**
- Retry logic (3 attempts with exponential backoff)
- Fallback to HTTP with redirect to HTTPS when ready
- Manual intervention option in admin panel

### Risk 3: Nginx Config Errors
**Mitigation:**
- Test config before applying (nginx -t)
- Backup previous config before changes
- Automatic rollback on errors
- Alert sysadmin on repeated failures

### Risk 4: Certificate Expiry
**Mitigation:**
- Daily expiry checks
- Auto-renewal 30 days before expiry
- Email alerts to tenant + platform admin
- Grace period (7 days) with warning banner

---

## 🧪 Testing Plan

### Unit Tests
- DNS lookup functions
- Token generation
- Domain validation
- Config generation

### Integration Tests
- API endpoints (add, verify, remove domain)
- Nginx config creation
- SSL provisioning flow
- Middleware routing

### E2E Tests
- Full domain setup flow
- DNS verification process
- SSL certificate issuance
- Custom domain access
- Domain removal

### Manual Testing
- Use actual test domain (test.stepperslife.com)
- Verify all DNS providers (Cloudflare, GoDaddy, Namecheap)
- Test mobile UI
- Test error scenarios

---

## 📝 User Documentation Outline

### For Tenants:

**1. Adding Your Custom Domain**
- Step-by-step guide
- Screenshots
- DNS provider examples
- Verification process

**2. Troubleshooting**
- DNS not verifying
- SSL certificate issues
- Domain not resolving
- Email support contact

**3. Best Practices**
- Using www vs root domain
- DNS TTL recommendations
- SSL certificate management

### For Admins:

**1. System Architecture**
- DNS verification flow
- SSL automation
- Nginx configuration

**2. Maintenance**
- Certificate renewal
- Config backups
- Monitoring dashboards

**3. Support Procedures**
- Common issues
- Manual overrides
- Escalation process

---

## 🎯 Week 11 Deliverables Checklist

### Day 1: DNS Verification ✅
- [ ] Database schema updated
- [ ] DNS verification APIs created
- [ ] Token generation system
- [ ] DNS lookup logic implemented
- [ ] API endpoints tested

### Day 2: SSL Automation ✅
- [ ] Certbot integration working
- [ ] SSL request API created
- [ ] Auto-renewal cron configured
- [ ] Monitoring system active
- [ ] Email alerts set up

### Day 3: Nginx Configuration ✅
- [ ] Template system created
- [ ] Dynamic config generation
- [ ] Middleware enhanced
- [ ] Domain routing tested
- [ ] Cleanup on removal

### Day 4: UI Integration ✅
- [ ] Domain settings page created
- [ ] DNS instructions clear
- [ ] Status monitoring UI
- [ ] Plan restrictions enforced
- [ ] Mobile responsive

### Day 5: Testing & Docs ✅
- [ ] All unit tests passing
- [ ] Integration tests complete
- [ ] E2E test with real domain
- [ ] User documentation written
- [ ] Admin guide complete
- [ ] Production checklist verified

---

## 🚀 Post-Week 11 Status

Upon completion:
- ✅ Tenants can use custom domains
- ✅ Automatic DNS verification
- ✅ SSL certificates auto-provisioned
- ✅ Professional branding enabled
- ✅ Premium feature revenue stream
- ✅ Enterprise-ready platform

**Next:** Week 12 - Launch Preparation (testing, marketing, go-live)

---

**Status:** 🔄 **READY TO BEGIN**
**Estimated Effort:** 5 days
**Complexity:** High (involves DNS, SSL, Nginx)
**Business Value:** Very High (Premium feature, competitive advantage)
