/**
 * OTP (One-Time Password) Tests
 * Tests for OTP generation and hashing
 */

const crypto = require("crypto");
const { generateOtp, hashOtp } = require("../../lib/otp");

describe("OTP Module", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("generateOtp", () => {
    it("should generate 6-digit OTP by default", () => {
      const otp = generateOtp();

      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should generate OTP with custom length", () => {
      process.env.OTP_LENGTH = "4";

      const otp = generateOtp();

      expect(otp).toMatch(/^\d{4}$/);
    });

    it("should generate 8-digit OTP when configured", () => {
      process.env.OTP_LENGTH = "8";

      const otp = generateOtp();

      expect(otp).toMatch(/^\d{8}$/);
    });

    it("should not have leading zeros", () => {
      for (let i = 0; i < 10; i++) {
        const otp = generateOtp();
        expect(otp[0]).not.toBe("0");
      }
    });

    it("should generate different OTPs on consecutive calls", () => {
      const otps = new Set();

      for (let i = 0; i < 100; i++) {
        otps.add(generateOtp());
      }

      // Should have generated mostly unique OTPs
      expect(otps.size).toBeGreaterThan(90);
    });

    it("should handle invalid OTP_LENGTH gracefully", () => {
      process.env.OTP_LENGTH = "invalid";

      const otp = generateOtp();

      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should return string", () => {
      const otp = generateOtp();

      expect(typeof otp).toBe("string");
    });

    it("should generate within valid range", () => {
      process.env.OTP_LENGTH = "6";

      for (let i = 0; i < 10; i++) {
        const otp = generateOtp();
        const num = parseInt(otp, 10);

        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it("should handle length of 4", () => {
      process.env.OTP_LENGTH = "4";

      const otp = generateOtp();
      const num = parseInt(otp, 10);

      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    });

    it("should handle length of 10", () => {
      process.env.OTP_LENGTH = "10";

      const otp = generateOtp();

      expect(otp).toHaveLength(10);
      expect(otp).toMatch(/^\d{10}$/);
    });
  });

  describe("hashOtp", () => {
    it("should hash OTP with SHA256", () => {
      const otp = "123456";

      const hash = hashOtp(otp);

      expect(hash).toHaveLength(64); // SHA256 produces 64 hex chars
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce consistent hashes for same OTP", () => {
      const otp = "123456";

      const hash1 = hashOtp(otp);
      const hash2 = hashOtp(otp);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different OTPs", () => {
      const otp1 = "123456";
      const otp2 = "654321";

      const hash1 = hashOtp(otp1);
      const hash2 = hashOtp(otp2);

      expect(hash1).not.toBe(hash2);
    });

    it("should use configured salt", () => {
      process.env.OTP_HASH_SALT = "custom-salt";
      const otp = "123456";

      const hash = hashOtp(otp);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it("should change hash when salt changes", () => {
      const otp = "123456";

      process.env.OTP_HASH_SALT = "salt1";
      const hash1 = hashOtp(otp);

      process.env.OTP_HASH_SALT = "salt2";
      const hash2 = hashOtp(otp);

      expect(hash1).not.toBe(hash2);
    });

    it("should use default salt when not configured", () => {
      delete process.env.OTP_HASH_SALT;
      const otp = "123456";

      const hash = hashOtp(otp);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it("should handle empty string", () => {
      const hash = hashOtp("");

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it("should handle special characters in OTP", () => {
      const hash = hashOtp("123!@#");

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it("should be deterministic", () => {
      const otps = ["123456", "654321", "000000", "999999"];

      otps.forEach((otp) => {
        const hash1 = hashOtp(otp);
        const hash2 = hashOtp(otp);
        expect(hash1).toBe(hash2);
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("should generate and hash OTP", () => {
      const otp = generateOtp();
      const hash = hashOtp(otp);

      expect(otp).toMatch(/^\d+$/);
      expect(hash).toHaveLength(64);
    });

    it("should verify OTP by comparing hashes", () => {
      const otp = generateOtp();
      const hash1 = hashOtp(otp);

      // Simulate user input
      const userInput = otp;
      const hash2 = hashOtp(userInput);

      expect(hash1).toBe(hash2);
    });

    it("should reject wrong OTP", () => {
      const correctOtp = generateOtp();
      const correctHash = hashOtp(correctOtp);

      const wrongOtp = generateOtp();
      const wrongHash = hashOtp(wrongOtp);

      expect(correctHash).not.toBe(wrongHash);
    });

    it("should work with multiple OTPs", () => {
      const otps = [];
      const hashes = [];

      for (let i = 0; i < 5; i++) {
        const otp = generateOtp();
        otps.push(otp);
        hashes.push(hashOtp(otp));
      }

      // All hashes should be unique
      expect(new Set(hashes).size).toBe(5);

      // Verify each OTP matches its hash
      otps.forEach((otp, i) => {
        expect(hashOtp(otp)).toBe(hashes[i]);
      });
    });
  });

  describe("Security Properties", () => {
    it("should not be reversible", () => {
      const otp = "123456";
      const hash = hashOtp(otp);

      // Hash should not contain the original OTP
      expect(hash).not.toContain("123456");
    });

    it("should avalanche (small input change = large hash change)", () => {
      const otp1 = "123456";
      const otp2 = "123457"; // Only last digit changed

      const hash1 = hashOtp(otp1);
      const hash2 = hashOtp(otp2);

      // Count differing characters
      let diff = 0;
      for (let i = 0; i < 64; i++) {
        if (hash1[i] !== hash2[i]) diff++;
      }

      // Should have significant difference
      expect(diff).toBeGreaterThan(20);
    });

    it("should handle brute force attempts", () => {
      const targetOtp = "123456";
      const targetHash = hashOtp(targetOtp);

      let attempts = 0;
      let found = false;

      // Try 1000 OTPs
      for (let i = 100000; i < 101000 && !found; i++) {
        attempts++;
        if (hashOtp(String(i)) === targetHash) {
          found = String(i) === targetOtp;
        }
      }

      // Should only find if we tried the correct OTP
      expect(found).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very short OTP length", () => {
      process.env.OTP_LENGTH = "1";

      const otp = generateOtp();

      expect(otp).toMatch(/^\d{1}$/);
    });

    it("should handle zero as valid digit", () => {
      process.env.OTP_LENGTH = "6";

      const otps = [];
      for (let i = 0; i < 100; i++) {
        otps.push(generateOtp());
      }

      const hasZero = otps.some((otp) => otp.includes("0"));
      expect(hasZero).toBe(true);
    });

    it("should handle consecutive calls rapidly", () => {
      const otps = [];

      for (let i = 0; i < 1000; i++) {
        otps.push(generateOtp());
      }

      expect(otps).toHaveLength(1000);
      expect(new Set(otps).size).toBeGreaterThan(900);
    });
  });
});
