# 🔐 PHASE 6: SECURITY HARDENING - ENTERPRISE-GRADE

**Priority**: 🟠 HIGH  
**Timeline**: Month 1 (4-6 weeks, parallel to Phase 5)  
**Effort**: 60 hours  
**Impact**: Enterprise compliance, new customer segments  

---

## 🎯 Security Implementation Path

### MFA Implementation (Weeks 1-2) ⏱️ 20 hours

#### Step 1: Add MFA to User Model

```prisma
// apps/api/prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  
  // MFA fields (new)
  mfaEnabled    Boolean  @default(false)
  mfaMethod     String?  @default("totp") // totp, sms, webauthn
  mfaSecret     String?  // TOTP secret (encrypted)
  backupCodes   String[] // Encrypted backup codes
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Step 2: Create MFA Service

```javascript
// apps/api/src/services/mfaService.js

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class MFAService {
  // Generate TOTP secret
  async generateTOTPSecret(email) {
    const secret = speakeasy.generateSecret({
      name: `Infamous Freight (${email})`,
      issuer: 'Infamous Freight',
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: await QRCode.toDataURL(secret.otpauth_url)
    };
  }

  // Verify TOTP token
  verifyTOTP(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 windows (±30 seconds)
    });
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    return Array(count).fill(0).map(() => {
      return crypto.randomBytes(4).toString('hex').toUpperCase();
    });
  }

  // Verify backup code (one-time use)
  async verifyBackupCode(userId, code) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.backupCodes.includes(code)) {
      return false;
    }

    // Remove code (one-time use)
    const updated = user.backupCodes.filter(c => c !== code);
    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updated }
    });

    return true;
  }

  // Enable MFA for user
  async enableMFA(userId, method = 'totp') {
    if (method === 'totp') {
      const { secret, qrCode } = await this.generateTOTPSecret(userId);
      const backupCodes = this.generateBackupCodes();

      return {
        secret,
        qrCode,
        backupCodes
      };
    }
  }

  // Confirm MFA (after user scans QR and verifies)
  async confirmMFA(userId, totp, backupCodes) {
    // Verify first token
    const secret = // Temporary secret from session
    if (!this.verifyTOTP(secret, totp)) {
      throw new Error('Invalid TOTP code');
    }

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: 'totp',
        mfaSecret: this.encryptSecret(secret),
        backupCodes: backupCodes.map(c => this.hashBackupCode(c))
      }
    });

    return { success: true };
  }

  // Disable MFA
  async disableMFA(userId, password) {
    // Require password confirmation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) throw new Error('Invalid password');

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
        mfaSecret: null,
        backupCodes: []
      }
    });
  }

  // Private helpers
  encryptSecret(secret) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decryptSecret(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

module.exports = new MFAService();
```

#### Step 3: MFA Middleware

```javascript
// apps/api/src/middleware/mfaMiddleware.js

const mfaService = require('../services/mfaService');

// Check MFA requirement
async function requireMFA(req, res, next) {
  const user = req.user;
  
  if (!user.mfaEnabled) {
    // MFA not enabled but required for this endpoint
    return res.status(403).json({ 
      error: 'MFA required',
      code: 'MFA_REQUIRED'
    });
  }

  // Check if MFA already verified in this session
  if (req.session.mfaVerified) {
    return next();
  }

  // Require MFA verification
  res.status(403).json({
    error: 'MFA verification required',
    code: 'MFA_VERIFICATION_REQUIRED'
  });
}

// MFA verification endpoint
router.post('/api/auth/verify-mfa', async (req, res, next) => {
  try {
    const { token, backupCode } = req.body;
    const user = req.user;

    let valid = false;

    if (token) {
      const secret = mfaService.decryptSecret(user.mfaSecret);
      valid = mfaService.verifyTOTP(secret, token);
    } else if (backupCode) {
      valid = await mfaService.verifyBackupCode(user.id, backupCode);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid MFA' });
    }

    // Mark MFA verified for this session
    req.session.mfaVerified = true;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = { requireMFA };
```

---

### SSO Integration (Weeks 3-4) ⏱️ 25 hours

#### OAuth2 with Google

```javascript
// apps/api/src/services/ssoService.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value }
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
              ssoProvider: 'google',
              ssoId: profile.id,
              password: crypto.randomBytes(16).toString('hex') // Random password
            }
          });

          logger.info('New user created via Google SSO', { email: user.email });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// OAuth routes
router.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { sub: req.user.id, email: req.user.email },
      process.env.JWT_SECRET
    );

    res.redirect(`/dashboard?token=${token}`);
  }
);
```

---

### Advanced Security (Weeks 4-6) ⏱️ 15 hours

```javascript
// apps/api/src/middleware/advancedSecurity.js

// 1. Rate limit by user (prevent brute force)
const userRateLimiter = rateLimit({
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !req.user, // Only limit authenticated
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per 15 minutes per user
});

// 2. API key rotation
async function rotateAPIKeys() {
  const users = await prisma.user.findMany({
    where: {
      lastKeyRotation: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // > 30 days
      }
    }
  });

  for (const user of users) {
    const newKey = crypto.randomBytes(32).toString('hex');
    await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: hash(newKey),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Notify user
    await emailService.send({
      to: user.email,
      subject: 'API Key Rotated',
      template: 'api-key-rotated'
    });
  }
}

// Schedule rotation
schedule.scheduleJob('0 0 * * *', rotateAPIKeys);

// 3. Security headers audit
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

app.use((req, res, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

---

## ✅ SECURITY CHECKLIST

### MFA (TOTP)
- [ ] TOTP implementation complete
- [ ] QR code generation working
- [ ] Backup codes generated
- [ ] MFA verified in 2 environments
- [ ] Recovery procedure documented

### SSO (OAuth2)
- [ ] Google OAuth configured
- [ ] Microsoft OAuth configured (optional)
- [ ] GitHub OAuth configured (optional)
- [ ] User linking tested
- [ ] Fallback to email/password working

### API Security
- [ ] API key rotation automated
- [ ] Rate limiting by user working
- [ ] HTTPS enforced everywhere
- [ ] Security headers in place
- [ ] CORS properly configured

### Data Protection
- [ ] Secrets encrypted in database
- [ ] PII field encryption enabled
- [ ] Backup codes encrypted
- [ ] Audit logging for security events

---

## 🎯 SUCCESS METRICS

**Phase 6 Complete When:**
```
✅ MFA enabled for 80%+ of users
✅ SSO used by enterprise customers
✅ Zero successful unauthorized access attempts
✅ Security audit passed
✅ All compliance requirements met
✅ Ready for Phase 7
```

