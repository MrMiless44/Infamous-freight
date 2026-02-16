/**
 * Data Encryption at Rest - Phase 7
 * Encrypts sensitive database fields using AES-256-GCM
 * Transparent encryption/decryption for encrypted fields
 */

const crypto = require("crypto");
const { logger } = require("../middleware/logger");

/**
 * Encryption configuration
 */
const EncryptionConfig = {
  algorithm: "aes-256-gcm",
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 16,
  iterations: 100000,
};

/**
 * Encryption service
 */
class EncryptionService {
  constructor(masterKey) {
    if (!masterKey) {
      throw new Error("Master key required for encryption service");
    }
    this.masterKey = Buffer.from(masterKey, "hex");
    if (this.masterKey.length !== EncryptionConfig.keyLength) {
      throw new Error(`Master key must be ${EncryptionConfig.keyLength} bytes`);
    }
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext) {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(EncryptionConfig.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(EncryptionConfig.algorithm, this.masterKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine: iv + authTag + encrypted
      const result = iv.toString("hex") + authTag.toString("hex") + encrypted;

      return result;
    } catch (error) {
      logger.error("Encryption failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    try {
      // Extract components
      const iv = Buffer.from(encryptedData.slice(0, 32), "hex");
      const authTag = Buffer.from(encryptedData.slice(32, 64), "hex");
      const encrypted = encryptedData.slice(64);

      // Create decipher
      const decipher = crypto.createDecipheriv(EncryptionConfig.algorithm, this.masterKey, iv);

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("Decryption failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Get encrypted field prefix (to identify encrypted fields in DB)
   */
  static getPrefix() {
    return "enc_";
  }

  /**
   * Check if field is encrypted
   */
  static isEncrypted(value) {
    return typeof value === "string" && value.startsWith(this.getPrefix());
  }
}

/**
 * Database encryption proxy
 * Automatically encrypts/decrypts specified fields
 */
class DatabaseEncryptionProxy {
  constructor(encryptionService, encryptedFields) {
    this.encryptionService = encryptionService;
    // encryptedFields = { User: ['email', 'phone'], Payment: ['cardLastFour'] }
    this.encryptedFields = encryptedFields || {};
  }

  /**
   * Encrypt record before storing
   */
  encryptRecord(model, data) {
    const fields = this.encryptedFields[model] || [];
    const encrypted = { ...data };

    for (const field of fields) {
      if (encrypted[field]) {
        const encrypted_value = this.encryptionService.encrypt(String(encrypted[field]));
        encrypted[field] = EncryptionService.getPrefix() + encrypted_value;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt record after retrieving
   */
  decryptRecord(model, data) {
    if (!data) return data;

    const fields = this.encryptedFields[model] || [];
    const decrypted = { ...data };

    for (const field of fields) {
      if (decrypted[field] && EncryptionService.isEncrypted(decrypted[field])) {
        const encryptedValue = decrypted[field].slice(EncryptionService.getPrefix().length);
        decrypted[field] = this.encryptionService.decrypt(encryptedValue);
      }
    }

    return decrypted;
  }

  /**
   * Decrypt multiple records
   */
  decryptRecords(model, records) {
    return records.map((record) => this.decryptRecord(model, record));
  }
}

/**
 * Generate master key
 */
function generateMasterKey() {
  return crypto.randomBytes(EncryptionConfig.keyLength).toString("hex");
}

/**
 * Derive secure key from password
 */
function deriveKeyFromPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(EncryptionConfig.saltLength);
  }

  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    EncryptionConfig.iterations,
    EncryptionConfig.keyLength,
    "sha256",
  );

  return {
    key: derivedKey.toString("hex"),
    salt: salt.toString("hex"),
  };
}

/**
 * Fields to encrypt by model
 */
const EncryptedFields = {
  User: ["email", "phone"],
  Payment: ["cardLastFour", "cardBrand"],
  Shipment: ["originContact", "destinationContact"],
  Driver: ["licenseNumber", "ssn"],
};

/**
 * Hash password (for storing)
 */
function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password + ENCRYPTION_KEY)
    .digest("hex");
}

/**
 * Verify password
 */
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Hash field for comparison (non-reversible)
 */
function hashField(data) {
  return crypto.createHash("sha256").update(String(data)).digest("hex");
}

/**
 * Secure Payment Storage Service
 */
class SecurePaymentService {
  static async storePayment(prisma, paymentData) {
    return prisma.payment.create({
      data: {
        userId: paymentData.userId,
        stripePaymentIntentId: paymentData.stripePaymentIntentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        encryptedCardLast4: paymentData.cardLast4 ? encrypt(paymentData.cardLast4) : null,
        encryptedMetadata: paymentData.metadata
          ? encrypt(JSON.stringify(paymentData.metadata))
          : null,
      },
    });
  }

  static async getPayment(prisma, paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (payment) {
      if (payment.encryptedCardLast4) {
        payment.cardLast4 = decrypt(payment.encryptedCardLast4);
      }
      if (payment.encryptedMetadata) {
        payment.metadata = JSON.parse(decrypt(payment.encryptedMetadata) || "{}");
      }
    }

    return payment;
  }
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  hashField,
  SecurePaymentService,
};
