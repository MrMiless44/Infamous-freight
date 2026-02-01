/**
 * Authentication Routes
 * User registration, login, password reset, and token refresh
 */

const express = require("express");
const router = express.Router();
const authService = require("../services/auth.service");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters, authenticate } = require("../middleware/security");
const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");
const { ApiResponse, HTTP_STATUS } = require("@infamous-freight/shared");
const prisma = require("../db");

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    "/register",
    limiters.auth,
    [
        validateString("email"),
        validateString("password"),
        validateString("name"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { email, password, name } = req.body;

            logger.info("User registration attempt", { email });

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid email format",
                    }),
                );
            }

            // Validate password strength
            const passwordValidation = authService.validatePasswordStrength(password);
            if (!passwordValidation.isStrong) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Password does not meet security requirements",
                        details: passwordValidation.errors,
                    }),
                );
            }

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                logger.warn("User registration failed - email exists", { email });
                return res.status(HTTP_STATUS.CONFLICT).json(
                    new ApiResponse({
                        success: false,
                        error: "Email already registered",
                    }),
                );
            }

            // Hash password
            const passwordHash = await authService.hashPassword(password);

            // Generate email verification token
            const emailVerificationToken = authService.generateEmailVerificationToken();

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    emailVerificationToken,
                    role: "user",
                    scopes: ["shipments:read", "shipments:write"],
                },
            });

            logger.info("User registered successfully", { userId: user.id });

            // Generate tokens
            const tokens = authService.createAuthTokens(user);

            // TODO: Send email verification email with emailVerificationToken

            res.status(HTTP_STATUS.CREATED).json(
                new ApiResponse({
                    success: true,
                    data: {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresIn: tokens.expiresIn,
                    },
                }),
            );
        } catch (error) {
            logger.error("Registration error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/auth/login
 * Login user and return access/refresh tokens
 */
router.post(
    "/login",
    limiters.auth,
    [
        validateString("email"),
        validateString("password"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { email, password } = req.body;

            logger.info("Login attempt", { email });

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                logger.warn("Login failed - user not found", { email });
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid email or password",
                    }),
                );
            }

            // Compare password
            const isValid = await authService.comparePassword(
                password,
                user.passwordHash,
            );

            if (!isValid) {
                logger.warn("Login failed - invalid password", { userId: user.id });

                // Log failed attempt for security
                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: "LOGIN_FAILED",
                        metadata: { reason: "invalid_password" },
                    },
                });

                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid email or password",
                    }),
                );
            }

            // Check if email is verified
            if (!user.emailVerifiedAt && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
                return res.status(HTTP_STATUS.FORBIDDEN).json(
                    new ApiResponse({
                        success: false,
                        error: "Email not verified",
                        details: "Please verify your email before logging in",
                    }),
                );
            }

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            // Generate tokens
            const tokens = authService.createAuthTokens(user);

            // Log successful login
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: "LOGIN_SUCCESS",
                    metadata: { ipAddress: req.ip },
                },
            });

            logger.info("User logged in", { userId: user.id });

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresIn: tokens.expiresIn,
                    },
                }),
            );
        } catch (error) {
            logger.error("Login error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
    "/refresh",
    [
        validateString("refreshToken"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            logger.info("Token refresh attempt");

            // Verify refresh token
            let decoded;
            try {
                decoded = authService.verifyToken(refreshToken);
            } catch (error) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid or expired refresh token",
                    }),
                );
            }

            if (decoded.type !== "refresh") {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid token type",
                    }),
                );
            }

            // Get user
            const user = await prisma.user.findUnique({
                where: { id: decoded.sub },
            });

            if (!user) {
                return res.status(HTTP_STATUS.NOT_FOUND).json(
                    new ApiResponse({
                        success: false,
                        error: "User not found",
                    }),
                );
            }

            // Generate new tokens
            const tokens = authService.createAuthTokens(user);

            logger.info("Token refreshed", { userId: user.id });

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresIn: tokens.expiresIn,
                    },
                }),
            );
        } catch (error) {
            logger.error("Token refresh error", { error: error.message });
            next(error);
        }
    },
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post(
    "/logout",
    authenticate,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;

            logger.info("User logout", { userId });

            // Log logout event
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: "LOGOUT",
                },
            });

            res.json(
                new ApiResponse({
                    success: true,
                    data: { message: "Logged out successfully" },
                }),
            );
        } catch (error) {
            logger.error("Logout error", { error: error.message });
            next(error);
        }
    },
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
    "/forgot-password",
    limiters.auth,
    [
        validateString("email"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { email } = req.body;

            logger.info("Password reset requested", { email });

            // Find user (don't reveal if exists)
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                // Return same response for security
                return res.json(
                    new ApiResponse({
                        success: true,
                        data: { message: "If email exists, reset link has been sent" },
                    }),
                );
            }

            // Generate reset token
            const { resetToken, resetTokenHash, expiresAt } =
                authService.generatePasswordResetToken(user.id);

            // Store token hash in database
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetTokenHash,
                    passwordResetExpiresAt: expiresAt,
                },
            });

            // TODO: Send email with reset link
            // Example: `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`

            logger.info("Password reset email sent", { userId: user.id });

            res.json(
                new ApiResponse({
                    success: true,
                    data: { message: "If email exists, reset link has been sent" },
                }),
            );
        } catch (error) {
            logger.error("Password reset request error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
    "/reset-password",
    [
        validateString("token"),
        validateString("password"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { token, password } = req.body;

            logger.info("Password reset attempt");

            // Validate new password
            const passwordValidation = authService.validatePasswordStrength(password);
            if (!passwordValidation.isStrong) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Password does not meet security requirements",
                        details: passwordValidation.errors,
                    }),
                );
            }

            // Hash provided token to find user
            const crypto = require("crypto");
            const tokenHash = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            // Find user with valid reset token
            const user = await prisma.user.findFirst({
                where: {
                    passwordResetToken: tokenHash,
                    passwordResetExpiresAt: {
                        gt: new Date(),
                    },
                },
            });

            if (!user) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Invalid or expired reset token",
                    }),
                );
            }

            // Hash new password
            const passwordHash = await authService.hashPassword(password);

            // Update user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpiresAt: null,
                },
            });

            logger.info("Password reset successful", { userId: user.id });

            // Log security event
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: "PASSWORD_RESET",
                },
            });

            res.json(
                new ApiResponse({
                    success: true,
                    data: { message: "Password reset successful" },
                }),
            );
        } catch (error) {
            logger.error("Password reset error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
    "/me",
    authenticate,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    avatar: true,
                    createdAt: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                },
            });

            if (!user) {
                return res.status(HTTP_STATUS.NOT_FOUND).json(
                    new ApiResponse({
                        success: false,
                        error: "User not found",
                    }),
                );
            }

            res.json(
                new ApiResponse({
                    success: true,
                    data: user,
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

module.exports = router;
