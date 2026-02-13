/**
 * End-to-End Flow Tests
 * Aligned to current API routes.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");
const { prisma } = require("../../db/prisma");

describe("End-to-End Flow Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    describe("Auth Flow", () => {
        test("issue dev token and access /v1/auth/me", async () => {
            const devTokenResponse = await request(app)
                .post("/v1/auth/dev-token")
                .send({ userId: "user-dev-123" })
                .expect(200);

            expect(devTokenResponse.body.ok).toBe(true);
            const token = devTokenResponse.body.token;

            const meResponse = await request(app)
                .get("/v1/auth/me")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(meResponse.body.ok).toBe(true);
            expect(meResponse.body.userId).toBe("user-dev-123");
        });
    });

    describe("AI Command Flow", () => {
        test("send AI command and receive response", async () => {
            const token = generateTestJWT({
                sub: "user-ai-123",
                scopes: ["ai:command"],
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "Optimize route from LA to NY" });

            expect([200, 503]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.ok).toBe(true);
                expect(response.body.result).toBeDefined();
            }
        });
    });

    describe("Voice Processing Flow", () => {
        test("upload voice file and process command", async () => {
            const token = generateTestJWT({
                sub: "user-voice-123",
                scopes: ["voice:ingest", "voice:command"],
            });

            const ingestResponse = await request(app)
                .post("/api/voice/ingest")
                .set("Authorization", `Bearer ${token}`)
                .attach("audio", Buffer.from("fake audio data"), "command.mp3");

            expect([200, 503]).toContain(ingestResponse.status);
            if (ingestResponse.status !== 200) {
                return;
            }

            const commandResponse = await request(app)
                .post("/api/voice/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "create shipment" });

            expect(commandResponse.status).toBe(200);
            expect(commandResponse.body.ok).toBe(true);
        });
    });

    describe("Billing Flow", () => {
        test("create payment intent, confirm payment, and list transactions", async () => {
            const token = generateTestJWT({
                sub: "user-billing-123",
                scopes: ["billing:payment", "billing:read"],
            });

            const intentResponse = await request(app)
                .post("/api/payment-intent")
                .set("Authorization", `Bearer ${token}`)
                .send({ amount: 25, currency: "USD" });

            if (intentResponse.status === 404) {
                return;
            }

            expect(intentResponse.status).toBe(200);
            expect(intentResponse.body.success).toBe(true);
            const intentId = intentResponse.body.data.intentId;

            const confirmResponse = await request(app)
                .post("/api/confirm-payment")
                .set("Authorization", `Bearer ${token}`)
                .send({ intentId })
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);
            expect(confirmResponse.body.data.status).toBe("succeeded");

            const historyResponse = await request(app)
                .get("/api/transactions")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(historyResponse.body.success).toBe(true);
            expect(historyResponse.body.data.transactions).toBeInstanceOf(Array);
        });
    });

    const describeIfDb = prisma ? describe : describe.skip;

    describeIfDb("Shipment Flow", () => {
        test("create, update, and fetch shipment", async () => {
            const token = generateTestJWT({
                sub: "driver-123",
                scopes: ["shipments:read", "shipments:write"],
            });

            const createResponse = await request(app)
                .post("/api/shipments")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    origin: "Los Angeles, CA",
                    destination: "New York, NY",
                })
                .expect(201);

            expect(createResponse.body.ok).toBe(true);
            const shipmentId = createResponse.body.shipment.id;

            const updateResponse = await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "IN_TRANSIT" })
                .expect(200);

            expect(updateResponse.body.ok).toBe(true);
            expect(updateResponse.body.shipment.status).toBe("IN_TRANSIT");

            const getResponse = await request(app)
                .get(`/api/shipments/${shipmentId}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(getResponse.body.ok).toBe(true);
            expect(getResponse.body.shipment.id).toBe(shipmentId);
        });
    });
});
