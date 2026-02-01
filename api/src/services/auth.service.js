/**
 * Authentication Service
 * Handles JWT token generation, validation, password hashing, and OAuth flows
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "30d";

/**
 * Hash a password using bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
    try {
        // Use 12 salt rounds for security
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        logger.error("Password hashing failed", { error: error.message });
        throw error;
    }
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        logger.error("Password comparison failed", { error: error.message });
        return false;
    }
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Expiration time
 * @returns {string}
 */
function generateToken(payload, expiresIn = JWT_EXPIRY) {
    try {
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn,
            algorithm: "HS256",
        });

        return token;
    } catch (error) {
        logger.error("Token generation failed", { error: error.message });
        throw error;
    }
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Object}
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
        });

        return decoded;
    } catch (error) {
        logger.warn("Token verification failed", {
            error: error.message,
            name: error.name,
        });

        if (error.name === "TokenExpiredError") {
            throw new Error("Token expired");
        } else if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        }

        throw error;
    }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token
 * @returns {Object}
 */
function decodeToken(token) {
    return jwt.decode(token);
}

/**
 * Create authentication tokens (access + refresh)
 * @param {Object} user
 * @returns {Object}
 */
function createAuthTokens(user) {
    // Access token (short-lived)
    const accessToken = generateToken(
        {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            scopes: user.scopes || [],
        },
        JWT_EXPIRY,
    );

    // Refresh token (long-lived)
    const refreshToken = generateToken(
        {
            sub: user.id,
            type: "refresh",
        },
        REFRESH_TOKEN_EXPIRY,
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: getTokenExpirySeconds(JWT_EXPIRY),
    };
}

/**
 * Validate scopes
 * @param {Array} userScopes
 * @param {Array|string} requiredScopes
 * @returns {boolean}
 */
function validateScopes(userScopes, requiredScopes) {
    if (typeof requiredScopes === "string") {
        requiredScopes = [requiredScopes];
    }

    if (!Array.isArray(userScopes)) {
        userScopes = [];
    }

    return requiredScopes.some((scope) => userScopes.includes(scope));
}

/**
 * Convert expiry format to seconds
 * @param {string} expiryStr - e.g., "7d", "24h", "30m"
 * @returns {number}
 */
function getTokenExpirySeconds(expiryStr) {
    const units = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        w: 604800,
    };

    const match = expiryStr.match(/^(\d+)([smhdw])$/);
    if (!match) {
        return 3600; // Default to 1 hour
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
}

/**
 * Generate password reset token
 * @param {string} userId
 * @returns {Object}
 */
function generatePasswordResetToken(userId) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Valid for 1 hour

    return {
        resetToken, // Send this to user
        resetTokenHash, // Store this in database
        expiresAt,
    };
}

/**
 * Verify password reset token
 * @param {string} resetToken - Token from user
 * @param {string} storedHash - Hash from database
 * @returns {boolean}
 */
function verifyPasswordResetToken(resetToken, storedHash) {
    const hash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    return hash === storedHash;
}

/**
 * Generate email verification token
 * @returns {string}
 */
function generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate 2FA secret (for TOTP)
 * @returns {string}
 */
function generate2FASecret() {
    return crypto.randomBytes(32).toString("base64");
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {Object}
 */
function validatePasswordStrength(password) {
    const result = {
        isStrong: true,
        errors: [],
        score: 0,
    };

    // Length check
    if (password.length < 12) {
        result.errors.push("Password must be at least 12 characters");
        result.isStrong = false;
    } else {
        result.score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        result.errors.push("Password must contain uppercase letter");
        result.isStrong = false;
    } else {
        result.score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
        result.errors.push("Password must contain lowercase letter");
        result.isStrong = false;
    } else {
        result.score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
        result.errors.push("Password must contain number");
        result.isStrong = false;
    } else {
        result.score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.errors.push("Password must contain special character");
        result.isStrong = false;
    } else {
        result.score += 1;
    }

    return result;
}

/**
 * Create session token
 * @param {string} userId
 * @param {Object} metadata
 * @returns {string}
 */
function createSessionToken(userId, metadata = {}) {
    const sessionToken = jwt.sign(
        {
            sub: userId,
            type: "session",
            ...metadata,
        },
        JWT_SECRET,
        {
            expiresIn: "24h",
            algorithm: "HS256",
        },
    );

    return sessionToken;
}

/**
 * Check if token is near expiration
 * @param {string} token
 * @param {number} minutesThreshold - Minutes until expiry to consider "near"
 * @returns {boolean}
 */
function isTokenNearExpiry(token, minutesThreshold = 5) {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }

        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        const thresholdMs = minutesThreshold * 60 * 1000;

        return timeUntilExpiry < thresholdMs;
    } catch {
        return true;
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    decodeToken,
    createAuthTokens,
    validateScopes,
    getTokenExpirySeconds,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    generateEmailVerificationToken,
    generate2FASecret,
    validatePasswordStrength,
    createSessionToken,
    isTokenNearExpiry,
};
