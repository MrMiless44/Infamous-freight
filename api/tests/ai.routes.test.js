/**
 * AI Route Validation Tests
 *
 * Covers boundary checks for AI payload sizes.
 */

const request = require("supertest");
const express = require("express");

jest.mock("../src/middleware/security", () => ({
    authenticate: (req, res, next) => {
        req.user = { sub: "user-1", scopes: ["ai:command"] };
        next();
    },
    requireScope: () => (req, res, next) => next(),
    limiters: { ai: (req, res, next) => next() },
    auditLog: (req, res, next) => next(),
}));

jest.mock("../src/services/ai.service", () => ({
    generateText: jest.fn().mockResolvedValue("ok"),
    analyzeSentiment: jest.fn().mockResolvedValue({
        sentiment: "positive",
        confidence: 0.9,
        emotion: "happy",
    }),
    generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    AI_PROVIDER: "synthetic",
    AI_MODEL: "test-model",
}));

const aiRouter = require("../src/routes/ai.commands.implementation");

describe("AI route validation", () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use("/api/ai", aiRouter);
    });

    test("accepts prompt length of 5000", async () => {
        const response = await request(app)
            .post("/api/ai/generate")
            .send({ prompt: "a".repeat(5000) });

        expect(response.status).toBe(201);
    });

    test("rejects prompt length greater than 5000", async () => {
        const response = await request(app)
            .post("/api/ai/generate")
            .send({ prompt: "a".repeat(5001) });

        expect(response.status).toBe(400);
    });

    test("accepts sentiment text length of 2000", async () => {
        const response = await request(app)
            .post("/api/ai/sentiment-analysis")
            .send({ text: "b".repeat(2000) });

        expect(response.status).toBe(200);
    });

    test("rejects sentiment text length greater than 2000", async () => {
        const response = await request(app)
            .post("/api/ai/sentiment-analysis")
            .send({ text: "b".repeat(2001) });

        expect(response.status).toBe(400);
    });
});
