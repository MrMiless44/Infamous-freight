/**
 * Feature Flags Service Tests
 * Aligned to ENABLE_AI_COMMANDS and ENABLE_VOICE_PROCESSING.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("Feature Flags Service Tests", () => {
  let app;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    app = require("../../app");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("ENABLE_AI_COMMANDS flag", () => {
    test("allows AI endpoints when enabled", async () => {
      process.env.ENABLE_AI_COMMANDS = "true";

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["ai:command"],
      });

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "optimize route" });

      expect(response.status).not.toBe(503);
    });

    test("returns 503 when disabled", async () => {
      process.env.ENABLE_AI_COMMANDS = "false";

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["ai:command"],
      });

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(503);

      expect(response.body.error).toMatch(/disabled/i);
    });

    test("defaults to enabled when flag not set", async () => {
      delete process.env.ENABLE_AI_COMMANDS;

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["ai:command"],
      });

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" });

      expect(response.status).not.toBe(503);
    });

    test("treats non-false values as enabled", async () => {
      process.env.ENABLE_AI_COMMANDS = "0";

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["ai:command"],
      });

      const response = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" });

      expect(response.status).not.toBe(503);
    });
  });

  describe("ENABLE_VOICE_PROCESSING flag", () => {
    test("allows voice endpoints when enabled", async () => {
      process.env.ENABLE_VOICE_PROCESSING = "true";

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["voice:ingest"],
      });

      const response = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${token}`)
        .attach("audio", Buffer.from("fake audio"), "test.mp3");

      expect(response.status).not.toBe(503);
    });

    test("returns 503 when disabled", async () => {
      process.env.ENABLE_VOICE_PROCESSING = "false";

      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["voice:ingest"],
      });

      const response = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${token}`)
        .attach("audio", Buffer.from("fake audio"), "test.mp3")
        .expect(503);

      expect(response.body.error).toMatch(/disabled/i);
    });
  });

  describe("Runtime flag changes", () => {
    test("respects AI flag changes without restart", async () => {
      const token = generateTestJWT({
        sub: "user-123",
        scopes: ["ai:command"],
      });

      process.env.ENABLE_AI_COMMANDS = "true";
      const response1 = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" });
      expect(response1.status).not.toBe(503);

      process.env.ENABLE_AI_COMMANDS = "false";
      const response2 = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "test" })
        .expect(503);
    });
  });
});
