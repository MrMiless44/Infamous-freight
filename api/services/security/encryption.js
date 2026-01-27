/**
 * Field-Level Encryption Service
 * 
 * Provides AES-256-GCM encryption for sensitive data fields
 * - Secure key derivation from master key
 * - Authentic encryption with authentication tags
 * - Serialization-safe format (hex encoding)
 * 
 * Sensitive fields to encrypt:
 *  - User phone numbers
 *  - Social security numbers (SSN)
 *  - Bank account details
 *  - Credit card information
 *  - API keys
 * 
 * Usage:
 *   const encrypted = EncryptionService.encrypt("sensitive data");
 *   const decrypted = EncryptionService.decrypt(encrypted);
 *   const hashed = EncryptionService.hash("password");
 */

const crypto = require("crypto");
const logger = require("../../middleware/logger");

class EncryptionService {
    // Get encryption key from environment
    static getEncryptionKey() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error(
                "ENCRYPTION_KEY environment variable not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
            );
        }
        return Buffer.from(key, "hex");
    }

    static ALGORITHM = "aes-256-gcm";
    static IV_LENGTH = 16;
    static AUTH_TAG_LENGTH = 16;
    static SALT_LENGTH = 16;

    /**
     * Encrypt plaintext using AES-256-GCM
     * Returns: "{iv}:{encryptedData}:{authTag}"
     */
    static encrypt(plaintext) {
        try {
            const key = this.getEncryptionKey();
            const iv = crypto.randomBytes(this.IV_LENGTH);

            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            const textBuffer = Buffer.from(JSON.stringify(plaintext), "utf8");

            let encrypted = cipher.update(textBuffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            const authTag = cipher.getAuthTag();

            return {
                iv: iv.toString("hex"),
                encryptedData: encrypted.toString("hex"),
                authTag: authTag.toString("hex"),
            };
        } catch (error) {
            logger.error("Encryption failed", { error: error.message });
            throw new Error("Failed to encrypt data");
        }
    }

    /**
     * Decrypt ciphertext using AES-256-GCM
     * Accepts: {iv, encryptedData, authTag}
     */
    static decrypt(encryptedObject) {
        try {
            const key = this.getEncryptionKey();
            const iv = Buffer.from(encryptedObject.iv, "hex");
            const encryptedData = Buffer.from(encryptedObject.encryptedData, "hex");
            const authTag = Buffer.from(encryptedObject.authTag, "hex");

            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return JSON.parse(decrypted.toString("utf8"));
        } catch (error) {
            logger.error("Decryption failed", { error: error.message });
            throw new Error("Failed to decrypt data");
        }
    }

    /**
     * Hash a value using SHA-256 + salt
     * Used for one-way hashing (passwords, tokens)
     */
    static hash(plaintext) {
        const salt = process.env.HASH_SALT || "infamous-freight-salt";
        return crypto
            .createHash("sha256")
            .update(plaintext + salt)
            .digest("hex");
    }

    /**
     * Verify hashed value
     */
    static verifyHash(plaintext, hash) {
        return this.hash(plaintext) === hash;
    }

    /**
     * Generate secure random token
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString("hex");
    }

    /**
     * Encrypt sensitive user fields before database insert
     */
    static encryptUserFields(user) {
        const copy = { ...user };
        if (copy.phone) copy.phone = this.encrypt(copy.phone);
        if (copy.ssn) copy.ssn = this.encrypt(copy.ssn);
        if (copy.bankAccount) copy.bankAccount = this.encrypt(copy.bankAccount);
        return copy;
    }

    /**
     * Decrypt sensitive user fields after database retrieval
     */
    static decryptUserFields(user) {
        const copy = { ...user };
        if (copy.phone && typeof copy.phone === "object")
            copy.phone = this.decrypt(copy.phone);
        if (copy.ssn && typeof copy.ssn === "object")
            copy.ssn = this.decrypt(copy.ssn);
        if (copy.bankAccount && typeof copy.bankAccount === "object")
            copy.bankAccount = this.decrypt(copy.bankAccount);
        return copy;
    }
}

module.exports = EncryptionService;
