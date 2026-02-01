/**
 * AI Service
 * Integration with OpenAI, Anthropic, or synthetic AI providers
 * Handles text generation, voice transcription, and AI commands
 */

const logger = require("../middleware/logger");
const Sentry = require("@sentry/node");

// Initialize providers based on environment
const openai = process.env.OPENAI_API_KEY
    ? require("openai").default
    : null;
const anthropic = process.env.ANTHROPIC_API_KEY
    ? require("@anthropic-ai/sdk").default
    : null;

const AI_PROVIDER = process.env.AI_PROVIDER || "synthetic";
const AI_MODEL = process.env.AI_MODEL || "gpt-4-turbo";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Generate text using the configured AI provider
 * @param {Object} params
 * @returns {Promise<string>}
 */
async function generateText({
    prompt,
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = null,
    userId = null,
}) {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            logger.info("AI text generation", {
                provider: AI_PROVIDER,
                model: AI_PROVIDER === "anthropic" ? ANTHROPIC_MODEL : AI_MODEL,
                userId,
            });

            let response;

            if (AI_PROVIDER === "openai" && openai) {
                response = await generateWithOpenAI({
                    prompt,
                    maxTokens,
                    temperature,
                    systemPrompt,
                });
            } else if (AI_PROVIDER === "anthropic" && anthropic) {
                response = await generateWithAnthropic({
                    prompt,
                    maxTokens,
                    temperature,
                    systemPrompt,
                });
            } else {
                // Fallback to synthetic provider
                response = generateWithSynthetic(prompt);
            }

            logger.info("AI generation successful", {
                provider: AI_PROVIDER,
                tokensUsed: response.tokensUsed,
            });

            // Log to user's audit trail
            if (userId) {
                const prisma = require("../db");
                await prisma.auditLog.create({
                    data: {
                        userId,
                        action: "AI_GENERATION",
                        metadata: {
                            provider: AI_PROVIDER,
                            tokens: response.tokensUsed,
                            duration: response.duration,
                        },
                    },
                });
            }

            return response.text;
        } catch (error) {
            retries++;
            logger.warn("AI generation failed", {
                error: error.message,
                attempt: retries,
                maxRetries: MAX_RETRIES,
            });

            if (retries >= MAX_RETRIES) {
                logger.error("AI generation max retries exceeded", {
                    error: error.message,
                    provider: AI_PROVIDER,
                });

                Sentry.captureException(error, {
                    tags: { service: "ai", operation: "generateText", provider: AI_PROVIDER },
                });

                // Fallback to synthetic
                logger.info("Falling back to synthetic AI");
                return generateWithSynthetic(prompt).text;
            }

            // Wait before retry
            await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY * retries),
            );
        }
    }
}

/**
 * Generate text using OpenAI
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function generateWithOpenAI({
    prompt,
    maxTokens,
    temperature,
    systemPrompt,
}) {
    const client = new openai();
    const startTime = Date.now();

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
    });

    const duration = Date.now() - startTime;

    return {
        text: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        duration,
        model: response.model,
    };
}

/**
 * Generate text using Anthropic
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function generateWithAnthropic({
    prompt,
    maxTokens,
    temperature,
    systemPrompt,
}) {
    const client = new anthropic();
    const startTime = Date.now();

    const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        ...(systemPrompt && { system: systemPrompt }),
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature,
    });

    const duration = Date.now() - startTime;

    return {
        text: response.content[0].text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        duration,
        model: response.model,
    };
}

/**
 * Generate text using synthetic/local AI
 * Returns deterministic responses based on prompt
 * @param {string} prompt
 * @returns {Object}
 */
