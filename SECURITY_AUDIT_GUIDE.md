# 🔒 SECURITY AUDIT & HARDENING GUIDE (100%)

**Status**: Ready for implementation  
**Time to Complete**: 2-4 hours  
**Impact**: Achieves SOC 2 readiness + compliance baseline  

---

## 🎯 SECURITY LAYERS

```
┌─────────────────────────────────────────────────┐
│ 1. Application Security (OWASP Top 10)          │
├─────────────────────────────────────────────────┤
│ 2. Infrastructure Security (Network/OS)         │
├─────────────────────────────────────────────────┤
│ 3. Data Security (Encryption/Privacy)           │
├─────────────────────────────────────────────────┤
│ 4. Compliance (SOC 2, GDPR, HIPAA)             │
├─────────────────────────────────────────────────┤
│ 5. Monitoring & Incident Response               │
└─────────────────────────────────────────────────┘
```

---

## 1️⃣ APPLICATION SECURITY

### OWASP Top 10 Checklist

#### A01: Broken Access Control
- [ ] JWT token validation on all protected routes
- [ ] Role-based access control (RBAC) enforced
- [ ] Scope validation: `requireScope()` middleware active
- [ ] No direct object references (use IDs, not sequential numbers)

**Test:**
```bash
# Try accessing other user's data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com/api/users/999

# Should return 403 Forbidden, not 200
```

#### A02: Cryptographic Failures
- [x] HTTPS enforced (TLS 1.2+)
- [x] Passwords hashed (bcrypt with salt)
- [ ] Sensitive data encrypted at rest
- [ ] API keys not logged or exposed
- [ ] No hardcoded secrets in code

**Check:**
```bash
# Verify HTTPS only
curl -I https://infamous-freight.fly.dev
# Should show "Strict-Transport-Security: max-age=..."

# Check for secrets in code
git grep -i "password\|secret\|key\|token" -- ':!.env*' | grep -v node_modules
# Should return ZERO results
```

#### A03: Injection (SQL, NoSQL, Command)
- [x] Prisma ORM used (prevents SQL injection)
- [x] Input validation with `express-validator`
- [ ] No dynamic SQL queries
- [ ] Parameterized queries only

**Check:**
```bash
# Verify ORM usage
grep -r "SELECT" apps/api/src --include="*.js" | grep -v "prisma"
# Should return ZERO results (all queries via Prisma)
```

#### A04: Insecure Design
- [x] Rate limiting implemented
- [x] Security headers configured
- [ ] Principle of least privilege enforced
- [ ] Input sanitization with xss library

**Test:**
```bash
# Check security headers
curl -I https://infamous-freight.fly.dev/api/health

# Should show:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

#### A05: Broken Authentication
- [x] JWT properly validated
- [x] Password strength requirements
- [ ] Session timeout implemented (30 min inactivity)
- [ ] Multi-factor authentication optional

**Check:**
```bash
# Verify JWT validation
# Try with expired or invalid token
curl -H "Authorization: Bearer invalid.token.here" \
  https://api.example.com/api/health
# Should return 401 Unauthorized
```

#### A06: Sensitive Data Exposure
- [x] HTTPS/TLS enforced
- [x] PII encryption enabled
- [ ] Data minimization (collect only needed data)
- [ ] Retention policy documented

#### A07: XML External Entity (XXE)
- [x] XML parsing disabled in default
- [ ] If XML needed: Use secure parser

#### A08: Software & Data Integrity Failures
- [x] Dependencies from npm only (no arbitrary scripts)
- [x] Lock file committed (`pnpm-lock.yaml`)
- [ ] Dependency audit run regularly

**Run:**
```bash
npm audit
pnpm audit
# Fix: pnpm audit --fix
```

#### A09: Logging & Monitoring Failures
- [x] Error tracking (Sentry)
- [x] Structured logging (Winston/Pino)
- [ ] Audit logs for sensitive operations
- [ ] Log retention policy (30+ days)

#### A10: Server-Side Request Forgery (SSRF)
- [x] External API calls whitelisted
- [ ] No user-controlled URLs in backend calls

---

## 2️⃣ INFRASTRUCTURE SECURITY

### Network Security

- [x] HTTPS enforced (auto via Vercel/Fly.io)
- [x] TLS 1.2 minimum
- [ ] DDoS protection (Cloudflare optional)
- [ ] WAF rules (if using Cloudflare)

**Setup Cloudflare (Optional):**
```
1. Go to cloudflare.com
2. Add domain
3. Point nameservers
4. Enable:
   - DDoS Protection: ON
   - WAF rules: ON (managed)
   - Rate limiting: 100 req/sec
