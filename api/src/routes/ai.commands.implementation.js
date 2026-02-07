/**
 * AI Command Routes
 * Voice commands, shipment optimization, semantic search, and AI insights
 */

const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const {
    authenticate,
    requireScope,
    limiters,
    auditLog,
} = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");
const { ApiResponse, HTTP_STATUS } = require("@infamous-freight/shared");

const aiRateLimiter = limiters.ai; // 20 requests/minute

/**
 * POST /api/ai/generate
 * Generate text using AI
 */
router.post(
    "/generate",
    aiRateLimiter,
    authenticate,
    requireScope("ai:command"),
    auditLog,
    [
        validateString("prompt", { maxLength: 5000 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { prompt, maxTokens = 2000, temperature = 0.7 } = req.body;
            const userId = req.user.sub;

            if (prompt.length > 5000) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Prompt exceeds maximum length (5000 characters)",
                    }),
                );
            }

            logger.info("AI text generation request", {
                userId,
                promptLength: prompt.length,
            });

            const startTime = Date.now();

            const generatedText = await aiService.generateText({
                prompt,
                maxTokens,
                temperature,
                userId,
            });

            const duration = Date.now() - startTime;

            logger.info("AI generation completed", {
                userId,
                duration,
                outputLength: generatedText.length,
            });

            res.status(HTTP_STATUS.CREATED).json(
                new ApiResponse({
                    success: true,
                    data: {
                        text: generatedText,
                        duration,
                        provider: aiService.AI_PROVIDER,
                    },
                }),
            );
        } catch (error) {
            logger.error("AI generation error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/ai/shipment-optimization
 * Generate shipment optimization suggestions
 */
router.post(
    "/shipment-optimization",
    aiRateLimiter,
    authenticate,
    requireScope("ai:command"),
    auditLog,
    [
        validateString("shipmentId"),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { shipmentId } = req.body;
            const userId = req.user.sub;

            logger.info("Shipment optimization request", {
                userId,
                shipmentId,
            });

            // Get shipment data
            const prisma = require("../db");
            const shipment = await prisma.shipment.findUnique({
                where: { id: shipmentId },
                include: {
                    origin: true,
                    destination: true,
                    items: true,
                },
            });

            if (!shipment) {
                return res.status(HTTP_STATUS.NOT_FOUND).json(
                    new ApiResponse({
                        success: false,
                        error: "Shipment not found",
                    }),
                );
            }

            // Generate suggestions
            const suggestions = await aiService.generateShipmentSuggestions({
                origin: shipment.origin,
                destination: shipment.destination,
                weight: shipment.totalWeight,
                volume: shipment.totalVolume,
                itemCount: shipment.items.length,
                status: shipment.status,
            });

            logger.info("Optimization suggestions generated", {
                userId,
                shipmentId,
                suggestionCount: suggestions.length,
            });

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        shipmentId,
                        suggestions,
                        provider: aiService.AI_PROVIDER,
                    },
                }),
            );
        } catch (error) {
            logger.error("Shipment optimization error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/ai/sentiment-analysis
 * Analyze sentiment of text (customer feedback, reviews, etc.)
 */
router.post(
    "/sentiment-analysis",
    aiRateLimiter,
    authenticate,
    requireScope("ai:command"),
    auditLog,
    [
        validateString("text", { maxLength: 2000 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { text } = req.body;
            const userId = req.user.sub;

            if (text.length > 2000) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: "Text exceeds maximum length (2000 characters)",
                    }),
                );
            }

            logger.info("Sentiment analysis request", { userId });

            const analysis = await aiService.analyzeSentiment(text);

            logger.info("Sentiment analysis completed", {
                userId,
                sentiment: analysis.sentiment,
            });

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        sentiment: analysis.sentiment,
                        confidence: analysis.confidence,
                        emotion: analysis.emotion,
                    },
                }),
            );
        } catch (error) {
            logger.error("Sentiment analysis error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/ai/embedding
 * Generate embeddings for semantic search
 */
router.post(
    "/embedding",
    aiRateLimiter,
    authenticate,
    requireScope("ai:command"),
    auditLog,
    [
        validateString("text", { maxLength: 2000 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { text } = req.body;
            const userId = req.user.sub;

            logger.info("Embedding generation request", { userId });

            const embedding = await aiService.generateEmbedding(text);

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        embedding,
                        dimension: embedding.length,
                    },
                }),
            );
        } catch (error) {
            logger.error("Embedding generation error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * POST /api/ai/voice-command
 * Process voice command and return action
 * Expects audio file from voice service
 */
router.post(
    "/voice-command",
    aiRateLimiter,
    authenticate,
    requireScope("ai:command"),
    auditLog,
    [
        validateString("transcription", { maxLength: 5000 }),
        handleValidationErrors,
    ],
    async (req, res, next) => {
        try {
            const { transcription } = req.body;
            const userId = req.user.sub;

            logger.info("Voice command processed", {
                userId,
                transcriptionLength: transcription.length,
            });

            // Parse command intent
            const intent = parseVoiceCommand(transcription);

            // Log command
            const prisma = require("../db");
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: "VOICE_COMMAND",
                    metadata: {
                        intent: intent.type,
                        confidence: intent.confidence,
                        transcription: transcription.substring(0, 200),
                    },
                },
            });

            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        intent: intent.type,
                        confidence: intent.confidence,
                        action: intent.action,
                        message: intent.message,
                    },
                }),
            );
        } catch (error) {
            logger.error("Voice command error", { error: error.message });
            Sentry.captureException(error);
            next(error);
        }
    },
);

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get(
    "/health",
    authenticate,
    async (req, res, next) => {
        try {
            res.json(
                new ApiResponse({
                    success: true,
                    data: {
                        status: "healthy",
                        provider: aiService.AI_PROVIDER,
                        model: aiService.AI_MODEL,
                        rateLimitRemaining: req.rateLimit?.remaining || "unknown",
                    },
                }),
            );
        } catch (error) {
            next(error);
        }
    },
);

/**
 * Parse voice command to extract intent
 * @param {string} transcription
 * @returns {Object}
 */
function parseVoiceCommand(transcription) {
    const text = transcription.toLowerCase();

    // Define voice command patterns
    const commands = {
        track: {
            keywords: ["track", "where is", "status", "location"],
            action: "GET_SHIPMENT_STATUS",
            message: "Tracking your shipment...",
        },
        create: {
            keywords: ["create", "new shipment", "send", "schedule"],
            action: "CREATE_SHIPMENT",
            message: "Creating new shipment...",
        },
        pricing: {
            keywords: ["price", "cost", "quote", "estimate"],
            action: "GET_PRICING",
            message: "Calculating shipment cost...",
        },
        help: {
            keywords: ["help", "what can", "commands", "support"],
            action: "SHOW_HELP",
            message: "Available commands: track shipment, create shipment, get pricing",
        },
    };

    // Find matching command
    for (const [key, command] of Object.entries(commands)) {
        if (command.keywords.some((keyword) => text.includes(keyword))) {
            return {
                type: key,
                action: command.action,
                message: command.message,
                confidence: 0.85,
            };
        }
    }

    // Default fallback
    return {
        type: "unknown",
        action: "SHOW_HELP",
        message: "I didn't understand that command. Try 'track shipment' or 'create shipment'.",
        confidence: 0.3,
    };
}

module.exports = router;
