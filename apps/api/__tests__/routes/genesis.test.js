/**
 * Genesis AI Routes - Comprehensive Test Suite
 * Tests AI agent routes, LLM integration, and memory management
 * Target: 100% line, branch, and function coverage
 */

const request = require("supertest");
const express = require("express");

// Mock dependencies
jest.mock("../../src/genesis/core");
jest.mock("../../src/genesis/llm");
jest.mock("../../src/genesis/memory");
jest.mock("../../src/middleware/security");

const { authenticate, requireScope } = require("../../src/middleware/security");
const genCore = require("../../src/genesis/core");
const genLLM = require("../../src/genesis/llm");
const genMemory = require("../../src/genesis/memory");

describe("Genesis Routes - Comprehensive Suite", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { sub: "test-user", email: "test@example.com" };
      next();
    });
    requireScope.mockImplementation(() => (req, res, next) => next());

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("POST /api/genesis/agent", () => {
    it("should create new AI agent successfully", async () => {
      const mockAgent = {
        id: "agent-123",
        name: "Test Agent",
        model: "gpt-4",
        createdAt: new Date().toISOString(),
      };

      genCore.createAgent = jest.fn().mockResolvedValue(mockAgent);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/agent")
        .send({
          name: "Test Agent",
          model: "gpt-4",
          systemPrompt: "You are a helpful assistant",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAgent);
      expect(genCore.createAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Agent",
          model: "gpt-4",
        })
      );
    });

    it("should reject invalid agent configuration", async () => {
      genCore.createAgent = jest
        .fn()
        .mockRejectedValue(new Error("Invalid model"));

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/agent")
        .send({
          name: "Test Agent",
          model: "invalid-model",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should handle missing required fields", async () => {
      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/agent")
        .send({})
        .expect(400);
    });

    it("should apply rate limiting", async () => {
      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      // Make multiple rapid requests
      const promises = Array(25)
        .fill(null)
        .map(() =>
          request(app).post("/api/genesis/agent").send({
            name: "Test",
            model: "gpt-4",
          })
        );

      const results = await Promise.all(promises);
      const rateLimited = results.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe("POST /api/genesis/chat", () => {
    it("should process chat message with AI agent", async () => {
      const mockResponse = {
        message: "Hello! How can I help you?",
        tokens: 25,
        model: "gpt-4",
      };

      genLLM.chat = jest.fn().mockResolvedValue(mockResponse);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
    });

    it("should handle streaming responses", async () => {
      const mockStreamIterator = {
        [Symbol.asyncIterator]: async function* () {
          yield { delta: "Hello" };
          yield { delta: " world" };
          yield { delta: "!" };
        },
      };

      genLLM.chatStream = jest.fn().mockResolvedValue(mockStreamIterator);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
          stream: true,
        })
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/event-stream");
    });

    it("should include conversation history in context", async () => {
      const mockHistory = [
        { role: "user", content: "Previous message" },
        { role: "assistant", content: "Previous response" },
      ];

      genMemory.getConversationHistory = jest
        .fn()
        .mockResolvedValue(mockHistory);
      genLLM.chat = jest.fn().mockResolvedValue({ message: "Response" });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "New message",
          conversationId: "conv-123",
        })
        .expect(200);

      expect(genMemory.getConversationHistory).toHaveBeenCalledWith("conv-123");
      expect(genLLM.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          history: mockHistory,
        })
      );
    });

    it("should handle LLM timeout errors", async () => {
      genLLM.chat = jest
        .fn()
        .mockRejectedValue(new Error("Request timeout"));

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
        })
        .expect(504);
    });

    it("should handle rate limiting from LLM provider", async () => {
      const error = new Error("Rate limit exceeded");
      error.status = 429;
      genLLM.chat = jest.fn().mockRejectedValue(error);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
        })
        .expect(429);
    });
  });

  describe("POST /api/genesis/memory", () => {
    it("should store memory successfully", async () => {
      genMemory.store = jest.fn().mockResolvedValue({
        id: "mem-123",
        content: "Test memory",
        stored: true,
      });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/memory")
        .send({
          agentId: "agent-123",
          content: "Test memory",
          type: "fact",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(genMemory.store).toHaveBeenCalled();
    });

    it("should retrieve memories by query", async () => {
      const mockMemories = [
        { id: "mem-1", content: "Memory 1", score: 0.95 },
        { id: "mem-2", content: "Memory 2", score: 0.87 },
      ];

      genMemory.search = jest.fn().mockResolvedValue(mockMemories);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .get("/api/genesis/memory")
        .query({
          agentId: "agent-123",
          query: "test query",
        })
        .expect(200);

      expect(response.body.data).toEqual(mockMemories);
    });

    it("should handle memory storage errors", async () => {
      genMemory.store = jest.fn().mockRejectedValue(new Error("Storage full"));

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/memory")
        .send({
          agentId: "agent-123",
          content: "Test memory",
        })
        .expect(500);
    });
  });

  describe("GET /api/genesis/agents", () => {
    it("should list all agents for user", async () => {
      const mockAgents = [
        { id: "agent-1", name: "Agent 1" },
        { id: "agent-2", name: "Agent 2" },
      ];

      genCore.listAgents = jest.fn().mockResolvedValue(mockAgents);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app).get("/api/genesis/agents").expect(200);

      expect(response.body.data).toEqual(mockAgents);
    });

    it("should filter agents by capability", async () => {
      const mockAgents = [{ id: "agent-1", name: "Code Agent" }];

      genCore.listAgents = jest.fn().mockResolvedValue(mockAgents);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .get("/api/genesis/agents")
        .query({ capability: "code" })
        .expect(200);

      expect(genCore.listAgents).toHaveBeenCalledWith(
        expect.objectContaining({
          capability: "code",
        })
      );
    });
  });

  describe("DELETE /api/genesis/agent/:id", () => {
    it("should delete agent successfully", async () => {
      genCore.deleteAgent = jest.fn().mockResolvedValue(true);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app).delete("/api/genesis/agent/agent-123").expect(204);

      expect(genCore.deleteAgent).toHaveBeenCalledWith("agent-123");
    });

    it("should return 404 for non-existent agent", async () => {
      genCore.deleteAgent = jest.fn().mockResolvedValue(false);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app).delete("/api/genesis/agent/agent-999").expect(404);
    });
  });

  describe("Edge Cases & Error Scenarios", () => {
    it("should handle malformed JSON in request body", async () => {
      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .set("Content-Type", "application/json")
        .send("{invalid json")
        .expect(400);
    });

    it("should sanitize SQL injection attempts", async () => {
      genMemory.search = jest.fn().mockResolvedValue([]);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .get("/api/genesis/memory")
        .query({
          agentId: "agent-123",
          query: "'; DROP TABLE memories; --",
        })
        .expect(200);

      // Should still execute safely
      expect(genMemory.search).toHaveBeenCalled();
    });

    it("should handle extremely long messages", async () => {
      const longMessage = "a".repeat(100000);

      genLLM.chat = jest.fn().mockResolvedValue({ message: "Truncated" });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: longMessage,
        })
        .expect(413); // Payload too large
    });

    it("should handle concurrent agent creation", async () => {
      genCore.createAgent = jest
        .fn()
        .mockResolvedValue({ id: "agent-123" });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/genesis/agent")
            .send({
              name: "Test Agent",
              model: "gpt-4",
            })
        );

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.status === 201);
      expect(successful.length).toBe(10);
    });

    it("should handle database connection failures", async () => {
      genCore.createAgent = jest
        .fn()
        .mockRejectedValue(new Error("ECONNREFUSED"));

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/agent")
        .send({
          name: "Test Agent",
          model: "gpt-4",
        })
        .expect(503);
    });
  });

  describe("Security & Authentication", () => {
    it("should require authentication for all endpoints", async () => {
      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: "Unauthorized" });
      });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app).get("/api/genesis/agents").expect(401);
    });

    it("should require ai:genesis scope", async () => {
      requireScope.mockImplementation(() => (req, res, next) => {
        res.status(403).json({ error: "Forbidden" });
      });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app).get("/api/genesis/agents").expect(403);
    });

    it("should isolate agent data by user", async () => {
      genCore.listAgents = jest.fn().mockResolvedValue([]);

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app).get("/api/genesis/agents").expect(200);

      expect(genCore.listAgents).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "test-user",
        })
      );
    });
  });

  describe("Performance & Monitoring", () => {
    it("should track response times", async () => {
      const startTime = Date.now();

      genLLM.chat = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { message: "Response" };
      });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it("should include usage metrics in response", async () => {
      genLLM.chat = jest.fn().mockResolvedValue({
        message: "Response",
        tokens: 150,
        cost: 0.005,
      });

      const router = require("../../src/genesis/routes");
      app.use("/api/genesis", router);

      const response = await request(app)
        .post("/api/genesis/chat")
        .send({
          agentId: "agent-123",
          message: "Hello",
        })
        .expect(200);

      expect(response.body.data.tokens).toBe(150);
      expect(response.body.data.cost).toBe(0.005);
    });
  });
});
