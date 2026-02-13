const jwt = require("jsonwebtoken");

const DEFAULT_SECRET =
    process.env.JWT_SECRET || "test-secret-key-for-jwt-validation";

function generateTestJWT(payload = {}, options = {}) {
    const mergedPayload = {
        sub: "test-user",
        scopes: [],
        org_id: "test-org",
        ...payload,
    };

    return jwt.sign(mergedPayload, DEFAULT_SECRET, {
        expiresIn: "1h",
        ...options,
    });
}

module.exports = { generateTestJWT };
