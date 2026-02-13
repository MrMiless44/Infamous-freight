const request = require("supertest");

const app = require("../../app");

describe("Auth Routes", () => {
    test("issues a dev token in non-production", async () => {
        const response = await request(app)
            .post("/v1/auth/dev-token")
            .send({ userId: "user-123" });

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
        expect(typeof response.body.token).toBe("string");
    });

    test("rejects /v1/auth/me without token", async () => {
        const response = await request(app).get("/v1/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.ok).toBe(false);
    });

    test("returns user id for /v1/auth/me with token", async () => {
        const tokenResponse = await request(app)
            .post("/v1/auth/dev-token")
            .send({ userId: "user-123" });

        const response = await request(app)
            .get("/v1/auth/me")
            .set("Authorization", `Bearer ${tokenResponse.body.token}`);

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
        expect(response.body.userId).toBe("user-123");
    });
});