function generateWithSynthetic(prompt) {
    const startTime = Date.now();

    // Synthetic responses for common patterns
    const responses = {
        shipment: `The shipment is progressing well. Current status: In Transit. 
    Location: Distribution Center, Las Vegas, NV. 
    Estimated delivery: Tomorrow by 5 PM. 
    No issues reported. Tracking number: SHP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,

        pricing: `Based on the current parameters, the estimated shipping cost is $${(Math.random() * 500 + 50).toFixed(2)}. 
    This includes base freight charge, fuel surcharge, and handling fees. 
    Volume discounts available for shipments over 10 pallets.`,

        tracking: `Last update: 2 hours ago. Package at Memphis Distribution Center. 
    Next stop: Regional Sorting Hub. Estimated arrival: 6 hours. 
    On schedule for delivery tomorrow.`,

        default: `I've processed your request successfully. 
    The system is analyzing your shipment data and providing recommendations. 
    Please check back shortly for detailed results.`,
    };

    // Determine response based on prompt keywords
    let response = responses.default;
    const lowerPrompt = prompt.toLowerCase();

    if (
        lowerPrompt.includes("shipment") ||
        lowerPrompt.includes("status")
    ) {
        response = responses.shipment;
    } else if (
        lowerPrompt.includes("price") ||
        lowerPrompt.includes("cost")
    ) {
        response = responses.pricing;
    } else if (
        lowerPrompt.includes("track") ||
        lowerPrompt.includes("location")
    ) {
        response = responses.tracking;
    }

    const duration = Date.now() - startTime;

    return {
        text: response,
        tokensUsed: Math.ceil(response.split(" ").length * 1.3), // Estimate
        duration,
        model: "synthetic",
    };
}

/**
 * Process voice file and transcribe to text
 * @param {string} filePath - Path to audio file
 * @returns {Promise<string>}
 */
async function transcribeAudio(filePath) {
    try {
        if (AI_PROVIDER !== "openai" || !openai) {
            // Synthetic transcription
            return `[Transcribed audio from ${filePath}] This is a synthetic transcription of your voice message.`;
        }

        const client = new openai();
        const fs = require("fs");

        const response = await client.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(filePath),
            language: "en",
        });

        logger.info("Audio transcription successful", {
            filePath,
            textLength: response.text.length,
        });

        return response.text;
    } catch (error) {
        logger.error("Audio transcription failed", {
            error: error.message,
            filePath,
        });

        Sentry.captureException(error, {
            tags: { service: "ai", operation: "transcribeAudio" },
        });

        throw error;
    }
}

/**
 * Generate embeddings for semantic search
 * @param {string} text
 * @returns {Promise<Array>}
 */
async function generateEmbedding(text) {
    try {
        if (AI_PROVIDER !== "openai" || !openai) {
            // Synthetic embedding (384-dimensional vector)
            return Array(384)
                .fill(0)
                .map(() => Math.random());
        }

        const client = new openai();

        const response = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });

        logger.info("Embedding generation successful", {
            textLength: text.length,
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error("Embedding generation failed", {
            error: error.message,
        });

        Sentry.captureException(error, {
            tags: { service: "ai", operation: "generateEmbedding" },
        });

        throw error;
    }
}

/**
 * Analyze sentiment of text
 * @param {string} text
 * @returns {Promise<Object>}
 */
async function analyzeSentiment(text) {
    const prompt = `Analyze the sentiment of this text and provide:
1. Overall sentiment (positive, negative, neutral)
2. Confidence score (0-1)
3. Key emotion detected

Text: "${text}"

Respond in JSON format.`;

    const response = await generateText({
        prompt,
        maxTokens: 200,
        systemPrompt: "You are a sentiment analysis expert. Respond only with valid JSON.",
    });

    try {
        return JSON.parse(response);
    } catch {
        return {
            sentiment: "neutral",
            confidence: 0.5,
            emotion: "neutral",
        };
    }
}

/**
 * Generate suggestions for shipment optimization
 * @param {Object} shipmentData
 * @returns {Promise<Array>}
 */
async function generateShipmentSuggestions(shipmentData) {
    const prompt = `You are a logistics optimization expert. 
  Based on this shipment data: ${JSON.stringify(shipmentData)}
  
  Provide 3-5 specific, actionable suggestions to optimize:
  1. Cost
  2. Delivery time
  3. Environmental impact
  
  Keep each suggestion concise and specific.`;

    const response = await generateText({
        prompt,
        maxTokens: 500,
        temperature: 0.5,
    });

    // Parse response into suggestion array
    const suggestions = response
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    return suggestions;
}

module.exports = {
    generateText,
    transcribeAudio,
    generateEmbedding,
    analyzeSentiment,
    generateShipmentSuggestions,
    AI_PROVIDER,
    AI_MODEL,
};