```

### Container Security

- [x] Non-root user (nodejs:1001)
- [x] Alpine Linux (minimal attack surface)
- [x] Multi-stage build (runtime only)
- [ ] Image scanning enabled
- [ ] No hardcoded credentials

**Check Dockerfile:**
```dockerfile
# Verify non-root user
USER nodejs
# Verify Alpine
FROM node:24-alpine
# Verify multi-stage
FROM ... AS runner
```

### Database Security

- [ ] SSL connection required
- [ ] Principle of least privilege (read-only role for API)
- [ ] IP whitelisting if possible
- [ ] Regular backups with testing
- [ ] Point-in-time recovery enabled

**Set up in Prisma:**
```env
# Connection with SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

---

## 3️⃣ DATA SECURITY

### Encryption

```
┌──────────────────────────────────────────┐
│ Data in Transit (HTTPS/TLS)   ✅ ENABLED │
├──────────────────────────────────────────┤
│ Data at Rest (Encryption)     🎯 TODO    │
├──────────────────────────────────────────┤
│ Database Encryption           🎯 TODO    │
├──────────────────────────────────────────┤
│ Key Management (Secrets)      ✅ ENABLED │
└──────────────────────────────────────────┘
```

### Implementation

**Sensitive Fields to Encrypt:**
- [ ] Social Security Numbers
- [ ] Bank Account Numbers
- [ ] Driver's License Numbers
- [ ] Phone Numbers (PII)

**Example Using crypto:**
```javascript
const crypto = require('crypto');

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text, key) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(Buffer.from(parts.join(':'), 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
```

### Privacy & GDPR

```
GDPR Requirements (if serving EU users):
├─ [ ] Privacy policy updated
├─ [ ] Cookie consent banner
├─ [ ] Data processing agreement (DPA)
├─ [ ] Right to access implemented
├─ [ ] Right to deletion implemented
├─ [ ] Data breach notification plan
└─ [ ] Data retention policy documented
```

---

## 4️⃣ AUTHENTICATION & AUTHORIZATION

### JWT Security

```bash
# Verify JWT implementation
# 1. Check issuer: Does JWT_SECRET match?
# 2. Check expiration: Tokens < 24 hours
# 3. Check claims: Contains user_id, roles
# 4. Check refresh: Refresh tokens for long sessions
```

### Password Security

- [x] Bcrypt with salt rounds ≥ 10
- [ ] Password strength requirements (12+ chars, mixed case, numbers)
- [ ] Password history (no reuse of last 3)
- [ ] Password reset via email link (1 hour expiry)

**Implement:**
```javascript
// Password validation
const validatePassword = (pwd) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(pwd);
  // Requires: lowercase, uppercase, digit, 12+ chars
};

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Session / Token Management

- [ ] JWT expires after 24 hours
- [ ] Refresh token expires after 30 days
- [ ] Logout invalidates tokens (optional: token blacklist)
- [ ] Concurrent session limit (prevent multi-login)

---

## 5️⃣ COMPLIANCE FRAMEWORKS

### SOC 2 Type II Readiness

**Control Areas:**
1. Security
   - [ ] Access controls documented
   - [ ] Incident response plan
   - [ ] Security awareness training

2. Availability
   - [ ] 99.9% SLA target
   - [ ] Backup & recovery tested
   - [ ] Redundancy planned

3. Processing Integrity
   - [ ] Input validation
   - [ ] Audit logging
   - [ ] Error handling

4. Confidentiality
   - [ ] Encryption implemented
   - [ ] Access restricted
   - [ ] Data classification

5. Privacy
   - [ ] Privacy policy
   - [ ] Consent obtained
   - [ ] Data retention limits

**Getting Certified:**
```
1. Document all controls (this guide)
2. Evidence collection (screenshots, logs)
3. 6-month audit period
4. Auditor assessment
5. SOC 2 report issued

