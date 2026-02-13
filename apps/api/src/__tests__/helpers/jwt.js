const jwt = require("jsonwebtoken");

const DEFAULT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-jwt-validation";

function generateTestJWT(payload = {}, options = {}) {
  const mergedPayload = {
    sub: "test-user",
    scopes: [],
    org_id: "test-org",
    ...payload,
  };

  // Don't set expiresIn if exp is already in payload
  const signOptions = mergedPayload.exp ? { ...options } : { expiresIn: "1h", ...options };

  return jwt.sign(mergedPayload, DEFAULT_SECRET, signOptions);
}

module.exports = { generateTestJWT };
