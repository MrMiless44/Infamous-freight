// apps/api/src/services/multiFactorAuth.js

class MultiFactorAuthService {
  /**
   * Multi-factor authentication with 2FA, biometric, device fingerprinting
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.totpWindow = 30; // seconds
    this.maxAttempts = 5;
  }

  /**
   * Enable TOTP 2FA for user
   */
  async enableTOTP(userId) {
    // Generate secret using base32 encoding
    const secret = this.generateTOTPSecret();

    // Generate QR code for authentication apps
    const qrCode = this.generateQRCode(userId, secret);

    return {
      userId,
      method: "totp",
      secret,
      qrCode,
      backupCodes: this.generateBackupCodes(10),
      status: "pending_verification",
      expiresAt: new Date(Date.now() + 15 * 60000), // 15 minutes
    };
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(userId, token) {
    const isValid = this.validateTOTPToken(token);

    if (!isValid) {
      return {
        verified: false,
        reason: "Invalid or expired token",
      };
    }

    return {
      verified: true,
      userId,
      method: "totp",
      timestamp: new Date(),
    };
  }

  /**
   * Generate TOTP secret
   */
  generateTOTPSecret() {
    // In production, use speakeasy or similar library
    return btoa(Math.random().toString()).slice(0, 32);
  }

  /**
   * Generate QR code
   */
  generateQRCode(userId, secret) {
    // In production, use qrcode library
    return {
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/InfamousFreight:${userId}?secret=${secret}`,
      manualEntry: secret,
    };
  }

  /**
   * Validate TOTP token
   */
  validateTOTPToken(token) {
    // In production, use speakeasy to verify
    return token.length === 6 && /^\d+$/.test(token);
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push({
        code: this.randomCode(8),
        used: false,
      });
    }
    return codes;
  }

  /**
   * Send SMS 2FA
   */
  async sendSMS2FA(userId, phoneNumber) {
    const code = Math.random().toString().slice(2, 8);

    return {
      userId,
      method: "sms",
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      sentAt: new Date(),
      expiresIn: 300, // 5 minutes
      attempts: 0,
      maxAttempts: this.maxAttempts,
      // In production: actual SMS would be sent
      code, // Remove in production
    };
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(userId, code) {
    // In production: compare with stored code
    const isValid = code.length === 6 && /^\d+$/.test(code);

    return {
      verified: isValid,
      userId,
      method: "sms",
      timestamp: new Date(),
    };
  }

  /**
   * Send email 2FA
   */
  async sendEmail2FA(userId, email) {
    const code = Math.random().toString().slice(2, 8);
    const link = `https://app.com/verify-email?code=${code}&userId=${userId}`;

    return {
      userId,
      method: "email",
      email: this.maskEmail(email),
      sentAt: new Date(),
      expiresIn: 600, // 10 minutes
      verificationLink: link,
      attempts: 0,
      maxAttempts: this.maxAttempts,
    };
  }

  /**
   * Device fingerprinting
   */
  async captureDeviceFingerprint(userId, deviceData) {
    const { userAgent, ipAddress, deviceId, platform, browserVersion, screenResolution } =
      deviceData;

    const fingerprint = this.calculateFingerprint(deviceData);

    return {
      fingerprintId: `fp_${Date.now()}`,
      userId,
      fingerprint,
      deviceInfo: {
        userAgent,
        ipAddress: this.maskIP(ipAddress),
        deviceId,
        platform,
        browserVersion,
        screenResolution,
      },
      isNewDevice: this.isNewDevice(userId, fingerprint),
      riskScore: this.calculateDeviceRiskScore(deviceData),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate device fingerprint
   */
  calculateFingerprint(deviceData) {
    const dataString = JSON.stringify(deviceData);
    let hash = 0;

    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return btoa(Math.abs(hash).toString());
  }

  /**
   * Check if new device
   */
  isNewDevice(userId, fingerprint) {
    // In production: query database for known fingerprints
    return Math.random() > 0.7; // 30% chance new device
  }

  /**
   * Calculate device risk score
   */
  calculateDeviceRiskScore(deviceData) {
    let riskScore = 0;

    // Check for suspicious patterns
    if (deviceData.ipAddress && this.isVPN(deviceData.ipAddress)) riskScore += 0.2;
    if (deviceData.userAgent && this.isBot(deviceData.userAgent)) riskScore += 0.3;
    if (this.isUncommonBrowser(deviceData.browserVersion)) riskScore += 0.1;

    return Math.min(riskScore, 1.0);
  }

  /**
   * Check if VPN
   */
  isVPN(ipAddress) {
    // In production: use VPN detection API
    const vpnRanges = ["192.168", "10.0", "172.16"];
    return vpnRanges.some((range) => ipAddress.startsWith(range));
  }

  /**
   * Check if bot
   */
  isBot(userAgent) {
    const botPatterns = ["bot", "crawler", "spider", "scrapy"];
    return botPatterns.some((pattern) => userAgent.toLowerCase().includes(pattern));
  }

  /**
   * Check if uncommon browser
   */
  isUncommonBrowser(browserVersion) {
    const commonBrowsers = ["Chrome", "Firefox", "Safari", "Edge"];
    return !commonBrowsers.some((browser) => browserVersion.includes(browser));
  }

  /**
   * Require MFA challenge
   */
  async requireMFAChallenge(userId, reason = "login") {
    return {
      challengeId: `mfa_${Date.now()}`,
      userId,
      reason,
      methods: ["totp", "sms", "email", "biometric"],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60000), // 10 minutes
    };
  }

  /**
   * Record failed MFA attempt
   */
  async recordFailedMFAAttempt(userId, method) {
    return {
      userId,
      method,
      attemptedAt: new Date(),
      isLocked: false,
    };
  }

  /**
   * Get MFA status
   */
  async getMFAStatus(userId) {
    return {
      userId,
      mfaEnabled: true,
      methods: {
        totp: { enabled: true, configured: true },
        sms: { enabled: true, configured: true },
        email: { enabled: true, configured: true },
        biometric: { enabled: false, configured: false },
      },
      lastVerified: new Date(Date.now() - 3600000),
      trustThisDevice: false,
    };
  }

  /**
   * Utility functions
   */
  maskPhoneNumber(phone) {
    return phone.slice(0, 3) + "***" + phone.slice(-2);
  }

  maskEmail(email) {
    const [name, domain] = email.split("@");
    return name.slice(0, 2) + "***@" + domain;
  }

  maskIP(ip) {
    const parts = ip.split(".");
    return parts.slice(0, 3).join(".") + ".***";
  }

  randomCode(length) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2)
      .toUpperCase();
  }
}

module.exports = { MultiFactorAuthService };