Cost: $5K-$15K
Timeline: 6-12 months
```

### GDPR Compliance (EU Users)

```
Required Actions:
├─ [ ] Privacy policy published
├─ [ ] Terms of service updated
├─ [ ] Cookie consent banner
├─ [ ] Data Processing Agreement (DPA) with vendors
├─ [ ] Data Protection Impact Assessment (DPIA)
├─ [ ] Demonstrate consent (for marketing)
├─ [ ] Data breach notification template (72h)
└─ [ ] Data subject access request (DSAR) process

Fines for violation:
├─ Minor: €10,000,000 or 2% revenue
└─ Severe: €20,000,000 or 4% revenue
```

### HIPAA Compliance (Healthcare)

```
If handling health data:
├─ [ ] Business Associate Agreement (BAA)
├─ [ ] Encryption (medical records)
├─ [ ] Access controls (role-based)
├─ [ ] Audit logging (all access)
├─ [ ] Breach notification (60 days)
└─ [ ] Security training (annual)
```

---

## 🔐 SECURITY CHECKLIST (DO NOW)

### Code Level
- [ ] No hardcoded secrets in code
- [ ] All dependencies up to date (`npm audit`)
- [ ] Input validation on all endpoints
- [ ] Output encoding (prevent XSS)
- [ ] CSRF tokens enabled (if forms)
- [ ] Rate limiting active

### Infrastructure Level
- [ ] HTTPS enforced (automatic redirects)
- [ ] Security headers configured
- [ ] CORS configured properly
- [ ] Database SSL required
- [ ] Backups automated & tested
- [ ] Firewall rules in place

### Access Level
- [ ] All users have unique credentials
- [ ] Privileged accounts limited
- [ ] Audit logging enabled
- [ ] API keys rotated regularly
- [ ] Database credentials in secrets (not code)

### Monitoring
- [ ] Error tracking active (Sentry)
- [ ] Suspicious activity logged
- [ ] Failed login attempts monitored
- [ ] API rate limiting monitored

---

## 📋 SECURITY INCIDENT RESPONSE

### If Breach Occurs

1. **Immediate (< 1 hour)**
   - [ ] Isolate affected systems
   - [ ] Collect evidence
   - [ ] Notify security team

2. **Short-term (< 24 hours)**
   - [ ] Investigation complete
   - [ ] Impact assessment
   - [ ] Fix deployed
   - [ ] Customers notified (if required)

3. **Long-term (1-7 days)**
   - [ ] Post-incident review
   - [ ] Process improvements
   - [ ] Compliance notifications
   - [ ] Public communication

### Legal/Compliance Notifications
```
GDPR: Notify within 72 hours
HIPAA: Notify within 60 days
California: Notify within 15 days
```

---

## ✅ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| Code audit | 1 hr | Dev |
| Secrets scan | 30 min | Dev |
| Security headers verify | 30 min | DevOps |
| Database security | 1 hr | DevOps |
| Compliance docs | 2 hrs | Legal |
| Team training | 1 hr | Security |
| **Total** | **6 hrs** | |

---

## 🎯 SECURITY SCORECARD

Rate yourself:

```
Application Security:      ☐ Not Started  ☐ In Progress  ☐ Complete
Infrastructure Security:   ☐ Not Started  ☐ In Progress  ☐ Complete
Data Security:            ☐ Not Started  ☐ In Progress  ☐ Complete
Authentication/Authz:     ☐ Not Started  ☐ In Progress  ☐ Complete
Compliance:               ☐ Not Started  ☐ In Progress  ☐ Complete
Monitoring/Response:      ☐ Not Started  ☐ In Progress  ☐ Complete

Overall Security Score: ___/6 Complete

Target: 5/6 for launch
```

---

**Document Version**: 1.0.0  
**Status**: Ready for implementation  
**Next Review**: Monthly security audit
